from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from pathlib import Path
import uuid
import json
import threading
import pandas as pd
from model_files.predict import predict
from werkzeug.utils import secure_filename

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# The folder where all runs will be stored
BASE_DIR = Path(__file__).resolve().parent / "runs"
# Create a folder to store all runs if it doesn't exist
BASE_DIR.mkdir(parents=True, exist_ok=True)

# 5 MB (not in use yet, but can be used to limit file size in the future)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Will be used to store and show the current status of each run
def write_status(run_dir: Path, phase: str, message: str, done: int, total: int):
    status_path = run_dir / "status.json"
    with open(status_path, "w") as f:
        json.dump({
            "phase": phase,
            "message": message,
            "progress": {
                "done": done,
                "total": total
            }
        }, f)
        
def build_inference_csv(run_dir: Path, material_id: str):
    inference_csv = run_dir / "inference.csv"
    pd.DataFrame([{"material_id": material_id}]).to_csv(inference_csv, index=False)


def get_unique_filename(run_dir: Path, filename: str) -> str:
    candidate_path = run_dir / filename
    if not candidate_path.exists():
        return filename

    stem = Path(filename).stem
    suffix = Path(filename).suffix
    counter = 1

    while True:
        candidate_name = f"{stem}_{counter}{suffix}"
        if not (run_dir / candidate_name).exists():
            return candidate_name
        counter += 1


def prediction_pipeline(run_dir: Path, input_filenames: list[str]):
    try:
        total_files = len(input_filenames)
        total_steps = max(total_files * 3 + 1, 1)
        completed_steps = 0
        predictions = []

        for index, input_filename in enumerate(input_filenames, start=1):
            material_id = Path(input_filename).stem

            write_status(
                run_dir,
                "queued",
                f"Preparing {material_id} ({index}/{total_files})",
                completed_steps,
                total_steps,
            )
            build_inference_csv(run_dir, material_id)
            completed_steps += 1

            write_status(
                run_dir,
                "model",
                f"Running model inference for {material_id} ({index}/{total_files})",
                completed_steps,
                total_steps,
            )
            df = predict(str(run_dir))
            completed_steps += 1

            write_status(
                run_dir,
                "post_processing",
                f"Saving prediction for {material_id} ({index}/{total_files})",
                completed_steps,
                total_steps,
            )
            predictions.append(df)
            completed_steps += 1

        if not predictions:
            raise ValueError("No valid CIF files were queued for inference.")

        df = pd.concat(predictions, ignore_index=True)
        output_path = run_dir / "output.csv"
        df.to_csv(output_path, index=False)

        write_status(run_dir, "ready", f"Processed {total_files} materials. Output ready for download.", total_steps, total_steps)

    except Exception as e:
        write_status(run_dir, "error", f"Pipeline failed: {str(e)}", 0, 1)

# File upload handler
@app.route("/upload", methods=["POST"])
def upload():
    print("UPLOAD HIT")
    files = request.files.getlist("files")
    if not files:
        files = request.files.getlist("files[]")
    if not files and "file" in request.files:
        files = [request.files["file"]]

    if not files:
        return jsonify({"error": "No file uploaded"}), 400

    runId = str(uuid.uuid4())
    run_dir = BASE_DIR / runId
    run_dir.mkdir(exist_ok=True)

    saved_filenames = []

    for file in files:
        if file.filename == "":
            return jsonify({"error": "One of the uploaded files has no name"}), 400

        if not file.filename.lower().endswith(".cif"):
            return jsonify({"error": f"Only .cif files are allowed. Invalid file: {file.filename}"}), 400

        file_content = file.read()
        if len(file_content) == 0:
            return jsonify({"error": f"Uploaded file is empty: {file.filename}"}), 400

        safe_name = get_unique_filename(run_dir, secure_filename(file.filename))
        input_path = run_dir / safe_name

        with open(input_path, "wb") as f:
            f.write(file_content)

        saved_filenames.append(safe_name)

    write_status(run_dir, "uploaded", f"{len(saved_filenames)} file(s) uploaded successfully", 0, max(len(saved_filenames) * 3 + 1, 1))

    thread = threading.Thread(target=prediction_pipeline, args=(run_dir, saved_filenames), daemon=True)
    thread.start()

    return jsonify({"runId": runId, "fileCount": len(saved_filenames)}), 200

# Status check handler
@app.route("/status/<runId>", methods=["GET"])
def get_status(runId):
    run_dir = BASE_DIR / runId
    status_path = run_dir / "status.json"

    if not status_path.exists():
        return jsonify({"error": "Run not found"}), 404

    with open(status_path, "r") as f:
        status = json.load(f)

    return jsonify(status), 200

# File download handler
@app.route("/download/<runId>", methods=["GET"])
def download_file(runId):
    run_dir = BASE_DIR / runId
    output_path = run_dir / "output.csv"

    if not output_path.exists():
        return jsonify({"error": "File not found"}), 404

    return send_file(output_path, as_attachment=True, download_name="output.csv")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the API"})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
