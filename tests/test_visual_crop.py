import io
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient

from app.main import app
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_test_pdf_with_content() -> bytes:
    """Create a sample 2-page PDF with text blocks and drawings."""
    doc = fitz.open()
    
    # Page 1: Has content positioned between (100, 100) and (400, 300)
    p1 = doc.new_page(width=600, height=800)
    p1.insert_text((120, 150), "Hello Crop World", fontsize=16)
    p1.draw_rect(fitz.Rect(100, 100, 400, 300), color=(0, 0, 1), fill=(0.9, 0.9, 1))

    # Page 2: Blank page
    doc.new_page(width=600, height=800)

    out = io.BytesIO()
    doc.save(out)
    data = out.getvalue()
    doc.close()
    return data


class TestVisualCropBackend:
    """Tests for PDFEngine content boundary detection and enhanced page cropping."""

    def test_get_content_bounds_with_content(self):
        pdf_bytes = create_test_pdf_with_content()
        bounds = PDFEngine.get_content_bounds(pdf_bytes, page_num=1, padding=10.0)

        assert bounds["has_content"] is True
        assert bounds["page_width"] == 600
        assert bounds["page_height"] == 800
        
        bbox = bounds["bbox"]
        assert len(bbox) == 4
        x0, y0, x1, y1 = bbox
        assert x0 <= 100
        assert y0 <= 100
        assert x1 >= 400
        assert y1 >= 300
        assert x0 >= 0 and y0 >= 0
        assert x1 <= 600 and y1 <= 800

    def test_get_content_bounds_blank_page(self):
        pdf_bytes = create_test_pdf_with_content()
        bounds = PDFEngine.get_content_bounds(pdf_bytes, page_num=2, padding=18.0)

        assert bounds["has_content"] is False
        assert bounds["page_width"] == 600
        assert bounds["page_height"] == 800
        assert bounds["bbox"] == [30.0, 40.0, 570.0, 760.0]

    def test_crop_page_single(self):
        pdf_bytes = create_test_pdf_with_content()
        cropped = PDFEngine.crop_page(pdf_bytes, page_num=1, crop_box=[50, 50, 350, 400], apply_all_pages=False)

        doc = fitz.open(stream=cropped, filetype="pdf")
        assert len(doc) == 2
        p1 = doc[0]
        p2 = doc[1]

        assert abs(p1.rect.width - 300) < 1.0
        assert abs(p1.rect.height - 350) < 1.0

        # Page 2 should remain uncropped
        assert abs(p2.rect.width - 600) < 1.0
        assert abs(p2.rect.height - 800) < 1.0
        doc.close()

    def test_crop_page_coordinate_normalization(self):
        pdf_bytes = create_test_pdf_with_content()
        # Inverted coordinates: x0 > x1 and y0 > y1
        cropped = PDFEngine.crop_page(pdf_bytes, page_num=1, crop_box=[350, 400, 50, 50], apply_all_pages=False)

        doc = fitz.open(stream=cropped, filetype="pdf")
        p1 = doc[0]
        assert abs(p1.rect.width - 300) < 1.0
        assert abs(p1.rect.height - 350) < 1.0
        doc.close()

    def test_crop_page_all_pages(self):
        pdf_bytes = create_test_pdf_with_content()
        cropped = PDFEngine.crop_page(pdf_bytes, page_num=1, crop_box=[100, 100, 400, 500], apply_all_pages=True)

        doc = fitz.open(stream=cropped, filetype="pdf")
        assert len(doc) == 2
        for p in doc:
            assert abs(p.rect.width - 300) < 1.0
            assert abs(p.rect.height - 400) < 1.0
        doc.close()

    def test_crop_page_invalid_dimensions_raises(self):
        pdf_bytes = create_test_pdf_with_content()
        with pytest.raises(ValueError, match="Crop dimensions must be at least 10x10 pt"):
            PDFEngine.crop_page(pdf_bytes, page_num=1, crop_box=[100, 100, 105, 105])


class TestVisualCropAPI:
    """Tests for the visual crop content-bounds and crop endpoints."""

    def test_api_content_bounds_and_crop_flow(self):
        pdf_bytes = create_test_pdf_with_content()

        # Upload document
        upload_res = client.post(
            "/api/upload",
            files={"file": ("crop_test.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_res.status_code == 200
        doc_id = upload_res.json()["doc_id"]

        # 1. Fetch content bounds
        bounds_res = client.get(f"/api/document/{doc_id}/page/1/content-bounds?padding=12.0")
        assert bounds_res.status_code == 200
        bounds = bounds_res.json()
        assert bounds["has_content"] is True
        assert len(bounds["bbox"]) == 4

        # 2. Crop page using detected bounds
        crop_res = client.post(
            f"/api/document/{doc_id}/page/crop",
            json={
                "page": 1,
                "crop_box": bounds["bbox"],
                "apply_all_pages": False
            }
        )
        assert crop_res.status_code == 200
        crop_data = crop_res.json()
        assert "Cropped" in crop_data["message"]
        assert "info" in crop_data
