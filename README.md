# 📄 In-House Local PDF Studio & Editor (Commercial Edition)

A high-performance, 100% private, enterprise-grade PDF Editor built with **Python**, **PyMuPDF**, and **FastAPI**. It runs completely offline on your own machine, ensuring zero confidential data ever leaves your network.

---

## 🌟 Industry-Standard Feature Suite

### 1. 📝 AcroForms & Interactive Form Builder
- **Auto-Detect & Fill**: Interactive fillable fields (Text, Checkbox, Radio, Dropdown) with live browser UI synchronization.
- **Form Widget Designer**: Drag-and-drop or coordinate placement of new form fields.
- **Form Flattening**: One-click flattening of dynamic AcroForm fields into permanent, non-editable vector shapes.

### 2. 🛡️ True Vector Redaction & Document Sanitization
- **Cryptographic Character/Pixel Deletion**: Eliminates sensitive data permanently from PDF content streams (no superficial black boxes).
- **Custom Redaction Overlays**: Display compliance labels (e.g. `[REDACTED - PRIVACY]`, `[CONFIDENTIAL]`).
- **Comprehensive Document Sanitizer**: Strip metadata, unreferenced objects, hidden attachments, embedded URLs, and revision histories with highest garbage collection.

### 3. 📑 Document Bookmarks & Table of Contents (TOC)
- **Interactive Outline Tree**: View, navigate, and jump across document chapters.
- **Hierarchical Outline Builder**: Add, rename, indent/outdent, re-order, and delete multi-level bookmark structures.

### 4. ✍️ Freehand Ink, Stamps & Sticky Notes
- **Natural Pen / Pencil Drawing**: Multi-color, adjustable width vector ink annotations.
- **Vector Stamp Badges**: Certified vector stamps (`APPROVED`, `CONFIDENTIAL`, `DRAFT`, `FINAL`, `REJECTED`) with double-bordered radius styling.
- **Interactive Sticky Notes**: Threaded comments and annotations attached to specific page coordinates with author tags.

### 5. 🖼️ Image & Signature Stamping
- Stamp external signatures, corporate logos, or PNG/JPEG images onto any page with aspect-ratio preservation.

### 6. 📄 Advanced Page Manipulation
- **Insert Blank Page**: Add blank pages at arbitrary positions with custom dimensions (A4, Letter, Custom).
- **Duplicate Pages**: Clone individual pages in place with full vector elements.
- **Page Margin Cropping**: Adjust and crop page boundaries.
- **Visual Thumbnail Organizer**: Reorder, rotate 90°/180°/270°, and delete pages via thumbnail actions.

### 7. 🔒 Compliance, Security & Metadata Inspector
- **PDF/A & Standards Audit**: Real-time detection of PDF/A conformance, PDF specification version, embedded JavaScript actions, and encryption state.
- **Granular Permissions & AES-256**: Protect documents with 256-bit AES encryption and granular flags (printing, modifying, copy/paste, annotations).
- **Metadata Editor**: View and update Document Title, Author, Subject, Keywords, Creator, and Producer.

### 8. ✏️ Native Text Editing & WYSIWYG Add Text
- **Click-to-Edit & Find/Replace**: Direct in-place editing of text blocks.
- **WYSIWYG Text Placement**: Rich text formatting, custom typography, font sizing, alignment, and background bounding highlights.

### 9. 📐 Shape Tools, Watermarks & Optimizations
- **Vector Shapes**: Rectangles, ellipses, arrows, lines, and translucent highlights.
- **Dynamic Watermarking**: Configurable opacity, rotation angles, font size, and color across custom page ranges.
- **Stream Compression**: Garbage-collection and stream deflating for dramatic file size reduction.

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10, 3.11, 3.12, 3.13, or 3.14
- Dependencies:
  ```bash
  pip install -r requirements.txt
  ```

### 2. Launching the App

#### On Windows:
Double-click:
```bash
run.bat
```

#### Via Command Line:
```bash
python run.py
```

The launcher will automatically open your default browser to:
👉 **http://localhost:8000**

---

## 📁 Project Architecture

```
pdf_editor/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI REST API endpoints & static routing
│   └── pdf_engine.py        # High-performance PyMuPDF manipulation engine
├── static/
│   ├── css/
│   │   └── style.css        # Clean, modern, responsive UI styling
│   └── js/
│       └── app.js           # Client-side state, canvas overlay, and API bridge
├── templates/
│   └── index.html           # Single-page interactive PDF studio
├── requirements.txt         # Package dependencies
├── run.py                   # Automated Python launcher with auto-browser launch
├── run.bat                  # Double-click Windows batch runner
└── README.md                # Documentation and architecture guide
```

---

## 🔒 Reliability & Privacy Guarantees

- **100% Offline**: Operates completely on localhost without an internet connection. Zero third-party telemetry, tracking, or cloud uploads.
- **C-Powered Engine**: Built on PyMuPDF (MuPDF C-library), delivering sub-second execution speeds even on large documents.
- **Non-Destructive & Versioned**: Full undo/redo version stack preserving document integrity across complex operations.
