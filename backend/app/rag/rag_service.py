import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from pypdf import PdfReader

from app.database import get_db_connection
from app.rag.chunker import chunk_text
from app.rag.embeddings import embedding_service
from app.rag.vector_store import vector_store


class RAGService:
    def __init__(self):
        self._init_api_key()

    def _init_api_key(self):
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = 'gemini_api_key'")
            row = cursor.fetchone()
            if row and row["value"]:
                embedding_service.update_api_key(row["value"])
            conn.close()
        except Exception:
            pass

    def get_setting(self, key: str, default: str = "") -> str:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        return row["value"] if row else default

    async def index_note(self, note_id: int, title: str, content: str, category: str = "", tags: List[str] = None):
        """Re-chunks and re-indexes a single note."""
        vector_store.delete_by_source("note", note_id)

        full_text = f"# {title}\n\nCategory: {category}\nTags: {', '.join(tags or [])}\n\n{content}"
        chunks = chunk_text(full_text)

        now = datetime.utcnow().isoformat()
        records = []
        for idx, c in enumerate(chunks):
            emb = await embedding_service.get_embedding(c["content"])
            records.append({
                "source_type": "note",
                "source_id": note_id,
                "source_title": title,
                "chunk_index": idx,
                "content": c["content"],
                "embedding": emb,
                "metadata": {
                    "category": category,
                    "tags": tags or [],
                    "header": c.get("header", "")
                },
                "created_at": now
            })

        vector_store.add_chunks(records)

    async def index_document(self, doc_id: int, file_path: str, filename: str, file_type: str) -> Dict[str, Any]:
        """Extracts text from PDF/TXT/MD, chunks, embeds, and updates document record."""
        vector_store.delete_by_source("document", doc_id)

        extracted_text = ""
        try:
            if file_type.lower() == "pdf":
                reader = PdfReader(file_path)
                pages = []
                for i, page in enumerate(reader.pages):
                    t = page.extract_text()
                    if t:
                        pages.append(f"--- Trang {i+1} ---\n" + t)
                extracted_text = "\n\n".join(pages)
            else:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    extracted_text = f.read()
        except Exception as e:
            return {"success": False, "error": str(e)}

        if not extracted_text.strip():
            return {"success": False, "error": "Tập tin không chứa văn bản trích xuất được"}

        chunks = chunk_text(extracted_text, chunk_size=800, overlap=120)
        now = datetime.utcnow().isoformat()
        records = []
        for idx, c in enumerate(chunks):
            emb = await embedding_service.get_embedding(c["content"])
            records.append({
                "source_type": "document",
                "source_id": doc_id,
                "source_title": filename,
                "chunk_index": idx,
                "content": c["content"],
                "embedding": emb,
                "metadata": {
                    "file_type": file_type,
                    "header": c.get("header", "")
                },
                "created_at": now
            })

        vector_store.add_chunks(records)

        # Update document chunk count & summary
        summary = extracted_text[:300].strip().replace("\n", " ") + "..."
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE documents 
            SET chunk_count = ?, summary = ?, status = 'indexed'
            WHERE id = ?
        """, (len(chunks), summary, doc_id))
        conn.commit()
        conn.close()

        return {"success": True, "chunk_count": len(chunks)}

    async def answer_query(
        self,
        question: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        top_k: int = 5,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main RAG pipeline:
        1. Embed question
        2. Retrieve relevant chunks from Second Brain
        3. Synthesize answer with selected LLM (Gemini or OpenRouter) or local fallback
        """
        # Embed question
        q_emb = await embedding_service.get_embedding(question)

        # Retrieve relevant chunks
        chunks = vector_store.similarity_search(q_emb, top_k=top_k)

        # Build context
        context_parts = []
        sources = []
        for i, c in enumerate(chunks):
            src_info = {
                "source_type": c["source_type"],
                "source_id": c["source_id"],
                "title": c["source_title"],
                "score": c["score"],
                "snippet": c["content"][:200] + ("..." if len(c["content"]) > 200 else "")
            }
            sources.append(src_info)
            context_parts.append(
                f"[Tài liệu {i+1}: {c['source_title']} ({'Ghi chú' if c['source_type'] == 'note' else 'Tài liệu'})]\n{c['content']}"
            )

        context_str = "\n\n".join(context_parts)

        # Determine active provider & model
        active_provider = (provider or self.get_setting("llm_provider", "gemini")).lower()

        if active_provider == "openrouter":
            or_key = self.get_setting("openrouter_api_key", os.getenv("OPENROUTER_API_KEY", ""))
            or_model = model or self.get_setting("openrouter_model", "deepseek/deepseek-chat")
            if or_key and len(or_key) > 5:
                answer = await self._call_openrouter_rag(or_key, or_model, question, context_str, chat_history)
            else:
                answer = (
                    "### ⚠️ Chưa cấu hình OpenRouter API Key\n\n"
                    "Bạn đang chọn sử dụng mô hình qua **OpenRouter**, nhưng hệ thống chưa có API Key.\n\n"
                    "👉 Vui lòng mở **Cài đặt & API Key**, chọn tab **OpenRouter** và nhập API Key (lấy tại https://openrouter.ai/keys) để tiếp tục."
                )
        else:
            # Gemini default
            gemini_key = self.get_setting("gemini_api_key", os.getenv("GEMINI_API_KEY", ""))
            gemini_model = model or self.get_setting("gemini_model", self.get_setting("model_name", "gemini-2.5-flash"))

            if gemini_key and len(gemini_key) > 10:
                answer = await self._call_gemini_rag(gemini_key, gemini_model, question, context_str, chat_history)
            else:
                answer = self._generate_local_synthesis(question, chunks)

        return {
            "answer": answer,
            "sources": sources
        }

    async def _call_openrouter_rag(
        self,
        api_key: str,
        model: str,
        question: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Second Brain AI",
            "Content-Type": "application/json"
        }

        system_instruction = (
            "Bạn là trợ lý AI thông minh phụ trách Second Brain (Bộ não thứ hai cá nhân). "
            "Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên Ngữ cảnh Kiến thức (Context) được cung cấp từ các ghi chú và tài liệu của họ. "
            "Quy tắc trả lời:\n"
            "1. Luôn ưu tiên thông tin chính xác từ Ngữ cảnh kiến thức.\n"
            "2. Trích dẫn rõ ràng nguồn từ ghi chú hoặc tài liệu nào (ví dụ: 'Theo ghi chú [Tên ghi chú]...').\n"
            "3. Nếu ngữ cảnh không có thông tin, hãy thành thật nêu rõ Second Brain chưa có dữ liệu về điều này trước khi trả lời khái quát.\n"
            "4. Định dạng Markdown rõ ràng, dễ đọc, gạch đầu dòng các ý quan trọng."
        )

        messages = [{"role": "system", "content": system_instruction}]
        if chat_history:
            for msg in chat_history[-6:]:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})

        user_content = f"Ngữ cảnh kiến thức từ Second Brain:\n---\n{context}\n---\n\nCâu hỏi: {question}"
        messages.append({"role": "user", "content": user_content})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 2048
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "")
                else:
                    return f"Lỗi gọi OpenRouter API ({resp.status_code}): {resp.text}"
        except Exception as e:
            return f"Không thể kết nối đến OpenRouter API: {str(e)}"

        return "Không nhận được phản hồi từ mô hình OpenRouter."

    async def _call_gemini_rag(
        self,
        api_key: str,
        model: str,
        question: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        system_instruction = (
            "Bạn là trợ lý AI thông minh phụ trách Second Brain (Bộ não thứ hai cá nhân). "
            "Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên Ngữ cảnh Kiến thức (Context) được cung cấp từ các ghi chú và tài liệu của họ. "
            "Quy tắc trả lời:\n"
            "1. Luôn ưu tiên thông tin chính xác từ Ngữ cảnh kiến thức.\n"
            "2. Trích dẫn rõ ràng nguồn từ ghi chú hoặc tài liệu nào (ví dụ: 'Theo ghi chú [Tên ghi chú]...').\n"
            "3. Nếu ngữ cảnh không có thông tin, hãy thành thật nêu rõ Second Brain chưa có dữ liệu về điều này trước khi trả lời khái quát.\n"
            "4. Định dạng Markdown rõ ràng, dễ đọc, gạch đầu dòng các ý quan trọng."
        )

        contents = []
        if chat_history:
            for msg in chat_history[-6:]:  # Keep recent context
                role = "user" if msg["role"] == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })

        user_prompt = f"Ngữ cảnh kiến thức từ Second Brain:\n---\n{context}\n---\n\nCâu hỏi: {question}"
        contents.append({
            "role": "user",
            "parts": [{"text": user_prompt}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 2048
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                else:
                    return f"Lỗi gọi Gemini API ({resp.status_code}): {resp.text}"
        except Exception as e:
            return f"Không thể kết nối đến Gemini API: {str(e)}"

        return "Không nhận được phản hồi từ AI."

    def _generate_local_synthesis(self, question: str, chunks: List[Dict[str, Any]]) -> str:
        """Fallback synthesis when no Gemini API key is configured yet."""
        if not chunks or (len(chunks) > 0 and chunks[0]["score"] <= 0.05):
            return (
                f"### 🔍 Không tìm thấy thông tin phù hợp\n\n"
                f"Second Brain chưa tìm thấy ghi chú hoặc tài liệu nào liên quan trực tiếp đến câu hỏi: **\"{question}\"**.\n\n"
                f"💡 **Gợi ý**:\n"
                f"- Thử thêm ghi chú mới hoặc tải lên tài liệu PDF/Text liên quan đến chủ đề này.\n"
                f"- Để kích hoạt AI thông minh trò chuyện tự nhiên, bạn có thể nhập **Gemini API Key** trong phần **Cài đặt** (Settings)."
            )

        top_sources = list({c["source_title"] for c in chunks[:3]})
        sources_str = ", ".join([f"`{s}`" for s in top_sources])

        res = [
            f"### 💡 Kết quả trích xuất từ Second Brain\n\n",
            f"Tìm thấy các đoạn kiến thức liên quan từ nguồn: {sources_str}\n\n"
        ]

        for i, c in enumerate(chunks[:3]):
            icon = "📝 Ghi chú" if c["source_type"] == "note" else "📄 Tài liệu"
            res.append(f"#### {i+1}. {icon}: **{c['source_title']}** (Độ tương đồng: {int(c['score']*100)}%)\n")
            res.append(f"> {c['content'].strip()}\n\n")

        res.append(
            "\n---\n"
            "🔑 *Mẹo: Bạn có thể nhập **Google Gemini API Key** trong phần **Cài đặt** để AI tự động phân tích sâu, tóm tắt và trò chuyện như một người trợ lý cá nhân.*"
        )

        return "".join(res)


rag_service = RAGService()
