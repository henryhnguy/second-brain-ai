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
    is_cloud = bool(os.getenv("SPACE_ID") or os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT"))
    default_port = 7860 if os.getenv("SPACE_ID") else 8000
    port = int(os.getenv("PORT", default_port))
    host = os.getenv("HOST", "0.0.0.0" if is_cloud or os.getenv("PORT") else "127.0.0.1")

    print("=" * 60)
    print(">>> KHOI DONG SECOND BRAIN AI (BO NAO THU HAI CA NHAN) <<<")
    print("=" * 60)
    print(f"Host: {host}:{port}")
    print(f"URL Ung dung: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    print(f"API Swagger Docs: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/docs")
    print("Nhan Ctrl + C de dung ung dung.")
    print("=" * 60)

    # Automatically try opening the browser only in local desktop environments
    if not is_cloud and host == "127.0.0.1":
        try:
            webbrowser.open(f"http://localhost:{port}")
        except Exception:
            pass

    uvicorn.run("app.main:app", host=host, port=port, reload=False)
