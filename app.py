import sys
import os
from pathlib import Path

# Add backend directory to Python path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

# ZeroGPU compatibility: satisfy ZeroGPU startup check if ZeroGPU hardware was selected
try:
    import spaces
    @spaces.GPU
    def _zerogpu_compat():
        return True
except Exception:
    pass

import gradio as gr
from brain_app.main import app as fastapi_app

# Gradio interface definition (Hugging Face Spaces Gradio SDK expects a Blocks/Interface)
with gr.Blocks(title="Second Brain AI — Bộ Não Thứ Hai Cá Nhân") as demo:
    gr.Markdown("""
    # 🧠 Second Brain AI — Bộ Não Thứ Hai Cá Nhân
    
    Ứng dụng quản lý tri thức cá nhân tích hợp AI RAG Copilot (Gemini & OpenRouter).
    
    Giao diện web chính đang chạy tại đường dẫn gốc.
    """)

# Mount Gradio onto the FastAPI app at /ui
# FastAPI serves the full React SPA at / and all REST APIs at /api/*
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
