import io
import fitz
import pytest
from fastapi.testclient import TestClient

from app.main import app, DOC_STORE
from app.pdf_engine import PDFEngine


def create_test_pdf_with_elements() -> bytes:
    """Create a test PDF with text and annotations for history and batch delete testing."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    # Add text
    page.insert_text(fitz.Point(72, 100), "First Heading to be deleted", fontsize=16, fontname="helv")
    page.insert_text(fitz.Point(72, 150), "Second Paragraph to preserve", fontsize=12, fontname="helv")

    # Add a rectangle annotation
    rect = fitz.Rect(72, 200, 200, 260)
    annot = page.add_rect_annot(rect)
    annot.set_colors(stroke=(0.2, 0.4, 0.9), fill=(0.9, 0.9, 1.0))
    annot.update()

    # Add a highlight annotation
    hl = page.add_highlight_annot(fitz.Rect(72, 145, 250, 165))
    hl.update()

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


class TestOptimisticHistoryTimeline:
    """Comprehensive test suite for Plan Q5: Zero-Latency Optimistic UI & Visual Undo/Redo Timeline."""

    def test_upload_initializes_history_timeline(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()

        res = client.post(
            "/api/upload",
            files={"file": ("test_timeline.pdf", pdf_bytes, "application/pdf")}
        )
        assert res.status_code == 200
        data = res.json()
        doc_id = data["doc_id"]

        # Check history returned on upload
        assert "history" in data
        assert len(data["history"]) == 1
        v0_entry = data["history"][0]
        assert v0_entry["version"] == 0
        assert v0_entry["action_type"] == "upload"
        assert "Original Document" in v0_entry["action_title"]

        # Also verify GET /api/document/{doc_id}/history
        hist_res = client.get(f"/api/document/{doc_id}/history")
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert hist_data["current_version"] == 0
        assert len(hist_data["history"]) == 1

    def test_history_tracking_across_mutations(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()
        upload_res = client.post(
            "/api/upload",
            files={"file": ("test_mutations.pdf", pdf_bytes, "application/pdf")}
        )
        doc_id = upload_res.json()["doc_id"]

        # 1. First mutation: Add a shape (v1)
        shape_res = client.post(
            f"/api/document/{doc_id}/add-shape",
            json={
                "page": 1,
                "shapes": [{
                    "type": "rect",
                    "bbox": [50, 50, 150, 100],
                    "color": [1, 0, 0],
                    "width": 2
                }]
            }
        )
        assert shape_res.status_code == 200
        s_data = shape_res.json()
        assert s_data["version"] == 1
        assert len(s_data["history"]) == 2
        assert s_data["history"][1]["action_type"] == "shape"

        # 2. Second mutation: Edit text (v2)
        edit_res = client.post(
            f"/api/document/{doc_id}/edit-text",
            json={
                "edits": [{
                    "page": 1,
                    "bbox": [72, 90, 300, 110],
                    "new_text": "Updated Header Text",
                    "font_size": 16,
                    "font_name": "helv"
                }]
            }
        )
        assert edit_res.status_code == 200
        e_data = edit_res.json()
        assert e_data["version"] == 2
        assert len(e_data["history"]) == 3
        assert e_data["history"][2]["action_type"] in ["text", "edit"]

        # Verify history timeline endpoint returns all 3 versions in sequence
        hist = client.get(f"/api/document/{doc_id}/history").json()
        assert hist["current_version"] == 2
        assert [h["version"] for h in hist["history"]] == [0, 1, 2]

    def test_jump_to_version_time_travel(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()
        doc_id = client.post(
            "/api/upload",
            files={"file": ("test_jump.pdf", pdf_bytes, "application/pdf")}
        ).json()["doc_id"]

        # Create 2 versions
        r1 = client.post(f"/api/document/{doc_id}/add-shape", json={
            "page": 1, "shapes": [{"type": "circle", "bbox": [10, 10, 50, 50]}]
        })
        assert r1.status_code == 200
        r2 = client.post(f"/api/document/{doc_id}/add-shape", json={
            "page": 1, "shapes": [{"type": "rect", "bbox": [10, 10, 80, 80]}]
        })
        assert r2.status_code == 200

        # At v2:
        # Jump backward to v1
        jump1 = client.post(f"/api/document/{doc_id}/jump-to-version/1?page=1")
        assert jump1.status_code == 200
        j1_data = jump1.json()
        assert j1_data["version"] == 1
        assert j1_data["can_undo"] is True
        assert j1_data["can_redo"] is True
        assert "page_bundle" in j1_data

        # Jump to v0 (original)
        jump0 = client.post(f"/api/document/{doc_id}/jump-to-version/0?page=1")
        assert jump0.status_code == 200
        j0_data = jump0.json()
        assert j0_data["version"] == 0
        assert j0_data["can_undo"] is False
        assert j0_data["can_redo"] is True

        # Jump forward to v2
        jump2 = client.post(f"/api/document/{doc_id}/jump-to-version/2?page=1")
        assert jump2.status_code == 200
        j2_data = jump2.json()
        assert j2_data["version"] == 2
        assert j2_data["can_undo"] is True
        assert j2_data["can_redo"] is False

    def test_jump_to_version_out_of_bounds(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()
        doc_id = client.post(
            "/api/upload",
            files={"file": ("test_bounds.pdf", pdf_bytes, "application/pdf")}
        ).json()["doc_id"]

        # Out of bounds: -1
        res_neg = client.post(f"/api/document/{doc_id}/jump-to-version/-1")
        assert res_neg.status_code == 400

        # Out of bounds: 5 when max is 0
        res_large = client.post(f"/api/document/{doc_id}/jump-to-version/5")
        assert res_large.status_code == 400

    def test_batch_delete_elements_atomic_execution(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()
        doc_id = client.post(
            "/api/upload",
            files={"file": ("test_batch.pdf", pdf_bytes, "application/pdf")}
        ).json()["doc_id"]

        # Call batch delete: 1 text edit redaction + 1 annotation index deletion
        batch_res = client.post(
            f"/api/document/{doc_id}/batch-delete",
            json={
                "page": 1,
                "text_edits": [{
                    "page": 1,
                    "bbox": [72, 90, 300, 110],
                    "new_text": "",
                    "bg_color": None
                }],
                "annot_indices": [0]
            }
        )
        assert batch_res.status_code == 200
        b_data = batch_res.json()
        assert b_data["status"] == "success"
        assert b_data["version"] == 1
        assert "Deleted 2 items in batch" in b_data["message"]
        assert b_data["history"][-1]["action_type"] == "delete"

        # Verify page bundle reflects deletion
        bundle = b_data.get("page_bundle")
        assert bundle is not None
        # Original had 2 annotations (rect + highlight); now 1 remains
        assert len(bundle.get("annotations", [])) == 1

    def test_branch_truncation_on_divergent_edit(self):
        client = TestClient(app)
        pdf_bytes = create_test_pdf_with_elements()
        doc_id = client.post(
            "/api/upload",
            files={"file": ("test_trunc.pdf", pdf_bytes, "application/pdf")}
        ).json()["doc_id"]

        # v1 and v2
        client.post(f"/api/document/{doc_id}/add-shape", json={
            "page": 1, "shapes": [{"type": "rect", "bbox": [10, 10, 40, 40]}]
        })
        client.post(f"/api/document/{doc_id}/add-shape", json={
            "page": 1, "shapes": [{"type": "circle", "bbox": [50, 50, 90, 90]}]
        })

        hist_before = client.get(f"/api/document/{doc_id}/history").json()
        assert len(hist_before["history"]) == 3

        # Jump back to v1
        client.post(f"/api/document/{doc_id}/jump-to-version/1")

        # Now perform a divergent edit from v1 (creates new v2)
        divergent_res = client.post(
            f"/api/document/{doc_id}/add-shape",
            json={"page": 1, "shapes": [{"type": "rect", "bbox": [0, 0, 100, 100]}]}
        )
        assert divergent_res.status_code == 200
        d_data = divergent_res.json()
        assert d_data["version"] == 2

        # Verify history has 3 items (v0, v1, new v2) - old v2 is truncated
        hist_after = client.get(f"/api/document/{doc_id}/history").json()
        assert len(hist_after["history"]) == 3
        assert hist_after["current_version"] == 2
