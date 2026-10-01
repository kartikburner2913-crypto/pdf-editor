# Scanned PDF OCR & Table Extraction Design Document

> **Status:** Archived / Decoupled from Core Codebase  
> **Reason:** Memory overhead (~450MB+ in ONNX/OCR models), rendering instability on cloud tiers (Render 512MB limit), and architectural separation of raster inpainting vs. native vector editing.  
> **Purpose:** Serves as the complete blueprint and copy-paste reference for re-integrating OCR and deep learning table extraction in the future (e.g., as an async worker or microservice).

---

## 1. Overview & Problem Definition

### Native Vector PDFs vs. Scanned (Raster) PDFs

1. **Native Vector PDFs:**
   - Contain true text elements, font descriptors, and vector draw commands.
   - Text can be extracted, searched, redacted, and replaced with pinpoint accuracy using standard PyMuPDF (`page.get_text("dict")`, `page.add_redact_annot()`, `page.insert_textbox()`).
   - Peak RAM usage: **~30–60 MB**.

2. **Scanned / Raster PDFs:**
   - Consist solely of full-page scanned bitmap images (JPEG/PNG/TIFF) embedded inside PDF page containers.
   - Zero native text spans or vector lines exist.
   - Requires:
     - Optical Character Recognition (OCR) to detect words, font boundaries, and bounding boxes.
     - Deep Learning Table Recognition (e.g., `rapid-table`) to reconstruct tabular structures from raw pixels.
     - Pixel-level image inpainting or redaction (`fitz.PDF_REDACT_IMAGE_PIXELS`) rather than simple vector text removal.
   - Model memory footprint: **~400–600 MB RAM** during inference.

---

## 2. OCR Text Extraction Pipeline (RapidOCR)

### Step-by-Step Logic

1. **Scanned Page Detection:**
   Analyze the raw text length returned by PyMuPDF. If the page contains fewer than 25 characters, it is classified as a scanned image page.

2. **High-DPI Rendering:**
   Render the scanned PDF page into a high-resolution pixmap at 300 DPI (scaling factor = $300 / 72 \approx 4.1667$).

3. **Inference with RapidOCR:**
   Pass the rendered PIL image into `RapidOCR()`. The model yields bounding box coordinates `[[x0,y0], [x1,y0], [x1,y1], [x0,y1]]`, detected text, and confidence scores.

4. **Coordinate Normalization (300 DPI $\to$ 72 DPI):**
   Scale pixel bounding boxes back to 72 DPI PDF point space ($x / \text{zoom}, y / \text{zoom}$) and reconstruct standard PyMuPDF block/line/span dictionaries.

### Complete Reference Code

```python
import pymupdf as fitz
from PIL import Image
from typing import Dict, Any, List

def is_scanned_page(page: fitz.Page, threshold_chars: int = 25) -> bool:
    """Determine if a page is raster-based by checking native text volume."""
    text = page.get_text().strip()
    return len(text) < threshold_chars

def run_rapidocr_pipeline(page: fitz.Page) -> Dict[str, Any]:
    """
    Run RapidOCR on a scanned page and format the output
    identically to PyMuPDF's page.get_text('dict').
    """
    try:
        from rapidocr_onnxruntime import RapidOCR
        ocr = RapidOCR()

        # Render page to 300 DPI for high OCR accuracy
        zoom = 300.0 / 72.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        # Convert pixmap to PIL Image
        if pix.n == 4:  # RGBA
            pil_img = Image.frombytes("RGBA", (pix.w, pix.h), pix.samples).convert("RGB")
        elif pix.n == 1:  # Grayscale
            pil_img = Image.frombytes("L", (pix.w, pix.h), pix.samples).convert("RGB")
        else:  # RGB
            pil_img = Image.frombytes("RGB", (pix.w, pix.h), pix.samples)

        result, _ = ocr(pil_img)

        blocks = []
        if result:
            for idx, res in enumerate(result):
                box, text, score = res
                # box format: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
                x0 = min(p[0] for p in box) / zoom
                y0 = min(p[1] for p in box) / zoom
                x1 = max(p[0] for p in box) / zoom
                y1 = max(p[1] for p in box) / zoom
                box_h = y1 - y0

                blocks.append({
                    "type": 0,
                    "bbox": [x0, y0, x1, y1],
                    "lines": [{
                        "bbox": [x0, y0, x1, y1],
                        "spans": [{
                            "bbox": [x0, y0, x1, y1],
                            "text": text,
                            "size": max(8.0, box_h * 0.8),
                            "font": "Helvetica",
                            "color": 0,
                            "flags": 0
                        }]
                    }]
                })

        return {"blocks": blocks}
    except Exception as e:
        # Fallback to standard get_text('dict') on failure
        return page.get_text("dict")
```

---

## 3. Scanned PDF Text Redaction & Replacement

When editing a scanned PDF, deleting text requires erasing image pixels under the text rather than removing PDF vector text objects:

```python
def redact_scanned_region(page: fitz.Page, bbox: List[float], bg_color: List[float] = [1.0, 1.0, 1.0]):
    """
    Erase raster pixels underneath the text bounding box and apply a solid background fill.
    """
    rect = fitz.Rect(bbox[0] - 1.0, bbox[1] - 1.0, bbox[2] + 1.5, bbox[3] + 1.5)
    page.add_redact_annot(rect, fill=bg_color)
    
    # PDF_REDACT_IMAGE_PIXELS modifies the actual underlying raster image pixels
    page.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_PIXELS,
        graphics=fitz.PDF_REDACT_LINE_ART_NONE
    )
```

---

## 4. Scanned Table Extraction Architecture (RapidTable)

PyMuPDF's built-in `page.find_tables()` relies on vector line paths and text coordinates. For scanned documents, `rapid-table` uses a deep learning structure recognition model:

### Implementation Reference

```python
from PIL import Image
import fitz

def extract_scanned_table(page: fitz.Page, table_bbox=None) -> List[List[str]]:
    """
    Extract structured table data from a scanned PDF page using RapidTable.
    """
    from rapid_table import RapidTable
    table_engine = RapidTable()

    # 1. Render page crop
    zoom = 300.0 / 72.0
    mat = fitz.Matrix(zoom, zoom)
    
    if table_bbox:
        clip_rect = fitz.Rect(table_bbox)
        pix = page.get_pixmap(matrix=mat, clip=clip_rect)
    else:
        pix = page.get_pixmap(matrix=mat)
        
    pil_img = Image.frombytes("RGB", (pix.w, pix.h), pix.samples)

    # 2. Run Table Structure Recognition
    table_html_str, elapse = table_engine(pil_img)
    
    # 3. Parse HTML table to 2D matrix (e.g. using BeautifulSoup or regex)
    # Returns: [["Header 1", "Header 2"], ["Val 1", "Val 2"]]
    return table_html_str
```

---

## 5. Recommended Future Deployment Architecture

To support scanned PDFs and heavy OCR without slowing down or crashing the main editor:

1. **Async Worker Pattern:**
   - Host OCR / RapidTable on a dedicated background worker (e.g., Celery, AWS Lambda, or Cloud Run GPU).
   - The main editor remains fast, lightweight (<50MB RAM), and reliable on free tier hosting (Render, Railway, Hugging Face).
2. **Client-side / WebAssembly OCR:**
   - Use Tesseract.js directly inside the browser for client-side OCR without any backend memory cost.
