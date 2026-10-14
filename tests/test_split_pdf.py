import io
import zipfile
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient
from app.main import app
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_pdf(num_pages: int = 5, prefix: str = "Page") -> bytes:
    """Helper to generate a lightweight valid multi-page PDF in-memory."""
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595, height=842)  # A4
        page.insert_text((72, 72), f"{prefix} {i + 1} Content", fontsize=18)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# ==============================================================================
# PDFEngine Unit Tests - Split & Extract
# ==============================================================================

def test_split_and_extract_single_page():
    """Extract a single page from a 5-page PDF."""
    pdf_bytes = create_sample_pdf(5)
    extracted = PDFEngine.split_and_extract(pdf_bytes, "3")
    res_doc = fitz.open(stream=extracted, filetype="pdf")
    assert res_doc.page_count == 1
    assert "Page 3 Content" in res_doc[0].get_text()
    res_doc.close()


def test_split_and_extract_range():
    """Extract a range of pages (e.g. 2-4)."""
    pdf_bytes = create_sample_pdf(5)
    extracted = PDFEngine.split_and_extract(pdf_bytes, "2-4")
    res_doc = fitz.open(stream=extracted, filetype="pdf")
    assert res_doc.page_count == 3
    assert "Page 2 Content" in res_doc[0].get_text()
    assert "Page 3 Content" in res_doc[1].get_text()
    assert "Page 4 Content" in res_doc[2].get_text()
    res_doc.close()


def test_split_and_extract_mixed_ranges_with_spaces():
    """Extract combination of ranges and individual pages with extra whitespace."""
    pdf_bytes = create_sample_pdf(6)
    extracted = PDFEngine.split_and_extract(pdf_bytes, " 1 - 2 ,  5 , 6 ")
    res_doc = fitz.open(stream=extracted, filetype="pdf")
    assert res_doc.page_count == 4
    assert "Page 1 Content" in res_doc[0].get_text()
    assert "Page 2 Content" in res_doc[1].get_text()
    assert "Page 5 Content" in res_doc[2].get_text()
    assert "Page 6 Content" in res_doc[3].get_text()
    res_doc.close()


def test_split_and_extract_partial_out_of_bounds():
    """Range exceeding total page count extracts available pages up to total."""
    pdf_bytes = create_sample_pdf(3)
    extracted = PDFEngine.split_and_extract(pdf_bytes, "2-10")
    res_doc = fitz.open(stream=extracted, filetype="pdf")
    assert res_doc.page_count == 2
    assert "Page 2 Content" in res_doc[0].get_text()
    assert "Page 3 Content" in res_doc[1].get_text()
    res_doc.close()


def test_split_and_extract_invalid_boundaries_error():
    """Reversed bounds (e.g. 5-2) should raise ValueError."""
    pdf_bytes = create_sample_pdf(5)
    with pytest.raises(ValueError, match="Invalid range boundaries"):
        PDFEngine.split_and_extract(pdf_bytes, "5-2")


def test_split_and_extract_zero_or_negative_error():
    """Zero or negative numbers should raise ValueError."""
    pdf_bytes = create_sample_pdf(5)
    with pytest.raises(ValueError):
        PDFEngine.split_and_extract(pdf_bytes, "0-3")


def test_split_and_extract_empty_or_whitespace_error():
    """Empty strings or pure whitespace should raise ValueError."""
    pdf_bytes = create_sample_pdf(5)
    with pytest.raises(ValueError, match="cannot be empty"):
        PDFEngine.split_and_extract(pdf_bytes, "   ")


def test_split_and_extract_malformed_syntax_error():
    """Malformed syntax like 'abc', '1-2-3', or '1, @' should raise ValueError."""
    pdf_bytes = create_sample_pdf(5)
    with pytest.raises(ValueError):
        PDFEngine.split_and_extract(pdf_bytes, "1-2-3")
    with pytest.raises(ValueError):
        PDFEngine.split_and_extract(pdf_bytes, "abc")
    with pytest.raises(ValueError):
        PDFEngine.split_and_extract(pdf_bytes, "1, @, 3")


def test_split_and_extract_completely_out_of_bounds_error():
    """Selecting page 99 on a 3-page document should raise ValueError."""
    pdf_bytes = create_sample_pdf(3)
    with pytest.raises(ValueError, match="No valid pages selected"):
        PDFEngine.split_and_extract(pdf_bytes, "99, 100")


# ==============================================================================
# PDFEngine Unit Tests - Extract Pages to ZIP
# ==============================================================================

def test_extract_pages_to_zip():
    """Extract selected pages into separate individual PDFs inside a ZIP."""
    pdf_bytes = create_sample_pdf(5)
    zip_bytes = PDFEngine.extract_pages_to_zip(pdf_bytes, "1, 3-4")
    
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        file_list = sorted(zf.namelist())
        assert file_list == ["extracted_page_001.pdf", "extracted_page_003.pdf", "extracted_page_004.pdf"]
        for fname in file_list:
            page_data = zf.read(fname)
            doc = fitz.open(stream=page_data, filetype="pdf")
            assert doc.page_count == 1
            doc.close()


def test_extract_pages_to_zip_empty_raises():
    """Empty range for extract_pages_to_zip raises ValueError."""
    pdf_bytes = create_sample_pdf(3)
    with pytest.raises(ValueError):
        PDFEngine.extract_pages_to_zip(pdf_bytes, "")


# ==============================================================================
# API Endpoint Integration Tests
# ==============================================================================

def test_api_split_pdf_success():
    """POST /api/document/{doc_id}/split extracts pages with custom filename."""
    pdf_bytes = create_sample_pdf(5, prefix="Studio Page")
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("my_document.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_resp.status_code == 200
    doc_id = upload_resp.json()["doc_id"]

    split_resp = client.post(
        f"/api/document/{doc_id}/split",
        json={"page_ranges": "1-2, 5", "output_filename": "custom_extract.pdf"}
    )
    assert split_resp.status_code == 200
    assert split_resp.headers["content-type"] == "application/pdf"
    assert 'filename="custom_extract.pdf"' in split_resp.headers.get("content-disposition", "")

    extracted_doc = fitz.open(stream=split_resp.content, filetype="pdf")
    assert extracted_doc.page_count == 3
    assert "Studio Page 1" in extracted_doc[0].get_text()
    assert "Studio Page 2" in extracted_doc[1].get_text()
    assert "Studio Page 5" in extracted_doc[2].get_text()
    extracted_doc.close()


def test_api_split_pdf_invalid_range():
    """POST /api/document/{doc_id}/split with invalid range returns 400."""
    pdf_bytes = create_sample_pdf(3)
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("doc.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    doc_id = upload_resp.json()["doc_id"]

    split_resp = client.post(
        f"/api/document/{doc_id}/split",
        json={"page_ranges": "99-100"}
    )
    assert split_resp.status_code == 400
    assert "No valid pages" in split_resp.json()["detail"]


def test_api_extract_pages_zip_success():
    """POST /api/document/{doc_id}/extract-zip extracts pages into a ZIP."""
    pdf_bytes = create_sample_pdf(4)
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("annual_report.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    doc_id = upload_resp.json()["doc_id"]

    resp = client.post(
        f"/api/document/{doc_id}/extract-zip",
        json={"page_ranges": "2, 4"}
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/zip"
    assert 'filename="extracted_pages_annual_report.zip"' in resp.headers.get("content-disposition", "")

    with zipfile.ZipFile(io.BytesIO(resp.content), "r") as zf:
        names = sorted(zf.namelist())
        assert names == ["page_002.pdf", "page_004.pdf"]


def test_api_extract_pages_zip_single_and_all_pages():
    """Extract zip works for 1 page and all pages."""
    pdf_bytes = create_sample_pdf(3)
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("test_doc.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    doc_id = upload_resp.json()["doc_id"]

    # Single page zip
    resp_single = client.post(
        f"/api/document/{doc_id}/extract-zip",
        json={"page_ranges": "2"}
    )
    assert resp_single.status_code == 200
    with zipfile.ZipFile(io.BytesIO(resp_single.content), "r") as zf:
        assert zf.namelist() == ["page_002.pdf"]

    # All pages zip
    resp_all = client.post(
        f"/api/document/{doc_id}/extract-zip",
        json={"page_ranges": "1-3"}
    )
    assert resp_all.status_code == 200
    with zipfile.ZipFile(io.BytesIO(resp_all.content), "r") as zf:
        assert sorted(zf.namelist()) == ["page_001.pdf", "page_002.pdf", "page_003.pdf"]


def test_api_split_nonexistent_document_returns_404():
    """Nonexistent doc_id returns 404."""
    resp_split = client.post(
        "/api/document/nonexistent-doc-id/split",
        json={"page_ranges": "1"}
    )
    assert resp_split.status_code == 404

    resp_zip = client.post(
        "/api/document/nonexistent-doc-id/extract-zip",
        json={"page_ranges": "1"}
    )
    assert resp_zip.status_code == 404


def test_api_split_custom_filename_without_extension():
    """Custom filename without .pdf extension is correctly handled."""
    pdf_bytes = create_sample_pdf(2)
    upload_resp = client.post(
        "/api/upload",
        files={"file": ("notes.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    doc_id = upload_resp.json()["doc_id"]

    resp = client.post(
        f"/api/document/{doc_id}/split",
        json={"page_ranges": "1", "output_filename": "extracted_chapter"}
    )
    assert resp.status_code == 200
    assert 'filename="extracted_chapter.pdf"' in resp.headers.get("content-disposition", "")


def test_ui_split_elements_present_in_index_html():
    """Verify that templates/index.html includes all Visual Split Studio elements."""
    with open("templates/index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # Sidebar components
    assert 'id="splitSidebarGrid"' in html
    assert 'id="splitRangeInput"' in html
    assert 'id="splitSelectionSummary"' in html
    assert 'id="btnOpenSplitModal"' in html
    assert 'id="btnSplitSelectAll"' in html
    assert 'id="btnSplitSelectNone"' in html
    assert 'id="btnSplitSelectOdd"' in html
    assert 'id="btnSplitSelectEven"' in html
    assert 'id="btnSplitInvert"' in html
    assert 'id="btnSplitRange"' in html
    assert 'id="btnSplitOpenStudio"' in html
    assert 'id="btnExtractZip"' in html
    assert 'id="btnBurstZip"' in html

    # Studio Modal components
    assert 'id="splitStudioModal"' in html
    assert 'id="splitModalCardsGrid"' in html
    assert 'id="splitModalRangeInput"' in html
    assert 'id="splitModalStatsBadge"' in html
    assert 'id="btnModalSplitSelectAll"' in html
    assert 'id="btnModalSplitSelectNone"' in html
    assert 'id="btnModalSplitSelectOdd"' in html
    assert 'id="btnModalSplitSelectEven"' in html
    assert 'id="btnModalSplitInvert"' in html
    assert 'id="btnModalExtractZip"' in html
    assert 'id="btnModalSplitDownload"' in html
    assert 'id="btnModalSplitOpen"' in html

