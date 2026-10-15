import io
import os
import re
import subprocess
import pytest
import pymupdf as fitz
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_numbered_pdf() -> bytes:
    """Create a 3-page test PDF with distinct text on each page."""
    doc = fitz.open()
    for i in range(1, 4):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 100), f"PAGE {i} UNIQUE CONTENT", fontsize=20)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_organize_reorder_undo_redo_revert_flow():
    """Verify page reorder returns version metadata and roundtrips cleanly with undo, redo, and revert."""
    pdf_bytes = create_numbered_pdf()

    # 1. Upload document
    resp = client.post(
        "/api/upload",
        files={"file": ("test_flow.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert resp.status_code == 200
    doc_id = resp.json()["doc_id"]
    assert resp.json()["info"]["page_count"] == 3

    # Initial page 1 text verification
    p1_bundle = client.get(f"/api/document/{doc_id}/page/1/bundle").json()
    assert any("PAGE 1" in b.get("text", "") for b in p1_bundle["text_blocks"])

    # 2. Reorder pages: Swap Page 1 and Page 2 -> [2, 1, 3]
    reorder_resp = client.post(
        f"/api/document/{doc_id}/organize",
        json={"page_order": [2, 1, 3]}
    )
    assert reorder_resp.status_code == 200
    data = reorder_resp.json()
    assert data["status"] == "success"
    assert data["version"] == 1
    assert data["can_undo"] is True
    assert data["can_redo"] is False

    # Verify Page 1 now contains original Page 2 content
    p1_after = client.get(f"/api/document/{doc_id}/page/1/bundle?v=1").json()
    assert any("PAGE 2" in b.get("text", "") for b in p1_after["text_blocks"])

    # 3. Undo reorder -> Back to version 0
    undo_resp = client.post(f"/api/document/{doc_id}/undo?page=1")
    assert undo_resp.status_code == 200
    undo_data = undo_resp.json()
    assert undo_data["version"] == 0
    assert undo_data["can_undo"] is False
    assert undo_data["can_redo"] is True

    # Verify Page 1 restored to original Page 1 content
    p1_undone = client.get(f"/api/document/{doc_id}/page/1/bundle?v=0").json()
    assert any("PAGE 1" in b.get("text", "") for b in p1_undone["text_blocks"])

    # 4. Redo reorder -> Back to version 1
    redo_resp = client.post(f"/api/document/{doc_id}/redo?page=1")
    assert redo_resp.status_code == 200
    redo_data = redo_resp.json()
    assert redo_data["version"] == 1
    assert redo_data["can_undo"] is True
    assert redo_data["can_redo"] is False

    # Verify Page 1 is Page 2 content again
    p1_redone = client.get(f"/api/document/{doc_id}/page/1/bundle?v=1").json()
    assert any("PAGE 2" in b.get("text", "") for b in p1_redone["text_blocks"])

    # 5. Revert document -> Resets to original version 0
    revert_resp = client.post(f"/api/document/{doc_id}/revert")
    assert revert_resp.status_code == 200
    rev_data = revert_resp.json()
    assert rev_data["version"] == 0
    assert rev_data["can_undo"] is False
    assert rev_data["can_redo"] is True

    # Verify Page 1 is original Page 1 content after revert
    p1_reverted = client.get(f"/api/document/{doc_id}/page/1/bundle?v=0").json()
    assert any("PAGE 1" in b.get("text", "") for b in p1_reverted["text_blocks"])


def test_ui_markup_for_thumbnail_reorder_actions():
    """Verify index.html context menu items, CSS rules, and JS function exports for page reordering."""
    index_path = os.path.join(os.path.dirname(__file__), "..", "templates", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    assert soup.find(id="ctxMovePageUp") is not None, "ctxMovePageUp must exist in thumbnail context menu"
    assert soup.find(id="ctxMovePageDown") is not None, "ctxMovePageDown must exist in thumbnail context menu"

    css_path = os.path.join(os.path.dirname(__file__), "..", "static", "css", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".thumbnail-quick-actions" in css
    assert ".thumb-action-btn" in css
    assert "flex-shrink: 0" in css

    js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "app.js")
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    assert "function movePageRelative(" in js
    assert "window.movePageRelative = movePageRelative;" in js

    # Strict emoji invariant check
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
    assert len(emoji_pattern.findall(str(soup.find(id="thumbnailContextMenu")))) == 0


def test_user_reported_bugs_verification():
    """Verify fixes for the 4 user-reported bugs:
    1. Single page view toggle & PDF wrapper persistence.
    2. Page reorder updates editor canvas view.
    3. Thumbnail click triggers page navigation and scroll.
    4. Outlines and page badges removed from canvas pages.
    """
    css_path = os.path.join(os.path.dirname(__file__), "..", "static", "css", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    # Bug 4 verification in CSS
    assert ".page-slot-badge {\n  display: none !important;" in css or ".page-slot-badge {\n  display: none !important" in css
    # Verify no blue border/outline on active-slot
    assert "box-shadow: 0 0 0 2px #0284c7" not in css

    js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "app.js")
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Bug 1 & 4: verify no badge element appended to slot in createPageSlotElement
    assert 'slot.appendChild(badge)' not in js

    # Bug 1: verify togglePageLayoutMode resets containers and ensures wrapper visibility
    assert 'wrapper.style.display = "block"' in js
    assert 'loadPage(state.currentPage, { forceScrollReset: true })' in js

    # Bug 2: verify applyPageOrder loads active page with forceScrollReset and syncs active thumbnail
    assert ('await applyMutationResponse(data, state.currentPage, { forceScrollReset: true });' in js or 
            'await loadPage(state.currentPage, { forceScrollReset: true });' in js)
    assert 'syncActiveThumbnail(state.currentPage);' in js

    # Bug 3: verify thumbnail click navigation handles mouseup/click and prevents image drag conflicts
    assert 'img.draggable = false;' in js
    assert 'scrollToPageSlot(i)' in js

    # Mathematical / Functional Node test
    node_script = """
    const fs = require('fs');
    const js = fs.readFileSync('static/js/app.js', 'utf8');

    // Verify cacheKey v0/v1 consistency
    if (js.includes("v${state.docVersion || 1}_p${pageNumber}")) {
      throw new Error("Found inconsistent state.docVersion || 1 in cacheKey!");
    }
    console.log("PASS");
    """
    res = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), ".."))
    assert res.returncode == 0, f"Node verification failed:\n{res.stderr}"
    assert "PASS" in res.stdout

