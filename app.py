import sys
import os
from pathlib import Path

# Add backend directory to Python path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

import gradio as gr
from app.main import app as fastapi_app

# Minimal Gradio UI — acts only as a redirect wrapper.
# Hugging Face Spaces (Gradio SDK) requires a "demo" or "app" object.
# We use gr.mount_gradio_app to attach Gradio into our FastAPI app,
# which serves the full React SPA at the root path.
with gr.Blocks(title="Second Brain AI — Bộ Não Thứ Hai Cá Nhân") as demo:
    gr.HTML("""
    <div style="font-family:sans-serif;text-align:center;padding:40px 20px;background:#0f172a;min-height:200px;color:#f8fafc">
        <div style="font-size:48px;margin-bottom:16px">🧠</div>
        <h2 style="color:#818cf8;margin:0 0 8px">Second Brain AI</h2>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 24px">Đang chuyển hướng đến giao diện chính...</p>
        <script>
            // Redirect to the React SPA served by FastAPI at root
            (function() {
                var base = window.location.origin;
                if (window.top !== window.self) {
                    window.top.location.href = base;
                } else {
                    window.location.href = base;
                }
            })();
        </script>
    </div>
    """)

# Mount the Gradio UI inside our FastAPI app at /ui
# The FastAPI app itself serves the React SPA at / and all /api/* routes
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")
