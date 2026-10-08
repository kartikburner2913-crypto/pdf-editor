# SmallPDF vs PDF Studio & Editor — Feature Comparison & Implementation Plan

> **Generated:** October 6, 2026
> **Scope:** Full feature-by-feature audit of SmallPDF.com (40+ tools) against the current PDF Studio & Editor codebase
> **Objective:** Identify missing features, quality gaps, and build actionable implementation plans

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Comparison Matrix](#feature-comparison-matrix)
3. [Category A — Missing Features (Not Present At All)](#category-a--missing-features-not-present-at-all)
4. [Category B — Existing Features Needing Upgrades](#category-b--existing-features-needing-upgrades)
5. [Category C — Features At Parity or Better](#category-c--features-at-parity-or-better)
6. [Implementation Plans — Missing Features](#implementation-plans--missing-features)
7. [Implementation Plans — Quality Upgrades](#implementation-plans--quality-upgrades)
8. [Priority Roadmap](#priority-roadmap)
9. [Technical Dependencies](#technical-dependencies)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| SmallPDF Total Tools/Features Analyzed | 42 |
| **Features at Parity or Better** | **28** (+7 Conversion Suite) |
| **Features Present but Needing Upgrades** | 9 |
| **Features Completely Missing** | **5** (-7 Conversion Suite) |

**Key Gaps & Progress:** The **format conversions** suite (PDF to/from Word, Excel, PowerPoint, and PDF/A) is now **fully implemented** with dedicated backend engines and studio UI. The remaining missing features are **eSign / Digital Signatures**, **OCR**, **Unlock/Decrypt PDF**, **Batch Processing**, **Cloud Storage Integration**, and **AI-Powered Document Chat/Summary**.

---

## Feature Comparison Matrix

### Legend
- PASS = Fully implemented and on par
- WARN = Partially implemented / needs upgrades
- FAIL = Missing entirely
- PRO = SmallPDF Pro-only (premium feature)

| # | SmallPDF Feature | SmallPDF Tier | PDF Studio Status | Notes |
|---|------------------|---------------|-------------------|-------|
| **CONVERSION TOOLS** | | | | |
| 1 | PDF to Word (.docx) | Free | PASS | Implemented via `PDFEngine.convert_pdf_to_docx`, `/api/document/{id}/convert-to-word`, `/api/convert-pdf-to-word` |
| 2 | PDF to Excel (.xlsx) | Free | PASS | Implemented via `PDFEngine.convert_pdf_to_excel`, `/api/document/{id}/convert-to-excel`, `/api/convert-pdf-to-excel` |
| 3 | PDF to PowerPoint (.pptx) | Free | PASS | Implemented via `PDFEngine.convert_pdf_to_pptx`, `/api/document/{id}/convert-to-pptx`, `/api/convert-pdf-to-pptx` |
| 4 | Word to PDF | Free | PASS | Implemented via `PDFEngine.convert_docx_to_pdf`, `/api/convert-docx-to-pdf` |
| 5 | Excel to PDF | Free | PASS | Implemented via `PDFEngine.convert_excel_to_pdf`, `/api/convert-excel-to-pdf` |
| 6 | PowerPoint to PDF | Free | PASS | Implemented via `PDFEngine.convert_pptx_to_pdf`, `/api/convert-pptx-to-pdf` |
| 7 | PDF to JPG/PNG | Free | PASS | Implemented via `/api/document/{id}/convert-to-images` |
| 8 | JPG/PNG to PDF | Free | PASS | Implemented via `/api/convert-images-to-pdf` |
| 9 | PDF to PDF/A | Free | PASS | Implemented via `PDFEngine.convert_pdf_to_pdfa`, `/api/document/{id}/convert-to-pdfa`, `/api/convert-pdf-to-pdfa` |
| **EDITING and ANNOTATION** | | | | |
| 10 | Edit PDF (add text, images, shapes) | Free | PASS | Comprehensive — text, images, shapes, ink, stamps |
| 11 | Edit Existing Text (inline modify) | PRO | PASS | Full WYSIWYG in-place text editing with font/color control |
| 12 | Highlight / Underline / Strikeout | Free | PASS | Full text markup suite with 4 types |
| 13 | Add Comments / Sticky Notes | Free | PASS | Sticky notes with author tags |
| 14 | Freehand Drawing | Free | PASS | Multi-color, adjustable width ink annotations |
| 15 | Add Shapes (rect, circle, line, arrow) | Free | PASS | Full shape annotation suite |
| 16 | Add Watermark | Free | PASS | Configurable opacity, rotation, color, page selection |
| 17 | Add Page Numbers | Free | PASS | 6 positions, custom format, font control |
| **DOCUMENT ORGANIZATION** | | | | |
| 18 | Merge PDFs | Free | PASS | Multi-file merge endpoint |
| 19 | Split PDF | Free | PASS | Page range extraction + burst to ZIP |
| 20 | Organize Pages (reorder/rotate/delete) | Free | PASS | Full thumbnail organizer with rotation |
| 21 | Delete Pages | Free | PASS | Via organize pages endpoint |
| 22 | Rotate Pages | Free | PASS | 90/180/270 rotation |
| 23 | Insert Blank Page | Free | PASS | Custom dimensions (A4/Letter/Custom) |
| 24 | Duplicate Page | Free | PASS | Clone page in-place |
| 25 | Crop Pages | Free | WARN | Implemented but lacks SmallPDF visual crop preview UI |
| **COMPRESSION** | | | | |
| 26 | Compress PDF (basic) | Free | PASS | Multiple presets (extreme/recommended/high/custom) |
| 27 | Strong Compression | PRO | PASS | Advanced lossy compression with image quality/DPI control |
| **SECURITY** | | | | |
| 28 | Protect PDF (password encrypt) | Free | PASS | AES-256 with granular permissions |
| 29 | Unlock PDF (remove password) | Free | FAIL | Can only apply protection, cannot remove/decrypt |
| 30 | Flatten PDF | Free | PASS | Form + annotation flattening |
| **SIGNING** | | | | |
| 31 | eSign PDF (create and apply signature) | Free | WARN | Can insert signature images but no draw/type signature creation workflow |
| 32 | Request Signatures (send for signing) | PRO | FAIL | Not implemented — requires user auth + email system |
| **AI-POWERED** | | | | |
| 33 | AI Chat / Summarize PDF | PRO | FAIL | Not implemented |
| 34 | AI Translate Document | PRO | FAIL | Not implemented |
| **SCANNING and OCR** | | | | |
| 35 | OCR (make scanned PDF searchable) | PRO | FAIL | Not implemented |
| 36 | Scanner (mobile scan to PDF) | Free | N/A | Mobile feature — out of scope for web app |
| **FORMS** | | | | |
| 37 | Fill and Sign Forms | Free | PASS | Full AcroForm CRUD with fill/flatten/export/import |
| 38 | Form Builder (add fields) | Free | PASS | 8 field types with drag-and-drop placement |
| **ADVANCED** | | | | |
| 39 | Batch Processing (multi-file) | PRO | FAIL | Not implemented — all operations are single-file |
| 40 | Cloud Storage Integration (Drive/Dropbox) | Free | FAIL | Not implemented — 100% local/offline by design |
| 41 | Compare Documents | PRO | PASS | Side-by-side visual diff with change detection |
| 42 | Number Pages | Free | PASS | Already implemented with 6 positions + custom format |
| **ADDITIONAL (PDF Studio has, SmallPDF lacks)** | | | | |
| 43 | PII Scanning and Auto-Redaction | — | PASS | Advanced — SSN, email, phone, credit card, IP detection |
| 44 | True Redaction (cryptographic deletion) | — | PASS | Permanent character/pixel deletion, not just black boxes |
| 45 | Document Sanitization | — | PASS | Strip metadata, attachments, links, annotations |
| 46 | Table Detection and Extraction | — | PASS | ML-powered table detection with CSV/Excel export |
| 47 | Security and Compliance Inspector | — | PASS | PDF/A, encryption, JS actions, permissions audit |
| 48 | Layer Z-Ordering | — | PASS | Bring to front/send to back for images/text/shapes |
| 49 | Bookmarks / TOC Editor | — | PASS | Hierarchical outline CRUD |
| 50 | Image Manipulation (move/resize/flip/rotate/opacity) | — | PASS | Full transform box with drag handles |

---

## Category A — Feature Status & Remaining Roadmap

### Implemented Conversion Features (October 2026)
- [x] **A1. PDF to Word Conversion (.docx)** — Implemented via `pdf2docx` + `python-docx`
- [x] **A2. PDF to Excel Conversion (.xlsx)** — Implemented via `PyMuPDF` table extract + `openpyxl`
- [x] **A3. PDF to PowerPoint Conversion (.pptx)** — Implemented via `python-pptx`
- [x] **A4. Word to PDF Conversion** — Implemented via `python-docx` + `reportlab`
- [x] **A5. Excel to PDF Conversion** — Implemented via `openpyxl` + `reportlab`
- [x] **A6. PowerPoint to PDF Conversion** — Implemented via `python-pptx` + `reportlab`
- [x] **A7. PDF to PDF/A Archival Conversion** — Implemented via `PyMuPDF` XMP / Ghostscript

### Remaining Features (To Implement)
- [ ] **A8. Unlock / Decrypt PDF**
- [ ] **A9. OCR (Optical Character Recognition)**
- [ ] **A10. eSign Workflow (draw/type signature + certificate signing)**
- [ ] **A11. Batch Processing**
- [ ] **A12. AI-Powered Document Features (Chat/Summarize/Translate)**

---

## Category B — Existing Features Needing Upgrades

### B1. Crop Pages — Missing Visual Crop UI
**Current State:** Backend supports cropping via coordinates.
**Gap:** SmallPDF provides a visual drag-to-crop rectangle preview. PDF Studio only accepts manual coordinate input.
**Upgrade:** Add interactive visual crop overlay to the canvas.

### B2. eSign — No Signature Creation Workflow
**Current State:** Can insert uploaded signature images.
**Gap:** SmallPDF lets users draw, type, or upload signatures. Our app only supports image upload.
**Upgrade:** Build in-browser signature pad (draw), typed signature generator (select font), and integrate with the image insert pipeline.

### B3. Compress PDF — No Visual Before/After
**Current State:** Returns metrics (original size, compressed size, savings %).
**Gap:** SmallPDF shows a visual comparison with animated size reduction.
**Upgrade:** Add animated compression results card with visual size comparison bar.

### B4. Merge PDFs — UI Is Basic
**Current State:** API endpoint works, but UI only accepts multi-file upload.
**Gap:** SmallPDF allows drag-and-drop reordering of files before merge, preview of each document.
**Upgrade:** Build a file list reorder UI with thumbnails before merge submission.

### B5. Split PDF — No Visual Page Picker
**Current State:** User types page ranges as text ("1-3, 5").
**Gap:** SmallPDF shows page thumbnails and lets users click to select which pages to extract.
**Upgrade:** Add visual page thumbnail grid with checkboxes for split page selection.

### B6. PDF Upload — No Drag-and-Drop from Cloud
**Current State:** Only local file upload supported.
**Gap:** SmallPDF supports drag-and-drop from Google Drive, Dropbox, OneDrive.
**Upgrade:** Add file picker integrations (Google Picker API, Dropbox Chooser, OneDrive).

### B7. Download — No Save-to-Cloud Option
**Current State:** Only downloads to local filesystem.
**Gap:** SmallPDF offers "Save to Dropbox/Drive" after processing.
**Upgrade:** Add cloud export buttons after download.

### B8. Mobile Responsiveness
**Current State:** App is primarily desktop-oriented.
**Gap:** SmallPDF is fully responsive and mobile-first.
**Upgrade:** Improve responsive breakpoints, touch targets, and mobile toolbar layout.

### B9. Landing / Tool Selection Page
**Current State:** Single upload page leads directly to editor.
**Gap:** SmallPDF has a polished tool selector landing page with categorized tool cards.
**Upgrade:** Consider adding a tool-selector landing page for dedicated tools (compress, merge, split, convert).

---

## Category C — Features At Parity or Better

These features are at or above SmallPDF's quality level and require no changes:

| Feature | Assessment |
|---------|-----------|
| Text Editing (inline, find/replace) | Exceeds SmallPDF — bbox-level precision, per-line editing |
| Text Addition (WYSIWYG placement) | At parity — font, size, color, alignment, background |
| Shape Annotations | At parity — rect, circle, line, highlight, fill colors |
| Freehand Ink / Drawing | At parity — multi-color, adjustable width |
| Stamps (vector badges) | Exceeds SmallPDF — 5 stamp types with double-border styling |
| Sticky Notes | At parity — page-positioned with author |
| Watermark | At parity — opacity, rotation, color, page selection |
| Page Numbers | At parity — 6 positions, custom format |
| Merge PDFs | At parity |
| Split / Extract Pages | At parity + burst-to-ZIP |
| Organize (reorder/rotate/delete) | At parity with thumbnail organizer |
| Compress PDF | Exceeds SmallPDF — 4 presets, DPI control, grayscale, metadata strip |
| Password Protection | Exceeds SmallPDF — AES-256, granular permission flags |
| Form Fill | Exceeds SmallPDF — 8 field types, CRUD, export/import JSON, flatten |
| Bookmarks / TOC | Exceeds SmallPDF — hierarchical CRUD (SmallPDF lacks this) |
| Redaction | Exceeds SmallPDF — true vector redaction + PII auto-scan (SmallPDF lacks) |
| Sanitization | Exceeds SmallPDF — metadata, attachments, links, annotations stripping |
| Document Comparison | At parity — visual diff with change detection |
| Security Inspector | Exceeds SmallPDF — PDF/A audit, JS actions, encryption state |
| Image Insert/Move/Resize/Replace | Exceeds SmallPDF — full transform with opacity, rotation, flip |
| PDF to Images (JPG/PNG) | At parity — DPI control, ZIP bundle |
| Images to PDF | At parity — multi-image conversion |
| Undo/Redo Version Stack | Exceeds SmallPDF — full non-destructive version history |

---

## Implementation Plans — Missing Features

---

### Plan A1: PDF to Word Conversion [IMPLEMENTED]

**Endpoint:** `/api/document/{id}/convert-to-word` & `/api/convert-pdf-to-word`
**Status:** FULLY IMPLEMENTED (Verified with unit & integration tests)
**SmallPDF Parity:** Full document to .docx with layout preservation

#### Technical Approach
1. **Primary Option — pdf2docx library** (Python, GPL-licensed):
   - Uses PyMuPDF internally for PDF parsing
   - Converts layout, text formatting, tables, images to .docx
   - Install: pip install pdf2docx

2. **Alternative — pypandoc + pdftotext:**
   - Text-only conversion, less layout fidelity

#### Backend Implementation
```python
@app.get("/api/document/{doc_id}/convert-to-word")
async def convert_to_word(doc_id: str):
    doc = get_doc(doc_id)
    docx_bytes = PDFEngine.convert_pdf_to_docx(doc["current_bytes"])
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{doc["filename"]}.docx"'}
    )
```

#### Engine Implementation
```python
@staticmethod
def convert_pdf_to_docx(pdf_bytes: bytes) -> bytes:
    from pdf2docx import Converter
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
        tmp_pdf.write(pdf_bytes)
        tmp_pdf_path = tmp_pdf.name
    tmp_docx_path = tmp_pdf_path.replace(".pdf", ".docx")
    try:
        cv = Converter(tmp_pdf_path)
        cv.convert(tmp_docx_path)
        cv.close()
        with open(tmp_docx_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(tmp_pdf_path)
        if os.path.exists(tmp_docx_path):
            os.unlink(tmp_docx_path)
```

#### Dependencies
```
pdf2docx>=0.5.8
python-docx>=1.1.0
```

---

### Plan A2: PDF to Excel Conversion [IMPLEMENTED]

**Endpoint:** `/api/document/{id}/convert-to-excel` & `/api/convert-pdf-to-excel`
**Status:** FULLY IMPLEMENTED (Verified with multi-sheet table extraction)

#### Technical Approach
1. Multi-page table detection using PyMuPDF `find_tables()`
2. Export structured cells with header styling and auto-width columns to `.xlsx` using `openpyxl`
3. Layout text fallback for pages without explicit table borders

#### Dependencies
```
openpyxl>=3.1.2
```

---

### Plan A3: PDF to PowerPoint Conversion [IMPLEMENTED]

**Endpoint:** `/api/document/{doc_id}/convert-to-pptx` & `/api/convert-pdf-to-pptx`
**Status:** FULLY IMPLEMENTED (Verified with python-pptx)

#### Technical Approach
1. python-pptx library creates dynamic slide decks matching PDF page dimensions
2. Renders high-DPI (150 DPI) page visuals as slide pictures
3. Injects extractable text boxes for searchability and editing in PowerPoint

#### Dependencies
```
python-pptx>=1.0.2
```

---

### Plan A4-A6: Office to PDF Conversion (Word/Excel/PowerPoint to PDF) [IMPLEMENTED]

**Endpoints:**
- Word: `POST /api/convert-docx-to-pdf`
- Excel: `POST /api/convert-excel-to-pdf`
- PowerPoint: `POST /api/convert-pptx-to-pdf`
**Status:** FULLY IMPLEMENTED (ReportLab portable rendering + headless LibreOffice accelerator)

#### Technical Approach
- Pure Python ReportLab platypus engine converts `.docx`, `.xlsx`, and `.pptx` into standard PDFs with zero external OS dependencies required.
- Automatically uses headless `soffice` / `libreoffice` if installed in the host environment for accelerated rendering.

#### Dependencies
```
python-docx>=1.2.0
python-pptx>=1.0.2
openpyxl>=3.1.2
reportlab>=4.0.0
```

---

### Plan A7: PDF to PDF/A Conversion [IMPLEMENTED]

**Endpoint:** `/api/document/{doc_id}/convert-to-pdfa` & `POST /api/convert-pdf-to-pdfa`
**Status:** FULLY IMPLEMENTED (PDF/A XMP metadata injection + Ghostscript fallback)

#### Engine Implementation
```python
@staticmethod
def convert_to_pdfa(pdf_bytes: bytes, level: str = "2b") -> bytes:
    import subprocess, tempfile
    pdfa_def = {"1b": "1", "2b": "2", "3b": "3"}.get(level, "2")
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_in:
        tmp_in.write(pdf_bytes)
        in_path = tmp_in.name
    out_path = in_path.replace(".pdf", "_pdfa.pdf")
    try:
        subprocess.run([
            "gs", "-dPDFA=" + pdfa_def, "-dBATCH", "-dNOPAUSE",
            "-sProcessColorModel=DeviceRGB", "-sDEVICE=pdfwrite",
            "-sPDFACompatibilityPolicy=1",
            "-sOutputFile=" + out_path, in_path
        ], check=True, timeout=120)
        with open(out_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(in_path)
        if os.path.exists(out_path):
            os.unlink(out_path)
```

#### Dependencies
```
# System dependency: Ghostscript
# apt-get install ghostscript (Linux) / choco install ghostscript (Windows)
```

---

### Plan A8: Unlock / Decrypt PDF

**Difficulty:** Easy
**Estimated Effort:** 0.5-1 day

#### Engine Implementation
```python
@staticmethod
def unlock_pdf(pdf_bytes: bytes, password: str) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        if doc.is_encrypted:
            if not doc.authenticate(password):
                raise ValueError("Incorrect password.")
        return doc.tobytes(encryption=fitz.PDF_ENCRYPT_NONE, garbage=4, deflate=True)
    finally:
        doc.close()
```

---

### Plan A9: OCR (Optical Character Recognition)

**Difficulty:** Hard
**Estimated Effort:** 3-5 days

#### Engine Implementation (PyMuPDF + Tesseract)
```python
@staticmethod
def apply_ocr(pdf_bytes: bytes, language: str = "eng",
              pages=None, dpi: int = 300) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page_indices = [p - 1 for p in pages] if pages else range(len(doc))
        for idx in page_indices:
            page = doc[idx]
            if page.get_text().strip():
                continue
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_data = pytesseract.image_to_data(
                img, lang=language, output_type=pytesseract.Output.DICT
            )
            for i, word in enumerate(ocr_data["text"]):
                if word.strip():
                    x = ocr_data["left"][i] * 72 / dpi
                    y = ocr_data["top"][i] * 72 / dpi
                    h = ocr_data["height"][i] * 72 / dpi
                    page.insert_text(fitz.Point(x, y + h), word,
                                     fontsize=h * 0.8, render_mode=3)
        return doc.tobytes(garbage=4, deflate=True)
    finally:
        doc.close()
```

#### Dependencies
```
pytesseract>=0.3.10
# System: Tesseract OCR must be installed
```

---

### Plan A10: eSign Workflow (Draw / Type / Upload Signature)

**Difficulty:** Medium
**Estimated Effort:** 2-3 days
**Note:** Backend already supports image insertion. This is primarily a frontend UX feature.

#### Key Components
- **Signature Pad (Draw):** HTML5 Canvas with freehand drawing, touch support
- **Typed Signature:** Text input with cursive font preview (Google Fonts: Satisfy, Dancing Script)
- **Upload:** Existing file input for signature image
- All three produce a PNG blob sent to existing /api/document/{id}/insert-image

---

### Plan A11: Batch Processing

**Difficulty:** Medium
**Estimated Effort:** 2-4 days

#### Technical Approach
Create a batch processing endpoint that accepts multiple files and applies the same operation, returning a ZIP of results. Supported operations: compress, convert-to-images, unlock, protect, ocr, watermark.

---

### Plan A12: AI-Powered Features (Chat / Summarize / Translate)

**Difficulty:** Hard
**Estimated Effort:** 5-7 days
**Note:** Requires an LLM API key (OpenAI, Anthropic, Google, or local Ollama model). Must be opt-in to preserve offline guarantee.

#### Configuration
```
# Environment variables:
# AI_PROVIDER=openai|anthropic|google|ollama|disabled
# AI_API_KEY=sk-...
# AI_MODEL=gpt-4o|claude-3-opus|gemini-pro|llama3
# OLLAMA_BASE_URL=http://localhost:11434
```

#### Dependencies (all optional)
```
openai>=1.0.0
anthropic>=0.30.0
httpx>=0.27.0
```

---

## Implementation Plans — Quality Upgrades

### Upgrade B1: Visual Crop Tool
Add interactive drag-to-select crop rectangle overlay on page preview. Convert pixel coordinates to PDF points and send to existing crop API.

### Upgrade B3: Compression Results Visualization
Add animated size comparison bars showing original vs compressed file size with percentage savings badge.

### Upgrade B4: Merge PDF Reorder UI
Build draggable file list with thumbnails. Users can reorder files before submitting merge request.

### Upgrade B5: Split PDF Visual Page Picker
Add page thumbnail grid with checkboxes. Users click to select pages instead of typing ranges.

### Upgrade B8: Mobile Responsiveness
- Touch-friendly 44px minimum tap targets
- Collapsible sidebar as slide-in drawer
- Pinch-to-zoom gesture support
- Bottom action bar for thumb-accessible controls
- Proper media queries for tablet (768px) and mobile (480px)

---

## Priority Roadmap

### Phase 1 — Quick Wins (Week 1)
| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | A8: Unlock PDF | 0.5 day | High — trivial to implement |
| P0 | B1: Visual Crop Tool | 1 day | High — major UX gap |
| P0 | B3: Compression Visualization | 0.5 day | Medium — polish |
| P1 | A10: eSign Workflow | 2 days | High — signature creation UI |
| P1 | B4: Merge Reorder UI | 1 day | Medium — UX improvement |
| P1 | B5: Split Page Picker | 1 day | Medium — UX improvement |

### Phase 2 — Core Conversions (Week 2-3)
| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P1 | A1: PDF to Word | 3 days | Very High — most requested feature |
| P1 | A2: PDF to Excel | 2 days | High — extend existing table extraction |
| P1 | A3: PDF to PowerPoint | 3 days | Medium — image-based slides |
| P2 | A4-A6: Office to PDF | 3 days | High — requires LibreOffice |

### Phase 3 — Advanced (Week 4-5)
| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P2 | A9: OCR | 3 days | High — requires Tesseract |
| P2 | A7: PDF/A Conversion | 2 days | Medium — requires Ghostscript |
| P2 | A11: Batch Processing | 2 days | Medium — multi-file pipeline |
| P2 | B8: Mobile Responsiveness | 3 days | High — expands user base |

### Phase 4 — Ambitious (Week 6+)
| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P3 | A12: AI Features | 5 days | High but requires API key |
| P3 | B6-B7: Cloud Storage | 3 days | Medium — breaks offline promise |
| P3 | B9: Tool Landing Page | 2 days | Medium — UX/marketing |

---

## Technical Dependencies

### New Python Dependencies
```
# Core conversions (Phase 2)
pdf2docx>=0.5.8              # PDF to Word
python-pptx>=0.6.23          # PDF to PowerPoint

# OCR (Phase 3)
pytesseract>=0.3.10          # OCR wrapper

# AI (Phase 4 — all optional)
openai>=1.0.0                # OpenAI API
anthropic>=0.30.0            # Anthropic API
httpx>=0.27.0                # Ollama local LLM
```

### System Dependencies
```
# Phase 2 (Office to PDF)
LibreOffice (headless mode)

# Phase 3
Tesseract OCR
Ghostscript
```

### Existing Dependencies (Already Satisfied)
```
PyMuPDF (fitz)               # Core engine
Pillow                       # Image processing
openpyxl                     # Excel export
FastAPI + Uvicorn            # Web framework
```

---

## Summary of Competitive Position

| Dimension | PDF Studio | SmallPDF | Winner |
|-----------|-----------|----------|--------|
| Editing Depth | Deep inline text/image manipulation | Basic add text/shapes | PDF Studio |
| Form Builder | 8 field types, full CRUD, JSON export | Basic fill and sign | PDF Studio |
| Redaction | True vector redaction + PII auto-scan | Not offered | PDF Studio |
| Security Audit | Full PDF/A, encryption, JS inspector | Not offered | PDF Studio |
| Table Extraction | ML-powered detection + CSV/Excel export | Not offered | PDF Studio |
| Document Comparison | Side-by-side visual diff | Not offered on free tier | PDF Studio |
| Privacy | 100% offline, zero cloud | Cloud-based, 1hr file retention | PDF Studio |
| Format Conversions | PDF to/from Images only | PDF to/from Word/Excel/PPT/Images | SmallPDF |
| eSign Workflow | Image insert only | Draw/type/upload + send for signing | SmallPDF |
| OCR | Not available | Pro feature | SmallPDF |
| AI Features | Not available | Chat, summarize, translate | SmallPDF |
| Mobile UX | Desktop-focused | Fully responsive + mobile app | SmallPDF |
| Batch Processing | Not available | Pro feature | SmallPDF |
| Cloud Integration | Not available | Google Drive, Dropbox, OneDrive | SmallPDF |

**Verdict:** PDF Studio is already stronger in core editing, security, and privacy. The gaps are primarily in format conversions, eSign workflow, OCR, and consumer UX polish. Implementing the Phase 1-2 items would close approximately 70% of the competitive gap.
