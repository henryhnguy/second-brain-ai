import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "second_brain.db"


def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Notes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'Resources',
        tags TEXT DEFAULT '[]',
        pinned INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Documents table (uploaded files: PDF, MD, TXT)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        summary TEXT DEFAULT '',
        chunk_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'indexed',
        created_at TEXT NOT NULL
    );
    """)

    # Chunks table (for Vector Store / RAG)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_type TEXT NOT NULL, -- 'note' or 'document'
        source_id INTEGER NOT NULL,
        source_title TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT NOT NULL, -- JSON array of floats
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL
    );
    """)

    # Chat Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # Chat Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL, -- 'user' or 'assistant'
        content TEXT NOT NULL,
        sources TEXT DEFAULT '[]', -- JSON array of citation objects
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    """)

    # Settings table (e.g. Gemini API Key, default model)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    conn.commit()

    # Insert default settings if not exists
    cursor.execute("SELECT value FROM settings WHERE key = 'llm_provider'")
    if not cursor.fetchone():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('llm_provider', 'gemini')")

    cursor.execute("SELECT value FROM settings WHERE key = 'gemini_api_key'")
    if not cursor.fetchone():
        env_key = os.getenv("GEMINI_API_KEY", "")
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("gemini_api_key", env_key))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("model_name", "gemini-2.5-flash"))

    cursor.execute("SELECT value FROM settings WHERE key = 'openrouter_api_key'")
    if not cursor.fetchone():
        env_or_key = os.getenv("OPENROUTER_API_KEY", "")
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("openrouter_api_key", env_or_key))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ("openrouter_model", "deepseek/deepseek-chat"))

    conn.commit()

    # Seed sample notes if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM notes")
    row = cursor.fetchone()
    if row and row["cnt"] == 0:
        seed_sample_notes(conn)

    conn.close()


def seed_sample_notes(conn):
    now = datetime.utcnow().isoformat()
    samples = [
        (
            "🧠 Chào mừng đến với Second Brain AI",
            """# Chào mừng bạn đến với Bộ não thứ hai (Second Brain)

Second Brain là không gian lưu trữ, tổ chức kiến thức và cộng tác cùng Trí tuệ Nhân tạo (AI).

### 🌟 Tính năng chính:
- **Ghi chú & Soạn thảo Markdown**: Lưu trữ ý tưởng, bài học, tài liệu nghiên cứu.
- **Tải lên tài liệu**: Hỗ trợ tập tin PDF, Markdown, Text (.txt).
- **Hỏi đáp AI (RAG - Retrieval-Augmented Generation)**: Chat với AI được cá nhân hóa bằng toàn bộ dữ liệu bạn đã nạp vào Second Brain.
- **Tìm kiếm ngữ nghĩa (Semantic Search)**: Tìm thông tin theo ý nghĩa thay vì chỉ khớp từ khóa chính xác.
- **Phương pháp PARA**: Phân loại theo Projects (Dự án), Areas (Trách nhiệm), Resources (Tài nguyên), Archives (Lưu trữ).

### 🚀 Bắt đầu ngay:
1. Thử tạo một ghi chú mới ở nút **+ Ghi chú mới**.
2. Nhấn vào mục **Tài liệu** để tải lên file PDF hoặc bài báo bạn muốn AI đọc giúp.
3. Mở tab **AI Chat** và đặt câu hỏi: *"Trong Second Brain có những gì?"* hoặc *"Tóm tắt ghi chú của tôi"*.
""",
            "Resources",
            json.dumps(["Welcome", "SecondBrain", "Guide"]),
            1,
            now,
            now
        ),
        (
            "📁 Phương pháp PARA trong quản lý tri thức",
            """# Phương pháp PARA của Tiago Forte

PARA là một hệ thống tổ chức thông tin đơn giản nhưng cực kỳ hiệu quả dành cho Second Brain cá nhân:

1. **Projects (Dự án)**:
   - Các mục tiêu ngắn hạn có thời hạn cụ thể (Deadline) và kết quả đo lường được.
   - *Ví dụ:* Hoàn thành báo cáo quý 3, Ra mắt website mới, Đạt chứng chỉ AWS.

2. **Areas (Lĩnh vực)**:
   - Những trách nhiệm dài hạn không có ngày kết thúc nhưng cần duy trì tiêu chuẩn liên tục.
   - *Ví dụ:* Sức khỏe & Thể thao, Quản lý tài chính cá nhân, Nâng cao năng lực chuyên môn.

3. **Resources (Tài nguyên)**:
   - Kho kiến thức, tài liệu tham khảo, chủ đề bạn quan tâm hoặc có thể dùng trong tương lai.
   - *Ví dụ:* Ghi chú kiến trúc hệ thống, Thư viện prompt AI, Công thức nấu ăn.

4. **Archives (Lưu trữ)**:
   - Những mục đã hoàn thành hoặc không còn hoạt động từ 3 nhóm trên nhưng cần lưu lại để tra cứu.
""",
            "Areas",
            json.dumps(["Productivity", "PARA", "TiagoForte"]),
            0,
            now,
            now
        ),
        (
            "⚡ Tuyển tập Prompt AI cho học tập & nghiên cứu",
            """# Kỹ thuật Prompting hiệu quả cùng Second Brain

Khi tương tác với AI Assistant trong Second Brain, bạn có thể áp dụng các cấu trúc prompt sau:

### 1. Tóm tắt & Trích xuất ý cốt lõi:
> *"Dựa trên các ghi chú và tài liệu về [Chủ đề X], hãy rút ra 3 bài học quan trọng nhất và đưa ra ví dụ thực tế."*

### 2. Tìm kiếm liên kết ẩn giữa các kiến thức:
> *"Hãy tìm mối liên hệ giữa ghi chú về Phương pháp PARA và các tài liệu dự án gần đây của tôi."*

### 3. Đóng vai người phản biện (Devil's Advocate):
> *"Tôi đang lập kế hoạch cho dự án X. Hãy chỉ ra 3 rủi ro tiềm ẩn mà tôi có thể chưa lường trước dựa trên các ghi chú trước đây."*
""",
            "Resources",
            json.dumps(["AI", "Prompts", "Study"]),
            0,
            now,
            now
        )
    ]

    cursor = conn.cursor()
    for title, content, cat, tags, pinned, c_at, u_at in samples:
        cursor.execute(
            "INSERT INTO notes (title, content, category, tags, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (title, content, cat, tags, pinned, c_at, u_at)
        )
    conn.commit()
