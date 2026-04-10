from flask import Flask
from flask_cors import CORS
from pathlib import Path
import uuid
import json
import threading
import time

app = Flask(__name__)
CORS(app)

# The folder where all runs will be stored
BASE_DIR = Path("runs")
# Create a folder to store all runs if it doesn't exist
BASE_DIR.mkdir(exist_ok=True)

# 5 MB
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

        