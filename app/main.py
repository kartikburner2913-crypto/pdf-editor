"""
In-House PDF Editor - FastAPI Web Application
Provides RESTful APIs and serves the front page interactive interface.
100% offline & local processing.
"""

import os
import io
import time
import uuid
import shutil
from typing import List, Dict, Any, Optional, Union
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.pdf_engine import PDFEngine

from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(
    title="In-House PDF Editor",
    description="Local, private, high-performance PDF editor powered by PyMuPDF and FastAPI.",
    version="1.0.0"
)

# Enable automatic Gzip compression for all JSON and static payloads > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
DATA_DIR = os.path.join(BASE_DIR, "data", "sessions")

os.makedirs(DATA_DIR, exist_ok=True)

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# In-memory document storage: doc_id -> { "filename": str, "current_version": int, "max_version": int, "updated_at": float }
DOC_STORE: Dict[str, Dict[str, Any]] = {}
MAX_STORE_ITEMS = 50
SESSION_TTL_SECONDS = 7200  # 2 hours idle TTL


def get_doc_bytes(doc_id: str, version: int = None) -> bytes:
    doc = DOC_STORE.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    v = doc["current_version"] if version is None else version
    v_path = os.path.join(DATA_DIR, doc_id, f"v{v}.pdf")
    if os.path.exists(v_path):
        with open(v_path, "rb") as f:
            return f.read()
    if "current_bytes" in doc and doc["current_bytes"]:
        return doc["current_bytes"]
    raise HTTPException(status_code=404, detail=f"Version {v} not found on disk")

def save_doc_bytes(doc_id: str, version: int, content: bytes):
    doc_dir = os.path.join(DATA_DIR, doc_id)
    os.makedirs(doc_dir, exist_ok=True)
    v_path = os.path.join(doc_dir, f"v{version}.pdf")
    with open(v_path, "wb") as f:
        f.write(content)

def save_new_version(doc_id: str, new_pdf: bytes):
    doc = DOC_STORE[doc_id]
    next_v = doc["current_version"] + 1
    # Truncate any redo history beyond current version
    max_v = doc.get("max_version", doc["current_version"])
    for v in range(next_v, max_v + 1):
        try:
            os.remove(os.path.join(DATA_DIR, doc_id, f"v{v}.pdf"))
        except:
            pass
    save_doc_bytes(doc_id, next_v, new_pdf)
    doc["current_version"] = next_v
    doc["max_version"] = next_v
    doc["current_bytes"] = new_pdf

def prune_store():
    """Prune expired sessions from memory and purge their physical directories from disk."""
    now = time.time()
    # 1. Clean expired sessions based on TTL
    expired_keys = [k for k, v in DOC_STORE.items() if (now - v.get("updated_at", 0)) > SESSION_TTL_SECONDS]
    for k in expired_keys:
        DOC_STORE.pop(k, None)
        doc_dir = os.path.join(DATA_DIR, k)
        shutil.rmtree(doc_dir, ignore_errors=True)

    # 2. Enforce capacity limit
    if len(DOC_STORE) > MAX_STORE_ITEMS:
        oldest_keys = sorted(DOC_STORE.keys(), key=lambda k: DOC_STORE[k].get("updated_at", 0))
        for k in oldest_keys[:max(1, len(DOC_STORE) - MAX_STORE_ITEMS + 5)]:
            DOC_STORE.pop(k, None)
            doc_dir = os.path.join(DATA_DIR, k)
            shutil.rmtree(doc_dir, ignore_errors=True)

    # 3. Clean orphaned disk directories older than TTL
    try:
        if os.path.exists(DATA_DIR):
            for entry in os.scandir(DATA_DIR):
                if entry.is_dir() and entry.name not in DOC_STORE:
                    stat = entry.stat()
                    if (now - stat.st_mtime) > SESSION_TTL_SECONDS:
                        shutil.rmtree(entry.path, ignore_errors=True)
    except Exception:
        pass


def get_doc(doc_id: str) -> Dict[str, Any]:
    doc = DOC_STORE.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or expired. Please re-upload.")
    doc["updated_at"] = time.time()
    if "current_bytes" not in doc or not doc["current_bytes"]:
        doc["current_bytes"] = get_doc_bytes(doc_id)
    return doc



# Pydantic schemas
class TextEditItem(BaseModel):
    page: int = 0  # 0 for all pages, or 1-indexed page
    search_text: Optional[str] = ""
    new_text: str
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1]
    new_bbox: Optional[List[float]] = None  # optional relocated [x0, y0, x1, y1]
    font_size: Optional[float] = None
    font_name: Optional[str] = "helv"
    is_bold: Optional[bool] = False
    is_italic: Optional[bool] = False
    align: Optional[int] = 0
    text_color: Optional[List[float]] = [0.0, 0.0, 0.0]
    bg_color: Optional[List[float]] = [1.0, 1.0, 1.0]
    lines: Optional[List[Dict[str, Any]]] = None


class DeleteImageRequest(BaseModel):
    page: int = 1
    bbox: List[float]


class EditTextRequest(BaseModel):
    edits: List[TextEditItem]


class AddTextAnnotationItem(BaseModel):
    page: int = 1
    x: float
    y: float
    text: str
    html_content: Optional[str] = None
    font_size: float = 12.0
    font_name: str = "helv"
    color: List[float] = [0.0, 0.0, 0.0]
    bg_color: Optional[List[float]] = None
    width: Optional[float] = None
    height: Optional[float] = None


class AddTextRequest(BaseModel):
    annotations: List[AddTextAnnotationItem]


class AddShapeAnnotationItem(BaseModel):
    page: int = 1
    type: str = "rect"  # rect, circle, line, highlight
    bbox: Optional[List[float]] = None  # [x0, y0, x1, y1] for rect/circle/highlight
    points: Optional[List[List[float]]] = None  # [[x0, y0], [x1, y1]] for line
    color: Optional[List[float]] = [0.0, 0.0, 0.0]
    fill_color: Optional[List[float]] = None
    width: float = 1.0


class AddShapeRequest(BaseModel):
    shapes: List[AddShapeAnnotationItem]


class WatermarkRequest(BaseModel):
    text: str
    opacity: float = 0.3
    font_size: float = 48.0
    color: List[float] = [0.75, 0.75, 0.75]
    rotation_angle: float = 45.0
    page_numbers: Optional[List[int]] = None


class OrganizeRequest(BaseModel):
    page_order: List[int]
    rotations: Optional[Dict[str, int]] = None  # page_number as string -> angle


class SplitRequest(BaseModel):
    page_ranges: str  # e.g., "1-3, 5"


class ProtectRequest(BaseModel):
    password: str
    allow_print: bool = True
    allow_copy: bool = True
    allow_edit: bool = False


class FormFillRequest(BaseModel):
    values: Dict[str, Any]


class AddFormFieldRequest(BaseModel):
    page: int = 1
    type: str = "text"  # text, textarea, checkbox, radio, combobox/choice, listbox, signature, date
    name: str
    bbox: List[float]
    default_value: Optional[str] = ""
    options: Optional[List[str]] = None
    choices: Optional[List[str]] = None
    font_size: Optional[float] = 11.0
    is_required: bool = False
    is_read_only: bool = False
    border_color: Optional[List[float]] = None
    fill_color: Optional[List[float]] = None


class UpdateFormFieldRequest(BaseModel):
    page: int = 1
    field_name: str
    new_name: Optional[str] = None
    new_value: Optional[Any] = None
    new_bbox: Optional[List[float]] = None
    new_choices: Optional[List[str]] = None
    font_size: Optional[float] = None
    is_required: Optional[bool] = None
    is_read_only: Optional[bool] = None


class DeleteFormFieldRequest(BaseModel):
    page: int = 1
    field_name: str


class MoveFormFieldRequest(BaseModel):
    page: int = 1
    name: str
    bbox: List[float]


class ImportFormDataRequest(BaseModel):
    data: Dict[str, Any]


class BookmarkItem(BaseModel):
    level: int = 1
    title: str
    page: int = 1


class BookmarksRequest(BaseModel):
    bookmarks: List[BookmarkItem]


class RedactionItem(BaseModel):
    page: int = 1
    bbox: List[float]
    fill_color: Optional[List[float]] = [0.0, 0.0, 0.0]
    text: Optional[str] = ""
    text_color: Optional[List[float]] = [1.0, 1.0, 1.0]
    font_size: Optional[float] = 9.0


class RedactRequest(BaseModel):
    redactions: List[RedactionItem]


class SanitizeRequest(BaseModel):
    remove_metadata: bool = True
    remove_attachments: bool = True
    remove_bookmarks: bool = False
    remove_links: bool = True
    remove_annotations: bool = False


class LayerOrderRequest(BaseModel):
    page: int = 1
    element_type: str = "image"  # "image", "text", "annotation", "shape", "form"
    action: str = "bring_to_front"  # "bring_to_front", "send_to_back", "bring_forward", "send_backward"
    element_id: Optional[Union[int, str]] = None
    bbox: Optional[List[float]] = None
    text: Optional[str] = None
    font_size: Optional[float] = None
    font_name: Optional[str] = None
    color: Optional[List[float]] = None


class InkDrawingItem(BaseModel):
    page: int = 1
    paths: List[List[List[float]]]  # list of strokes [[x, y], [x, y]...]
    color: Optional[List[float]] = [0.0, 0.0, 0.0]
    width: float = 2.0


class InkRequest(BaseModel):
    drawings: List[InkDrawingItem]


class StampRequest(BaseModel):
    page: int = 1
    bbox: List[float]
    text: str
    color: Optional[List[float]] = None


class StickyNoteRequest(BaseModel):
    page: int = 1
    point: List[float]
    content: str
    author: Optional[str] = "User"


class MetadataRequest(BaseModel):
    title: Optional[str] = ""
    author: Optional[str] = ""
    subject: Optional[str] = ""
    keywords: Optional[str] = ""
    creator: Optional[str] = ""
    producer: Optional[str] = ""


class CompressPDFRequest(BaseModel):
    mode: Optional[str] = "lossy"  # "lossless" or "lossy"
    preset: Optional[str] = "recommended"  # "extreme", "recommended", "high", "custom"
    image_quality: Optional[int] = 75
    max_dpi: Optional[int] = 150
    grayscale: Optional[bool] = False
    remove_metadata: Optional[bool] = False


class InsertBlankPageRequest(BaseModel):
    at_page: int = 1
    width: float = 595.0
    height: float = 842.0


class DuplicatePageRequest(BaseModel):
    page: int = 1


class CropPageRequest(BaseModel):
    page: int = 1
    crop_box: List[float]
    apply_all_pages: bool = False


class TrimMarginsRequest(BaseModel):
    page: int = 0
    padding: float = 18.0


class TableExportRequest(BaseModel):
    tables: List[Dict[str, Any]]


class ScanPIIRequest(BaseModel):
    page: int = 0
    types: Optional[List[str]] = None
    custom_keys: Optional[List[str]] = None
    key_value_mode: Optional[str] = "value_only"
    custom_keywords: Optional[List[str]] = None
    match_whole_word: Optional[bool] = True
    case_sensitive: Optional[bool] = False
    custom_pattern: Optional[str] = None


class AutoRedactPIIRequest(BaseModel):
    items: List[Dict[str, Any]]
    fill_color: Optional[List[float]] = [0.0, 0.0, 0.0]
    text_color: Optional[List[float]] = [1.0, 1.0, 1.0]
    label: Optional[str] = "[REDACTED]"
    sanitize_metadata: Optional[bool] = True


class TextMarkupRequest(BaseModel):
    page: int = 1
    type: str = "highlight"  # highlight, underline, strikeout, squiggly
    bboxes: Optional[List[List[float]]] = None
    search_text: Optional[str] = None
    color: Optional[List[float]] = None


class PageNumberRequest(BaseModel):
    position: str = "bottom-center"
    format_str: str = "Page {n} of {total}"
    start_page: int = 1
    font_size: float = 10.0
    font_name: str = "helv"
    color: Optional[List[float]] = [0.2, 0.2, 0.2]
    margin: float = 36.0


class MoveTextBlockRequest(BaseModel):
    page: int = 1
    old_bbox: List[float]
    new_bbox: List[float]
    text: str
    font_size: Optional[float] = None
    font_name: Optional[str] = "helv"
    color: Optional[List[float]] = None
    bg_color: Optional[List[float]] = None


class MoveAnnotationRequest(BaseModel):
    page: int = 1
    index: int
    bbox: List[float]


class DeleteAnnotationRequest(BaseModel):
    page: int = 1
    index: int


class DeleteImageRequest(BaseModel):
    page: int = 1
    bbox: Optional[List[float]] = None
    xref: Optional[int] = None


class MoveImageRequest(BaseModel):
    page: int = 1
    old_bbox: List[float]
    new_bbox: List[float]
    xref: Optional[int] = None
    opacity: Optional[float] = 1.0
    rotation: Optional[int] = 0
    flip_h: Optional[bool] = False
    flip_v: Optional[bool] = False



# Routes
@app.get("/", response_class=HTMLResponse)
async def serve_home():
    """Serve the single-page application."""
    index_path = os.path.join(TEMPLATES_DIR, "index.html")
    if not os.path.exists(index_path):
        return HTMLResponse("<h3>index.html not found.</h3>", status_code=404)
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(
            content=f.read(),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )


@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF file and initialize session state."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded PDF file is empty.")

    try:
        info = PDFEngine.get_document_info(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF: {str(e)}")

    doc_id = uuid.uuid4().hex
    prune_store()
    
    os.makedirs(os.path.join(DATA_DIR, doc_id), exist_ok=True)
    save_doc_bytes(doc_id, 0, contents)
    
    DOC_STORE[doc_id] = {
        "filename": file.filename,
        "current_version": 0,
        "max_version": 0,
        "updated_at": time.time()
    }

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "info": info
    }


@app.get("/api/document/{doc_id}/info")
async def get_document_info(doc_id: str):
    """Get metadata and page layout information for current document."""
    doc = get_doc(doc_id)
    info = PDFEngine.get_document_info(doc["current_bytes"])
    return {
        "doc_id": doc_id,
        "filename": doc["filename"],
        "info": info,
        "history_count": doc["current_version"] + 1
    }


@app.get("/api/document/{doc_id}/page/{page_number}/bundle")
def get_page_bundle(doc_id: str, page_number: int, zoom: float = Query(1.5, ge=0.1, le=5.0)):
    """
    High-speed unified page bundle endpoint.
    Returns rendered image, text blocks, annotations, and images in a single network round-trip.
    """
    doc = get_doc(doc_id)
    try:
        bundle = PDFEngine.get_page_bundle(doc["current_bytes"], page_number, zoom=zoom)
        bundle["version"] = doc.get("current_version", 1)
        return bundle
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading page bundle: {str(e)}")


@app.get("/api/document/{doc_id}/page/{page_number}/image")
def get_page_image(
    doc_id: str,
    page_number: int,
    zoom: float = Query(1.5, ge=0.05, le=5.0),
    format: Optional[str] = Query(None)
):
    """Render a page to image bytes (high-efficiency JPEG for thumbnails or PNG for full resolution)."""
    doc = get_doc(doc_id)
    try:
        use_jpeg = (format in ("jpeg", "jpg")) or (format is None and zoom <= 0.5)
        img_format = "jpeg" if use_jpeg else (format or "png")
        img_bytes = PDFEngine.render_page_image(doc["current_bytes"], page_number, zoom=zoom, format=img_format)
        media_type = "image/jpeg" if use_jpeg else "image/png"
        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                "Vary": "Accept-Encoding"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rendering page: {str(e)}")


@app.get("/api/document/{doc_id}/page/{page_number}/text-blocks")
async def get_page_text_blocks(doc_id: str, page_number: int):
    """Retrieve all text blocks on a page for visual editing."""
    doc = get_doc(doc_id)
    try:
        blocks = PDFEngine.get_page_text_blocks(doc["current_bytes"], page_number)
        return {"page": page_number, "blocks": blocks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text blocks: {str(e)}")


@app.post("/api/document/{doc_id}/edit-text")
async def edit_text(doc_id: str, req: EditTextRequest):
    """
    Search & replace or edit text blocks in-place.
    Supports redaction + re-inserting new text.
    """
    doc = get_doc(doc_id)
    try:
        edits_data = [item.model_dump() for item in req.edits]
        new_pdf = PDFEngine.edit_text(doc["current_bytes"], edits_data)
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Text edited successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error editing text: {str(e)}")


@app.post("/api/document/{doc_id}/add-text")
async def add_text(doc_id: str, req: AddTextRequest):
    """Add new text annotations at specific coordinates."""
    doc = get_doc(doc_id)
    try:
        annotations_data = [item.model_dump() for item in req.annotations]
        new_pdf = PDFEngine.add_text_annotations(doc["current_bytes"], annotations_data)
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Text added successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding text: {str(e)}")


@app.post("/api/document/{doc_id}/move-text")
@app.post("/api/document/{doc_id}/move-text-block")
async def move_text_block(doc_id: str, req: MoveTextBlockRequest):
    """Move a text block on the PDF by redacting old location and inserting at new location."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.move_text_block(
            doc["current_bytes"],
            page_num=req.page,
            old_bbox=req.old_bbox,
            new_bbox=req.new_bbox,
            text=req.text,
            font_size=req.font_size,
            font_name=req.font_name or "helv",
            color=req.color,
            bg_color=req.bg_color
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Text block moved successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving text block: {str(e)}")


@app.get("/api/document/{doc_id}/page/{page_number}/annotations")
async def get_page_annotations(doc_id: str, page_number: int):
    """Retrieve all annotations on a page."""
    doc = get_doc(doc_id)
    try:
        annots = PDFEngine.get_annotations(doc["current_bytes"], page_number)
        return {"page": page_number, "annotations": annots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading annotations: {str(e)}")


@app.post("/api/document/{doc_id}/annotations/move")
@app.post("/api/document/{doc_id}/move-annotation")
async def move_annotation(doc_id: str, req: MoveAnnotationRequest):
    """Move an annotation to a new bounding box."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.move_annotation(
            doc["current_bytes"],
            page_num=req.page,
            annot_index=req.index,
            new_bbox=req.bbox
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Annotation moved successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving annotation: {str(e)}")


@app.post("/api/document/{doc_id}/annotations/delete")
async def delete_annotation(doc_id: str, req: DeleteAnnotationRequest):
    """Delete an annotation from the page."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.delete_annotation(
            doc["current_bytes"],
            page_num=req.page,
            annot_index=req.index
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Annotation deleted successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting annotation: {str(e)}")


@app.post("/api/document/{doc_id}/add-shape")
async def add_shape(doc_id: str, req: AddShapeRequest):
    """Add shapes or highlight annotations."""
    doc = get_doc(doc_id)
    try:
        shapes_data = [item.model_dump() for item in req.shapes]
        new_pdf = PDFEngine.add_shape_annotations(doc["current_bytes"], shapes_data)
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Shapes added successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding shape: {str(e)}")


@app.post("/api/document/{doc_id}/watermark")
async def add_watermark(doc_id: str, req: WatermarkRequest):
    """Add watermark to PDF."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_watermark(
            doc["current_bytes"],
            text=req.text,
            opacity=req.opacity,
            font_size=req.font_size,
            color=req.color,
            rotation_angle=req.rotation_angle,
            page_numbers=req.page_numbers
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Watermark applied successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying watermark: {str(e)}")


@app.post("/api/document/{doc_id}/organize")
async def organize_pages(doc_id: str, req: OrganizeRequest):
    """Reorder, delete, and rotate pages."""
    if not req.page_order:
        raise HTTPException(status_code=400, detail="Page order list cannot be empty.")
    doc = get_doc(doc_id)
    try:
        rotations_int = {int(k): v for k, v in (req.rotations or {}).items()}
        new_pdf = PDFEngine.organize_pages(
            doc["current_bytes"],
            page_order=req.page_order,
            rotations=rotations_int
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Pages organized successfully.", "info": info}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error organizing pages: {str(e)}")


@app.post("/api/document/{doc_id}/split")
async def split_pdf(doc_id: str, req: SplitRequest):
    """Extract specified page range into a new document."""
    if not req.page_ranges or not req.page_ranges.strip():
        raise HTTPException(status_code=400, detail="Page ranges string cannot be empty.")
    doc = get_doc(doc_id)
    try:
        extracted_pdf = PDFEngine.split_and_extract(doc["current_bytes"], req.page_ranges)
        return StreamingResponse(
            io.BytesIO(extracted_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="extracted_{doc["filename"]}"'}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error splitting PDF: {str(e)}")


@app.get("/api/document/{doc_id}/burst")
async def burst_pdf(doc_id: str):
    """Split all pages into individual files and download as ZIP."""
    doc = get_doc(doc_id)
    try:
        zip_bytes = PDFEngine.burst_to_zip(doc["current_bytes"], prefix="page")
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="burst_{doc["filename"]}.zip"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error bursting PDF: {str(e)}")


@app.post("/api/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merge multiple uploaded PDF files."""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files to merge.")
    
    pdf_bytes_list = []
    for f in files:
        if not f.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File '{f.filename}' is not a PDF.")
        content = await f.read()
        pdf_bytes_list.append(content)

    try:
        merged_pdf = PDFEngine.merge_pdfs(pdf_bytes_list)
        return StreamingResponse(
            io.BytesIO(merged_pdf),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="merged_document.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error merging PDFs: {str(e)}")


@app.get("/api/document/{doc_id}/extract-text")
async def extract_text(doc_id: str, as_file: bool = False):
    """Extract all text from document."""
    doc = get_doc(doc_id)
    try:
        text_content = PDFEngine.extract_text(doc["current_bytes"])
        if as_file:
            return StreamingResponse(
                io.BytesIO(text_content.encode("utf-8")),
                media_type="text/plain; charset=utf-8",
                headers={"Content-Disposition": f'attachment; filename="text_{doc["filename"]}.txt"'}
            )
        return {"text": text_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text: {str(e)}")


@app.get("/api/document/{doc_id}/extract-images")
async def extract_images(doc_id: str):
    """Extract all embedded images as a ZIP archive."""
    doc = get_doc(doc_id)
    try:
        zip_bytes = PDFEngine.extract_images(doc["current_bytes"])
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="images_{doc["filename"]}.zip"'}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting images: {str(e)}")


@app.post("/api/document/{doc_id}/compress")
async def compress_pdf(doc_id: str, req: Optional[CompressPDFRequest] = None):
    """Compress and optimize PDF file streams and embedded raster images."""
    doc = get_doc(doc_id)
    if req is None:
        req = CompressPDFRequest()
    try:
        res = PDFEngine.compress_pdf_advanced(
            doc["current_bytes"],
            mode=req.mode,
            preset=req.preset,
            image_quality=req.image_quality,
            max_dpi=req.max_dpi,
            grayscale=req.grayscale or False,
            remove_metadata=req.remove_metadata or False
        )
        save_new_version(doc_id, res["compressed_bytes"])
        return {
            "status": "success",
            "message": f"Successfully compressed! Reduced from {res['original_size'] // 1024} KB to {res['compressed_size'] // 1024} KB ({res['savings_percent']}% reduction).",
            "original_size": res["original_size"],
            "new_size": res["compressed_size"],
            "compressed_size": res["compressed_size"],
            "savings_percent": res["savings_percent"],
            "bytes_saved": res["bytes_saved"],
            "mode": res["mode"],
            "preset": res["preset"],
            "images_optimized": res["images_optimized"],
            "page_count": res.get("page_count", 1)
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error compressing PDF: {str(e)}")


@app.post("/api/compress-file")
async def compress_uploaded_file(
    file: UploadFile = File(...),
    mode: str = Form("lossy"),
    preset: str = Form("recommended"),
    image_quality: Optional[int] = Form(75),
    max_dpi: Optional[int] = Form(150),
    grayscale: Optional[bool] = Form(False),
    remove_metadata: Optional[bool] = Form(False)
):
    """Upload any PDF, compress it with selected mode/quality, and return metrics + doc_id."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded PDF file is empty.")
    if len(contents) > 250 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF exceeds maximum allowed file size of 250 MB.")

    try:
        res = PDFEngine.compress_pdf_advanced(
            contents,
            mode=mode,
            preset=preset,
            image_quality=image_quality,
            max_dpi=max_dpi,
            grayscale=bool(grayscale),
            remove_metadata=bool(remove_metadata)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

    doc_id = uuid.uuid4().hex
    prune_store()
    
    os.makedirs(os.path.join(DATA_DIR, doc_id), exist_ok=True)
    save_doc_bytes(doc_id, 0, res["compressed_bytes"])
    
    DOC_STORE[doc_id] = {
        "filename": file.filename,
        "current_version": 0,
        "max_version": 0,
        "current_bytes": res["compressed_bytes"],
        "updated_at": time.time()
    }

    return {
        "status": "success",
        "doc_id": doc_id,
        "filename": file.filename,
        "original_size": res["original_size"],
        "compressed_size": res["compressed_size"],
        "new_size": res["compressed_size"],
        "savings_percent": res["savings_percent"],
        "bytes_saved": res["bytes_saved"],
        "mode": res["mode"],
        "preset": res["preset"],
        "images_optimized": res["images_optimized"],
        "page_count": res.get("page_count", 1),
        "download_url": f"/api/document/{doc_id}/download"
    }


@app.post("/api/compress-direct-download")
async def compress_direct_download(
    file: UploadFile = File(...),
    mode: str = Form("lossy"),
    preset: str = Form("recommended"),
    image_quality: Optional[int] = Form(75),
    max_dpi: Optional[int] = Form(150),
    grayscale: Optional[bool] = Form(False),
    remove_metadata: Optional[bool] = Form(False)
):
    """Compress an uploaded PDF and return the optimized PDF directly as a download."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded PDF file is empty.")

    try:
        res = PDFEngine.compress_pdf_advanced(
            contents,
            mode=mode,
            preset=preset,
            image_quality=image_quality,
            max_dpi=max_dpi,
            grayscale=bool(grayscale),
            remove_metadata=bool(remove_metadata)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")

    out_name = file.filename
    if not out_name.lower().endswith(".pdf"):
        out_name += ".pdf"
    if not out_name.startswith("compressed_"):
        out_name = f"compressed_{out_name}"

    return StreamingResponse(
        io.BytesIO(res["compressed_bytes"]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{out_name}"',
            "X-Original-Size": str(res["original_size"]),
            "X-Compressed-Size": str(res["compressed_size"]),
            "X-Savings-Percent": str(res["savings_percent"]),
            "X-Bytes-Saved": str(res["bytes_saved"]),
            "X-Images-Optimized": str(res["images_optimized"])
        }
    )


@app.post("/api/document/{doc_id}/protect")
async def protect_pdf(doc_id: str, req: ProtectRequest):
    """Set password encryption on current PDF."""
    doc = get_doc(doc_id)
    try:
        protected = PDFEngine.protect_pdf(
            doc["current_bytes"],
            user_password=req.password,
            allow_print=req.allow_print,
            allow_copy=req.allow_copy,
            allow_edit=req.allow_edit
        )
        save_new_version(doc_id, protected)
        return {"status": "success", "message": "Password protection applied successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error protecting PDF: {str(e)}")


@app.post("/api/document/{doc_id}/undo")
async def undo_last_change(doc_id: str):
    """Undo the last edit operation (non-destructive, preserves redo history)."""
    doc = get_doc(doc_id)
    if doc["current_version"] > 0:
        doc["current_version"] -= 1
        current_bytes = get_doc_bytes(doc_id, doc["current_version"])
        doc["current_bytes"] = current_bytes
        info = PDFEngine.get_document_info(current_bytes)
        return {"status": "success", "message": "Undone successfully.", "info": info,
                "can_undo": doc["current_version"] > 0,
                "can_redo": doc["current_version"] < doc.get("max_version", 0)}
    else:
        raise HTTPException(status_code=400, detail="No previous state to undo.")


@app.post("/api/document/{doc_id}/redo")
async def redo_change(doc_id: str):
    """Redo a previously undone operation."""
    doc = get_doc(doc_id)
    max_v = doc.get("max_version", doc["current_version"])
    if doc["current_version"] < max_v:
        doc["current_version"] += 1
        current_bytes = get_doc_bytes(doc_id, doc["current_version"])
        doc["current_bytes"] = current_bytes
        info = PDFEngine.get_document_info(current_bytes)
        return {"status": "success", "message": "Redone successfully.", "info": info,
                "can_undo": doc["current_version"] > 0,
                "can_redo": doc["current_version"] < max_v}
    else:
        raise HTTPException(status_code=400, detail="Nothing to redo.")


@app.post("/api/document/{doc_id}/revert")
async def revert_to_original(doc_id: str):
    """Revert to the original uploaded document."""
    doc = get_doc(doc_id)
    if doc["current_version"] == 0:
        raise HTTPException(status_code=400, detail="Already at original state.")
    doc["current_version"] = 0
    current_bytes = get_doc_bytes(doc_id, 0)
    doc["current_bytes"] = current_bytes
    info = PDFEngine.get_document_info(current_bytes)
    return {"status": "success", "message": "Reverted to original document.", "info": info}


@app.get("/api/document/{doc_id}/search")
async def search_text(doc_id: str, q: str = Query(..., min_length=1), page: int = Query(0)):
    """Search for text in the document and return matching locations."""
    doc = get_doc(doc_id)
    try:
        results = PDFEngine.search_text(doc["current_bytes"], q, page_num=page)
        return {"query": q, "results": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@app.get("/api/document/{doc_id}/download")
async def download_pdf(doc_id: str):
    """Download the current edited PDF."""
    doc = get_doc(doc_id)
    filename = doc["filename"]
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"
    if not filename.startswith("edited_"):
        filename = f"edited_{filename}"
        
    return StreamingResponse(
        io.BytesIO(doc["current_bytes"]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# --- ACROFORMS & FORM FILLING ---
@app.get("/api/document/{doc_id}/forms")
async def get_form_fields(doc_id: str):
    """Retrieve all interactive AcroForm fields."""
    doc = get_doc(doc_id)
    try:
        fields = PDFEngine.get_form_fields(doc["current_bytes"])
        return {"fields": fields}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading form fields: {str(e)}")


@app.post("/api/document/{doc_id}/forms/fill")
@app.post("/api/document/{doc_id}/fill-forms")
async def fill_form_fields(doc_id: str, req: FormFillRequest):
    """Fill form fields in place."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.fill_form_fields(doc["current_bytes"], req.values)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Form fields updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating form fields: {str(e)}")


@app.post("/api/document/{doc_id}/forms/add-field")
@app.post("/api/document/{doc_id}/add-form-field")
async def add_form_field(doc_id: str, req: AddFormFieldRequest):
    """Add a new form widget to the PDF."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_form_widget(
            doc["current_bytes"],
            page_num=req.page,
            field_type=req.type,
            field_name=req.name,
            bbox=req.bbox,
            default_value=req.default_value,
            options=req.options or req.choices,
            font_size=req.font_size,
            is_required=req.is_required,
            is_read_only=req.is_read_only,
            border_color=req.border_color,
            fill_color=req.fill_color
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Form field '{req.name}' added successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding form field: {str(e)}")


@app.post("/api/document/{doc_id}/forms/update-field")
async def update_form_field(doc_id: str, req: UpdateFormFieldRequest):
    """Update properties of an existing AcroForm widget."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.update_form_field(
            doc["current_bytes"],
            page_num=req.page,
            field_name=req.field_name,
            new_name=req.new_name,
            new_value=req.new_value,
            new_bbox=req.new_bbox,
            new_choices=req.new_choices,
            font_size=req.font_size,
            is_required=req.is_required,
            is_read_only=req.is_read_only
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Form field '{req.field_name}' updated successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating form field: {str(e)}")


@app.post("/api/document/{doc_id}/forms/delete-field")
async def delete_form_field(doc_id: str, req: DeleteFormFieldRequest):
    """Delete an AcroForm widget from the page."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.delete_form_field(
            doc["current_bytes"],
            page_num=req.page,
            field_name=req.field_name
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Form field '{req.field_name}' deleted.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting form field: {str(e)}")


@app.post("/api/document/{doc_id}/forms/move-field")
@app.post("/api/document/{doc_id}/move-form-field")
async def move_form_field(doc_id: str, req: MoveFormFieldRequest):
    """Move / resize an existing AcroForm widget on a page."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.move_form_field(
            doc["current_bytes"],
            page_num=req.page,
            field_name=req.name,
            new_bbox=req.bbox
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Form field '{req.name}' moved successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving form field: {str(e)}")


@app.post("/api/document/{doc_id}/forms/clear")
async def clear_form_fields(doc_id: str):
    """Clear all form field values in document."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.clear_form_fields(doc["current_bytes"])
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "All form fields cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing form fields: {str(e)}")


@app.get("/api/document/{doc_id}/forms/export-json")
async def export_form_json(doc_id: str):
    """Export all form field data as JSON."""
    doc = get_doc(doc_id)
    try:
        data = PDFEngine.export_form_data(doc["current_bytes"])
        return JSONResponse(content=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting form data: {str(e)}")


@app.post("/api/document/{doc_id}/forms/import-json")
async def import_form_json(doc_id: str, req: ImportFormDataRequest):
    """Import form field data from JSON dictionary."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.import_form_data(doc["current_bytes"], req.data)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Form data imported successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing form data: {str(e)}")


@app.post("/api/document/{doc_id}/forms/flatten")
@app.post("/api/document/{doc_id}/flatten-forms")
async def flatten_forms(doc_id: str):
    """Bake all form fields and annotations into static vectors."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.flatten_forms(doc["current_bytes"])
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Document flattened successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error flattening document: {str(e)}")


# --- BOOKMARKS / TOC TREE ---
@app.get("/api/document/{doc_id}/bookmarks")
async def get_bookmarks(doc_id: str):
    """Retrieve document bookmarks/outline tree."""
    doc = get_doc(doc_id)
    try:
        bookmarks = PDFEngine.get_bookmarks(doc["current_bytes"])
        return {"bookmarks": bookmarks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading bookmarks: {str(e)}")


@app.post("/api/document/{doc_id}/bookmarks")
async def set_bookmarks(doc_id: str, req: BookmarksRequest):
    """Save updated bookmarks hierarchy."""
    doc = get_doc(doc_id)
    try:
        items = [b.model_dump() for b in req.bookmarks]
        new_pdf = PDFEngine.set_bookmarks(doc["current_bytes"], items)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Bookmarks updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving bookmarks: {str(e)}")


# --- TRUE REDACTION & SANITIZATION ---
@app.post("/api/document/{doc_id}/redact")
async def apply_redaction(doc_id: str, req: RedactRequest):
    """Apply true permanent redaction deleting underlying characters and pixels."""
    doc = get_doc(doc_id)
    try:
        items = [r.model_dump() for r in req.redactions]
        new_pdf = PDFEngine.apply_redactions_with_labels(doc["current_bytes"], items)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": f"{len(items)} area(s) redacted permanently."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying redactions: {str(e)}")


@app.post("/api/document/{doc_id}/sanitize")
async def sanitize_pdf(doc_id: str, req: SanitizeRequest):
    """Strip metadata, attachments, hidden links, scripts, and revisions."""
    doc = get_doc(doc_id)
    try:
        new_pdf, report = PDFEngine.sanitize_document(doc["current_bytes"], req.model_dump())
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Document sanitized successfully.", "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sanitizing document: {str(e)}")


# --- IMAGE / SIGNATURE PLACEMENT ---
@app.post("/api/document/{doc_id}/insert-image")
async def insert_image(
    doc_id: str,
    file: UploadFile = File(...),
    page: int = Form(1),
    x0: float = Form(...),
    y0: float = Form(...),
    x1: float = Form(...),
    y1: float = Form(...),
    opacity: float = Form(1.0),
    rotation: int = Form(0),
    flip_h: bool = Form(False),
    flip_v: bool = Form(False)
):
    """Insert uploaded image or signature stamp onto a page."""
    doc = get_doc(doc_id)
    try:
        img_bytes = await file.read()
        bbox = [x0, y0, x1, y1]
        new_pdf = PDFEngine.insert_image_to_page(
            doc["current_bytes"],
            img_bytes,
            page,
            bbox,
            opacity=opacity,
            rotation=rotation,
            flip_h=flip_h,
            flip_v=flip_v
        )
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Image placed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error placing image: {str(e)}")


@app.get("/api/document/{doc_id}/page/{page_number}/images")
async def get_page_images(doc_id: str, page_number: int):
    """Retrieve all images on a page with their bounding boxes and preview URLs."""
    doc = get_doc(doc_id)
    try:
        images = PDFEngine.get_page_images_info(doc["current_bytes"], page_number)
        for img in images:
            img["image_url"] = f"/api/document/{doc_id}/image/{img['xref']}"
        return {"page": page_number, "images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting images: {str(e)}")


@app.get("/api/document/{doc_id}/image/{xref}")
async def get_extracted_image(doc_id: str, xref: int):
    """Retrieve raw extracted image bytes by xref for crisp live preview."""
    import fitz
    doc = get_doc(doc_id)
    try:
        pdf_doc = fitz.open(stream=doc["current_bytes"], filetype="pdf")
        try:
            img_dict = pdf_doc.extract_image(xref)
            img_bytes = img_dict["image"]
            ext = img_dict.get("ext", "png")
            media_type = f"image/{ext}" if ext in ("png", "jpeg", "webp") else "image/png"
            return Response(content=img_bytes, media_type=media_type)
        finally:
            pdf_doc.close()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Image with xref {xref} not found: {str(e)}")


@app.post("/api/document/{doc_id}/delete-image")
async def delete_image(doc_id: str, req: DeleteImageRequest):
    """Delete an image on a page by bounding box or xref non-destructively."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.delete_image_by_bbox(doc["current_bytes"], req.page, req.bbox or [], xref=req.xref)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Image removed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing image: {str(e)}")


@app.post("/api/document/{doc_id}/move-image")
async def move_image(doc_id: str, req: MoveImageRequest):
    """Move and/or resize an existing image on a page."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.move_image_on_page(
            doc["current_bytes"],
            page_num=req.page,
            old_bbox=req.old_bbox,
            new_bbox=req.new_bbox,
            xref=req.xref,
            opacity=req.opacity if req.opacity is not None else 1.0,
            rotation=req.rotation or 0,
            flip_h=bool(req.flip_h),
            flip_v=bool(req.flip_v)
        )
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Image updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving image: {str(e)}")


@app.post("/api/document/{doc_id}/replace-image")
async def replace_image(
    doc_id: str,
    file: UploadFile = File(...),
    page: int = Form(1),
    x0: float = Form(...),
    y0: float = Form(...),
    x1: float = Form(...),
    y1: float = Form(...),
    xref: Optional[int] = Form(None),
    opacity: float = Form(1.0),
    rotation: int = Form(0),
    flip_h: bool = Form(False),
    flip_v: bool = Form(False)
):
    """Replace an existing image xref with a new uploaded image in-place."""
    doc = get_doc(doc_id)
    try:
        new_img_bytes = await file.read()
        old_bbox = [x0, y0, x1, y1]
        new_pdf = PDFEngine.move_image_on_page(
            doc["current_bytes"],
            page_num=page,
            old_bbox=old_bbox,
            new_bbox=old_bbox,
            xref=xref,
            opacity=opacity,
            rotation=rotation,
            flip_h=flip_h,
            flip_v=flip_v,
            new_image_bytes=new_img_bytes
        )
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Image replaced successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error replacing image: {str(e)}")


@app.post("/api/document/{doc_id}/layer-order")
async def reorder_layer(doc_id: str, req: LayerOrderRequest):
    """Reorder visual depth / z-index stacking of an element (image, text, shape, annotation)."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.reorder_page_layer(
            pdf_bytes=doc["current_bytes"],
            page_num=req.page,
            element_type=req.element_type,
            action=req.action,
            element_id=req.element_id,
            bbox=req.bbox,
            text=req.text,
            font_size=req.font_size,
            font_name=req.font_name,
            color=req.color
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Layer updated ({req.action.replace('_', ' ')}).", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating layer order: {str(e)}")


# --- FREEHAND INK & ANNOTATIONS ---
@app.post("/api/document/{doc_id}/add-ink")
@app.post("/api/document/{doc_id}/ink")
async def add_ink(doc_id: str, req: InkRequest):
    """Add freehand pen/pencil strokes."""
    doc = get_doc(doc_id)
    try:
        items = [item.model_dump() for item in req.drawings]
        new_pdf = PDFEngine.add_ink_annotations(doc["current_bytes"], items)
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Drawing saved successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving drawings: {str(e)}")


@app.post("/api/document/{doc_id}/add-stamp")
async def add_stamp(doc_id: str, req: StampRequest):
    """Add vector badge stamp."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_stamp_annotation(
            doc["current_bytes"],
            page_num=req.page,
            bbox=req.bbox,
            stamp_text=req.text,
            color=req.color
        )
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": f"Stamp '{req.text}' added."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding stamp: {str(e)}")


@app.post("/api/document/{doc_id}/add-note")
@app.post("/api/document/{doc_id}/add-sticky-note")
async def add_sticky_note(doc_id: str, req: StickyNoteRequest):
    """Add sticky note annotation."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_sticky_note(
            doc["current_bytes"],
            page_num=req.page,
            point=req.point,
            content=req.content,
            author=req.author or "User"
        )
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Sticky note added."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


# --- METADATA & SECURITY INSPECTOR ---
@app.get("/api/document/{doc_id}/metadata")
async def get_metadata(doc_id: str):
    """Get full document metadata."""
    doc = get_doc(doc_id)
    info = PDFEngine.get_document_info(doc["current_bytes"])
    return {"metadata": info.get("metadata", {})}


@app.post("/api/document/{doc_id}/metadata")
async def update_metadata(doc_id: str, req: MetadataRequest):
    """Update document metadata properties."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.update_metadata(doc["current_bytes"], req.model_dump())
        save_new_version(doc_id, new_pdf)
        return {"status": "success", "message": "Metadata updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating metadata: {str(e)}")


@app.get("/api/document/{doc_id}/security-inspect")
async def security_inspect(doc_id: str):
    """Inspect encryption, permissions, PDF version, JavaScript, and PDF/A conformance."""
    doc = get_doc(doc_id)
    try:
        audit = PDFEngine.get_security_and_compliance_info(doc["current_bytes"])
        return audit
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing security audit: {str(e)}")


# --- ADVANCED PAGE TOOLS ---
@app.post("/api/document/{doc_id}/page/insert-blank")
async def insert_blank_page(doc_id: str, req: InsertBlankPageRequest):
    """Insert a blank page at target position."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.insert_blank_page(
            doc["current_bytes"],
            at_page=req.at_page,
            width=req.width,
            height=req.height
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Blank page inserted at page {req.at_page}.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting page: {str(e)}")


@app.post("/api/document/{doc_id}/page/duplicate")
async def duplicate_page(doc_id: str, req: DuplicatePageRequest):
    """Duplicate a page in place."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.duplicate_page(doc["current_bytes"], page_num=req.page)
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"Page {req.page} duplicated.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error duplicating page: {str(e)}")


@app.post("/api/document/{doc_id}/page/crop")
async def crop_page(doc_id: str, req: CropPageRequest):
    """Crop a page margins (single or all pages)."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.crop_page(
            doc["current_bytes"],
            page_num=req.page,
            crop_box=req.crop_box,
            apply_all_pages=req.apply_all_pages
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        target_str = "all pages" if req.apply_all_pages else f"page {req.page}"
        return {"status": "success", "message": f"Cropped {target_str}.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cropping page: {str(e)}")


@app.post("/api/document/{doc_id}/trim-margins")
async def trim_margins(doc_id: str, req: TrimMarginsRequest):
    """Auto-detect content boundaries and trim whitespace margins."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.trim_margins(
            doc["current_bytes"],
            page_num=req.page,
            padding_pt=req.padding
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        scope_str = "entire document" if req.page == 0 else f"page {req.page}"
        return {"status": "success", "message": f"Margins trimmed for {scope_str}.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error trimming margins: {str(e)}")


# --- FEATURE 1: TABLE EXTRACTION & EXPORT ---
@app.get("/api/document/{doc_id}/page/{page_number}/tables")
async def get_page_tables(doc_id: str, page_number: int):
    """Detect and extract tabular structures on a page."""
    doc = get_doc(doc_id)
    try:
        tables = PDFEngine.detect_tables(doc["current_bytes"], page_number)
        return {"page": page_number, "tables": tables, "count": len(tables)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting tables: {str(e)}")


@app.post("/api/document/{doc_id}/export-table-csv")
async def export_table_csv(doc_id: str, req: TableExportRequest):
    """Export extracted table rows as a CSV file."""
    doc = get_doc(doc_id)
    try:
        all_csv = ""
        for t in req.tables:
            rows = t.get("rows", [])
            all_csv += PDFEngine.export_table_to_csv(rows) + "\n\n"
        return StreamingResponse(
            io.BytesIO(all_csv.encode("utf-8")),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="tables_{doc["filename"]}.csv"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting table CSV: {str(e)}")


@app.post("/api/document/{doc_id}/export-table-excel")
async def export_table_excel(doc_id: str, req: TableExportRequest):
    """Export extracted tables as a multi-sheet Excel spreadsheet (.xlsx)."""
    doc = get_doc(doc_id)
    try:
        excel_bytes = PDFEngine.export_table_to_excel(req.tables)
        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="tables_{doc["filename"]}.xlsx"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting table Excel: {str(e)}")


# --- FEATURE 2: PII SCANNING & AUTO-REDACTION ---
@app.post("/api/document/{doc_id}/scan-pii")
async def scan_for_pii(doc_id: str, req: ScanPIIRequest):
    """Scan document for PII, custom key-value pairs, keywords, and regex patterns."""
    doc = get_doc(doc_id)
    try:
        matches = PDFEngine.scan_for_pii(
            doc["current_bytes"],
            page_num=req.page,
            types=req.types,
            custom_keys=req.custom_keys,
            key_value_mode=req.key_value_mode,
            custom_keywords=req.custom_keywords,
            match_whole_word=bool(req.match_whole_word),
            case_sensitive=bool(req.case_sensitive),
            custom_pattern=req.custom_pattern
        )
        return {"matches": matches, "total": len(matches)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning PII: {str(e)}")


@app.post("/api/document/{doc_id}/auto-redact-pii")
async def auto_redact_pii(doc_id: str, req: AutoRedactPIIRequest):
    """Apply permanent vector redactions to matched PII items and sanitize metadata."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.auto_redact_pii(
            doc["current_bytes"],
            items=req.items,
            fill_color=req.fill_color,
            text_color=req.text_color,
            label=req.label,
            sanitize_metadata=bool(req.sanitize_metadata)
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"{len(req.items)} sensitive items permanently redacted.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error auto-redacting PII: {str(e)}")


# --- FEATURE 3: TEXT MARKUP SUITE ---
@app.post("/api/document/{doc_id}/add-markup")
async def add_text_markup(doc_id: str, req: TextMarkupRequest):
    """Add text markup annotations (highlight, underline, strikeout, squiggly)."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_text_markup(
            doc["current_bytes"],
            page_num=req.page,
            markup_type=req.type,
            bboxes=req.bboxes,
            search_text=req.search_text,
            color=req.color
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": f"{req.type.capitalize()} markup added.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding text markup: {str(e)}")


# --- FEATURE 4: DOCUMENT COMPARISON ---
@app.post("/api/document/{doc_id}/compare")
async def compare_with_uploaded(
    doc_id: str,
    file: UploadFile = File(...),
    page_a: int = Form(1),
    page_b: int = Form(1),
    zoom: float = Form(1.5)
):
    """Compare current document page against an uploaded second PDF."""
    doc = get_doc(doc_id)
    try:
        doc_b_bytes = await file.read()
        diff_data = PDFEngine.compare_documents(
            doc["current_bytes"],
            doc_b_bytes,
            page_a=page_a,
            page_b=page_b,
            zoom=zoom
        )
        return diff_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing documents: {str(e)}")


@app.post("/api/compare")
async def compare_two_documents(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    page_a: int = Form(1),
    page_b: int = Form(1),
    zoom: float = Form(1.5)
):
    """Compare two uploaded PDF files."""
    try:
        bytes_a = await file_a.read()
        bytes_b = await file_b.read()
        diff_data = PDFEngine.compare_documents(
            bytes_a,
            bytes_b,
            page_a=page_a,
            page_b=page_b,
            zoom=zoom
        )
        return diff_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing documents: {str(e)}")


# --- FEATURE 5: FORMAT CONVERSIONS ---
@app.post("/api/convert-images-to-pdf")
async def convert_images_to_pdf(files: List[UploadFile] = File(...)):
    """Convert uploaded images into a clean single PDF."""
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one image.")
    try:
        images_data = []
        for f in files:
            content = await f.read()
            images_data.append((f.filename, content))
            
        pdf_bytes = PDFEngine.convert_images_to_pdf(images_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="converted_images.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting images to PDF: {str(e)}")


@app.get("/api/document/{doc_id}/convert-to-images")
async def convert_pdf_to_images(
    doc_id: str,
    dpi: int = Query(150, ge=72, le=300),
    format: str = Query("png")
):
    """Convert all pages into high-resolution images bundled in a ZIP."""
    doc = get_doc(doc_id)
    try:
        zip_bytes = PDFEngine.convert_pdf_to_images_zip(
            doc["current_bytes"],
            dpi=dpi,
            image_format=format
        )
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="images_{doc["filename"]}.zip"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting PDF to images: {str(e)}")


@app.post("/api/document/{doc_id}/page-numbers")
async def add_page_numbers(doc_id: str, req: PageNumberRequest):
    """Add dynamic page numbering across PDF."""
    doc = get_doc(doc_id)
    try:
        new_pdf = PDFEngine.add_page_numbers(
            doc["current_bytes"],
            position=req.position,
            format_str=req.format_str,
            start_page=req.start_page,
            font_size=req.font_size,
            font_name=req.font_name,
            color=req.color,
            margin=req.margin
        )
        save_new_version(doc_id, new_pdf)
        info = PDFEngine.get_document_info(new_pdf)
        return {"status": "success", "message": "Page numbers applied successfully.", "info": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error applying page numbers: {str(e)}")

