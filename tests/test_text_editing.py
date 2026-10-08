import io
import pytest
import pymupdf as fitz
from fastapi.testclient import TestClient

from app.main import app
from app.pdf_engine import PDFEngine

client = TestClient(app)


def create_tight_multiline_doc() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # Header
    page.insert_text((50, 45), "Top Document Header", fontsize=14)
    # 6 tight lines with descenders and ascenders
    lines = [
        "Line 1: Alpha line with descenders g, y, p, q.",
        "Line 2: Beta line with ascenders h, k, l, b.",
        "Line 3: Gamma line target to be edited.",
        "Line 4: Delta line directly below target.",
        "Line 5: Epsilon line with various punctuation symbols.",
        "Line 6: Zeta closing line of the test block."
    ]
    for i, l in enumerate(lines):
        # 13 pt leading on 11 pt font creates tight ascender/descender proximity
        page.insert_text((50, 80 + i * 13), l, fontsize=11)
    # Footer
    page.insert_text((50, 185), "Bottom Document Footer", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestTextEditingNonInvasive:
    """Ensure text block identification and editing never causes adjacent text to disappear."""

    def test_edit_middle_line_preserves_all_adjacent_lines(self):
        pdf_bytes = create_tight_multiline_doc()
        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)

        # Locate the Gamma line
        gamma_block = None
        for b in blocks:
            if "Gamma line target" in b["text"]:
                gamma_block = b
                break

        assert gamma_block is not None, "Gamma block should be identified"

        new_text = "Line 3: GAMMA HAS BEEN UPDATED CLEANLY"
        edit_payload = [{
            "page": 1,
            "bbox": gamma_block["bbox"],
            "lines": gamma_block.get("lines"),
            "new_text": new_text,
            "font_size": 11.0,
            "font_name": "helv"
        }]

        edited_bytes = PDFEngine.edit_text(pdf_bytes, edit_payload)

        doc = fitz.open(stream=edited_bytes, filetype="pdf")
        page = doc[0]
        page_text = page.get_text("text", sort=True)
        doc.close()

        # All adjacent lines above and below must remain 100% intact
        assert "Top Document Header" in page_text
        assert "Line 1: Alpha line with descenders g, y, p, q." in page_text
        assert "Line 2: Beta line with ascenders h, k, l, b." in page_text
        assert new_text in page_text
        assert "Line 4: Delta line directly below target." in page_text
        assert "Line 5: Epsilon line with various punctuation symbols." in page_text
        assert "Line 6: Zeta closing line of the test block." in page_text
        assert "Bottom Document Footer" in page_text

    def test_edit_first_and_last_lines_in_tight_block(self):
        pdf_bytes = create_tight_multiline_doc()
        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)

        # Edit line 1 (Alpha)
        alpha_block = next(b for b in blocks if "Line 1: Alpha" in b["text"])
        edit_alpha = [{
            "page": 1,
            "bbox": alpha_block["bbox"],
            "lines": alpha_block.get("lines"),
            "new_text": "Line 1: REPLACED ALPHA",
            "font_size": 11.0
        }]
        res1 = PDFEngine.edit_text(pdf_bytes, edit_alpha)

        # Edit line 6 (Zeta)
        blocks_after = PDFEngine.get_page_text_blocks(res1, page_number=1)
        zeta_block = next(b for b in blocks_after if "Line 6: Zeta" in b["text"])
        edit_zeta = [{
            "page": 1,
            "bbox": zeta_block["bbox"],
            "lines": zeta_block.get("lines"),
            "new_text": "Line 6: REPLACED ZETA",
            "font_size": 11.0
        }]
        res2 = PDFEngine.edit_text(res1, edit_zeta)

        doc = fitz.open(stream=res2, filetype="pdf")
        text = doc[0].get_text("text", sort=True)
        doc.close()

        assert "Line 1: REPLACED ALPHA" in text
        assert "Line 2: Beta line with ascenders h, k, l, b." in text
        assert "Line 3: Gamma line target to be edited." in text
        assert "Line 4: Delta line directly below target." in text
        assert "Line 5: Epsilon line with various punctuation symbols." in text
        assert "Line 6: REPLACED ZETA" in text
        assert "Top Document Header" in text
        assert "Bottom Document Footer" in text

    def test_multiline_block_replacement(self):
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 50), "Section Heading", fontsize=14)
        page.insert_text((50, 90), "First line of body text in paragraph", fontsize=11)
        page.insert_text((50, 104), "and second line concluding the paragraph neatly.", fontsize=11)
        page.insert_text((50, 150), "Subsequent paragraph following section.", fontsize=11)
        pdf_bytes = doc.tobytes()
        doc.close()

        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)
        body_block = next(b for b in blocks if "First line of body text" in b["text"])

        new_text = "Updated line one.\nUpdated line two."
        edits = [{
            "page": 1,
            "bbox": body_block["bbox"],
            "lines": body_block.get("lines"),
            "new_text": new_text,
            "font_size": 11.0
        }]

        edited_bytes = PDFEngine.edit_text(pdf_bytes, edits)
        doc_out = fitz.open(stream=edited_bytes, filetype="pdf")
        out_text = doc_out[0].get_text("text", sort=True)
        doc_out.close()

        assert "Section Heading" in out_text
        assert "Updated line one." in out_text
        assert "Updated line two." in out_text
        assert "Subsequent paragraph following section." in out_text

    def test_move_text_block_leaves_other_blocks_untouched(self):
        pdf_bytes = create_tight_multiline_doc()
        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)
        gamma_block = next(b for b in blocks if "Gamma line" in b["text"])

        w = gamma_block["bbox"][2] - gamma_block["bbox"][0]
        h = gamma_block["bbox"][3] - gamma_block["bbox"][1]
        new_bbox = [250, 350, 250 + w, 350 + h]

        moved_bytes = PDFEngine.move_text_block(
            pdf_bytes=pdf_bytes,
            page_num=1,
            old_bbox=gamma_block["bbox"],
            new_bbox=new_bbox,
            text=gamma_block["text"],
            font_size=11.0
        )

        doc = fitz.open(stream=moved_bytes, filetype="pdf")
        text = doc[0].get_text("text", sort=True)
        doc.close()

        # All existing lines must still be present
        assert "Line 1: Alpha line with descenders g, y, p, q." in text
        assert "Line 2: Beta line with ascenders h, k, l, b." in text
        assert "Line 3: Gamma line target to be edited." in text
        assert "Line 4: Delta line directly below target." in text
        assert "Line 5: Epsilon line with various punctuation symbols." in text
        assert "Line 6: Zeta closing line of the test block." in text
        assert "Top Document Header" in text
        assert "Bottom Document Footer" in text

    def test_bullet_list_segmentation(self):
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 50), "Shopping List:", fontsize=13)
        page.insert_text((50, 80), "- Apples and oranges", fontsize=11)
        page.insert_text((50, 96), "- Fresh sourdough bread", fontsize=11)
        page.insert_text((50, 112), "- Organic almond milk", fontsize=11)
        pdf_bytes = doc.tobytes()
        doc.close()

        blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page_number=1)
        bullet_blocks = [b for b in blocks if "-" in b["text"]]
        assert len(bullet_blocks) == 3, f"Expected 3 separate bullet blocks, got {len(bullet_blocks)}"

        # Edit second bullet item
        bread_block = bullet_blocks[1]
        edited_bytes = PDFEngine.edit_text(pdf_bytes, [{
            "page": 1,
            "bbox": bread_block["bbox"],
            "lines": bread_block.get("lines"),
            "new_text": "- Artisanal baguettes and rye",
            "font_size": 11.0
        }])

        doc_out = fitz.open(stream=edited_bytes, filetype="pdf")
        out_text = doc_out[0].get_text("text", sort=True)
        doc_out.close()

        assert "Shopping List:" in out_text
        assert "- Apples and oranges" in out_text
        assert "- Artisanal baguettes and rye" in out_text
        assert "- Organic almond milk" in out_text

    def test_api_edit_text_endpoint_preserves_adjacent(self):
        pdf_bytes = create_tight_multiline_doc()
        upload_res = client.post(
            "/api/upload",
            files={"file": ("tight_test.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_res.status_code == 200
        doc_id = upload_res.json()["doc_id"]

        # Fetch blocks via unified bundle endpoint
        bundle_res = client.get(f"/api/document/{doc_id}/page/1/bundle")
        assert bundle_res.status_code == 200
        blocks = bundle_res.json()["text_blocks"]

        delta_block = next(b for b in blocks if "Delta line" in b["text"])

        # Edit Delta line via API
        edit_res = client.post(
            f"/api/document/{doc_id}/edit-text",
            json={
                "edits": [{
                    "page": 1,
                    "bbox": delta_block["bbox"],
                    "lines": delta_block.get("lines"),
                    "new_text": "Line 4: DELTA UPDATED VIA FASTAPI ENDPOINT",
                    "font_size": 11.0
                }]
            }
        )
        assert edit_res.status_code == 200
        edit_data = edit_res.json()
        assert edit_data["status"] == "success"

        # Download resulting document
        download_res = client.get(f"/api/document/{doc_id}/download")
        assert download_res.status_code == 200
        downloaded_bytes = download_res.content

        doc = fitz.open(stream=downloaded_bytes, filetype="pdf")
        final_text = doc[0].get_text("text", sort=True)
        doc.close()

        assert "Top Document Header" in final_text
        assert "Line 1: Alpha line with descenders g, y, p, q." in final_text
        assert "Line 2: Beta line with ascenders h, k, l, b." in final_text
        assert "Line 3: Gamma line target to be edited." in final_text
        assert "Line 4: DELTA UPDATED VIA FASTAPI ENDPOINT" in final_text
        assert "Line 5: Epsilon line with various punctuation symbols." in final_text
        assert "Line 6: Zeta closing line of the test block." in final_text
        assert "Bottom Document Footer" in final_text
