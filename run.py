import os
import sys
import webbrowser
from pathlib import Path

# Configure utf-8 encoding for Windows terminal output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print(">>> KHOI DONG SECOND BRAIN AI (BO NAO THU HAI CA NHAN) <<<")
    print("=" * 60)
    print("URL Ung dung: http://localhost:8000")
    print("API Swagger Docs: http://localhost:8000/docs")
    print("Nhan Ctrl + C de dung ung dung.")
    print("=" * 60)

    # Automatically try opening the browser
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
