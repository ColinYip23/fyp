from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from pathlib import Path
import uuid
import json
import threading
import time

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# The folder where all runs will be stored
BASE_DIR = Path("runs")
# Create a folder to store all runs if it doesn't exist
BASE_DIR.mkdir(exist_ok=True)

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
        
# pipeline simulation (for testing)
def fake_prediction_pipeline(run_dir: Path, input_filename: str):
    try:
        # Step 1
        write_status(run_dir, "model", "Reading CIF file...", 1, 4)
        time.sleep(2)

        # Step 2
        write_status(run_dir, "model", "Running prediction...", 2, 4)
        time.sleep(2)

        # Step 3
        write_status(run_dir, "postprocess", "Preparing output...", 3, 4)
        time.sleep(2)

        # Create fake output file
        output_path = run_dir / "output.csv"

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("filename,prediction\n")
            f.write(f"{input_filename},stable_candidate\n")

        # Final state
        write_status(run_dir, "ready", "Output ready for download.", 4, 4)

    except Exception as e:
        write_status(run_dir, "error", f"Pipeline failed: {str(e)}", 0, 4)

# File upload handler
@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No file uploaded"}), 400
    
    if not file.filename.endswith(".cif"):
        return jsonify({"error": "Only .cif files are allowed"}), 400    
    
    if len(file.read()) == 0:
        return jsonify({"error": "Uploaded file is empty"}), 400
    
    run_id = str(uuid.uuid4())
    
    run_dir = BASE_DIR / run_id
    run_dir.mkdir(exist_ok=True)
    
    input_path = run_dir / file.filename
    
    with open(input_path, "wb") as f:
        f.write(file.read())
    
    write_status(run_dir, "uploaded", "File uploaded successfully", 0, 4)
    
    thread = threading.Thread(target=fake_prediction_pipeline, args=(run_dir, file.filename), daemon=True)
    thread.start()
    
    return jsonify({"run_id": run_id}), 200

# Status check handler
@app.route("/status/<run_id>", methods=["GET"])
def get_status(run_id):
    run_dir = BASE_DIR / run_id
    status_path = run_dir / "status.json"

    if not status_path.exists():
        return jsonify({"error": "Run not found"}), 404

    with open(status_path, "r") as f:
        status = json.load(f)

    return jsonify(status), 200

# File download handler
@app.route("/download/<run_id>", methods=["GET"])
def download_file(run_id):
    run_dir = BASE_DIR / run_id
    output_path = run_dir / "output.csv"

    if not output_path.exists():
        return jsonify({"error": "File not found"}), 404

    return send_file(output_path, as_attachment=True, download_name="output.csv")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the API"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
