import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException

from app.database import get_db_connection
from app.models import ChatQueryRequest, ChatMessageResponse, ChatSessionResponse
from app.rag.rag_service import rag_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_sessions ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [
        ChatSessionResponse(
            id=r["id"],
            title=r["title"],
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ) for r in rows
    ]


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(title: str = "Hội thoại mới"):
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_sessions (title, created_at, updated_at) VALUES (?, ?, ?)", (title, now, now))
    sid = cursor.lastrowid
    conn.commit()
    conn.close()

    return ChatSessionResponse(
        id=sid,
        title=title,
        created_at=now,
        updated_at=now
    )


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"success": True}


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(session_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        ChatMessageResponse(
            id=r["id"],
            session_id=r["session_id"],
            role=r["role"],
            content=r["content"],
            sources=json.loads(r["sources"]) if r["sources"] else [],
            created_at=r["created_at"]
        ) for r in rows
    ]


@router.post("/query")
async def chat_query(req: ChatQueryRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")

    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()

    # If no session_id provided, create one
    session_id = req.session_id
    if not session_id:
        title = question[:40] + ("..." if len(question) > 40 else "")
        cursor.execute("INSERT INTO chat_sessions (title, created_at, updated_at) VALUES (?, ?, ?)", (title, now, now))
        session_id = cursor.lastrowid
        conn.commit()

    # Save user message
    cursor.execute("""
        INSERT INTO chat_messages (session_id, role, content, sources, created_at)
        VALUES (?, 'user', ?, '[]', ?)
    """, (session_id, question, now))
    user_msg_id = cursor.lastrowid
    conn.commit()

    # Fetch recent history
    cursor.execute("SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC", (session_id,))
    history_rows = cursor.fetchall()
    chat_history = [{"role": r["role"], "content": r["content"]} for r in history_rows[:-1]]  # exclude current question

    conn.close()

    # Run RAG with optional custom provider/model override
    rag_result = await rag_service.answer_query(
        question,
        chat_history=chat_history,
        provider=req.provider,
        model=req.model
    )
    answer = rag_result["answer"]
    sources = rag_result["sources"]

    # Save assistant message
    asst_now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO chat_messages (session_id, role, content, sources, created_at)
        VALUES (?, 'assistant', ?, ?, ?)
    """, (session_id, answer, json.dumps(sources), asst_now))
    asst_msg_id = cursor.lastrowid

    # Update session updated_at
    cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (asst_now, session_id))
    conn.commit()
    conn.close()

    return {
        "session_id": session_id,
        "user_message_id": user_msg_id,
        "assistant_message_id": asst_msg_id,
        "answer": answer,
        "sources": sources
    }
