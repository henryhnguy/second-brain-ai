from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class NoteCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "Resources"
    tags: Optional[List[str]] = []
    pinned: Optional[int] = 0


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    pinned: Optional[int] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: List[str]
    pinned: int
    created_at: str
    updated_at: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    summary: str
    chunk_count: int
    status: str
    created_at: str


class ChatQueryRequest(BaseModel):
    session_id: Optional[int] = None
    question: str
    provider: Optional[str] = None # 'gemini' or 'openrouter'
    model: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    sources: List[Dict[str, Any]]
    created_at: str


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: str
    updated_at: str


class SettingsUpdate(BaseModel):
    llm_provider: Optional[str] = None # 'gemini' or 'openrouter'
    gemini_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    gemini_model: Optional[str] = None
    openrouter_model: Optional[str] = None
    model_name: Optional[str] = None # backward compatibility


class SearchResult(BaseModel):
    id: int
    source_type: str
    source_id: int
    source_title: str
    content: str
    score: float
    metadata: Dict[str, Any]
