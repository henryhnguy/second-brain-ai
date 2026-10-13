import json
import sqlite3
from typing import List, Dict, Any, Optional
import numpy as np
from brain_app.database import get_db_connection


class VectorStore:
    def __init__(self):
        pass

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Inserts chunks into SQLite chunks table.
        Each chunk item:
          source_type, source_id, source_title, chunk_index, content, embedding (list), metadata (dict), created_at
        """
        if not chunks:
            return

        conn = get_db_connection()
        cursor = conn.cursor()

        for c in chunks:
            cursor.execute("""
                INSERT INTO chunks (
                    source_type, source_id, source_title, chunk_index, content, embedding, metadata, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                c["source_type"],
                c["source_id"],
                c["source_title"],
                c["chunk_index"],
                c["content"],
                json.dumps(c["embedding"]),
                json.dumps(c.get("metadata", {})),
                c["created_at"]
            ))

        conn.commit()
        conn.close()

    def delete_by_source(self, source_type: str, source_id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chunks WHERE source_type = ? AND source_id = ?", (source_type, source_id))
        conn.commit()
        conn.close()

    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        source_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Computes cosine similarity between query_vector and all stored chunks.
        Returns top_k most similar chunks.
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        if source_type:
            cursor.execute("SELECT id, source_type, source_id, source_title, chunk_index, content, embedding, metadata FROM chunks WHERE source_type = ?", (source_type,))
        else:
            cursor.execute("SELECT id, source_type, source_id, source_title, chunk_index, content, embedding, metadata FROM chunks")

        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 1e-6:
            q_vec = q_vec / q_norm

        results = []
        for r in rows:
            try:
                emb = np.array(json.loads(r["embedding"]), dtype=np.float32)
                # Ensure dimension match
                if emb.shape[0] != q_vec.shape[0]:
                    continue

                emb_norm = np.linalg.norm(emb)
                if emb_norm > 1e-6:
                    emb = emb / emb_norm

                score = float(np.dot(q_vec, emb))
                results.append({
                    "id": r["id"],
                    "source_type": r["source_type"],
                    "source_id": r["source_id"],
                    "source_title": r["source_title"],
                    "chunk_index": r["chunk_index"],
                    "content": r["content"],
                    "score": round(score, 4),
                    "metadata": json.loads(r["metadata"]) if r["metadata"] else {}
                })
            except Exception as e:
                continue

        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]


vector_store = VectorStore()
