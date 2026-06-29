"""
MealMate - Text Chunker
Splits large .txt documents into semantically meaningful chunks.
"""
import hashlib
from typing import List, Dict


def _make_id(text: str, index: int, prefix: str = "chunk") -> str:
    """Generate a unique ID based on content hash + index."""
    content_hash = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
    return f"{prefix}_{content_hash}_{index:04d}"


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    source_name: str = "document"
) -> List[Dict]:
    """Split text into overlapping chunks by paragraphs."""
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunks = []
    current_chunk = ""
    chunk_index = 0

    for para in paragraphs:
        if len(current_chunk) + len(para) > chunk_size and current_chunk:
            chunks.append({
                "id": _make_id(current_chunk.strip(), chunk_index, "chunk"),
                "text": current_chunk.strip(),
                "metadata": {
                    "chunk_index": chunk_index,
                    "char_count": len(current_chunk.strip()),
                    "source": source_name
                }
            })
            chunk_index += 1

            if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                overlap_text = current_chunk[-chunk_overlap:]
                space_idx = overlap_text.find(" ")
                if space_idx > 0:
                    overlap_text = overlap_text[space_idx + 1:]
                current_chunk = overlap_text + "\n" + para + "\n"
            else:
                current_chunk = para + "\n"
        else:
            current_chunk += para + "\n"

    if current_chunk.strip():
        chunks.append({
            "id": _make_id(current_chunk.strip(), chunk_index, "chunk"),
            "text": current_chunk.strip(),
            "metadata": {
                "chunk_index": chunk_index,
                "char_count": len(current_chunk.strip()),
                "source": source_name
            }
        })

    return chunks


def chunk_by_sections(text: str, source_name: str = "document") -> List[Dict]:
    """Split by section headers (ALL CAPS lines, # headers, lines ending with :)."""
    text = text.strip()
    if not text:
        return []

    lines = text.split("\n")
    sections = []
    current_section = ""
    current_header = "Introduction"
    chunk_index = 0

    for line in lines:
        stripped = line.strip()

        is_header = False
        if stripped and (
            (stripped.isupper() and len(stripped) < 80 and len(stripped) > 3)
            or stripped.startswith("#")
            or (stripped.endswith(":") and len(stripped) < 60)
        ):
            is_header = True

        if is_header and current_section.strip():
            section_text = f"{current_header}\n\n{current_section.strip()}"
            sections.append({
                "id": _make_id(section_text, chunk_index, "section"),
                "text": section_text,
                "metadata": {
                    "chunk_index": chunk_index,
                    "section_header": current_header,
                    "char_count": len(current_section.strip()),
                    "source": source_name
                }
            })
            chunk_index += 1
            current_header = stripped.replace("#", "").strip().rstrip(":")
            current_section = ""
        else:
            current_section += line + "\n"

    if current_section.strip():
        section_text = f"{current_header}\n\n{current_section.strip()}"
        sections.append({
            "id": _make_id(section_text, chunk_index, "section"),
            "text": section_text,
            "metadata": {
                "chunk_index": chunk_index,
                "section_header": current_header,
                "char_count": len(current_section.strip()),
                "source": source_name
            }
        })

    return sections


def smart_chunk(text: str, chunk_size: int = 500, overlap: int = 100, source_name: str = "document") -> List[Dict]:
    """Try section-based first, fall back to paragraph-based."""
    section_chunks = chunk_by_sections(text, source_name)

    if len(section_chunks) >= 3:
        final_chunks = []
        for chunk in section_chunks:
            if len(chunk["text"]) > chunk_size * 2:
                sub_chunks = chunk_text(chunk["text"], chunk_size, overlap, source_name)
                final_chunks.extend(sub_chunks)
            else:
                final_chunks.append(chunk)
        return final_chunks

    return chunk_text(text, chunk_size, overlap, source_name)
