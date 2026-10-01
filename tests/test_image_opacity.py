import io
import pytest
import fitz
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app, DOC_STORE, get_doc
from app.pdf_engine import PDFEngine

@pytest.fixture
def client():
    return TestClient(app)

def create_sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((72, 100), "Hello World for Opacity Test", fontsize=14)
    out = io.BytesIO()
    doc.save(out)
    doc.close()
    return out.getvalue()

def create_sample_image_bytes(transparent: bool = True) -> bytes:
    if transparent:
        img = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
        for y in range(100):
            for x in range(100):
                if (x - 50) ** 2 + (y - 50) ** 2 < 40 ** 2:
                    img.putpixel((x, y), (255, 0, 0, 255))
    else:
        img = Image.new("RGB", (100, 100), (0, 128, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_insert_and_detect_image_opacity():
    pdf_bytes = create_sample_pdf_bytes()
    img_bytes = create_sample_image_bytes(transparent=True)

    # Insert image with 10% opacity (0.1)
    pdf_10 = PDFEngine.insert_image_to_page(
        pdf_bytes,
        img_bytes,
        page_num=1,
        bbox=[50, 50, 150, 150],
        opacity=0.1
    )

    # 1. Test get_page_images_info
    images_info = PDFEngine.get_page_images_info(pdf_10, page_num=1)
    assert len(images_info) == 1
    assert images_info[0]["opacity"] == 0.1
    assert images_info[0]["xref"] > 0

    # 2. Test get_page_bundle
    bundle = PDFEngine.get_page_bundle(pdf_10, page_number=1)
    assert len(bundle["images"]) == 1
    assert bundle["images"][0]["opacity"] == 0.1

def test_restore_image_opacity_from_10_to_100():
    pdf_bytes = create_sample_pdf_bytes()
    img_bytes = create_sample_image_bytes(transparent=True)

    # 1. Insert with 10% opacity
    pdf_10 = PDFEngine.insert_image_to_page(
        pdf_bytes,
        img_bytes,
        page_num=1,
        bbox=[50, 50, 150, 150],
        opacity=0.1
    )
    info_10 = PDFEngine.get_page_images_info(pdf_10, page_num=1)
    xref = info_10[0]["xref"]
    assert info_10[0]["opacity"] == 0.1

    # 2. Edit the image and set opacity back to 100% (1.0)
    pdf_100 = PDFEngine.move_image_on_page(
        pdf_10,
        page_num=1,
        old_bbox=[50, 50, 150, 150],
        new_bbox=[50, 50, 150, 150],
        xref=xref,
        opacity=1.0
    )

    # 3. Verify detected opacity is now 1.0 (100%)
    info_100 = PDFEngine.get_page_images_info(pdf_100, page_num=1)
    assert len(info_100) == 1
    assert info_100[0]["opacity"] == 1.0

    bundle_100 = PDFEngine.get_page_bundle(pdf_100, page_number=1)
    assert len(bundle_100["images"]) == 1
    assert bundle_100["images"][0]["opacity"] == 1.0

def test_multi_step_opacity_adjustments():
    pdf_bytes = create_sample_pdf_bytes()
    img_bytes = create_sample_image_bytes(transparent=False)

    # 1. Start at 10%
    pdf_cur = PDFEngine.insert_image_to_page(
        pdf_bytes,
        img_bytes,
        page_num=1,
        bbox=[50, 50, 150, 150],
        opacity=0.1
    )
    info = PDFEngine.get_page_images_info(pdf_cur, 1)
    assert info[0]["opacity"] == 0.1

    # 2. Adjust to 50%
    pdf_cur = PDFEngine.move_image_on_page(
        pdf_cur,
        page_num=1,
        old_bbox=[50, 50, 150, 150],
        new_bbox=[50, 50, 150, 150],
        xref=info[0]["xref"],
        opacity=0.5
    )
    info = PDFEngine.get_page_images_info(pdf_cur, 1)
    assert info[0]["opacity"] == 0.5

    # 3. Adjust to 80%
    pdf_cur = PDFEngine.move_image_on_page(
        pdf_cur,
        page_num=1,
        old_bbox=[50, 50, 150, 150],
        new_bbox=[50, 50, 150, 150],
        xref=info[0]["xref"],
        opacity=0.8
    )
    info = PDFEngine.get_page_images_info(pdf_cur, 1)
    assert info[0]["opacity"] == 0.8

    # 4. Restore to 100%
    pdf_cur = PDFEngine.move_image_on_page(
        pdf_cur,
        page_num=1,
        old_bbox=[50, 50, 150, 150],
        new_bbox=[50, 50, 150, 150],
        xref=info[0]["xref"],
        opacity=1.0
    )
    info = PDFEngine.get_page_images_info(pdf_cur, 1)
    assert info[0]["opacity"] == 1.0

def test_api_image_opacity_lifecycle(client):
    # Upload PDF
    pdf_data = create_sample_pdf_bytes()
    resp = client.post(
        "/api/upload",
        files={"file": ("sample.pdf", io.BytesIO(pdf_data), "application/pdf")}
    )
    assert resp.status_code == 200
    doc_id = resp.json()["doc_id"]

    # Place image with 10% opacity
    img_data = create_sample_image_bytes(transparent=True)
    place_resp = client.post(
        f"/api/document/{doc_id}/insert-image",
        data={
            "page": 1,
            "x0": 50,
            "y0": 50,
            "x1": 150,
            "y1": 150,
            "opacity": 0.1
        },
        files={"file": ("circle.png", io.BytesIO(img_data), "image/png")}
    )
    assert place_resp.status_code == 200

    # Query images list
    imgs_resp = client.get(f"/api/document/{doc_id}/page/1/images")
    assert imgs_resp.status_code == 200
    imgs = imgs_resp.json()["images"]
    assert len(imgs) == 1
    assert imgs[0]["opacity"] == 0.1
    xref = imgs[0]["xref"]

    # Query image preview endpoint - should return normalized valid PNG
    preview_resp = client.get(f"/api/document/{doc_id}/image/{xref}")
    assert preview_resp.status_code == 200
    preview_img = Image.open(io.BytesIO(preview_resp.content))
    assert preview_img.mode == "RGBA"
    # Preview alpha should be normalized to 255 max so CSS opacity handles UI display
    assert max(preview_img.split()[3].getdata()) == 255

    # Move/Update image setting opacity to 100% (1.0)
    move_resp = client.post(
        f"/api/document/{doc_id}/move-image",
        json={
            "page": 1,
            "old_bbox": [50, 50, 150, 150],
            "new_bbox": [60, 60, 160, 160],
            "xref": xref,
            "opacity": 1.0
        }
    )
    assert move_resp.status_code == 200

    # Verify updated opacity via bundle & images endpoint
    bundle_resp = client.get(f"/api/document/{doc_id}/page/1/bundle")
    assert bundle_resp.status_code == 200
    bundle_imgs = bundle_resp.json()["images"]
    assert len(bundle_imgs) == 1
    assert bundle_imgs[0]["opacity"] == 1.0
