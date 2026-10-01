import io
import os
import time
import pytest
import pymupdf as fitz
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app, DOC_STORE, DATA_DIR, prune_store, get_doc, save_doc_bytes
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_doc(num_pages: int = 3) -> bytes:
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 50), f"Header on Page {i+1}", fontsize=14)
        page.insert_text((50, 100), "First paragraph of sample text for testing optimizations.", fontsize=11)
        page.insert_text((50, 120), "Second line in same paragraph.", fontsize=11)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestOptimizations:
    """Test performance optimizations, image encoding, and session pruning."""

    def test_page_bundle_high_efficiency_jpeg(self):
        pdf_bytes = create_sample_doc(num_pages=2)
        bundle = PDFEngine.get_page_bundle(pdf_bytes, page_number=1, zoom=1.5)

        assert bundle is not None
        assert "image_data_url" in bundle
        assert bundle["image_data_url"].startswith("data:image/jpeg;base64,")
        assert len(bundle["text_blocks"]) >= 1
        assert bundle["width"] == 595.0
        assert bundle["height"] == 842.0

    def test_page_image_format_negotiation(self):
        pdf_bytes = create_sample_doc(num_pages=1)

        # Upload
        upload_res = client.post(
            "/api/upload",
            files={"file": ("test.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_res.status_code == 200
        doc_id = upload_res.json()["doc_id"]

        # 1. Thumbnail zoom <= 0.5 auto-negotiates to image/jpeg
        thumb_res = client.get(f"/api/document/{doc_id}/page/1/image?zoom=0.18")
        assert thumb_res.status_code == 200
        assert thumb_res.headers["content-type"] == "image/jpeg"
        assert len(thumb_res.content) < 30000  # Should be lightweight (< 30 KB)

        # 2. Explicit format=png
        png_res = client.get(f"/api/document/{doc_id}/page/1/image?zoom=1.5&format=png")
        assert png_res.status_code == 200
        assert png_res.headers["content-type"] == "image/png"

        # 3. Explicit format=jpeg
        jpeg_res = client.get(f"/api/document/{doc_id}/page/1/image?zoom=1.5&format=jpeg")
        assert jpeg_res.status_code == 200
        assert jpeg_res.headers["content-type"] == "image/jpeg"

    def test_prune_store_cleans_disk_and_memory(self):
        doc_id = "test_prune_id_999"
        doc_dir = os.path.join(DATA_DIR, doc_id)
        os.makedirs(doc_dir, exist_ok=True)
        save_doc_bytes(doc_id, 0, b"%PDF-1.4 dummy content")

        # Set fake expired updated_at timestamp (3 hours ago)
        DOC_STORE[doc_id] = {
            "filename": "expired.pdf",
            "current_version": 0,
            "max_version": 0,
            "updated_at": time.time() - 10000
        }

        assert os.path.exists(doc_dir)
        assert doc_id in DOC_STORE

        # Run prune_store
        prune_store()

        assert doc_id not in DOC_STORE
        assert not os.path.exists(doc_dir)

    def test_cohesive_clustering_preserves_layout(self):
        pdf_bytes = create_sample_doc(num_pages=1)
        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)

        assert len(blocks) >= 1
        # First block should be the top-most header due to linear vertical sweep sorting
        assert "Header on Page 1" in blocks[0]["text"]
