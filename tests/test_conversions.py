import io
import os
import pytest
import pymupdf as fitz
from docx import Document
from pptx import Presentation
import openpyxl
from fastapi.testclient import TestClient

from app.main import app, DOC_STORE, DATA_DIR
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_pdf(num_pages: int = 2) -> bytes:
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 60), f"Sample Document Page {i+1}", fontsize=16)
        page.insert_text((50, 100), "This is a paragraph of text used for format conversion testing.", fontsize=11)
        page.insert_text((50, 130), "Item A: 100 | Item B: 200 | Item C: 300", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_sample_docx() -> bytes:
    doc = Document()
    doc.add_heading("Test Document Title", level=1)
    doc.add_paragraph("This is a test paragraph inside a Word document.")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Header 1"
    table.cell(0, 1).text = "Header 2"
    table.cell(1, 0).text = "Value A"
    table.cell(1, 1).text = "Value B"
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def create_sample_xlsx() -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Financials"
    ws.append(["Category", "Q1", "Q2", "Total"])
    ws.append(["Revenue", 1000, 1500, 2500])
    ws.append(["Expenses", 400, 500, 900])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def create_sample_pptx() -> bytes:
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[0])
    title = slide.shapes.title
    subtitle = slide.placeholders[1]
    title.text = "Presentation Title"
    subtitle.text = "Subtitle for PPTX test"
    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()


class TestFormatConversions:
    """Test full document conversions between PDF and Office formats (SmallPDF Parity)."""

    def test_pdf_to_word(self):
        pdf_bytes = create_sample_pdf(1)
        docx_bytes = PDFEngine.convert_pdf_to_docx(pdf_bytes)
        assert len(docx_bytes) > 0
        # Valid docx can be opened by python-docx
        doc = Document(io.BytesIO(docx_bytes))
        assert len(doc.paragraphs) > 0 or len(doc.tables) > 0

        # Test API upload endpoint
        res = client.post(
            "/api/convert-pdf-to-word",
            files={"file": ("test.pdf", pdf_bytes, "application/pdf")}
        )
        assert res.status_code == 200
        assert "wordprocessingml.document" in res.headers.get("content-type", "")

    def test_pdf_to_excel(self):
        pdf_bytes = create_sample_pdf(2)
        excel_bytes = PDFEngine.convert_pdf_to_excel(pdf_bytes)
        assert len(excel_bytes) > 0
        # Valid xlsx can be opened by openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(excel_bytes))
        assert len(wb.sheetnames) >= 2
        assert "Page 1" in wb.sheetnames

        # Test API upload endpoint
        res = client.post(
            "/api/convert-pdf-to-excel",
            files={"file": ("report.pdf", pdf_bytes, "application/pdf")}
        )
        assert res.status_code == 200
        assert "spreadsheetml.sheet" in res.headers.get("content-type", "")

    def test_pdf_to_pptx(self):
        pdf_bytes = create_sample_pdf(2)
        pptx_bytes = PDFEngine.convert_pdf_to_pptx(pdf_bytes)
        assert len(pptx_bytes) > 0
        # Valid pptx can be opened by python-pptx
        prs = Presentation(io.BytesIO(pptx_bytes))
        assert len(prs.slides) == 2

        # Test API upload endpoint
        res = client.post(
            "/api/convert-pdf-to-pptx",
            files={"file": ("deck.pdf", pdf_bytes, "application/pdf")}
        )
        assert res.status_code == 200
        assert "presentationml.presentation" in res.headers.get("content-type", "")

    def test_docx_to_pdf(self):
        docx_bytes = create_sample_docx()
        pdf_bytes = PDFEngine.convert_docx_to_pdf(docx_bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        assert len(doc) >= 1
        doc.close()

        # Test API endpoint
        res = client.post(
            "/api/convert-docx-to-pdf",
            files={"file": ("document.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        )
        assert res.status_code == 200
        assert "application/pdf" in res.headers.get("content-type", "")
        assert res.content.startswith(b"%PDF")

    def test_excel_to_pdf(self):
        xlsx_bytes = create_sample_xlsx()
        pdf_bytes = PDFEngine.convert_excel_to_pdf(xlsx_bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        assert len(doc) >= 1
        doc.close()

        # Test API endpoint
        res = client.post(
            "/api/convert-excel-to-pdf",
            files={"file": ("sheet.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        )
        assert res.status_code == 200
        assert "application/pdf" in res.headers.get("content-type", "")
        assert res.content.startswith(b"%PDF")

    def test_pptx_to_pdf(self):
        pptx_bytes = create_sample_pptx()
        pdf_bytes = PDFEngine.convert_pptx_to_pdf(pptx_bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes.startswith(b"%PDF")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        assert len(doc) >= 1
        doc.close()

        # Test API endpoint
        res = client.post(
            "/api/convert-pptx-to-pdf",
            files={"file": ("slides.pptx", pptx_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
        )
        assert res.status_code == 200
        assert "application/pdf" in res.headers.get("content-type", "")
        assert res.content.startswith(b"%PDF")

    def test_pdf_to_pdfa(self):
        pdf_bytes = create_sample_pdf(1)
        pdfa_bytes = PDFEngine.convert_pdf_to_pdfa(pdf_bytes, conformance="2b")
        assert len(pdfa_bytes) > 0
        assert pdfa_bytes.startswith(b"%PDF")
        doc = fitz.open(stream=pdfa_bytes, filetype="pdf")
        assert len(doc) == 1
        # Check XML metadata contains pdfaid schema
        xmp = doc.get_xml_metadata()
        assert "pdfaid" in xmp or doc.metadata.get("producer") == "PDF Studio Engine"
        doc.close()

        # Test API endpoint
        res = client.post(
            "/api/convert-pdf-to-pdfa",
            files={"file": ("archive.pdf", pdf_bytes, "application/pdf")},
            data={"level": "2b"}
        )
        assert res.status_code == 200
        assert "application/pdf" in res.headers.get("content-type", "")
        assert res.content.startswith(b"%PDF")

    def test_active_document_conversion_endpoints(self):
        pdf_bytes = create_sample_pdf(1)
        upload_res = client.post(
            "/api/upload",
            files={"file": ("active_doc.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_res.status_code == 200
        doc_id = upload_res.json()["doc_id"]

        # 1. Convert active doc to word
        word_res = client.get(f"/api/document/{doc_id}/convert-to-word")
        assert word_res.status_code == 200
        assert "wordprocessingml.document" in word_res.headers.get("content-type", "")

        # 2. Convert active doc to excel
        excel_res = client.get(f"/api/document/{doc_id}/convert-to-excel")
        assert excel_res.status_code == 200
        assert "spreadsheetml.sheet" in excel_res.headers.get("content-type", "")

        # 3. Convert active doc to pptx
        pptx_res = client.get(f"/api/document/{doc_id}/convert-to-pptx")
        assert pptx_res.status_code == 200
        assert "presentationml.presentation" in pptx_res.headers.get("content-type", "")

        # 4. Convert active doc to pdfa
        pdfa_res = client.get(f"/api/document/{doc_id}/convert-to-pdfa?level=2b")
        assert pdfa_res.status_code == 200
        assert "application/pdf" in pdfa_res.headers.get("content-type", "")
        assert pdfa_res.content.startswith(b"%PDF")
