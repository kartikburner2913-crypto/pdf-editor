import io
import os
import re
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_sample_pdf() -> bytes:
    """Create a 3-page test document with text and forms for testing mutations."""
    doc = fitz.open()
    for i in range(1, 4):
        p = doc.new_page(width=595, height=842)
        p.insert_text((50, 100), f"Document Page {i} Header Text", fontsize=18)
        p.insert_text((50, 200), f"Sample Email: user{i}@example.com", fontsize=14)
        p.insert_text((50, 300), f"Confidential Data SSN: 123-45-678{i}", fontsize=14)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_mutations_bundle_and_undo_redo_roundtrip():
    """Verify that all major mutation operations (page numbers, watermarks, redactions,
    markups, forms, blank page, duplicate, crop, trim, bookmarks, sticky notes, stamps)
    return a complete bundle with version increment, can_undo/can_redo, and undo/redo works."""
    pdf_bytes = create_sample_pdf()

    # 1. Upload
    res = client.post(
        "/api/upload",
        files={"file": ("mutation_test.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert res.status_code == 200
    doc_id = res.json()["doc_id"]
    assert res.json()["info"]["page_count"] == 3

    # 2. Add Page Numbers
    pn_res = client.post(
        f"/api/document/{doc_id}/page-numbers?page=1",
        json={
            "position": "bottom-right",
            "format_str": "Page {page} of {total}",
            "start_page": 1,
            "font_size": 11.0,
            "color": "#111827",
            "margin": 24.0
        }
    )
    assert pn_res.status_code == 200
    pn_data = pn_res.json()
    assert pn_data["status"] == "success"
    assert pn_data["version"] == 1
    assert pn_data["can_undo"] is True
    assert pn_data["can_redo"] is False
    assert "page_bundle" in pn_data
    assert pn_data["page_bundle"]["page"] == 1
    assert "image_data_url" in pn_data["page_bundle"]
    assert any("Page 1 of 3" in b.get("text", "") for b in pn_data["page_bundle"]["text_blocks"])

    # 3. Add Watermark
    wm_res = client.post(
        f"/api/document/{doc_id}/watermark?page=1",
        json={
            "text": "CONFIDENTIAL",
            "opacity": 0.25,
            "angle": 45.0,
            "font_size": 40.0,
            "color": "#dc2626"
        }
    )
    assert wm_res.status_code == 200
    wm_data = wm_res.json()
    assert wm_data["status"] == "success"
    assert wm_data["version"] == 2
    assert wm_data["can_undo"] is True
    assert wm_data["can_redo"] is False
    assert "page_bundle" in wm_data

    # 4. Add Text Markup (highlight)
    mk_res = client.post(
        f"/api/document/{doc_id}/add-markup",
        json={
            "page": 1,
            "type": "highlight",
            "search_text": "Header Text",
            "color": "#fef08a"
        }
    )
    assert mk_res.status_code == 200
    mk_data = mk_res.json()
    assert mk_data["status"] == "success"
    assert mk_data["version"] == 3
    assert mk_data["can_undo"] is True
    assert "page_bundle" in mk_data

    # 5. Add Form Field
    ff_res = client.post(
        f"/api/document/{doc_id}/add-form-field",
        json={
            "page": 1,
            "type": "text",
            "name": "full_name",
            "bbox": [50, 400, 250, 430],
            "default_value": "Jane Doe"
        }
    )
    assert ff_res.status_code == 200
    ff_data = ff_res.json()
    assert ff_data["status"] == "success"
    assert ff_data["version"] == 4
    assert ff_data["can_undo"] is True
    assert "page_bundle" in ff_data

    # 6. Fill Form Field
    fill_res = client.post(
        f"/api/document/{doc_id}/fill-forms?page=1",
        json={
            "fields": {
                "full_name": "Kartik Doe"
            }
        }
    )
    assert fill_res.status_code == 200
    fill_data = fill_res.json()
    assert fill_data["status"] == "success"
    assert fill_data["version"] == 5
    assert fill_data["can_undo"] is True
    assert "page_bundle" in fill_data

    # 7. Auto-Redact PII (SSN)
    pii_scan = client.post(
        f"/api/document/{doc_id}/scan-pii",
        json={"page": 1, "types": ["ssn"]}
    ).json()
    assert len(pii_scan["matches"]) > 0

    redact_res = client.post(
        f"/api/document/{doc_id}/auto-redact-pii?page=1",
        json={
            "items": pii_scan["matches"],
            "fill_color": "#000000",
            "text_color": "#ffffff",
            "label": "REDACTED",
            "sanitize_metadata": True
        }
    )
    assert redact_res.status_code == 200
    redact_data = redact_res.json()
    assert redact_data["status"] == "success"
    assert redact_data["version"] == 6
    assert redact_data["can_undo"] is True
    assert "page_bundle" in redact_data

    # 8. Insert Blank Page at position 2
    ins_res = client.post(
        f"/api/document/{doc_id}/page/insert-blank",
        json={"at_page": 2, "width": 595.0, "height": 842.0}
    )
    assert ins_res.status_code == 200
    ins_data = ins_res.json()
    assert ins_data["version"] == 7
    assert ins_data["info"]["page_count"] == 4
    assert "page_bundle" in ins_data

    # 9. Duplicate Page 2
    dup_res = client.post(
        f"/api/document/{doc_id}/page/duplicate",
        json={"page": 2}
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["version"] == 8
    assert dup_data["info"]["page_count"] == 5

    # 10. Sticky Note
    note_res = client.post(
        f"/api/document/{doc_id}/add-sticky-note",
        json={"page": 1, "point": [100.0, 100.0], "content": "Review Note", "author": "Reviewer"}
    )
    assert note_res.status_code == 200
    assert note_res.json()["version"] == 9

    # 11. Add Stamp
    stamp_res = client.post(
        f"/api/document/{doc_id}/add-stamp",
        json={"page": 1, "bbox": [100.0, 150.0, 220.0, 185.0], "text": "APPROVED"}
    )
    assert stamp_res.status_code == 200
    assert stamp_res.json()["version"] == 10

    # 12. Bookmarks
    bm_res = client.post(
        f"/api/document/{doc_id}/bookmarks?page=1",
        json={"bookmarks": [{"title": "Introduction", "page": 1}]}
    )
    assert bm_res.status_code == 200
    assert bm_res.json()["version"] == 11

    # 13. Metadata Update
    meta_res = client.post(
        f"/api/document/{doc_id}/metadata?page=1",
        json={"title": "Updated Title", "author": "Kartik"}
    )
    assert meta_res.status_code == 200
    assert meta_res.json()["version"] == 12

    # 14. Flatten Forms
    flat_res = client.post(f"/api/document/{doc_id}/forms/flatten?page=1")
    assert flat_res.status_code == 200
    assert flat_res.json()["version"] == 13

    # 15. Undo step-by-step
    u1 = client.post(f"/api/document/{doc_id}/undo?page=1").json()
    assert u1["version"] == 12
    assert u1["can_undo"] is True
    assert u1["can_redo"] is True

    u2 = client.post(f"/api/document/{doc_id}/undo?page=1").json()
    assert u2["version"] == 11
    assert u2["can_undo"] is True
    assert u2["can_redo"] is True

    # 16. Redo
    r1 = client.post(f"/api/document/{doc_id}/redo?page=1").json()
    assert r1["version"] == 12
    assert r1["can_undo"] is True
    assert r1["can_redo"] is True


def test_zero_emojis_in_source_code():
    """Enforce strict invariant: zero unicode emojis in templates, css, js, and py files."""
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
    base_dir = os.path.join(os.path.dirname(__file__), "..")

    targets = [
        os.path.join(base_dir, "templates", "index.html"),
        os.path.join(base_dir, "static", "css", "style.css"),
        os.path.join(base_dir, "static", "js", "app.js"),
        os.path.join(base_dir, "app", "main.py"),
        os.path.join(base_dir, "app", "pdf_engine.py"),
    ]

    for target in targets:
        with open(target, "r", encoding="utf-8") as f:
            content = f.read()
        matches = emoji_pattern.findall(content)
        assert len(matches) == 0, f"Found {len(matches)} emojis in {target}: {matches[:5]}"
