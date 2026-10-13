import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File

from brain_app.database import get_db_connection, DB_DIR
from brain_app.models import DocumentResponse
from brain_app.rag.rag_service import rag_service
from brain_app.rag.vector_store import vector_store

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOADS_DIR = DB_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("", response_model=List[DocumentResponse])
def get_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [
        DocumentResponse(
            id=r["id"],
            filename=r["filename"],
            file_type=r["file_type"],
            file_size=r["file_size"],
            summary=r["summary"] or "",
            chunk_count=r["chunk_count"] or 0,
            status=r["status"] or "ready",
            created_at=r["created_at"]
        ) for r in rows
    ]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"

    if ext not in ["pdf", "txt", "md", "markdown", "csv", "json"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF, MD, TXT, CSV, JSON")

    # Save to uploads dir
    saved_path = UPLOADS_DIR / f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
    file_bytes = await file.read()
    file_size = len(file_bytes)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (filename, file_type, file_path, file_size, summary, chunk_count, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (filename, ext, str(saved_path), file_size, "Đang xử lý & phân đoạn...", 0, "processing", now))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Index document asynchronously
    result = await rag_service.index_document(doc_id, str(saved_path), filename, ext)

    if not result.get("success", False):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET status = 'error', summary = ? WHERE id = ?", (f"Lỗi: {result.get('error')}", doc_id))
        conn.commit()
        conn.close()
        return {"success": False, "id": doc_id, "error": result.get("error")}

    return {
        "success": True,
        "id": doc_id,
        "filename": filename,
        "chunks": result.get("chunk_count", 0),
        "message": f"Đã lập chỉ mục {result.get('chunk_count', 0)} đoạn kiến thức vào Second Brain"
    }


@router.delete("/{doc_id}")
def delete_document(doc_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    if row and row["file_path"] and os.path.exists(row["file_path"]):
        try:
            os.remove(row["file_path"])
        except Exception:
            pass

    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()

    # Delete chunks
    vector_store.delete_by_source("document", doc_id)
    return {"success": True, "message": "Đã xóa tài liệu và các đoạn vector"}
