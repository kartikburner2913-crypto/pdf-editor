import io
import re
import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient
import pymupdf as fitz
from PIL import Image

from app.main import app, DOC_STORE

client = TestClient(app)


def create_test_pdf_with_image() -> bytes:
    """Creates a 2-page test PDF with embedded raster image for compression testing."""
    doc = fitz.open()
    for i in range(2):
        page = doc.new_page(width=600, height=800)
        page.insert_text((50, 50), f"Visual Test Page {i + 1}", fontsize=18)
        page.insert_text((50, 80), "This test document validates Before/After visual reduction.", fontsize=12)
        # Add raster image
        img = Image.new("RGB", (800, 800), color=(70 + i * 30, 140, 210))
        img_buf = io.BytesIO()
        img.save(img_buf, format="PNG")
        page.insert_image(fitz.Rect(50, 100, 350, 400), stream=img_buf.getvalue())
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestCompressionVisualBeforeAfter:
    """Tests for B3. Compress PDF — Visual Before/After Reduction UI and Endpoints."""

    def test_dom_elements_exist_in_index_html(self):
        with open("templates/index.html", "r", encoding="utf-8") as f:
            html = f.read()

        soup = BeautifulSoup(html, "html.parser")

        # 1. Results container
        card = soup.find(id="compressResultsCard")
        assert card is not None, "Missing #compressResultsCard"

        # 2. Savings badge in header
        badge = soup.find(id="compressSavingsBadge")
        assert badge is not None, "Missing #compressSavingsBadge"

        # 3. Before/After cards
        compare_cards = soup.find(class_="compress-compare-cards")
        assert compare_cards is not None, "Missing .compress-compare-cards"

        card_before = soup.find(class_="card-before")
        assert card_before is not None, "Missing .card-before"
        orig_metric = soup.find(id="metricOriginalSize")
        assert orig_metric is not None, "Missing #metricOriginalSize"

        flow_connector = soup.find(class_="compare-flow-connector")
        assert flow_connector is not None, "Missing .compare-flow-connector"
        savings_text = soup.find(id="compareSavingsText")
        assert savings_text is not None, "Missing #compareSavingsText"

        card_after = soup.find(class_="card-after")
        assert card_after is not None, "Missing .card-after"
        comp_metric = soup.find(id="metricCompressedSize")
        assert comp_metric is not None, "Missing #metricCompressedSize"

        # 4. Visual comparison bar section
        vis_bar = soup.find(id="compressVisualComparisonBar")
        assert vis_bar is not None, "Missing #compressVisualComparisonBar"

        reduction_label = soup.find(id="compressBarReductionLabel")
        assert reduction_label is not None, "Missing #compressBarReductionLabel"

        track = soup.find(class_="visual-bar-track")
        assert track is not None, "Missing .visual-bar-track"

        bar_compressed = soup.find(id="compressBarCompressed")
        assert bar_compressed is not None, "Missing #compressBarCompressed"

        bar_saved = soup.find(id="compressBarSaved")
        assert bar_saved is not None, "Missing #compressBarSaved"

        scale_marks = soup.find(class_="visual-bar-scale-marks")
        assert scale_marks is not None, "Missing .visual-bar-scale-marks"

        # 5. Metrics grid
        assert soup.find(id="metricBytesSaved") is not None, "Missing #metricBytesSaved"
        assert soup.find(id="metricImagesOptimized") is not None, "Missing #metricImagesOptimized"
        assert soup.find(id="metricCompressionMode") is not None, "Missing #metricCompressionMode"
        assert soup.find(id="metricPageCount") is not None, "Missing #metricPageCount"

        # 6. Action buttons
        assert soup.find(id="btnDownloadCompressedPdf") is not None, "Missing #btnDownloadCompressedPdf"
        assert soup.find(id="btnOpenInEditor") is not None, "Missing #btnOpenInEditor"
        assert soup.find(id="btnCompressReset") is not None, "Missing #btnCompressReset"

    def test_css_classes_defined_in_style_css(self):
        with open("static/css/style.css", "r", encoding="utf-8") as f:
            css = f.read()

        required_classes = [
            ".compress-results-card",
            ".compress-compare-cards",
            ".compare-card",
            ".card-before",
            ".card-after",
            ".compare-flow-connector",
            ".compare-flow-arrow",
            ".compare-savings-pill",
            ".compress-visual-bar-section",
            ".visual-bar-track",
            ".visual-bar-compressed",
            ".visual-bar-saved",
            ".visual-bar-scale-marks",
            ".btn-compress-reset",
        ]

        for cls in required_classes:
            assert cls in css, f"Missing CSS class: {cls}"

    def test_js_logic_defined_in_app_js(self):
        with open("static/js/app.js", "r", encoding="utf-8") as f:
            js = f.read()

        assert "animateNumberCounter" in js, "animateNumberCounter function missing from app.js"
        assert "compressBarCompressed" in js, "compressBarCompressed binding missing from app.js"
        assert "compressBarSaved" in js, "compressBarSaved binding missing from app.js"
        assert "btnCompressReset" in js, "btnCompressReset handler missing from app.js"
        assert "compareSavingsText" in js, "compareSavingsText binding missing from app.js"

    def test_no_standard_unicode_emojis(self):
        emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
        for fname in ["templates/index.html", "static/css/style.css", "static/js/app.js"]:
            with open(fname, "r", encoding="utf-8") as f:
                content = f.read()
            matches = emoji_pattern.findall(content)
            assert len(matches) == 0, f"Found unexpected emojis in {fname}: {matches}"

    def test_compress_api_endpoint_payloads_contain_all_visual_metrics(self):
        pdf_bytes = create_test_pdf_with_image()

        # 1. Standalone upload endpoint
        response = client.post(
            "/api/compress-file",
            files={"file": ("test_visual.pdf", pdf_bytes, "application/pdf")},
            data={"mode": "lossy", "preset": "recommended"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "original_size" in data
        assert "compressed_size" in data
        assert "savings_percent" in data
        assert "bytes_saved" in data
        assert "images_optimized" in data
        assert "page_count" in data
        assert data["page_count"] == 2
        assert data["original_size"] > 0
        assert data["compressed_size"] > 0

        # 2. In-editor endpoint
        doc_id = data["doc_id"]
        resp2 = client.post(
            f"/api/document/{doc_id}/compress",
            json={"mode": "lossy", "preset": "extreme"}
        )
        assert resp2.status_code == 200
        d2 = resp2.json()
        assert "original_size" in d2
        assert "compressed_size" in d2
        assert "savings_percent" in d2
        assert "bytes_saved" in d2
        assert "mode" in d2
        assert "preset" in d2
        assert "page_count" in d2
