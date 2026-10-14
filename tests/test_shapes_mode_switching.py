import io
import os
import re
from bs4 import BeautifulSoup
import pytest
from fastapi.testclient import TestClient
import fitz

from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def create_sample_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=600, height=800)
    page.insert_text((50, 50), "Shapes and Ruler Test Document", fontsize=16)
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    buf.seek(0)
    return buf.read()

def test_shapes_and_ruler_ui_elements_present():
    index_path = os.path.join(os.path.dirname(__file__), "..", "templates", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    tab_shapes = soup.find(id="tab-shapes")
    assert tab_shapes is not None, "tab-shapes pane must exist"

    # Segmented mode toggle
    mode_selector = soup.find(id="shapesModeSelector")
    assert mode_selector is not None, "shapesModeSelector toggle must exist"
    btn_add_shapes = soup.find(id="btnModeAddShapes")
    assert btn_add_shapes is not None, "btnModeAddShapes must exist"
    btn_measure_ruler = soup.find(id="btnModeMeasureRuler")
    assert btn_measure_ruler is not None, "btnModeMeasureRuler must exist"

    # Add shapes panel & controls
    draw_section = soup.find(id="shapesDrawSection")
    assert draw_section is not None, "shapesDrawSection must exist"
    assert soup.find(id="shapeType") is not None
    assert soup.find(id="shapeColor") is not None
    assert soup.find(id="shapeFill") is not None
    assert soup.find(id="shapeWidth") is not None
    assert soup.find(id="shapeStartX") is not None
    assert soup.find(id="shapeStartY") is not None
    assert soup.find(id="shapeEndX") is not None
    assert soup.find(id="shapeEndY") is not None
    assert soup.find(id="btnApplyShape") is not None

    # Measure / ruler panel & controls
    measure_section = soup.find(id="shapesMeasureSection")
    assert measure_section is not None, "shapesMeasureSection must exist"
    assert soup.find(id="btnMeasureDistance") is not None
    assert soup.find(id="btnMeasureArea") is not None
    assert soup.find(id="measureUnit") is not None
    assert soup.find(id="measureScale") is not None
    assert soup.find(id="measureReadoutCard") is not None
    assert soup.find(id="measureModeLabel") is not None
    assert soup.find(id="measureValueLabel") is not None
    assert soup.find(id="btnClearCurrentMeasure") is not None
    assert soup.find(id="btnCancelMeasure") is not None

    # Strict emoji check
    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]'
    )
    matches = emoji_pattern.findall(str(tab_shapes))
    assert len(matches) == 0, f"Found emojis in tab-shapes: {matches}"

def test_add_shape_api_lifecycle(client):
    pdf_bytes = create_sample_pdf()
    upload_res = client.post(
        "/api/upload",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["doc_id"]

    # 1. Add Rectangle Shape
    shape_payload = {
        "shapes": [{
            "page": 1,
            "type": "rect",
            "bbox": [100, 100, 250, 200],
            "points": [[100, 100], [250, 200]],
            "color": [0.15, 0.39, 0.92],
            "fill_color": [0.9, 0.95, 1.0],
            "width": 2.0
        }]
    }
    shape_res = client.post(f"/api/document/{doc_id}/add-shape", json=shape_payload)
    assert shape_res.status_code == 200
    data = shape_res.json()
    assert data.get("status") == "success"

    # 2. Add Circle Shape
    circle_payload = {
        "shapes": [{
            "page": 1,
            "type": "circle",
            "bbox": [300, 300, 450, 450],
            "points": [[300, 300], [450, 450]],
            "color": [0.9, 0.2, 0.2],
            "fill_color": None,
            "width": 3.0
        }]
    }
    circle_res = client.post(f"/api/document/{doc_id}/add-shape", json=circle_payload)
    assert circle_res.status_code == 200

    # 3. Download and verify shapes are rendered in document
    dl_res = client.get(f"/api/document/{doc_id}/download")
    assert dl_res.status_code == 200
    out_doc = fitz.open(stream=dl_res.content, filetype="pdf")
    assert out_doc.page_count == 1
    page1 = out_doc[0]
    drawings = page1.get_drawings()
    assert len(drawings) >= 2, "Expected at least 2 shape drawings on page"
    out_doc.close()
