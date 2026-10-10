import io
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient
from app.main import app
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_pdf(num_pages: int = 1, text_prefix: str = "Page") -> bytes:
    """Helper to generate a lightweight valid PDF in-memory."""
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595, height=842)  # A4
        page.insert_text((72, 72), f"{text_prefix} {i + 1}", fontsize=18)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_pdf_engine_inspect_valid():
    """Test PDFEngine.inspect_pdf on valid single-page and multi-page PDFs."""
    pdf_bytes = create_sample_pdf(num_pages=3, text_prefix="Inspect Doc")
    info = PDFEngine.inspect_pdf(pdf_bytes)
    assert info["is_encrypted"] is False
    assert info["page_count"] == 3
    assert info["width"] == 595.0
    assert info["height"] == 842.0
    assert info["thumbnail"] is not None
    assert info["thumbnail"].startswith("data:image/jpeg;base64,")


def test_pdf_engine_inspect_encrypted():
    """Test PDFEngine.inspect_pdf on encrypted PDF."""
    pdf_bytes = create_sample_pdf(num_pages=1, text_prefix="Secret")
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    enc_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw="owner123", user_pw="user123")
    doc.close()

    info = PDFEngine.inspect_pdf(enc_bytes)
    assert info["is_encrypted"] is True
    assert info["page_count"] == 0
    assert info["thumbnail"] is None


def test_pdf_engine_inspect_corrupt():
    """Test PDFEngine.inspect_pdf on corrupted data."""
    with pytest.raises(ValueError, match="Invalid or corrupted PDF"):
        PDFEngine.inspect_pdf(b"Not a PDF file at all")


def test_pdf_engine_merge_basic():
    """Test PDFEngine.merge_pdfs correctly combines multiple documents in order."""
    doc1 = create_sample_pdf(num_pages=2, text_prefix="Doc 1 Page")
    doc2 = create_sample_pdf(num_pages=3, text_prefix="Doc 2 Page")

    merged = PDFEngine.merge_pdfs([doc1, doc2])
    res_doc = fitz.open(stream=merged, filetype="pdf")
    assert res_doc.page_count == 5
    assert "Doc 1 Page 1" in res_doc[0].get_text()
    assert "Doc 1 Page 2" in res_doc[1].get_text()
    assert "Doc 2 Page 1" in res_doc[2].get_text()
    assert "Doc 2 Page 3" in res_doc[4].get_text()
    res_doc.close()


def test_pdf_engine_merge_with_rotations():
    """Test PDFEngine.merge_pdfs with per-document rotation."""
    doc1 = create_sample_pdf(num_pages=1, text_prefix="Normal")
    doc2 = create_sample_pdf(num_pages=1, text_prefix="Rotated")

    # Rotate second document 90 degrees
    merged = PDFEngine.merge_pdfs([doc1, doc2], rotations=[0, 90])
    res_doc = fitz.open(stream=merged, filetype="pdf")
    assert res_doc.page_count == 2
    assert res_doc[0].rotation == 0
    assert res_doc[1].rotation == 90
    res_doc.close()


def test_api_pdf_inspect():
    """Test /api/pdf-inspect endpoint."""
    pdf_bytes = create_sample_pdf(num_pages=2, text_prefix="API Inspect")
    files = {"file": ("inspect_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    resp = client.post("/api/pdf-inspect", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["filename"] == "inspect_test.pdf"
    assert data["page_count"] == 2
    assert data["is_encrypted"] is False
    assert data["thumbnail"].startswith("data:image/jpeg;base64,")


def test_api_pdf_inspect_non_pdf():
    """Test /api/pdf-inspect endpoint rejecting non-PDF file."""
    files = {"file": ("notes.txt", io.BytesIO(b"Hello world"), "text/plain")}
    resp = client.post("/api/pdf-inspect", files=files)
    assert resp.status_code == 400


def test_api_merge_pdfs_success():
    """Test /api/merge endpoint merging 2 files with custom filename."""
    doc1 = create_sample_pdf(num_pages=1, text_prefix="File A")
    doc2 = create_sample_pdf(num_pages=2, text_prefix="File B")

    files = [
        ("files", ("doc_a.pdf", io.BytesIO(doc1), "application/pdf")),
        ("files", ("doc_b.pdf", io.BytesIO(doc2), "application/pdf")),
    ]
    data = {
        "rotations": "0,90",
        "output_filename": "final_merged.pdf"
    }
    resp = client.post("/api/merge", files=files, data=data)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert 'filename="final_merged.pdf"' in resp.headers.get("content-disposition", "")

    merged_doc = fitz.open(stream=resp.content, filetype="pdf")
    assert merged_doc.page_count == 3
    assert merged_doc[0].rotation == 0
    assert merged_doc[1].rotation == 90
    assert "File A 1" in merged_doc[0].get_text()
    assert "File B 1" in merged_doc[1].get_text()
    merged_doc.close()


def test_api_merge_pdfs_insufficient_files():
    """Test /api/merge endpoint fails if fewer than 2 files uploaded."""
    doc1 = create_sample_pdf(num_pages=1, text_prefix="Single File")
    files = [
        ("files", ("single.pdf", io.BytesIO(doc1), "application/pdf"))
    ]
    resp = client.post("/api/merge", files=files)
    assert resp.status_code == 400
    assert "at least 2 PDF files" in resp.json()["detail"]
