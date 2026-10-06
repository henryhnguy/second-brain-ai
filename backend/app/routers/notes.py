import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.database import get_db_connection
from app.models import NoteCreate, NoteUpdate, NoteResponse
from app.rag.rag_service import rag_service
from app.rag.vector_store import vector_store

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=List[NoteResponse])
def get_notes(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM notes WHERE 1=1"
    params = []

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if q:
        query += " AND (title LIKE ? OR content LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%"])

    query += " ORDER BY pinned DESC, updated_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        tags = json.loads(r["tags"]) if r["tags"] else []
        if tag and tag not in tags:
            continue
        results.append(NoteResponse(
            id=r["id"],
            title=r["title"],
            content=r["content"],
            category=r["category"],
            tags=tags,
            pinned=r["pinned"],
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ))
    return results


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Ghi chú không tồn tại")

    return NoteResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        category=row["category"],
        tags=json.loads(row["tags"]) if row["tags"] else [],
        pinned=row["pinned"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.post("", response_model=NoteResponse)
async def create_note(data: NoteCreate):
    now = datetime.utcnow().isoformat()
    tags_json = json.dumps(data.tags or [])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notes (title, content, category, tags, pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data.title, data.content, data.category or "Resources", tags_json, data.pinned or 0, now, now))
    note_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Index into RAG vector store
    await rag_service.index_note(note_id, data.title, data.content, data.category, data.tags)

    return NoteResponse(
        id=note_id,
        title=data.title,
        content=data.content,
        category=data.category or "Resources",
        tags=data.tags or [],
        pinned=data.pinned or 0,
        created_at=now,
        updated_at=now
    )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, data: NoteUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Ghi chú không tồn tại")

    new_title = data.title if data.title is not None else existing["title"]
    new_content = data.content if data.content is not None else existing["content"]
    new_category = data.category if data.category is not None else existing["category"]
    new_tags = data.tags if data.tags is not None else json.loads(existing["tags"])
    new_pinned = data.pinned if data.pinned is not None else existing["pinned"]
    now = datetime.utcnow().isoformat()

    cursor.execute("""
        UPDATE notes
        SET title = ?, content = ?, category = ?, tags = ?, pinned = ?, updated_at = ?
        WHERE id = ?
    """, (new_title, new_content, new_category, json.dumps(new_tags), new_pinned, now, note_id))
    conn.commit()
    conn.close()

    # Re-index
    await rag_service.index_note(note_id, new_title, new_content, new_category, new_tags)

    return NoteResponse(
        id=note_id,
        title=new_title,
        content=new_content,
        category=new_category,
        tags=new_tags,
        pinned=new_pinned,
        created_at=existing["created_at"],
        updated_at=now
    )


@router.delete("/{note_id}")
def delete_note(note_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()

    # Remove chunks from vector store
    vector_store.delete_by_source("note", note_id)
    return {"success": True, "message": "Đã xóa ghi chú"}


@router.get("/meta/categories")
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM notes WHERE category IS NOT NULL AND category != ''")
    rows = cursor.fetchall()
    conn.close()
    cats = [r["category"] for r in rows]
    # Ensure default PARA categories are included
    defaults = ["Projects", "Areas", "Resources", "Archives"]
    for d in defaults:
        if d not in cats:
            cats.append(d)
    return cats


@router.get("/meta/tags")
def get_tags():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT tags FROM notes")
    rows = cursor.fetchall()
    conn.close()

    tag_set = set()
    for r in rows:
        if r["tags"]:
            try:
                for t in json.loads(r["tags"]):
                    tag_set.add(t)
            except Exception:
                pass
    return sorted(list(tag_set))
