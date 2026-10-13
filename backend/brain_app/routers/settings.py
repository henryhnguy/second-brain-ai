import os
from fastapi import APIRouter
from brain_app.database import get_db_connection
from brain_app.models import SettingsUpdate
from brain_app.rag.embeddings import embedding_service
from brain_app.rag.rag_service import rag_service

router = APIRouter(prefix="/api/settings", tags=["settings"])

POPULAR_OPENROUTER_MODELS = [
    {"id": "deepseek/deepseek-chat", "name": "DeepSeek V3", "provider": "openrouter", "desc": "Rất thông minh & chi phí siêu rẻ"},
    {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1", "provider": "openrouter", "desc": "Mô hình suy luận lý luận chuyên sâu (Reasoning)"},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "openrouter", "desc": "Khả năng viết, phân tích & code đỉnh cao"},
    {"id": "meta-llama/llama-3.3-70b-instruct", "name": "Llama 3.3 70B", "provider": "openrouter", "desc": "Mã nguồn mở mạnh mẽ từ Meta"},
    {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "openrouter", "desc": "Mô hình flagship đa năng từ OpenAI"},
    {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openrouter", "desc": "Nhanh gọn, giá rẻ từ OpenAI"},
    {"id": "qwen/qwen-2.5-72b-instruct", "name": "Qwen 2.5 72B", "provider": "openrouter", "desc": "Đa ngôn ngữ & toán luận xuất sắc"},
    {"id": "google/gemini-2.0-flash-exp:free", "name": "Gemini 2.0 Flash (Free)", "provider": "openrouter", "desc": "Miễn phí trên OpenRouter"}
]

GEMINI_MODELS = [
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "gemini", "desc": "Mặc định, tốc độ phản hồi cực nhanh"},
    {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "provider": "gemini", "desc": "Ổn định, cân bằng hiệu năng"},
    {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "provider": "gemini", "desc": "Ngữ cảnh siêu dài, suy luận phức tạp"}
]


@router.get("")
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    settings_dict = {r["key"]: r["value"] for r in rows}

    # Mask Gemini API key
    gemini_key = settings_dict.get("gemini_api_key", "")
    gemini_masked = ""
    if gemini_key:
        gemini_masked = gemini_key[:4] + "*" * (len(gemini_key) - 8) + gemini_key[-4:] if len(gemini_key) > 8 else "****"

    # Mask OpenRouter API key
    or_key = settings_dict.get("openrouter_api_key", "")
    or_masked = ""
    if or_key:
        or_masked = or_key[:4] + "*" * (len(or_key) - 8) + or_key[-4:] if len(or_key) > 8 else "****"

    # Count statistics
    cursor.execute("SELECT COUNT(*) as cnt FROM notes")
    total_notes = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM documents")
    total_docs = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM chunks")
    total_chunks = cursor.fetchone()["cnt"]

    conn.close()

    llm_provider = settings_dict.get("llm_provider", "gemini")
    gemini_model = settings_dict.get("gemini_model", settings_dict.get("model_name", "gemini-2.5-flash"))
    openrouter_model = settings_dict.get("openrouter_model", "deepseek/deepseek-chat")

    return {
        "llm_provider": llm_provider,
        "gemini_api_key_configured": bool(gemini_key and len(gemini_key) > 10),
        "gemini_api_key_masked": gemini_masked,
        "gemini_model": gemini_model,
        "model_name": gemini_model, # backward compatibility
        "openrouter_api_key_configured": bool(or_key and len(or_key) > 5),
        "openrouter_api_key_masked": or_masked,
        "openrouter_model": openrouter_model,
        "available_models": {
            "gemini": GEMINI_MODELS,
            "openrouter": POPULAR_OPENROUTER_MODELS
        },
        "stats": {
            "total_notes": total_notes,
            "total_documents": total_docs,
            "total_chunks": total_chunks
        }
    }


@router.post("")
def update_settings(data: SettingsUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    if data.llm_provider is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('llm_provider', ?)", (data.llm_provider.strip().lower(),))

    if data.gemini_api_key is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('gemini_api_key', ?)", (data.gemini_api_key.strip(),))
        embedding_service.update_api_key(data.gemini_api_key.strip())

    if data.openrouter_api_key is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('openrouter_api_key', ?)", (data.openrouter_api_key.strip(),))

    if data.gemini_model is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('gemini_model', ?)", (data.gemini_model.strip(),))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('model_name', ?)", (data.gemini_model.strip(),))

    if data.openrouter_model is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('openrouter_model', ?)", (data.openrouter_model.strip(),))

    if data.model_name is not None and data.gemini_model is None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('model_name', ?)", (data.model_name.strip(),))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('gemini_model', ?)", (data.model_name.strip(),))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Đã lưu cấu hình cài đặt"}
