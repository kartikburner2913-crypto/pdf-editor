import io
import fitz
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.pdf_engine import PDFEngine


def create_sample_typography_pdf() -> bytes:
    """Create a multi-font test PDF document with varied typographies."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # US Letter

    # Line 1: Standard Helvetica Heading
    page.insert_text(fitz.Point(72, 100), "Typography Harmonization Header", fontsize=20, fontname="hebo")

    # Line 2: Serif Body Text
    page.insert_text(fitz.Point(72, 140), "This is a paragraph in Times serif typography with rhythm.", fontsize=12, fontname="tiro")

    # Line 3: Monospace Code Line
    page.insert_text(fitz.Point(72, 180), "const font = resolveTypographyMatch(block);", fontsize=10, fontname="cour")

    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


class TestTypographyExtractionAndHarmonization:
    """Test suite for Plan Q4: Advanced Typography & Font Inpainting Harmonization."""

    def test_extract_font_family_and_weight_sans(self):
        # Subset prefix removal and weight extraction
        family, weight, style = PDFEngine._extract_font_family_and_weight("ABCDEF+Inter-SemiBold", 0)
        assert family == "Inter"
        assert weight == 600
        assert style == "normal"

        family, weight, style = PDFEngine._extract_font_family_and_weight("Roboto-BoldItalic", 2)
        assert family == "Roboto"
        assert weight == 700
        assert style == "italic"

        family, weight, style = PDFEngine._extract_font_family_and_weight("Montserrat-ExtraBold", 0)
        assert family == "Montserrat"
        assert weight == 800

        family, weight, style = PDFEngine._extract_font_family_and_weight("Poppins-Medium", 0)
        assert family == "Poppins"
        assert weight == 500

    def test_extract_font_family_and_weight_serif(self):
        family, weight, style = PDFEngine._extract_font_family_and_weight("TimesNewRomanPSMT", 0)
        assert family == "Times New Roman"
        assert weight == 400

        family, weight, style = PDFEngine._extract_font_family_and_weight("Merriweather-Bold", 16)
        assert family == "Merriweather"
        assert weight == 700

        family, weight, style = PDFEngine._extract_font_family_and_weight("PlayfairDisplay-Italic", 2)
        assert family == "Playfair Display"
        assert style == "italic"

    def test_extract_font_family_and_weight_mono(self):
        family, weight, style = PDFEngine._extract_font_family_and_weight("JetBrainsMono-Regular", 0)
        assert family == "JetBrains Mono"
        assert weight == 400

        family, weight, style = PDFEngine._extract_font_family_and_weight("RobotoMono-Bold", 16)
        assert family == "Roboto Mono"
        assert weight == 700

        family, weight, style = PDFEngine._extract_font_family_and_weight("CourierNewPS-BoldMT", 0)
        assert family == "Courier New"
        assert weight == 700

    def test_font_normalization_base14(self):
        assert PDFEngine._normalize_font_name("Inter", is_bold=False) == "helv"
        assert PDFEngine._normalize_font_name("Inter", is_bold=True) == "hebo"
        assert PDFEngine._normalize_font_name("Merriweather", is_bold=False) == "tiro"
        assert PDFEngine._normalize_font_name("Merriweather", is_bold=True) == "tibo"
        assert PDFEngine._normalize_font_name("JetBrains Mono", is_bold=False) == "cour"
        assert PDFEngine._normalize_font_name("JetBrains Mono", is_bold=True, is_italic=True) == "cobi"
        assert PDFEngine._normalize_font_name("Georgia", is_italic=True) == "tiit"

    def test_get_text_blocks_typography_metadata(self):
        pdf_bytes = create_sample_typography_pdf()
        blocks = PDFEngine.get_text_blocks(pdf_bytes, page_number=1)

        assert len(blocks) >= 3
        for block in blocks:
            # Plan Q4 required metadata fields
            assert "font_family" in block
            assert "font_weight" in block
            assert "font_style" in block
            assert "ascender" in block
            assert "descender" in block
            assert "cap_height" in block
            assert "letter_spacing_pt" in block
            assert "line_height_ratio" in block

            assert isinstance(block["font_weight"], int)
            assert 100 <= block["font_weight"] <= 900
            assert isinstance(block["letter_spacing_pt"], float)
            assert isinstance(block["line_height_ratio"], float)

    def test_edit_text_roundtrip_with_typography(self):
        pdf_bytes = create_sample_typography_pdf()
        blocks = PDFEngine.get_text_blocks(pdf_bytes, page_number=1)
        target = blocks[0]

        edits = [{
            "page": 1,
            "bbox": target["bbox"],
            "lines": target.get("lines"),
            "new_text": "Updated Typography Header",
            "font_size": 20,
            "font_name": "inter",
            "is_bold": True,
            "text_color": [0, 0, 0]
        }]

        new_pdf = PDFEngine.edit_text(pdf_bytes, edits)
        assert len(new_pdf) > 0

        # Verify replacement text exists in modified PDF
        doc = fitz.open(stream=new_pdf, filetype="pdf")
        text_content = doc[0].get_text()
        assert "Updated Typography Header" in text_content
        doc.close()

    def test_add_text_with_custom_typography(self):
        pdf_bytes = create_sample_typography_pdf()
        annots = [{
            "page": 1,
            "x": 72,
            "y": 250,
            "text": "Harmonized Note in Merriweather",
            "font_size": 14,
            "font_name": "merriweather",
            "color": [0.1, 0.1, 0.1],
            "width": 300,
            "height": 40
        }]

        new_pdf = PDFEngine.add_text_annotations(pdf_bytes, annots)
        assert len(new_pdf) > 0

        doc = fitz.open(stream=new_pdf, filetype="pdf")
        text_content = doc[0].get_text()
        assert "Harmonized Note in Merriweather" in text_content
        doc.close()

    def test_api_text_blocks_typography_endpoint(self):
        client = TestClient(app)
        pdf_bytes = create_sample_typography_pdf()

        # Upload document
        upload_resp = client.post(
            "/api/upload",
            files={"file": ("typography_test.pdf", pdf_bytes, "application/pdf")}
        )
        assert upload_resp.status_code == 200
        doc_id = upload_resp.json()["doc_id"]

        # Retrieve text blocks
        blocks_resp = client.get(f"/api/document/{doc_id}/page/1/text-blocks")
        assert blocks_resp.status_code == 200
        blocks = blocks_resp.json().get("blocks", [])
        assert len(blocks) >= 3

        first = blocks[0]
        assert "font_family" in first
        assert "font_weight" in first
        assert "letter_spacing_pt" in first
        assert "cap_height" in first
        assert "line_height_ratio" in first
