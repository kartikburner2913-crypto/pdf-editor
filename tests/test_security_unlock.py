import io
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient

from app.main import app
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_sample_encrypted_pdf(user_pw: str = "secret123", owner_pw: str = "admin123") -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "Confidential Protected PDF Document", fontsize=14)
    page.insert_text((50, 100), "Sensitive data that is encrypted using AES-256.", fontsize=11)
    
    out = io.BytesIO()
    doc.save(
        out,
        encryption=fitz.PDF_ENCRYPT_AES_256,
        user_pw=user_pw,
        owner_pw=owner_pw,
        permissions=fitz.PDF_PERM_PRINT
    )
    enc_bytes = out.getvalue()
    doc.close()
    return enc_bytes


def create_sample_plain_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 50), "Standard Public Document", fontsize=14)
    plain_bytes = doc.tobytes()
    doc.close()
    return plain_bytes


class TestSecurityUnlock:
    """Comprehensive test suite for Feature 29: Unlock PDF (remove password)."""

    def test_engine_unlock_pdf_user_password(self):
        enc_bytes = create_sample_encrypted_pdf("userpass", "ownerpass")
        assert PDFEngine.is_pdf_encrypted(enc_bytes) is True

        unlocked_bytes = PDFEngine.unlock_pdf(enc_bytes, "userpass")
        assert PDFEngine.is_pdf_encrypted(unlocked_bytes) is False

        # Verify content is readable
        doc = fitz.open(stream=unlocked_bytes, filetype="pdf")
        assert not doc.is_encrypted
        assert "Confidential Protected PDF" in doc[0].get_text()
        doc.close()

    def test_engine_unlock_pdf_owner_password(self):
        enc_bytes = create_sample_encrypted_pdf("userpass", "ownerpass")
        unlocked_bytes = PDFEngine.unlock_pdf(enc_bytes, "ownerpass")
        assert PDFEngine.is_pdf_encrypted(unlocked_bytes) is False

        doc = fitz.open(stream=unlocked_bytes, filetype="pdf")
        assert not doc.is_encrypted
        assert len(doc) == 1
        doc.close()

    def test_engine_unlock_pdf_incorrect_password(self):
        enc_bytes = create_sample_encrypted_pdf("correct_pass")
        with pytest.raises(ValueError) as exc:
            PDFEngine.unlock_pdf(enc_bytes, "wrong_pass")
        assert "Incorrect password" in str(exc.value)

    def test_engine_unlock_already_unencrypted_pdf(self):
        plain_bytes = create_sample_plain_pdf()
        assert PDFEngine.is_pdf_encrypted(plain_bytes) is False

        unlocked_bytes = PDFEngine.unlock_pdf(plain_bytes, "")
        assert PDFEngine.is_pdf_encrypted(unlocked_bytes) is False
        doc = fitz.open(stream=unlocked_bytes, filetype="pdf")
        assert not doc.is_encrypted
        assert "Standard Public Document" in doc[0].get_text()
        doc.close()

    def test_engine_is_pdf_encrypted_detection(self):
        plain_bytes = create_sample_plain_pdf()
        enc_bytes = create_sample_encrypted_pdf()
        assert PDFEngine.is_pdf_encrypted(plain_bytes) is False
        assert PDFEngine.is_pdf_encrypted(enc_bytes) is True
        assert PDFEngine.is_pdf_encrypted(b"") is False

    def test_api_document_unlock_workflow(self):
        # 1. Upload a plain document
        plain_bytes = create_sample_plain_pdf()
        res_upload = client.post(
            "/api/upload",
            files={"file": ("sample.pdf", plain_bytes, "application/pdf")}
        )
        assert res_upload.status_code == 200
        doc_id = res_upload.json()["doc_id"]
        assert res_upload.json()["is_encrypted"] is False

        # 2. Protect document via API
        res_protect = client.post(
            f"/api/document/{doc_id}/protect",
            json={"password": "MySecretPassword123", "allow_print": True, "allow_copy": False}
        )
        assert res_protect.status_code == 200
        assert res_protect.json()["status"] == "success"

        # Verify it is now encrypted
        res_audit = client.get(f"/api/document/{doc_id}/security-inspect")
        assert res_audit.status_code == 200
        assert res_audit.json()["is_encrypted"] is True

        # 3. Attempt unlock with incorrect password
        res_unlock_wrong = client.post(
            f"/api/document/{doc_id}/unlock",
            json={"password": "WrongPassword"}
        )
        assert res_unlock_wrong.status_code == 400
        assert "Incorrect password" in res_unlock_wrong.json()["detail"]

        # 4. Unlock with correct password
        res_unlock = client.post(
            f"/api/document/{doc_id}/unlock",
            json={"password": "MySecretPassword123"}
        )
        assert res_unlock.status_code == 200
        data = res_unlock.json()
        assert data["status"] == "success"
        assert data["info"]["is_encrypted"] is False
        assert data["info"]["page_count"] == 1

        # 5. Verify security inspection confirms it is no longer encrypted
        res_audit_post = client.get(f"/api/document/{doc_id}/security-inspect")
        assert res_audit_post.status_code == 200
        assert res_audit_post.json()["is_encrypted"] is False

    def test_api_upload_encrypted_pdf_prompts_password(self):
        enc_bytes = create_sample_encrypted_pdf("test_password_456")
        res = client.post(
            "/api/upload",
            files={"file": ("protected_doc.pdf", enc_bytes, "application/pdf")}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_encrypted"] is True
        assert data["requires_password"] is True
        doc_id = data["doc_id"]

        # Unlocking with valid password completes document initialization
        res_unlock = client.post(
            f"/api/document/{doc_id}/unlock",
            json={"password": "test_password_456"}
        )
        assert res_unlock.status_code == 200
        assert res_unlock.json()["info"]["is_encrypted"] is False
        assert res_unlock.json()["info"]["page_count"] == 1

    def test_api_upload_encrypted_pdf_with_immediate_password(self):
        enc_bytes = create_sample_encrypted_pdf("fast_unlock_pw")
        res = client.post(
            "/api/upload",
            files={"file": ("protected_fast.pdf", enc_bytes, "application/pdf")},
            data={"password": "fast_unlock_pw"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_encrypted"] is False
        assert data["requires_password"] is False
        assert data["info"]["page_count"] == 1

    def test_api_standalone_unlock_endpoint(self):
        enc_bytes = create_sample_encrypted_pdf("standalone_pw")
        
        # Test wrong password
        res_wrong = client.post(
            "/api/unlock-pdf",
            files={"file": ("secret.pdf", enc_bytes, "application/pdf")},
            data={"password": "wrong"}
        )
        assert res_wrong.status_code == 400
        assert "Incorrect password" in res_wrong.json()["detail"]

        # Test correct password -> returns stream
        res_correct = client.post(
            "/api/unlock-pdf",
            files={"file": ("secret.pdf", enc_bytes, "application/pdf")},
            data={"password": "standalone_pw"}
        )
        assert res_correct.status_code == 200
        assert res_correct.headers["content-type"] == "application/pdf"
        assert "attachment; filename=\"secret_unlocked.pdf\"" in res_correct.headers["content-disposition"]
        
        # Verify returned bytes are decrypted
        unlocked_doc = fitz.open(stream=res_correct.content, filetype="pdf")
        assert not unlocked_doc.is_encrypted
        assert "Confidential Protected PDF" in unlocked_doc[0].get_text()
        unlocked_doc.close()
