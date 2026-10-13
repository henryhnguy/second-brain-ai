import re
from typing import List, Dict, Any


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Splits text into coherent overlapping chunks, respecting paragraphs and headings.
    """
    if not text or not text.strip():
        return []

    # First attempt splitting by double newlines or markdown headers
    paragraphs = re.split(r'\n{2,}|(?=^#{1,4} )', text, flags=re.MULTILINE)
    paragraphs = [p.strip() for p in paragraphs if p.strip()]

    chunks = []
    current_chunk = ""
    current_header = ""

    for p in paragraphs:
        # Check if paragraph is a markdown header
        header_match = re.match(r'^(#{1,4})\s+(.+)$', p)
        if header_match:
            current_header = header_match.group(2).strip()

        # If adding this paragraph exceeds chunk_size, save current chunk
        if len(current_chunk) + len(p) > chunk_size and len(current_chunk) > 100:
            chunks.append({
                "content": current_chunk.strip(),
                "header": current_header
            })
            # Overlap: keep the last portion
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
            current_chunk = (overlap_text + "\n" + p).strip()
        else:
            if current_chunk:
                current_chunk += "\n\n" + p
            else:
                current_chunk = p

    if current_chunk.strip():
        chunks.append({
            "content": current_chunk.strip(),
            "header": current_header
        })

    # Fallback if any chunk is still excessively large (e.g. giant continuous text block)
    final_chunks = []
    for c in chunks:
        content = c["content"]
        if len(content) > chunk_size * 2:
            start = 0
            while start < len(content):
                end = min(start + chunk_size, len(content))
                sub_text = content[start:end].strip()
                if sub_text:
                    final_chunks.append({
                        "content": sub_text,
                        "header": c.get("header", "")
                    })
                start += chunk_size - overlap
        else:
            final_chunks.append(c)

    return final_chunks
