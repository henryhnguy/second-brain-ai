import os
import json
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import init_db, get_db_connection
from app.routers import notes, documents, chat, search, settings
from app.rag.rag_service import rag_service

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not FRONTEND_DIST.exists():
    env_dist = os.getenv("FRONTEND_DIST")
    if env_dist and Path(env_dist).exists():
        FRONTEND_DIST = Path(env_dist)
    elif Path("/app/frontend/dist").exists():
        FRONTEND_DIST = Path("/app/frontend/dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    init_db()

    # Index seed notes if chunks table is empty
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM chunks")
    chunk_count = cursor.fetchone()["cnt"]
    if chunk_count == 0:
        cursor.execute("SELECT * FROM notes")
        seed_rows = cursor.fetchall()
        for r in seed_rows:
            tags = json.loads(r["tags"]) if r["tags"] else []
            await rag_service.index_note(r["id"], r["title"], r["content"], r["category"], tags)
    conn.close()

    yield


app = FastAPI(
    title="Second Brain AI API",
    description="Personal Knowledge Management & RAG Copilot",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(notes.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(settings.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Second Brain AI"}


# Serve static production frontend if built
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api"):
            return {"error": "API route not found"}
        target_file = FRONTEND_DIST / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(FRONTEND_DIST / "index.html"))
