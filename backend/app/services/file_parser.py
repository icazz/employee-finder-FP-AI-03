import csv
import io

import fitz
from docx import Document

def _parse_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_text = [page.get_text() for page in doc]

    full_text = " ".join(pages_text)
    return _flatten_to_single_line(full_text)


def _parse_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

    full_text = " ".join(paragraphs)
    return _flatten_to_single_line(full_text)


def _flatten_to_single_line(text: str) -> str:
    return " ".join(text.split())

def _parse_file_to_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()

    match ext:
        case "pdf":
            return _parse_pdf(file_bytes)
        case "docx":
            return _parse_docx(file_bytes)
        case _:
            raise ValueError(f"Unsupported file type: .{ext}")

def _extract_email(text: str) -> str:
    at_idx = text.find("@")
    if at_idx == -1:
        return ""

    start = at_idx
    while start > 0 and text[start - 1] != " ":
        start -= 1

    end = at_idx
    while end < len(text) and text[end] != " ":
        end += 1

    candidate = text[start:end]

    if "." not in candidate[candidate.index("@"):]:
        return ""

    return candidate


def build_csv(files: list[tuple[str, bytes]]) -> io.StringIO:
    buffer = io.StringIO()
    writer = csv.writer(buffer, quoting=csv.QUOTE_ALL)

    writer.writerow(["filename", "text", "email"])

    for filename, file_bytes in files:
        text = _parse_file_to_text(file_bytes, filename)
        email = _extract_email(text)
        writer.writerow([filename, text, email])

    buffer.seek(0)
    return buffer