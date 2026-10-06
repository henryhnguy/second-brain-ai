import os
from fastapi import APIRouter
from app.database import get_db_connection
from app.models import SettingsUpdate
from app.rag.embeddings import embedding_service
from app.rag.rag_service import rag_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    settings_dict = {r["key"]: r["value"] for r in rows}

    # Mask API key for security if present
    api_key = settings_dict.get("gemini_api_key", "")
    masked_key = ""
    if api_key:
        masked_key = api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:] if len(api_key) > 8 else "****"

    # Count statistics
    cursor.execute("SELECT COUNT(*) as cnt FROM notes")
    total_notes = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM documents")
    total_docs = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM chunks")
    total_chunks = cursor.fetchone()["cnt"]

    conn.close()

    return {
        "gemini_api_key_configured": bool(api_key and len(api_key) > 10),
        "gemini_api_key_masked": masked_key,
        "model_name": settings_dict.get("model_name", "gemini-2.5-flash"),
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

    if data.gemini_api_key is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('gemini_api_key', ?)", (data.gemini_api_key.strip(),))
        embedding_service.update_api_key(data.gemini_api_key.strip())

    if data.model_name is not None:
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('model_name', ?)", (data.model_name.strip(),))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Đã lưu cấu hình cài đặt"}
