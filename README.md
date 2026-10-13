---
title: Second Brain AI
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: gradio
app_file: app.py
pinned: false
---

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

5. **⚙️ Đa dạng Mô hình AI (Google Gemini & OpenRouter):**
   - Hỗ trợ **Google Gemini API** (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
   - Hỗ trợ **OpenRouter API** với hàng trăm mô hình bên ngoài:
     - **DeepSeek V3 & DeepSeek R1** (`deepseek/deepseek-chat`, `deepseek/deepseek-r1`)
     - **Claude 3.5 Sonnet** (`anthropic/claude-3.5-sonnet`)
     - **Llama 3.3 70B** (`meta-llama/llama-3.3-70b-instruct`)
     - **GPT-4o & GPT-4o Mini** (`openai/gpt-4o`, `openai/gpt-4o-mini`)
     - **Qwen 2.5 72B** (`qwen/qwen-2.5-72b-instruct`)
     - Cho phép nhập bất kỳ Custom Model ID nào trên OpenRouter.
   - **Chuyển đổi mô hình nhanh (Model Quick Switcher)** ngay trên thanh điều khiển của giao diện Chat.
   - Cung cấp cơ chế **Local Embedding & Synthesis Fallback**: Hệ thống hoạt động trơn tru ngay cả khi chưa nhập API key.

---

## 🌐 Triển Khai Online Lên Hugging Face Spaces (Miễn Phí 100%)

Dự án đã được cấu hình sẵn **`Dockerfile` tối ưu hóa** và các thông số cho Hugging Face Spaces. Bạn chỉ mất 2 phút để đưa ứng dụng lên mạng với domain HTTPS công khai:

### Cách 1: Đẩy trực tiếp từ máy của bạn lên Hugging Face Space (Khuyên dùng)
1. Đăng ký/Đăng nhập tài khoản tại [huggingface.co](https://huggingface.co).
2. Vào **[huggingface.co/new-space](https://huggingface.co/new-space)**:
   - **Space name**: `second-brain-ai`
   - **License**: `mit` (hoặc `apache-2.0`)
   - **Select the Space SDK**: Chọn **Docker** (Blank)
   - **Space hardware**: Chọn **CPU basic - Free** (Miễn phí 100%)
   - Bấm **Create Space**.
3. Thêm remote Hugging Face vào git cục bộ và đẩy lên:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-hf-username>/second-brain-ai
   git push -u hf main
   ```
   *(Nhập username và Access Token Hugging Face khi được hỏi - lấy token tại [hf.co/settings/tokens](https://huggingface.co/settings/tokens))*.

Hugging Face sẽ tự động build container Docker trong ~2 phút và cung cấp URL công khai dạng:
`https://<your-username>-second-brain-ai.hf.space`

---

### Cách 2: Triển Khai Trên Render.com / Railway / Cloud VPS
Nếu bạn muốn dùng Render hoặc Railway:
1. Kết nối với GitHub repository: `https://github.com/henryhnguy/second-brain-ai`
2. Chọn loại dịch vụ **Web Service** (Docker).
3. Đặt port là `7860` (hoặc đặt biến môi trường `PORT=8000`).
4. Bấm **Deploy**.

---

## 🏗️ Cấu Trúc Dự Án

```
second-brain/
├── Dockerfile                   # Cấu hình container đa tầng cho HF Spaces & Cloud
├── .dockerignore
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server & route mounting
│   │   ├── database.py          # SQLite schema, tables, seed data
│   │   ├── models.py            # Pydantic data schemas
│   │   ├── rag/
│   │   │   ├── chunker.py       # Smart text & markdown chunking
│   │   │   ├── embeddings.py    # Hybrid embedding service (Gemini + Local)
│   │   │   ├── vector_store.py  # SQLite-backed vector store & cosine search
│   │   │   └── rag_service.py   # RAG pipeline orchestration (Gemini & OpenRouter)
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
│   │   │   ├── ChatView.jsx     # Giao diện chat RAG & Model Switcher
│   │   │   ├── SearchView.jsx   # Giao diện Semantic Search
│   │   │   └── SettingsModal.jsx# Cài đặt Gemini & OpenRouter API keys
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

## 🚀 Chạy Cục Bộ (Local Machine)

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

## 🔑 Cấu Hình API Key (Google Gemini & OpenRouter)

1. Mở giao diện ứng dụng.
2. Nhấn vào mục **Cài đặt & API Key** ở góc dưới bên trái Sidebar (hoặc icon bánh răng góc phải Chat).
3. **Cấu hình Google Gemini**:
   - Lấy API key miễn phí từ [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Chọn tab **Google Gemini**, dán key và chọn mô hình (`gemini-2.5-flash`, `gemini-1.5-pro`...).
4. **Cấu hình OpenRouter (Claude, DeepSeek, Llama...)**:
   - Tạo API key tại [OpenRouter Keys](https://openrouter.ai/keys).
   - Chọn tab **OpenRouter**, dán key và chọn mô hình mong muốn (DeepSeek V3, Claude 3.5 Sonnet, Llama 3.3, GPT-4o...) hoặc nhập model ID bất kỳ.
5. Bấm **Lưu cấu hình**.
