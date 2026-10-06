# 🧠 Second Brain AI - Bộ Não Thứ Hai Cá Nhân

Một ứng dụng **Quản lý Tri thức Cá nhân (Personal Knowledge Management - PKM)** kết hợp công nghệ **RAG (Retrieval-Augmented Generation)** và **AI Copilot** hiện đại. Hệ thống giúp bạn tổ chức ghi chú, tài liệu PDF/Markdown theo phương pháp PARA, đồng thời cho phép bạn hỏi đáp và trò chuyện trực tiếp với toàn bộ kho kiến thức của chính mình.

---

## 🌟 Tính Năng Nổi Bật

1. **📝 Quản lý Ghi chú & Soạn thảo Markdown:**
   - Hỗ trợ xem trước trực quan (Preview), chế độ chia đôi màn hình (Split mode).
   - Hệ thống phân loại **PARA (Projects, Areas, Resources, Archives)** chuẩn Tiago Forte.
   - Quản lý thẻ tag linh hoạt, ghim ghi chú quan trọng lên đầu.

2. **📄 Kho Tài liệu Đa định dạng (Document Hub):**
   - Tải lên kéo-thả các tệp: **PDF**, **Markdown (.md)**, **Văn bản (.txt)**, **CSV**, **JSON**.
   - Tự động trích xuất nội dung, phân đoạn thông minh (Text Chunking có độ chồng lấp overlap).
   - Lập chỉ mục Vector (Embedding) tự động ngay khi tải file lên.

3. **🤖 Trợ lý AI Copilot (RAG Chatbot):**
   - Trò chuyện tự nhiên với kho kiến thức cá nhân.
   - **Trích dẫn nguồn minh bạch (Citations)**: Hiển thị đoạn trích dẫn, tiêu đề ghi chú/tài liệu và điểm số tương đồng (Score %).
   - Tự động gợi ý câu hỏi thông minh, tóm tắt nhanh nội dung ghi chú.

4. **🔍 Tìm kiếm Ngữ nghĩa (Semantic Search):**
   - Tìm kiếm theo ý nghĩa và ngữ cảnh thay vì chỉ khớp chính xác từng từ khóa.
   - Lọc theo nguồn (Chỉ Ghi chú hoặc Chỉ Tài liệu) và xem trước đoạn trích dẫn tức thì.

5. **⚙️ Tích hợp Mô hình AI Linh hoạt:**
   - Hỗ trợ **Google Gemini API** (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
   - Cung cấp cơ chế **Local Embedding & Synthesis Fallback**: Hệ thống hoạt động trơn tru ngay cả khi chưa nhập API key.
   - Cấu hình API key an toàn trực tiếp trên giao diện Cài đặt (Settings).

---

## 🏗️ Cấu Trúc Dự Án

```
second-brain/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server & route mounting
│   │   ├── database.py          # SQLite schema, tables, seed data
│   │   ├── models.py            # Pydantic data schemas
│   │   ├── rag/
│   │   │   ├── chunker.py       # Smart text & markdown chunking
│   │   │   ├── embeddings.py    # Hybrid embedding service (Gemini + Local)
│   │   │   ├── vector_store.py  # SQLite-backed vector store & cosine search
│   │   │   └── rag_service.py   # RAG pipeline orchestration & LLM chat
│   │   └── routers/
│   │       ├── notes.py         # CRUD ghi chú & tags
│   │       ├── documents.py     # Upload & phân tích PDF/TXT/MD
│   │       ├── chat.py          # RAG chat & phiên hội thoại
│   │       ├── search.py        # Semantic vector search
│   │       └── settings.py      # Cài đặt API key & thống kê hệ thống
│   ├── data/                    # Thư mục lưu SQLite DB & uploaded files
│   └── requirements.txt         # Thư viện Python
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Thanh điều hướng PARA & danh mục
│   │   │   ├── NotesView.jsx    # Danh sách ghi chú & bộ lọc
│   │   │   ├── NoteEditor.jsx   # Trình soạn thảo Markdown & AI Actions
│   │   │   ├── DocumentsView.jsx# Quản lý & upload tài liệu PDF/MD
│   │   │   ├── ChatView.jsx     # Giao diện chat RAG & trích dẫn
│   │   │   ├── SearchView.jsx   # Giao diện Semantic Search
│   │   │   └── SettingsModal.jsx# Cài đặt Gemini API key
│   │   ├── api.js               # Client API wrapper
│   │   ├── App.jsx              # Giao diện chính kết hợp các module
│   │   └── index.css            # Tailwind CSS v4 styling
│   ├── package.json
│   └── vite.config.js
├── run.py                       # Script khởi động 1 lệnh cho toàn bộ hệ thống
├── start.bat                    # File khởi chạy nhanh trên Windows
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Khởi chạy nhanh (Đã đóng gói sẵn)
Chỉ cần chạy lệnh sau từ thư mục gốc của dự án:
```powershell
.\backend\.venv\Scripts\python.exe run.py
```
*(Hoặc nhấp đúp chuột vào file `start.bat`)*

Ứng dụng sẽ tự động mở tại trình duyệt: **http://localhost:8000**
Tài liệu API Swagger: **http://localhost:8000/docs**

---

### 2. Chế độ Phát triển (Development Mode)

Nếu bạn muốn chỉnh sửa mã nguồn Backend hoặc Frontend đồng thời:

#### Chạy Backend:
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

#### Chạy Frontend:
```powershell
cd frontend
npm run dev
```
Frontend sẽ chạy tại: **http://localhost:5173** (đã cấu hình proxy tự động chuyển tiếp request `/api` sang backend 8000).

---

## 🔑 Cấu Hình Google Gemini API Key

1. Mở giao diện ứng dụng tại `http://localhost:8000`.
2. Nhấn vào mục **Cài đặt & API Key** ở góc dưới bên trái Sidebar.
3. Lấy API key miễn phí từ [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Dán API key vào ô cấu hình và bấm **Lưu cấu hình**.
5. AI Copilot sẽ tự động chuyển sang mô hình Gemini siêu tốc để trả lời chuyên sâu mọi câu hỏi của bạn!
