import io
import pytest
import pymupdf as fitz
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app, DOC_STORE
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_pdf(with_images: bool = True, num_pages: int = 2) -> bytes:
    """Helper to generate an in-memory PDF with text and high-res images."""
    doc = fitz.open()
    for page_idx in range(num_pages):
        page = doc.new_page(width=595, height=842)
        # Insert some text
        page.insert_text((50, 50), f"Sample Page {page_idx + 1} - Enterprise Testing", fontsize=16)
        page.insert_text((50, 80), "This is vector text that must remain crisp after compression.", fontsize=11)

        if with_images:
            # Generate a 1200x1200 high-res image
            img = Image.new("RGB", (1200, 1200), color=(50 + page_idx * 40, 120, 200))
            img_buf = io.BytesIO()
            img.save(img_buf, format="PNG")
            # Draw it on page rect (200x200 pt display size -> high DPI ~ 432 DPI)
            page.insert_image(fitz.Rect(50, 120, 350, 420), stream=img_buf.getvalue())

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def create_encrypted_pdf() -> bytes:
    """Generate a password-encrypted PDF."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "Secret confidential content", fontsize=14)
    out = io.BytesIO()
    doc.save(
        out,
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw="securepassword123",
        owner_pw="ownerpassword123"
    )
    doc.close()
    return out.getvalue()


class TestPDFCompressionEngine:
    """Unit tests for core PDFEngine compression algorithms."""

    def test_lossless_compression(self):
        pdf_bytes = create_sample_pdf(with_images=False, num_pages=3)
        orig_copy = bytes(pdf_bytes)

        result = PDFEngine.compress_pdf_advanced(pdf_bytes, mode="lossless")

        assert result is not None
        assert "compressed_bytes" in result
        assert result["mode"] == "lossless"
        assert result["page_count"] == 3
        assert result["original_size"] == len(pdf_bytes)
        assert len(result["compressed_bytes"]) > 0

        # Verify output is valid PDF and text is intact
        comp_doc = fitz.open(stream=result["compressed_bytes"], filetype="pdf")
        assert len(comp_doc) == 3
        text = comp_doc[0].get_text()
        assert "Sample Page 1" in text
        comp_doc.close()

        # Verify original bytes were never modified (immutability)
        assert pdf_bytes == orig_copy

    def test_lossy_compression_recommended(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=2)
        orig_len = len(pdf_bytes)

        result = PDFEngine.compress_pdf_advanced(
            pdf_bytes,
            mode="lossy",
            preset="recommended"
        )

        assert result["mode"] == "lossy"
        assert result["preset"] == "recommended"
        assert result["compressed_size"] < orig_len
        assert result["savings_percent"] > 50.0
        assert result["images_optimized"] >= 2

        # Verify output validity
        comp_doc = fitz.open(stream=result["compressed_bytes"], filetype="pdf")
        assert len(comp_doc) == 2
        comp_doc.close()

    def test_lossy_compression_extreme(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=2)
        rec_res = PDFEngine.compress_pdf_advanced(pdf_bytes, mode="lossy", preset="recommended")
        ext_res = PDFEngine.compress_pdf_advanced(pdf_bytes, mode="lossy", preset="extreme")

        # Extreme preset should produce even smaller output than recommended
        assert ext_res["compressed_size"] <= rec_res["compressed_size"]
        assert ext_res["savings_percent"] >= rec_res["savings_percent"]

    def test_lossy_compression_custom_grayscale(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=1)
        result = PDFEngine.compress_pdf_advanced(
            pdf_bytes,
            mode="lossy",
            preset="custom",
            image_quality=50,
            max_dpi=96,
            grayscale=True
        )

        assert result["compressed_size"] < len(pdf_bytes)
        comp_doc = fitz.open(stream=result["compressed_bytes"], filetype="pdf")
        imgs = comp_doc[0].get_images(full=True)
        assert len(imgs) >= 1
        comp_doc.close()

    def test_compress_and_optimize_backwards_compatible(self):
        pdf_bytes = create_sample_pdf(with_images=False, num_pages=1)
        compressed = PDFEngine.compress_and_optimize(pdf_bytes)
        assert isinstance(compressed, bytes)
        assert len(compressed) > 0
        doc = fitz.open(stream=compressed, filetype="pdf")
        assert len(doc) == 1
        doc.close()

    def test_empty_pdf_raises_value_error(self):
        with pytest.raises(ValueError, match="empty"):
            PDFEngine.compress_pdf_advanced(b"")

    def test_invalid_corrupted_bytes_raise_value_error(self):
        with pytest.raises(ValueError, match="valid PDF|corrupted"):
            PDFEngine.compress_pdf_advanced(b"This is not a PDF at all")

    def test_encrypted_pdf_raises_value_error(self):
        enc_pdf = create_encrypted_pdf()
        with pytest.raises(ValueError, match="password-protected|encrypted"):
            PDFEngine.compress_pdf_advanced(enc_pdf)


class TestPDFCompressionEndpoints:
    """Integration tests for FastAPI compression routes."""

    def test_document_compress_endpoint(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=2)
        
        # Upload initial document
        upload_res = client.post(
            "/api/upload",
            files={"file": ("test_doc.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_res.status_code == 200
        doc_id = upload_res.json()["doc_id"]

        # Call compress endpoint on open document
        compress_res = client.post(
            f"/api/document/{doc_id}/compress",
            json={
                "mode": "lossy",
                "preset": "recommended",
                "image_quality": 70,
                "max_dpi": 150
            }
        )
        assert compress_res.status_code == 200
        data = compress_res.json()
        assert data["status"] == "success"
        assert data["compressed_size"] < data["original_size"]
        assert data["savings_percent"] > 0
        assert data["images_optimized"] >= 2

        # Verify undo works after compression
        undo_res = client.post(f"/api/document/{doc_id}/undo")
        assert undo_res.status_code == 200

    def test_standalone_compress_file_endpoint(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=2)

        res = client.post(
            "/api/compress-file",
            files={"file": ("standalone_test.pdf", pdf_bytes, "application/pdf")},
            data={
                "mode": "lossy",
                "preset": "extreme",
                "image_quality": "40",
                "max_dpi": "96",
                "grayscale": "false"
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "doc_id" in data
        assert data["compressed_size"] < data["original_size"]
        assert "download_url" in data

        # Test downloading the compressed file via generated URL
        dl_res = client.get(data["download_url"])
        assert dl_res.status_code == 200
        assert dl_res.headers["content-type"] == "application/pdf"
        assert len(dl_res.content) == data["compressed_size"]

    def test_direct_download_endpoint(self):
        pdf_bytes = create_sample_pdf(with_images=True, num_pages=1)

        res = client.post(
            "/api/compress-direct-download",
            files={"file": ("direct_doc.pdf", pdf_bytes, "application/pdf")},
            data={"mode": "lossless"}
        )
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert "X-Savings-Percent" in res.headers
        assert "X-Original-Size" in res.headers
        assert "X-Compressed-Size" in res.headers

    def test_compress_encrypted_pdf_api_error_handling(self):
        enc_pdf = create_encrypted_pdf()
        res = client.post(
            "/api/compress-file",
            files={"file": ("encrypted.pdf", enc_pdf, "application/pdf")},
            data={"mode": "lossy"}
        )
        assert res.status_code == 400
        assert "encrypted" in res.json()["detail"].lower() or "password" in res.json()["detail"].lower()

    def test_compress_invalid_file_api_error_handling(self):
        res = client.post(
            "/api/compress-file",
            files={"file": ("corrupt.pdf", b"garbage data not a pdf", "application/pdf")},
            data={"mode": "lossy"}
        )
        assert res.status_code == 400
        assert "corrupted" in res.json()["detail"].lower() or "valid" in res.json()["detail"].lower()
