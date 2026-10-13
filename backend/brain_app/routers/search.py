from typing import List, Optional
from fastapi import APIRouter, Query

from brain_app.models import SearchResult
from brain_app.rag.embeddings import embedding_service
from brain_app.rag.vector_store import vector_store

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=List[SearchResult])
async def search(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    source_type: Optional[str] = None
):
    if not q.strip():
        return []

    # Get query embedding
    query_vector = await embedding_service.get_embedding(q)

    # Perform similarity search
    results = vector_store.similarity_search(query_vector, top_k=limit, source_type=source_type)

    return [
        SearchResult(
            id=r["id"],
            source_type=r["source_type"],
            source_id=r["source_id"],
            source_title=r["source_title"],
            content=r["content"],
            score=r["score"],
            metadata=r["metadata"]
        ) for r in results
    ]
