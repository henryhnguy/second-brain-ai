import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to Python path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "backend"))

# ZeroGPU decorator support
try:
    import spaces
    has_spaces = True
except Exception:
    has_spaces = False

def gpu_task(fn):
    if has_spaces:
        return spaces.GPU(fn)
    return fn

import gradio as gr
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from brain_app.main import app as fastapi_app
from brain_app.rag.rag_service import rag_service

@gpu_task
def ask_second_brain(question: str):
    """ZeroGPU handler for querying Second Brain knowledge base."""
    if not question or not question.strip():
        return "Vui lòng nhập câu hỏi."
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(rag_service.answer_query(question.strip()))
        loop.close()
        return result.get("answer", "Không tìm thấy câu trả lời phù hợp trong tài liệu.")
    except Exception as e:
        return f"⚠️ Lỗi xử lý: {str(e)}"

FRONTEND_DIST = ROOT / "frontend" / "dist"

with gr.Blocks(title="Second Brain AI — Bộ Não Thứ Hai Cá Nhân", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧠 Second Brain AI — Bộ Não Thứ Hai Cá Nhân")
    
    with gr.Tab("💬 Hỏi đáp AI Copilot"):
        gr.Markdown("Trò chuyện và hỏi đáp nhanh với kho tri thức của bạn (Hỗ trợ Gemini & OpenRouter).")
        with gr.Row():
            user_input = gr.Textbox(placeholder="Nhập câu hỏi cho bộ não thứ hai...", label="Câu hỏi", scale=8)
            submit_btn = gr.Button("Gửi 🚀", variant="primary", scale=2)
        chat_output = gr.Markdown(label="Câu trả lời")
        submit_btn.click(ask_second_brain, inputs=[user_input], outputs=[chat_output])
        user_input.submit(ask_second_brain, inputs=[user_input], outputs=[chat_output])
    
    with gr.Tab("📱 Workspace Đầy đủ (React PKM)"):
        gr.Markdown("Giao diện quản lý ghi chú PARA, tải lên tài liệu PDF/Markdown và thiết lập mô hình AI.")
        gr.HTML("""
        <iframe src="/app-view" style="width:100%; height:82vh; border:none; border-radius:8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>
        """)

# Attach FastAPI routers and frontend assets into demo.app
demo.app.mount("/api", fastapi_app)

if FRONTEND_DIST.exists():
    demo.app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @demo.app.get("/app-view")
    async def serve_react_app():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port)
