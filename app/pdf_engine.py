"""
In-House PDF Editor - Core Engine
Powered by PyMuPDF (fitz)
Provides high-performance, 100% offline, local PDF manipulation.
"""

import io
import os
import zipfile
from typing import List, Dict, Any, Optional, Tuple, Union
import pymupdf as fitz
from PIL import Image

class PDFEngine:
    """Core PDF manipulation engine utilizing PyMuPDF."""


    @staticmethod
    def get_document_info(pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract metadata, page count, and page dimensions."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            pages_info = []
            is_enc = bool(doc.is_encrypted)
            if not is_enc:
                for i in range(len(doc)):
                    page = doc[i]
                    rect = page.rect
                    pages_info.append({
                        "page_number": i + 1,
                        "width": round(rect.width, 2),
                        "height": round(rect.height, 2),
                        "rotation": page.rotation
                    })
            
            metadata = doc.metadata or {}
            page_count = len(doc) if hasattr(doc, "__len__") else 0
            return {
                "page_count": page_count,
                "is_encrypted": is_enc,
                "pages": pages_info,
                "metadata": {
                    "title": metadata.get("title", ""),
                    "author": metadata.get("author", ""),
                    "subject": metadata.get("subject", ""),
                    "keywords": metadata.get("keywords", ""),
                    "creator": metadata.get("creator", ""),
                    "producer": metadata.get("producer", "")
                }
            }
        finally:
            doc.close()

    @staticmethod
    def search_text(pdf_bytes: bytes, query: str, page_num: int = 0) -> List[Dict[str, Any]]:
        """
        Search for text matches in the document.
        Returns list of {page: int, bbox: [x0, y0, x1, y1], query: str}
        """
        if not query or not query.strip():
            return []
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        results = []
        try:
            pages_to_search = [page_num - 1] if (1 <= page_num <= len(doc)) else range(len(doc))
            for pno in pages_to_search:
                page = doc[pno]
                quads = page.search_for(query.strip())
                for q in quads:
                    rect = q.rect if hasattr(q, "rect") else fitz.Rect(q)
                    results.append({
                        "page": pno + 1,
                        "bbox": [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)],
                        "query": query.strip()
                    })
            return results
        finally:
            doc.close()

    @staticmethod
    def add_page_numbers(
        pdf_bytes: bytes,
        position: str = "bottom-center",
        format_str: str = "Page {n} of {total}",
        start_page: int = 1,
        font_size: float = 10.0,
        font_name: str = "helv",
        color: Optional[List[float]] = None,
        margin: float = 36.0
    ) -> bytes:
        """
        Add page numbering to the PDF document.
        Positions: bottom-left, bottom-center, bottom-right, top-left, top-center, top-right
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        color = color or [0.2, 0.2, 0.2]
        if any(c > 1.0 for c in color):
            color = [c / 255.0 for c in color]
        fn = PDFEngine._normalize_font_name(font_name)
        
        try:
            total = len(doc)
            for idx in range(total):
                page_number = idx + 1
                if page_number < start_page:
                    continue
                page = doc[idx]
                text = (format_str or "Page {n} of {total}") \
                    .replace("{n}", str(page_number)) \
                    .replace("{total}", str(total))
                
                p_w = page.rect.width
                p_h = page.rect.height
                
                text_len = fitz.get_text_length(text, fontname=fn, fontsize=font_size)
                
                if position == "bottom-center":
                    x = (p_w - text_len) / 2
                    y = p_h - margin
                elif position == "bottom-right":
                    x = p_w - margin - text_len
                    y = p_h - margin
                elif position == "bottom-left":
                    x = margin
                    y = p_h - margin
                elif position == "top-center":
                    x = (p_w - text_len) / 2
                    y = margin + font_size
                elif position == "top-right":
                    x = p_w - margin - text_len
                    y = margin + font_size
                elif position == "top-left":
                    x = margin
                    y = margin + font_size
                else:
                    x = (p_w - text_len) / 2
                    y = p_h - margin
                    
                page.insert_text(fitz.Point(x, y), text, fontsize=font_size, fontname=fn, color=color)
                
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def get_page_bundle(pdf_bytes: bytes, page_number: int, zoom: float = 1.5) -> Dict[str, Any]:
        """
        High-performance unified page extractor.
        Renders image, extracts text blocks, annotations, and page images in a single PyMuPDF document pass.
        """
        import base64
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_number <= len(doc)):
                raise ValueError(f"Page number {page_number} is out of range (1..{len(doc)})")
            page_idx = page_number - 1
            page = doc[page_idx]
            
            # 1. Page dimensions
            rect = page.rect
            width_pt = round(rect.width, 2)
            height_pt = round(rect.height, 2)
            
            # 2. Render image to high-efficiency data URL (JPEG 86% for lightweight payload and instant cloud transfer)
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img_bytes = pix.tobytes("jpeg", jpg_quality=86)
            img_b64 = base64.b64encode(img_bytes).decode("ascii")
            image_data_url = f"data:image/jpeg;base64,{img_b64}"
            
            # 3. Extract text blocks (using the cohesive clustering engine)
            text_dict = page.get_text("dict")
            blocks_result = []
            block_counter = 0

            for b in text_dict.get("blocks", []):
                if b.get("type") == 0:  # text block
                    lines = b.get("lines", [])
                    if not lines:
                        continue
                    
                    valid_lines = []
                    for line in lines:
                        spans = line.get("spans", [])
                        if not spans:
                            continue
                        line_text = "".join(s.get("text", "") for s in spans).strip()
                        if line_text:
                            valid_lines.append({
                                "bbox": [round(c, 2) for c in line.get("bbox", [0, 0, 0, 0])],
                                "text": line_text,
                                "spans": spans
                            })
                    
                    if not valid_lines:
                        continue
                    
                    # Sort lines top-to-bottom, left-to-right for linear sweep clustering
                    valid_lines.sort(key=lambda l: (round(l["bbox"][1], 1), round(l["bbox"][0], 1)))
                    
                    clusters = []
                    current_cluster = [valid_lines[0]]
                    
                    for next_line in valid_lines[1:]:
                        prev_line = current_cluster[-1]
                        prev_y0, prev_y1 = prev_line["bbox"][1], prev_line["bbox"][3]
                        next_y0, next_y1 = next_line["bbox"][1], next_line["bbox"][3]
                        prev_h = max(4.0, prev_y1 - prev_y0)
                        next_h = max(4.0, next_y1 - next_y0)
                        avg_h = (prev_h + next_h) / 2.0
                        
                        has_y_overlap = False
                        for existing in current_cluster:
                            e_y0, e_y1 = existing["bbox"][1], existing["bbox"][3]
                            overlap = max(0.0, min(e_y1, next_y1) - max(e_y0, next_y0))
                            if overlap > 0.35 * min(e_y1 - e_y0, next_y1 - next_y0):
                                has_y_overlap = True
                                break
                        
                        dy = next_y0 - prev_y1
                        is_nearby = dy < (avg_h * 1.6)
                        
                        if is_nearby and not has_y_overlap:
                            current_cluster.append(next_line)
                        else:
                            clusters.append(current_cluster)
                            current_cluster = [next_line]
                    
                    if current_cluster:
                        clusters.append(current_cluster)
                    
                    for cluster in clusters:
                        all_x0 = min(l["bbox"][0] for l in cluster)
                        all_y0 = min(l["bbox"][1] for l in cluster)
                        all_x1 = max(l["bbox"][2] for l in cluster)
                        all_y1 = max(l["bbox"][3] for l in cluster)
                        
                        cluster_text = "\n".join(l["text"] for l in cluster)
                        
                        font_sizes = []
                        font_names = []
                        font_colors = []
                        is_bold = False
                        is_italic = False
                        
                        for l in cluster:
                            for s in l["spans"]:
                                font_sizes.append(s.get("size", 11.0))
                                font_names.append(s.get("font", "Helvetica"))
                                col = s.get("color", 0)
                                if isinstance(col, int):
                                    r = ((col >> 16) & 255) / 255.0
                                    g = ((col >> 8) & 255) / 255.0
                                    bl = (col & 255) / 255.0
                                    font_colors.append([round(r, 3), round(g, 3), round(bl, 3)])
                                elif isinstance(col, (list, tuple)):
                                    font_colors.append([round(c, 3) for c in col])
                                
                                flags = s.get("flags", 0)
                                if flags & 2 or "bold" in s.get("font", "").lower():
                                    is_bold = True
                                if flags & 1 or "italic" in s.get("font", "").lower() or "oblique" in s.get("font", "").lower():
                                    is_italic = True

                        avg_font_size = sum(font_sizes) / len(font_sizes) if font_sizes else 11.0
                        primary_font = max(set(font_names), key=font_names.count) if font_names else "Helvetica"
                        primary_color = font_colors[0] if font_colors else [0.0, 0.0, 0.0]

                        blocks_result.append({
                            "id": f"block_{page_number}_{block_counter}",
                            "bbox": [round(all_x0, 2), round(all_y0, 2), round(all_x1, 2), round(all_y1, 2)],
                            "text": cluster_text,
                            "font_name": primary_font,
                            "font_size": round(avg_font_size, 1),
                            "color": primary_color,
                            "is_bold": is_bold,
                            "is_italic": is_italic,
                            "lines": cluster
                        })
                        block_counter += 1

            # 4. Extract annotations
            annots_list = []
            for idx, a in enumerate(page.annots()):
                type_name = a.type[1] if isinstance(a.type, (list, tuple)) else str(a.type)
                info = a.info or {}
                author_val = info.get("title", "") or info.get("author", "")
                annots_list.append({
                    "index": idx,
                    "id": info.get("id", f"annot_{page_number}_{idx}"),
                    "type": type_name,
                    "type_id": a.type[0] if isinstance(a.type, (list, tuple)) else 0,
                    "rect": [round(c, 2) for c in a.rect],
                    "content": info.get("content", ""),
                    "title": info.get("title", ""),
                    "author": author_val,
                    "name": info.get("name", "")
                })

            # 5. Extract images
            images_list = []
            seen_bboxes = set()
            img_list = page.get_images(full=True)
            smask_xrefs = {item[1] for item in img_list if len(item) > 1 and item[1] > 0}

            for item in img_list:
                xref = item[0]
                smask = item[1] if len(item) > 1 else 0
                orig_w = item[2]
                orig_h = item[3]
                if xref in smask_xrefs or (orig_w <= 1 and orig_h <= 1):
                    continue

                detected_opacity = PDFEngine._extract_image_opacity(doc, xref, smask)

                rects = page.get_image_rects(xref)
                for r in rects:
                    bbox_tuple = (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))
                    if bbox_tuple in seen_bboxes:
                        continue
                    seen_bboxes.add(bbox_tuple)
                    images_list.append({
                        "xref": xref,
                        "bbox": [round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2)],
                        "width": round(r.width, 2),
                        "height": round(r.height, 2),
                        "orig_width": orig_w,
                        "orig_height": orig_h,
                        "opacity": detected_opacity
                    })

            return {
                "page_number": page_number,
                "width": width_pt,
                "height": height_pt,
                "rotation": page.rotation,
                "image_data_url": image_data_url,
                "text_blocks": blocks_result,
                "annotations": annots_list,
                "images": images_list
            }
        finally:
            doc.close()

    @staticmethod
    def render_page_image(pdf_bytes: bytes, page_number: int, zoom: float = 1.5, format: str = "png") -> bytes:
        """Render a single page to image bytes (PNG, JPEG, or WebP)."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_number <= len(doc)):
                raise ValueError(f"Page number {page_number} is out of range (1..{len(doc)})")
            page_idx = page_number - 1
            page = doc[page_idx]
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            norm_fmt = (format or "png").lower().strip()
            if norm_fmt in ("jpeg", "jpg"):
                return pix.tobytes("jpeg", jpg_quality=85)
            elif norm_fmt == "webp":
                return pix.tobytes("webp", webp_quality=88)
            else:
                return pix.tobytes("png")
        finally:
            doc.close()

    @staticmethod
    def get_page_text_blocks(pdf_bytes: bytes, page_number: int) -> List[Dict[str, Any]]:
        """
        Extract existing text blocks and lines with exact coordinates, font sizes, colors, and styling.
        Extracts at the cohesive block level, while cleanly isolating colliding / overlapping text blocks
        into their respective independent elements.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_number - 1, len(doc) - 1))
            page = doc[page_idx]
            
            text_dict = page.get_text("dict")
                
            blocks_result = []
            block_counter = 0

            for b in text_dict.get("blocks", []):
                if b.get("type") == 0:  # 0 is text block
                    lines = b.get("lines", [])
                    if not lines:
                        continue
                    
                    valid_lines = []
                    for line in lines:
                        spans = line.get("spans", [])
                        if not spans:
                            continue
                        line_text = "".join(s.get("text", "") for s in spans).strip()
                        if line_text:
                            valid_lines.append({
                                "bbox": [round(c, 2) for c in line.get("bbox", [0, 0, 0, 0])],
                                "text": line_text,
                                "spans": spans
                            })
                    
                    if not valid_lines:
                        continue
                    
                    # Sort lines top-to-bottom, left-to-right for linear sweep clustering
                    valid_lines.sort(key=lambda l: (round(l["bbox"][1], 1), round(l["bbox"][0], 1)))
                    
                    # Segment lines into cohesive clusters to isolate collisions & distinct text boxes
                    clusters = []
                    current_cluster = [valid_lines[0]]
                    
                    for next_line in valid_lines[1:]:
                        prev_line = current_cluster[-1]
                        prev_y0, prev_y1 = prev_line["bbox"][1], prev_line["bbox"][3]
                        next_y0, next_y1 = next_line["bbox"][1], next_line["bbox"][3]
                        prev_h = max(4.0, prev_y1 - prev_y0)
                        next_h = max(4.0, next_y1 - next_y0)
                        avg_h = (prev_h + next_h) / 2.0
                        
                        # Check for vertical overlap / collision with any existing line in current_cluster:
                        has_y_overlap = False
                        for existing in current_cluster:
                            e_y0, e_y1 = existing["bbox"][1], existing["bbox"][3]
                            overlap = max(0.0, min(e_y1, next_y1) - max(e_y0, next_y0))
                            if overlap > 0.35 * min(e_y1 - e_y0, next_y1 - next_y0):
                                has_y_overlap = True
                                break
                        
                        # Check if next_line starts above previous line
                        is_backwards = next_y0 < (prev_y0 - 2.0)
                        
                        # Check font size difference (> 1.8pt)
                        prev_sz = prev_line["spans"][0].get("size", 11.0) if prev_line["spans"] else 11.0
                        next_sz = next_line["spans"][0].get("size", 11.0) if next_line["spans"] else 11.0
                        is_diff_size = abs(prev_sz - next_sz) > 1.8
                        
                        # Check bold / style difference
                        prev_bold = any(s.get("flags", 0) & 16 or "bold" in s.get("font", "").lower() for s in prev_line["spans"])
                        next_bold = any(s.get("flags", 0) & 16 or "bold" in s.get("font", "").lower() for s in next_line["spans"])
                        is_diff_weight = prev_bold != next_bold
                        
                        # Check if vertical gap indicates a separate section / block (> 1.8 * line height)
                        vertical_gap = next_y0 - prev_y1
                        is_large_gap = vertical_gap > 1.8 * avg_h
                        
                        if has_y_overlap or is_backwards or is_diff_size or is_diff_weight:
                            clusters.append(current_cluster)
                            current_cluster = [next_line]
                        else:
                            current_cluster.append(next_line)
                            
                    if current_cluster:
                        clusters.append(current_cluster)
                    
                    for group in clusters:
                        all_spans = []
                        for l in group:
                            all_spans.extend(l["spans"])
                            
                        full_block_text = "\n".join(l["text"] for l in group)
                        min_x0 = min(l["bbox"][0] for l in group)
                        min_y0 = min(l["bbox"][1] for l in group)
                        max_x1 = max(l["bbox"][2] for l in group)
                        max_y1 = max(l["bbox"][3] for l in group)
                        block_bbox = [round(min_x0, 2), round(min_y0, 2), round(max_x1, 2), round(max_y1, 2)]

                        font_sizes = [s.get("size", 11.0) for s in all_spans]
                        font_names = [s.get("font", "helv") for s in all_spans]
                        colors = [s.get("color", 0) for s in all_spans]
                        flags_list = [s.get("flags", 0) for s in all_spans]

                        primary_size = font_sizes[0] if font_sizes else 11.0
                        primary_font = font_names[0] if font_names else "helv"
                        primary_color_int = colors[0] if colors else 0

                        # Convert sRGB integer to RGB 0..1 and hex color
                        r = ((primary_color_int >> 16) & 255) / 255.0
                        g = ((primary_color_int >> 8) & 255) / 255.0
                        b_c = (primary_color_int & 255) / 255.0
                        hex_color = f"#{int(r * 255):02x}{int(g * 255):02x}{int(b_c * 255):02x}"

                        is_bold = any(f & 16 or "bold" in fn.lower() or "black" in fn.lower() for f, fn in zip(flags_list, font_names))
                        is_italic = any(f & 2 or "italic" in fn.lower() or "oblique" in fn.lower() for f, fn in zip(flags_list, font_names))
                        norm_font = PDFEngine._normalize_font_name(primary_font, is_bold=is_bold, is_italic=is_italic)

                        blocks_result.append({
                            "id": f"block_{page_number}_{block_counter}",
                            "page": page_number,
                            "bbox": block_bbox,
                            "text": full_block_text,
                            "avg_font_size": round(primary_size, 1),
                            "font_size": round(primary_size, 1),
                            "font_name": norm_font,
                            "raw_font": primary_font,
                            "is_bold": is_bold,
                            "is_italic": is_italic,
                            "color": [round(r, 3), round(g, 3), round(b_c, 3)],
                            "hex_color": hex_color,
                            "lines": [{"bbox": l["bbox"], "text": l["text"], "spans": l["spans"]} for l in group]
                        })
                        block_counter += 1

            return blocks_result
        finally:
            doc.close()

    @staticmethod
    def _normalize_font_name(font_name: str, is_bold: bool = False, is_italic: bool = False) -> str:
        """Map generic / css font names and style flags to PyMuPDF standard 14 font identifiers."""
        if not font_name:
            base = "helv"
        else:
            fn = font_name.lower().strip()
            if "bold" in fn or "-bo" in fn or "black" in fn or "heavy" in fn or fn == "b" or fn in ["hebo", "tibo", "cobo"]:
                is_bold = True
            if "italic" in fn or "oblique" in fn or "-it" in fn or fn == "i" or fn in ["heit", "tiit", "coit"]:
                is_italic = True
            
            if "time" in fn or "roman" in fn or "serif" in fn or "tiro" in fn:
                base = "times"
            elif "courier" in fn or "mono" in fn or "typewriter" in fn or "cour" in fn:
                base = "couri"
            elif "symbol" in fn:
                return "symbol"
            elif "zapf" in fn:
                return "zapf"
            else:
                base = "helv"
            
        if base == "helv":
            if is_bold and is_italic:
                return "hebi"
            elif is_bold:
                return "hebo"
            elif is_italic:
                return "heit"
            return "helv"
        elif base in ["times", "tiro"]:
            if is_bold and is_italic:
                return "tibi"
            elif is_bold:
                return "tibo"
            elif is_italic:
                return "tiit"
            return "tiro"
        elif base in ["couri", "cour"]:
            if is_bold and is_italic:
                return "cobi"
            elif is_bold:
                return "cobo"
            elif is_italic:
                return "coit"
            return "cour"
        return "helv"

    @staticmethod
    def edit_text(
        pdf_bytes: bytes,
        edits: List[Dict[str, Any]]
    ) -> bytes:
        """
        Edit / Replace / Relocate existing text in the PDF with tight bounding box preservation.
        Supports:
        - Exact bounding box replacement (redact old line/block & insert new text at same or new position)
        - Search & replace across document or specific page
        - Custom font family, font size, bold/italic style, alignment, text color, and background fill
        - Real-time repositioning with `new_bbox`
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for edit in edits:
                page_num = edit.get("page", 0)  # 0 means all pages
                search_text = edit.get("search_text", "").strip()
                new_text = edit.get("new_text", "")
                bbox = edit.get("bbox")  # [x0, y0, x1, y1]
                new_bbox = edit.get("new_bbox")  # optional relocated [x0, y0, x1, y1]
                font_size = edit.get("font_size")
                is_bold = edit.get("is_bold", False)
                is_italic = edit.get("is_italic", False)
                font_name = PDFEngine._normalize_font_name(edit.get("font_name", "helv"), is_bold=is_bold, is_italic=is_italic)
                text_color = edit.get("text_color", [0, 0, 0])  # RGB 0..1 or 0..255
                bg_color = edit.get("bg_color", None)          # None by default so no opaque box is drawn
                align = edit.get("align", 0)

                # Normalize colors to 0..1 range
                if text_color and any(c > 1.0 for c in text_color):
                    text_color = [c / 255.0 for c in text_color]
                if bg_color and any(c > 1.0 for c in bg_color):
                    bg_color = [c / 255.0 for c in bg_color]

                # Determine target pages
                if 1 <= page_num <= len(doc):
                    target_pages = [doc[page_num - 1]]
                else:
                    target_pages = list(doc)

                for page in target_pages:
                    # Extract existing text blocks on this page to protect any overlapping neighbors
                    try:
                        existing_page_blocks = PDFEngine.get_page_text_blocks(pdf_bytes, page.number + 1)
                    except Exception:
                        existing_page_blocks = []

                    # List of tuples: (redact_rect, target_insert_rect, calculated_font_size)
                    replacements: List[Tuple[fitz.Rect, fitz.Rect, float]] = []

                    # Mode A: Exact Bounding Box replacement
                    if bbox and len(bbox) == 4:
                        redact_rect = fitz.Rect(bbox)
                        target_rect = fitz.Rect(new_bbox) if (new_bbox and len(new_bbox) == 4) else redact_rect
                        calc_size = font_size if font_size else max(8.0, target_rect.height * 0.8)
                        replacements.append((redact_rect, target_rect, calc_size))

                    # Mode B: Search string replacement
                    elif search_text:
                        quads = page.search_for(search_text)
                        for q in quads:
                            redact_rect = q.rect if hasattr(q, "rect") else fitz.Rect(q)
                            target_rect = fitz.Rect(new_bbox) if (new_bbox and len(new_bbox) == 4) else redact_rect
                            calc_size = font_size if font_size else max(8.0, target_rect.height * 0.8)
                            replacements.append((redact_rect, target_rect, calc_size))

                    # Identify any distinct neighbor text blocks on this page that physically overlap our redaction areas
                    # Protects collided / overlapping blocks from accidental letter erasure during both move and in-place edit
                    lines_data = edit.get("lines")
                    overlapping_neighbors: List[Dict[str, Any]] = []
                    if bbox or lines_data or new_bbox:
                        redact_regions = []
                        if lines_data and isinstance(lines_data, list) and len(lines_data) > 0:
                            for l in lines_data:
                                if "bbox" in l and len(l["bbox"]) == 4:
                                    redact_regions.append(fitz.Rect(l["bbox"]))
                        if not redact_regions:
                            for r_rect, _, _ in replacements:
                                redact_regions.append(fitz.Rect(r_rect))

                        for r_rect in redact_regions:
                            for b in existing_page_blocks:
                                b_rect = fitz.Rect(b["bbox"])
                                # If b is the exact block being edited, skip it
                                if max(abs(b["bbox"][i] - r_rect[i]) for i in range(4)) <= 3.5:
                                    continue
                                if bbox and len(bbox) == 4 and max(abs(b["bbox"][i] - bbox[i]) for i in range(4)) <= 3.5:
                                    continue
                                if search_text and search_text in b.get("text", ""):
                                    continue
                                
                                # Require real substantial geometric overlap (>= 15% area) to consider it a true collision
                                inter = r_rect & b_rect
                                if not inter.is_empty:
                                    min_area = min(r_rect.get_area(), b_rect.get_area())
                                    if min_area > 0 and (inter.get_area() / min_area) >= 0.15:
                                        if b not in overlapping_neighbors:
                                            overlapping_neighbors.append(b)

                    # 1. Cleanly remove old text without leaving opaque redaction rectangles or wiping line art/images
                    fill_c = bg_color if bg_color else None
                    if lines_data and isinstance(lines_data, list) and len(lines_data) > 0:
                        for l in lines_data:
                            if "bbox" in l and len(l["bbox"]) == 4:
                                lb = l["bbox"]
                                page.add_redact_annot(fitz.Rect(lb[0] - 1.0, lb[1] - 1.0, lb[2] + 1.5, lb[3] + 1.5), fill=fill_c)
                    else:
                        for redact_rect, _, _ in replacements:
                            page.add_redact_annot(fitz.Rect(redact_rect.x0 - 1.0, redact_rect.y0 - 1.0, redact_rect.x1 + 1.5, redact_rect.y1 + 1.5), fill=fill_c)

                    # Also redact overlapping neighbors with padding so no sliced letter residues remain
                    for n in overlapping_neighbors:
                        nb = n["bbox"]
                        page.add_redact_annot(fitz.Rect(nb[0] - 1.0, nb[1] - 1.0, nb[2] + 1.5, nb[3] + 1.5), fill=None)
                    
                    if replacements or lines_data or overlapping_neighbors:
                        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)

                        # 2. Re-insert preserved overlapping neighbors cleanly at their original bboxes
                        for n in overlapping_neighbors:
                            n_text = n.get("text", "")
                            if not n_text:
                                continue
                            n_lines = n.get("lines") or []
                            n_sz = n.get("font_size") or n.get("avg_font_size") or 11.0
                            n_font = PDFEngine._normalize_font_name(n.get("font_name", "helv"), is_bold=n.get("is_bold", False), is_italic=n.get("is_italic", False))
                            n_col = n.get("color", [0, 0, 0])
                            
                            if n_lines and len(n_lines) > 0:
                                for l in n_lines:
                                    if "spans" in l and l["spans"]:
                                        for s in l["spans"]:
                                            if "origin" in s:
                                                point = fitz.Point(s["origin"])
                                                sz = s.get("size", 11.0)
                                                f_name = s.get("font", "helv")
                                                c_val = s.get("color", 0)
                                                flags = s.get("flags", 0)
                                                
                                                r = ((c_val >> 16) & 255) / 255.0
                                                g = ((c_val >> 8) & 255) / 255.0
                                                bl = (c_val & 255) / 255.0
                                                
                                                is_bold = bool(flags & 16 or "bold" in f_name.lower() or "black" in f_name.lower())
                                                is_italic = bool(flags & 2 or "italic" in f_name.lower() or "oblique" in f_name.lower())
                                                n_font_norm = PDFEngine._normalize_font_name(f_name, is_bold=is_bold, is_italic=is_italic)
                                                
                                                page.insert_text(point, s.get("text", ""), fontsize=sz, fontname=n_font_norm, color=[r, g, bl])
                                    else:
                                        lb = l.get("bbox")
                                        lt = l.get("text", "")
                                        if lb and lt:
                                            point = fitz.Point(lb[0], lb[1] + (lb[3] - lb[1]) * 0.82)
                                            page.insert_text(point, lt, fontsize=n_sz, fontname=n_font, color=n_col)
                            else:
                                n_bbox = fitz.Rect(n["bbox"])
                                page.insert_textbox(n_bbox, n_text, fontsize=n_sz, fontname=n_font, color=n_col)

                        # 3. Insert replacement text with reliable baseline / textbox rendering and guaranteed zero truncation
                        for _, target_rect, sz in replacements:
                            if not new_text:
                                continue  # Pure redaction/deletion

                            lines_list = new_text.splitlines() or [new_text]
                            if len(lines_list) > 1 or len(new_text) > 40:
                                req_h = max(target_rect.height, sz * 1.35 * len(lines_list) + 8)
                                req_w = max(target_rect.width + 30, target_rect.width * 1.15 + 10)
                                render_rect = fitz.Rect(target_rect.x0, target_rect.y0, target_rect.x0 + req_w, target_rect.y0 + req_h)
                                rc = page.insert_textbox(
                                    render_rect,
                                    new_text,
                                    fontsize=sz,
                                    fontname=font_name,
                                    color=text_color,
                                    align=align
                                )
                                if rc < 0:
                                    # Auto-expand to fit complete text without truncation
                                    render_rect = fitz.Rect(render_rect.x0, render_rect.y0, render_rect.x1, render_rect.y1 + abs(rc) + 12)
                                    page.insert_textbox(
                                        render_rect,
                                        new_text,
                                        fontsize=sz,
                                        fontname=font_name,
                                        color=text_color,
                                        align=align
                                    )
                            else:
                                line = lines_list[0]
                                if align == 1:  # Center
                                    try:
                                        text_w = fitz.get_text_length(line, fontname=font_name, fontsize=sz)
                                    except Exception:
                                        text_w = len(line) * sz * 0.55
                                    line_x = target_rect.x0 + max(0.0, (target_rect.width - text_w) / 2.0)
                                elif align == 2:  # Right
                                    try:
                                        text_w = fitz.get_text_length(line, fontname=font_name, fontsize=sz)
                                    except Exception:
                                        text_w = len(line) * sz * 0.55
                                    line_x = max(target_rect.x0, target_rect.x1 - text_w)
                                else:  # Left
                                    line_x = target_rect.x0

                                baseline_y = target_rect.y0 + sz * 0.85
                                point = fitz.Point(line_x, baseline_y)
                                page.insert_text(
                                    point,
                                    line,
                                    fontsize=sz,
                                    fontname=font_name,
                                    color=text_color
                                )

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # Alias for backward compatibility
    edit_existing_text = edit_text

    @staticmethod
    def move_text_block(
        pdf_bytes: bytes,
        page_num: int,
        old_bbox: List[float],
        new_bbox: List[float],
        text: str,
        font_size: Optional[float] = None,
        font_name: str = "helv",
        color: Optional[List[float]] = None,
        bg_color: Optional[List[float]] = None
    ) -> bytes:
        """
        Move a text block on the page by redacting its old location and rendering it at the new bounding box.
        """
        return PDFEngine.edit_text(
            pdf_bytes=pdf_bytes,
            edits=[{
                "page": page_num,
                "bbox": old_bbox,
                "new_bbox": new_bbox,
                "new_text": text,
                "font_size": font_size,
                "font_name": font_name,
                "text_color": color,
                "bg_color": bg_color
            }]
        )

    @staticmethod
    def _extract_image_opacity(doc: fitz.Document, xref: int, smask_xref: int = 0) -> float:
        """Detect the effective opacity/transparency level of an image on a PDF page."""
        try:
            target_smask = smask_xref
            if target_smask <= 0:
                img_info = doc.extract_image(xref)
                target_smask = img_info.get("smask", 0)
            
            if target_smask > 0:
                smask_dict = doc.extract_image(target_smask)
                if smask_dict and "image" in smask_dict:
                    smask_img = Image.open(io.BytesIO(smask_dict["image"]))
                    extrema = smask_img.getextrema()
                    max_a = extrema[1] if isinstance(extrema, tuple) else extrema
                    if max_a is not None and max_a > 0:
                        return round(max_a / 255.0, 2)
            return 1.0
        except Exception:
            return 1.0

    @staticmethod
    def extract_image_bytes(doc: fitz.Document, xref: int, normalize_alpha: bool = True) -> Tuple[bytes, str]:
        """Extract and normalize image bytes with soft mask preservation for crisp web preview and re-editing."""
        try:
            img_info = doc.extract_image(xref)
            smask = img_info.get("smask", 0)
            
            if smask > 0:
                pix = fitz.Pixmap(doc, xref)
                smask_pix = fitz.Pixmap(doc, smask)
                
                if pix.colorspace and pix.colorspace.n not in (1, 3):
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                if smask_pix.colorspace and smask_pix.colorspace.n != 1:
                    smask_pix = fitz.Pixmap(fitz.csGRAY, smask_pix)
                if pix.colorspace and pix.colorspace.n != 3:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                    
                combined = fitz.Pixmap(pix, smask_pix)
                img = Image.open(io.BytesIO(combined.tobytes("png")))
                
                if normalize_alpha and img.mode == "RGBA":
                    r, g, b, a = img.split()
                    max_a = max(a.getdata()) if a else 255
                    if 0 < max_a < 255:
                        scale = 255.0 / max_a
                        a = a.point(lambda p: int(min(255, round(p * scale))))
                        img = Image.merge("RGBA", (r, g, b, a))
                
                out = io.BytesIO()
                img.save(out, format="PNG")
                return out.getvalue(), "image/png"
            else:
                img_bytes = img_info["image"]
                ext = img_info.get("ext", "png")
                media_type = f"image/{ext}" if ext in ("png", "jpeg", "webp") else "image/png"
                return img_bytes, media_type
        except Exception:
            img_dict = doc.extract_image(xref)
            return img_dict["image"], "image/png"

    @staticmethod
    def get_page_images_info(pdf_bytes: bytes, page_num: int) -> List[Dict[str, Any]]:
        """Extract bounding boxes and metadata of all images on a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        images_info = []
        seen_bboxes = set()
        try:
            if not (1 <= page_num <= len(doc)):
                return []
            page = doc[page_num - 1]
            img_list = page.get_images(full=True)
            # Filter soft mask xrefs to prevent transparent images from duplicating
            smask_xrefs = {item[1] for item in img_list if len(item) > 1 and item[1] > 0}

            for item in img_list:
                xref = item[0]
                smask = item[1] if len(item) > 1 else 0
                orig_w = item[2]
                orig_h = item[3]
                if xref in smask_xrefs or (orig_w <= 1 and orig_h <= 1):
                    continue

                detected_opacity = PDFEngine._extract_image_opacity(doc, xref, smask)

                rects = page.get_image_rects(xref)
                for r in rects:
                    bbox_tuple = (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))
                    if bbox_tuple in seen_bboxes:
                        continue
                    seen_bboxes.add(bbox_tuple)
                    images_info.append({
                        "xref": xref,
                        "bbox": [round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2)],
                        "width": round(r.width, 2),
                        "height": round(r.height, 2),
                        "orig_width": orig_w,
                        "orig_height": orig_h,
                        "opacity": detected_opacity
                    })
            return images_info
        finally:
            doc.close()

    @staticmethod
    def delete_image_by_bbox(pdf_bytes: bytes, page_num: int, bbox: Optional[List[float]] = None, xref: Optional[int] = None) -> bytes:
        """Permanently remove an image using native PDF object deletion (zero redactions)."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]
            
            target_xref = xref
            if target_xref is None and bbox:
                target_rect = fitz.Rect(bbox)
                for item in page.get_images(full=True):
                    x = item[0]
                    for r in page.get_image_rects(x):
                        if abs(r.x0 - target_rect.x0) < 10 and abs(r.y0 - target_rect.y0) < 10:
                            target_xref = x
                            break
                    if target_xref is not None:
                        break

            if target_xref is not None and hasattr(page, "delete_image"):
                page.delete_image(target_xref)
            elif bbox and len(bbox) == 4:
                target_rect = fitz.Rect(bbox)
                for item in page.get_images(full=True):
                    x = item[0]
                    for r in page.get_image_rects(x):
                        if r.intersects(target_rect):
                            page.delete_image(x)
                            break

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def _prepare_image_bytes(
        image_bytes: bytes,
        opacity: float = 1.0,
        rotation: int = 0,
        flip_h: bool = False,
        flip_v: bool = False
    ) -> bytes:
        """Process, normalize format, and apply rotation/opacity/flip transformations to image bytes."""
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            
            if flip_h:
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            if flip_v:
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            if rotation in (90, 180, 270):
                img = img.rotate(-rotation, expand=True)
            elif rotation != 0:
                img = img.rotate(-rotation, expand=True, resample=Image.BICUBIC)

            # Check and normalize baseline alpha range if previously attenuated
            r, g, b, a = img.split()
            max_a = max(a.getdata()) if a else 255
            if 0 < max_a < 255:
                scale = 255.0 / max_a
                a = a.point(lambda p: int(min(255, round(p * scale))))

            if opacity < 0.999:
                op = max(0.0, min(1.0, float(opacity)))
                a = a.point(lambda p: int(round(p * op)))

            img = Image.merge("RGBA", (r, g, b, a))

            out = io.BytesIO()
            img.save(out, format="PNG")
            return out.getvalue()
        except Exception:
            return image_bytes

    @staticmethod
    def move_image_on_page(
        pdf_bytes: bytes,
        page_num: int,
        old_bbox: List[float],
        new_bbox: List[float],
        xref: Optional[int] = None,
        opacity: float = 1.0,
        rotation: int = 0,
        flip_h: bool = False,
        flip_v: bool = False,
        new_image_bytes: Optional[bytes] = None
    ) -> bytes:
        """
        Move, resize, rotate, adjust opacity, or replace an existing image on a page using native image stream operations (zero redactions).
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]

            target_xref = xref
            if target_xref is None and old_bbox:
                target_rect = fitz.Rect(old_bbox)
                for item in page.get_images(full=True):
                    x = item[0]
                    rects = page.get_image_rects(x)
                    for r in rects:
                        if abs(r.x0 - target_rect.x0) < 10 and abs(r.y0 - target_rect.y0) < 10:
                            target_xref = x
                            break
                    if target_xref is not None:
                        break

            if target_xref is None and not old_bbox:
                raise ValueError("Could not find image to move")

            if new_image_bytes:
                img_bytes = new_image_bytes
            elif target_xref is not None:
                img_bytes, _ = PDFEngine.extract_image_bytes(doc, target_xref, normalize_alpha=True)
            else:
                raise ValueError("Could not extract image bytes")

            processed_img_bytes = PDFEngine._prepare_image_bytes(
                img_bytes, opacity=opacity, rotation=rotation, flip_h=flip_h, flip_v=flip_v
            )

            # 1. Cleanly remove old image instance using native image deletion (zero redactions)
            if target_xref is not None and hasattr(page, "delete_image"):
                page.delete_image(target_xref)
            elif old_bbox and len(old_bbox) == 4:
                target_rect = fitz.Rect(old_bbox)
                for item in page.get_images(full=True):
                    x = item[0]
                    for r in page.get_image_rects(x):
                        if r.intersects(target_rect):
                            page.delete_image(x)
                            break

            # 2. Insert image at new bounding box
            target_new_rect = fitz.Rect(new_bbox)
            page.insert_image(target_new_rect, stream=processed_img_bytes, keep_proportion=False)

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def get_annotations(pdf_bytes: bytes, page_num: int) -> List[Dict[str, Any]]:
        """Extract all interactive annotations (sticky notes, stamps, shapes, highlights) on a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        annots_list = []
        try:
            if not (1 <= page_num <= len(doc)):
                return []
            page = doc[page_num - 1]
            for idx, a in enumerate(page.annots()):
                type_name = a.type[1] if isinstance(a.type, (list, tuple)) else str(a.type)
                info = a.info or {}
                author_val = info.get("title", "") or info.get("author", "")
                annots_list.append({
                    "index": idx,
                    "id": info.get("id", f"annot_{page_num}_{idx}"),
                    "type": type_name,
                    "type_id": a.type[0] if isinstance(a.type, (list, tuple)) else 0,
                    "rect": [round(c, 2) for c in a.rect],
                    "content": info.get("content", ""),
                    "title": info.get("title", ""),
                    "author": author_val,
                    "name": info.get("name", "")
                })
            return annots_list
        finally:
            doc.close()

    @staticmethod
    def move_annotation(pdf_bytes: bytes, page_num: int, annot_index: int, new_bbox: List[float]) -> bytes:
        """Update the bounding box position of an annotation on a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]
            annots = list(page.annots())
            if not (0 <= annot_index < len(annots)):
                raise ValueError(f"Annotation index {annot_index} not found")
            annot = annots[annot_index]
            annot.set_rect(fitz.Rect(new_bbox))
            annot.update()
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def delete_annotation(pdf_bytes: bytes, page_num: int, annot_index: int) -> bytes:
        """Delete an annotation from a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]
            annots = list(page.annots())
            if not (0 <= annot_index < len(annots)):
                raise ValueError(f"Annotation index {annot_index} not found")
            page.delete_annot(annots[annot_index])
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def reorder_page_layer(
        pdf_bytes: bytes,
        page_num: int,
        element_type: str,
        action: str,
        element_id: Optional[Union[int, str]] = None,
        bbox: Optional[List[float]] = None,
        text: Optional[str] = None,
        font_size: Optional[float] = None,
        font_name: Optional[str] = None,
        color: Optional[List[float]] = None
    ) -> bytes:
        """
        Reorder visual layer / stacking order of elements on a page (zero redactions).
        Supports:
        - "bring_to_front": moves element to top rendering stack (on top of all other elements)
        - "send_to_back": moves element to bottom rendering stack (behind text/graphics as underlay)
        - "bring_forward": moves element up one layer
        - "send_backward": moves element down one layer
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]
            act = action.lower().strip()

            # --- A. IMAGE LAYER REORDERING ---
            if element_type.lower() in ("image", "img"):
                target_xref = None
                target_rect = None

                if element_id is not None:
                    try:
                        target_xref = int(element_id)
                    except (ValueError, TypeError):
                        pass

                if target_xref is None and bbox and len(bbox) == 4:
                    search_rect = fitz.Rect(bbox)
                    for item in page.get_images(full=True):
                        x = item[0]
                        for r in page.get_image_rects(x):
                            if r.intersects(search_rect) or (abs(r.x0 - search_rect.x0) < 15 and abs(r.y0 - search_rect.y0) < 15):
                                target_xref = x
                                target_rect = r
                                break
                        if target_xref is not None:
                            break

                if target_xref is None:
                    raise ValueError("Target image not found on page")

                if target_rect is None:
                    rects = page.get_image_rects(target_xref)
                    target_rect = rects[0] if rects else (fitz.Rect(bbox) if bbox else fitz.Rect(50, 50, 200, 200))

                # Extract existing image bytes with transparency intact
                img_bytes, _ = PDFEngine.extract_image_bytes(doc, target_xref, normalize_alpha=False)

                # Native image deletion (zero redactions)
                if hasattr(page, "delete_image"):
                    page.delete_image(target_xref)

                # Re-insert with desired overlay hierarchy
                is_overlay = act in ("bring_to_front", "bring_forward")
                page.insert_image(target_rect, stream=img_bytes, keep_proportion=False, overlay=is_overlay)

            # --- B. ANNOTATION / SHAPE / STAMP / FORM LAYER REORDERING ---
            elif element_type.lower() in ("annotation", "annot", "shape", "stamp", "sticky_note", "form"):
                annots = list(page.annots())
                if not annots:
                    raise ValueError("No annotations found on page")

                target_idx = None
                if element_id is not None:
                    try:
                        target_idx = int(element_id)
                    except (ValueError, TypeError):
                        pass

                if target_idx is None and bbox and len(bbox) == 4:
                    b = fitz.Rect(bbox)
                    for idx, a in enumerate(annots):
                        if a.rect.intersects(b):
                            target_idx = idx
                            break

                if target_idx is None or not (0 <= target_idx < len(annots)):
                    target_idx = 0

                annot_xrefs = [a.xref for a in annots]
                target_xref = annot_xrefs[target_idx]

                new_xrefs = list(annot_xrefs)
                new_xrefs.pop(target_idx)

                if act == "bring_to_front":
                    new_xrefs.append(target_xref)
                elif act == "send_to_back":
                    new_xrefs.insert(0, target_xref)
                elif act == "bring_forward":
                    new_idx = min(len(new_xrefs), target_idx + 1)
                    new_xrefs.insert(new_idx, target_xref)
                elif act == "send_backward":
                    new_idx = max(0, target_idx - 1)
                    new_xrefs.insert(new_idx, target_xref)
                else:
                    new_xrefs.append(target_xref)

                # Update /Annots array on the page object
                annots_val_str = "[" + " ".join(f"{x} 0 R" for x in new_xrefs) + "]"
                doc.xref_set_key(page.xref, "Annots", annots_val_str)

            # --- C. TEXT LAYER REORDERING ---
            elif element_type.lower() in ("text", "text_block"):
                if bbox and len(bbox) == 4 and text:
                    font_nm = PDFEngine._normalize_font_name(font_name or "helv")
                    font_sz = font_size if font_size else 12.0
                    text_col = color if color else [0.0, 0.0, 0.0]
                    if any(c > 1.0 for c in text_col):
                        text_col = [c / 255.0 for c in text_col]

                    # Cleanly remove old text instance
                    output_inter = PDFEngine.edit_text(
                        pdf_bytes=pdf_bytes,
                        edits=[{"page": page_num, "bbox": bbox, "new_text": "", "bg_color": None}]
                    )
                    doc_inter = fitz.open(stream=output_inter, filetype="pdf")
                    p_inter = doc_inter[page_num - 1]
                    
                    is_overlay = act in ("bring_to_front", "bring_forward")
                    text_rect = fitz.Rect(bbox)
                    p_inter.insert_textbox(text_rect, text, fontsize=font_sz, fontname=font_nm, color=text_col, overlay=is_overlay)
                    
                    out_b = io.BytesIO()
                    doc_inter.save(out_b, garbage=3, deflate=True)
                    doc_inter.close()
                    return out_b.getvalue()

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def add_text_annotations(
        pdf_bytes: bytes,
        annotations: List[Dict[str, Any]]
    ) -> bytes:
        """
        Add new text annotations at specific (x, y) coordinates or text boxes.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for ann in annotations:
                page_num = ann.get("page", 1)
                if not (1 <= page_num <= len(doc)):
                    continue
                page = doc[page_num - 1]
                
                text = ann.get("text", "")
                if not text:
                    continue

                x = float(ann.get("x", 50))
                y = float(ann.get("y", 50))
                font_size = float(ann.get("font_size", 12.0))
                font_name = PDFEngine._normalize_font_name(ann.get("font_name", "helv"))
                color = ann.get("color", [0, 0, 0])
                if any(c > 1.0 for c in color):
                    color = [c / 255.0 for c in color]

                width = ann.get("width")
                height = ann.get("height")
                html_content = ann.get("html_content")

                if width and height:
                    # Text box insertion
                    rect = fitz.Rect(x, y, x + float(width), y + float(height))
                    bg_color = ann.get("bg_color")
                    if bg_color:
                        if any(c > 1.0 for c in bg_color):
                            bg_color = [c / 255.0 for c in bg_color]
                        page.draw_rect(rect, color=bg_color, fill=bg_color)
                    
                    if html_content:
                        # Rich text insertion
                        text_rect = fitz.Rect(rect.x0, rect.y0, rect.x1, max(rect.y1, page.rect.height - 30))
                        page.insert_htmlbox(text_rect, html_content)
                    else:
                        # Cohesive text box insertion with guaranteed zero truncation
                        lines_list = text.splitlines() or [text]
                        req_h = max(rect.height, font_size * 1.35 * len(lines_list) + 6)
                        render_rect = fitz.Rect(rect.x0, rect.y0, max(rect.x1, rect.x0 + 60), max(rect.y1, rect.y0 + req_h))
                        rc = page.insert_textbox(render_rect, text, fontsize=font_size, fontname=font_name, color=color)
                        if rc < 0:
                            render_rect = fitz.Rect(render_rect.x0, render_rect.y0, render_rect.x1, render_rect.y1 + abs(rc) + 12)
                            page.insert_textbox(render_rect, text, fontsize=font_size, fontname=font_name, color=color)
                else:
                    # Point text insertion
                    point = fitz.Point(x, y)
                    page.insert_text(point, text, fontsize=font_size, fontname=font_name, color=color)

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def move_text_block(
        pdf_bytes: bytes,
        page_num: int,
        old_bbox: List[float],
        new_bbox: List[float],
        text: str,
        font_size: Optional[float] = None,
        font_name: str = "helv",
        color: Optional[List[float]] = None,
        bg_color: Optional[List[float]] = None
    ) -> bytes:
        """
        Move a text block on the PDF cleanly removing old characters and inserting at new location.
        """
        return PDFEngine.edit_text(
            pdf_bytes=pdf_bytes,
            edits=[{
                "page": page_num,
                "bbox": old_bbox,
                "new_bbox": new_bbox,
                "new_text": text,
                "font_size": font_size,
                "font_name": font_name,
                "text_color": color,
                "bg_color": bg_color
            }]
        )

    @staticmethod
    def merge_pdfs(pdf_bytes_list: List[bytes]) -> bytes:
        """Merge multiple PDF documents into a single document."""
        if not pdf_bytes_list:
            raise ValueError("No PDF documents provided to merge.")

        output_doc = fitz.open()
        try:
            for pdf_bytes in pdf_bytes_list:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                output_doc.insert_pdf(doc)
                doc.close()

            output = io.BytesIO()
            output_doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            output_doc.close()

    @staticmethod
    def split_and_extract(pdf_bytes: bytes, page_ranges_str: str) -> bytes:
        """
        Extract specific pages into a single new PDF based on comma/range notation.
        Example: '1-3, 5, 8-10' (1-indexed).
        """
        if not page_ranges_str or not page_ranges_str.strip():
            raise ValueError("Page ranges string cannot be empty")

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        output_doc = fitz.open()
        try:
            total_pages = len(doc)
            selected_indices = []

            for part in page_ranges_str.split(","):
                part = part.strip()
                if not part:
                    continue
                if "-" in part:
                    parts = part.split("-", 1)
                    if len(parts) != 2 or not parts[0].strip().isdigit() or not parts[1].strip().isdigit():
                        raise ValueError(f"Invalid range syntax: '{part}'")
                    start = int(parts[0].strip())
                    end = int(parts[1].strip())
                    if start < 1 or end < start:
                        raise ValueError(f"Invalid range boundaries: {start}-{end}")
                    for p in range(start, end + 1):
                        if 1 <= p <= total_pages:
                            selected_indices.append(p - 1)
                else:
                    if not part.isdigit():
                        raise ValueError(f"Invalid page number: '{part}'")
                    p = int(part)
                    if 1 <= p <= total_pages:
                        selected_indices.append(p - 1)

            if not selected_indices:
                raise ValueError("No valid pages selected for extraction")

            # Insert selected pages in order
            for idx in selected_indices:
                output_doc.insert_pdf(doc, from_page=idx, to_page=idx)

            output = io.BytesIO()
            output_doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()
            output_doc.close()

    @staticmethod
    def burst_to_zip(pdf_bytes: bytes, prefix: str = "page") -> bytes:
        """Split PDF into individual pages and return as a ZIP archive."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        zip_buffer = io.BytesIO()
        try:
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for i in range(len(doc)):
                    single_doc = fitz.open()
                    single_doc.insert_pdf(doc, from_page=i, to_page=i)
                    page_bytes = single_doc.tobytes(garbage=3, deflate=True)
                    single_doc.close()
                    zf.writestr(f"{prefix}_{i + 1:03d}.pdf", page_bytes)
            return zip_buffer.getvalue()
        finally:
            doc.close()

    @staticmethod
    def organize_pages(
        pdf_bytes: bytes,
        page_order: List[int],
        rotations: Optional[Dict[int, int]] = None
    ) -> bytes:
        """
        Reorder, delete, and rotate pages.
        - page_order: list of 1-based page numbers to retain in order (omitted pages are deleted).
        - rotations: dict mapping 1-based page number to degrees (0, 90, 180, 270).
        """
        if not page_order:
            raise ValueError("page_order must contain at least one page")

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        output_doc = fitz.open()
        rotations = rotations or {}
        try:
            total_pages = len(doc)
            for page_num in page_order:
                if 1 <= page_num <= total_pages:
                    idx = page_num - 1
                    output_doc.insert_pdf(doc, from_page=idx, to_page=idx)
                    new_page = output_doc[-1]
                    if page_num in rotations:
                        rot = (new_page.rotation + rotations[page_num]) % 360
                        new_page.set_rotation(rot)

            if len(output_doc) == 0:
                raise ValueError("Document must contain at least one valid page")

            output = io.BytesIO()
            output_doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()
            output_doc.close()

    @staticmethod
    def add_watermark(
        pdf_bytes: bytes,
        text: str,
        opacity: float = 0.3,
        font_size: float = 48.0,
        color: List[float] = None,
        rotation_angle: float = 45.0,
        page_numbers: Optional[List[int]] = None
    ) -> bytes:
        """
        Stamp a semi-transparent watermark diagonally or horizontally across PDF pages.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        color = color or [0.75, 0.75, 0.75]
        if any(c > 1.0 for c in color):
            color = [c / 255.0 for c in color]

        try:
            total_pages = len(doc)
            target_indices = (
                [p - 1 for p in page_numbers if 1 <= p <= total_pages]
                if page_numbers
                else range(total_pages)
            )

            font_name = "helv"
            text_len = fitz.get_text_length(text, fontname=font_name, fontsize=font_size)

            for idx in target_indices:
                page = doc[idx]
                rect = page.rect
                center_point = fitz.Point(rect.width / 2, rect.height / 2)
                start_pt = fitz.Point(center_point.x - text_len / 2, center_point.y + font_size / 3)
                
                # Apply arbitrary rotation around page center using morph
                mat = fitz.Matrix(-float(rotation_angle))
                page.insert_text(
                    start_pt,
                    text,
                    fontsize=font_size,
                    fontname=font_name,
                    color=color,
                    fill_opacity=max(0.05, min(1.0, float(opacity))),
                    morph=(center_point, mat)
                )

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def extract_text(pdf_bytes: bytes) -> str:
        """Extract all text from the PDF formatted with page headers."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            full_text = []
            for i, page in enumerate(doc):
                full_text.append(f"--- PAGE {i + 1} ---\n" + page.get_text())
            return "\n\n".join(full_text)
        finally:
            doc.close()

    @staticmethod
    def extract_images(pdf_bytes: bytes) -> bytes:
        """Extract all embedded images from the PDF and return as a ZIP archive."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        zip_buffer = io.BytesIO()
        try:
            image_count = 0
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for page_idx, page in enumerate(doc):
                    image_list = page.get_images(full=True)
                    for img_idx, img_info in enumerate(image_list):
                        xref = img_info[0]
                        base_image = doc.extract_image(xref)
                        if base_image:
                            image_bytes = base_image["image"]
                            image_ext = base_image["ext"]
                            img_filename = f"page_{page_idx + 1}_img_{img_idx + 1}.{image_ext}"
                            zf.writestr(img_filename, image_bytes)
                            image_count += 1

            if image_count == 0:
                raise ValueError("No embedded images found in this PDF.")
            return zip_buffer.getvalue()
        finally:
            doc.close()

    @staticmethod
    def compress_pdf_advanced(
        pdf_bytes: bytes,
        mode: str = "lossy",
        preset: str = "recommended",
        image_quality: Optional[int] = 75,
        max_dpi: Optional[int] = 150,
        grayscale: bool = False,
        remove_metadata: bool = False
    ) -> Dict[str, Any]:
        """
        Advanced professional PDF compression engine.
        Supports:
          - Lossless: Deflates uncompressed streams, cleans unused objects, removes dead xrefs.
          - Lossy: Downsamples high-resolution embedded images according to display DPI,
                   re-encodes with configurable quality/compression, optional grayscale conversion.
        Never mutates the input bytes. Gracefully handles corrupted, encrypted, and invalid PDFs.
        """
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("The provided PDF file is empty.")

        # Check basic PDF signature
        if not (pdf_bytes.startswith(b"%PDF") or b"%PDF" in pdf_bytes[:2048]):
            raise ValueError("The file provided does not appear to be a valid PDF document.")

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise ValueError(f"Unable to read PDF. The document may be corrupted or damaged: {str(e)}")

        try:
            if doc.is_encrypted:
                raise ValueError("The PDF document is password-protected or encrypted. Please decrypt or unlock it before compressing.")

            if len(doc) == 0:
                raise ValueError("The PDF document contains no pages.")

            orig_size = len(pdf_bytes)
            norm_mode = (mode or "lossy").lower().strip()
            norm_preset = (preset or "recommended").lower().strip()

            # Resolve lossy parameters based on preset
            if norm_preset == "extreme":
                quality = 40
                target_dpi = 96
            elif norm_preset == "recommended":
                quality = 70
                target_dpi = 150
            elif norm_preset == "high":
                quality = 85
                target_dpi = 220
            elif norm_preset == "custom":
                quality = max(10, min(100, int(image_quality if image_quality is not None else 75)))
                target_dpi = max(50, min(600, int(max_dpi if max_dpi is not None else 150)))
            else:
                quality = max(10, min(100, int(image_quality if image_quality is not None else 75)))
                target_dpi = max(50, min(600, int(max_dpi if max_dpi is not None else 150)))

            images_optimized = 0

            # If Lossy mode, process embedded raster images
            if norm_mode == "lossy":
                processed_xrefs = set()
                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    try:
                        images = page.get_images(full=True)
                    except Exception:
                        images = []

                    for img_info in images:
                        xref = img_info[0]
                        if xref in processed_xrefs:
                            continue
                        processed_xrefs.add(xref)

                        try:
                            base_img = doc.extract_image(xref)
                            if not base_img or "image" not in base_img:
                                continue

                            orig_img_bytes = base_img["image"]
                            orig_w = base_img.get("width", 0)
                            orig_h = base_img.get("height", 0)
                            if orig_w <= 0 or orig_h <= 0:
                                continue

                            # Determine display dimensions on page to calculate target pixel size
                            rects = page.get_image_rects(xref)
                            if rects:
                                max_w_pt = max(r.width for r in rects)
                                max_h_pt = max(r.height for r in rects)
                                disp_w_in = max(0.1, max_w_pt / 72.0)
                                disp_h_in = max(0.1, max_h_pt / 72.0)
                                max_allowed_w = max(1, int(disp_w_in * target_dpi))
                                max_allowed_h = max(1, int(disp_h_in * target_dpi))
                            else:
                                max_allowed_w = max(1, int(8.5 * target_dpi))
                                max_allowed_h = max(1, int(11.0 * target_dpi))

                            pil_img = Image.open(io.BytesIO(orig_img_bytes))

                            # Check if downsampling is appropriate
                            scale_factor = min(max_allowed_w / float(orig_w), max_allowed_h / float(orig_h))
                            needs_resize = scale_factor < 0.95

                            if needs_resize:
                                new_w = max(1, int(orig_w * scale_factor))
                                new_h = max(1, int(orig_h * scale_factor))
                                pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                            # Optional Grayscale conversion
                            if grayscale:
                                pil_img = pil_img.convert("L")

                            # Recompress image stream
                            out_img_buf = io.BytesIO()
                            if pil_img.mode in ("RGBA", "LA", "PA") and not grayscale:
                                # Recompress PNG with max compression
                                pil_img.save(out_img_buf, format="PNG", optimize=True)
                            else:
                                if pil_img.mode not in ("RGB", "L"):
                                    pil_img = pil_img.convert("RGB")
                                pil_img.save(out_img_buf, format="JPEG", quality=quality, optimize=True)

                            new_img_bytes = out_img_buf.getvalue()
                            # Only replace if recompressed stream is actually smaller than original
                            if len(new_img_bytes) < len(orig_img_bytes):
                                page.replace_image(xref, stream=new_img_bytes)
                                images_optimized += 1
                        except Exception:
                            # If an individual image fails to re-encode, continue without failing doc
                            continue

            if remove_metadata:
                try:
                    doc.set_metadata({})
                except Exception:
                    pass

            # Deflate streams and perform deep garbage collection
            output = io.BytesIO()
            doc.save(
                output,
                garbage=4,
                deflate=True,
                deflate_images=True,
                deflate_fonts=True,
                clean=True,
                linear=False
            )
            compressed_bytes = output.getvalue()
            new_size = len(compressed_bytes)

            bytes_saved = max(0, orig_size - new_size)
            savings_pct = round(max(0.0, (1.0 - (new_size / orig_size)) * 100.0), 2) if orig_size > 0 else 0.0

            return {
                "original_size": orig_size,
                "compressed_size": new_size,
                "savings_percent": savings_pct,
                "bytes_saved": bytes_saved,
                "mode": norm_mode,
                "preset": norm_preset if norm_mode == "lossy" else "lossless",
                "images_optimized": images_optimized,
                "page_count": len(doc),
                "compressed_bytes": compressed_bytes
            }
        finally:
            doc.close()

    @staticmethod
    def compress_and_optimize(pdf_bytes: bytes) -> bytes:
        """Compress and optimize PDF file streams and clean unused objects (lossless)."""
        result = PDFEngine.compress_pdf_advanced(pdf_bytes, mode="lossless")
        return result["compressed_bytes"]

    @staticmethod
    def add_shape_annotations(
        pdf_bytes: bytes,
        shapes: List[Dict[str, Any]]
    ) -> bytes:
        """
        Add shapes (rect, circle, line) or true highlight annotations.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for s in shapes:
                page_num = s.get("page", 1)
                if not (1 <= page_num <= len(doc)):
                    continue
                page = doc[page_num - 1]
                shape_type = s.get("type", "rect")
                color = s.get("color", [0, 0, 0])
                fill = s.get("fill_color")
                width = float(s.get("width", 1.0))
                
                # Normalize colors to 0..1 range
                if color and any(c > 1.0 for c in color):
                    color = [c / 255.0 for c in color]
                if fill and any(c > 1.0 for c in fill):
                    fill = [c / 255.0 for c in fill]
                
                if shape_type in ("rect", "circle", "highlight"):
                    bbox = s.get("bbox")
                    if not bbox or len(bbox) != 4:
                        continue
                    rect = fitz.Rect(bbox)
                    
                    if shape_type == "rect":
                        annot = page.add_rect_annot(rect)
                        if annot:
                            annot.set_colors(stroke=color, fill=fill)
                            annot.set_border(width=width)
                            annot.update()
                    elif shape_type == "circle":
                        annot = page.add_circle_annot(rect)
                        if annot:
                            annot.set_colors(stroke=color, fill=fill)
                            annot.set_border(width=width)
                            annot.update()
                    elif shape_type == "highlight":
                        annot = page.add_highlight_annot(rect)
                        if annot and color:
                            annot.set_colors(stroke=color)
                            annot.update()
                
                elif shape_type == "line":
                    points = s.get("points")
                    if not points or len(points) != 2:
                        continue
                    p1 = fitz.Point(points[0][0], points[0][1])
                    p2 = fitz.Point(points[1][0], points[1][1])
                    annot = page.add_line_annot(p1, p2)
                    if annot:
                        annot.set_colors(stroke=color)
                        annot.set_border(width=width)
                        annot.update()

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def protect_pdf(
        pdf_bytes: bytes,
        user_password: str,
        owner_password: Optional[str] = None,
        allow_print: bool = True,
        allow_copy: bool = True,
        allow_edit: bool = False
    ) -> bytes:
        """Encrypt PDF with password protection and granular permissions."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            owner_pw = owner_password or user_password
            
            perms = fitz.PDF_PERM_ACCESSIBILITY
            if allow_print:
                perms |= fitz.PDF_PERM_PRINT | fitz.PDF_PERM_PRINT_HQ
            if allow_copy:
                perms |= fitz.PDF_PERM_COPY
            if allow_edit:
                perms |= fitz.PDF_PERM_MODIFY | fitz.PDF_PERM_ANNOTATE | fitz.PDF_PERM_ASSEMBLE | fitz.PDF_PERM_FORM

            output = io.BytesIO()
            doc.save(
                output,
                encryption=fitz.PDF_ENCRYPT_AES_256,
                user_pw=user_password,
                owner_pw=owner_pw,
                permissions=perms,
                garbage=3,
                deflate=True
            )
            return output.getvalue()
        finally:
            doc.close()

    # --- 1. ACROFORMS & INTERACTIVE FORMS ---
    @staticmethod
    def get_form_fields(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract all AcroForm interactive form fields across the document."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        fields = []
        try:
            for page_idx, page in enumerate(doc):
                for w in page.widgets():
                    rect = [round(c, 2) for c in w.rect]
                    field_type_name = "text"
                    if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                        field_type_name = "checkbox"
                    elif w.field_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
                        field_type_name = "radio"
                    elif w.field_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
                        field_type_name = "choice"
                    elif w.field_type == fitz.PDF_WIDGET_TYPE_SIGNATURE:
                        field_type_name = "signature"
                    elif w.field_type == fitz.PDF_WIDGET_TYPE_BUTTON:
                        field_type_name = "button"
                    elif hasattr(w, "field_flags") and (w.field_flags & fitz.PDF_TX_FIELD_IS_MULTILINE):
                        field_type_name = "textarea"

                    fields.append({
                        "page": page_idx + 1,
                        "name": w.field_name or f"field_{page_idx + 1}_{len(fields) + 1}",
                        "type": field_type_name,
                        "value": w.field_value if w.field_value is not None else "",
                        "rect": rect,
                        "choices": w.choice_values if hasattr(w, "choice_values") and w.choice_values else [],
                        "font_size": getattr(w, "text_fontsize", 11.0) or 11.0,
                        "is_read_only": bool(w.field_flags & fitz.PDF_FIELD_IS_READ_ONLY) if hasattr(w, "field_flags") else False,
                        "is_required": bool(w.field_flags & fitz.PDF_FIELD_IS_REQUIRED) if hasattr(w, "field_flags") else False,
                        "is_multiline": bool(w.field_flags & fitz.PDF_TX_FIELD_IS_MULTILINE) if hasattr(w, "field_flags") else False
                    })
            return fields
        finally:
            doc.close()

    @staticmethod
    def fill_form_fields(pdf_bytes: bytes, field_values: Dict[str, Any]) -> bytes:
        """Fill AcroForm fields by field name and save document."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for page in doc:
                for w in page.widgets():
                    if w.field_name in field_values:
                        val = field_values[w.field_name]
                        if not val and val is not False and val != 0:
                            w.reset()
                        else:
                            if w.field_type in (fitz.PDF_WIDGET_TYPE_CHECKBOX, fitz.PDF_WIDGET_TYPE_RADIOBUTTON):
                                w.field_value = bool(val) if val not in ("Off", "off", "") else False
                            else:
                                w.field_value = str(val) if val is not None else ""
                            w.update()
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def add_form_widget(
        pdf_bytes: bytes,
        page_num: int,
        field_type: str,
        field_name: str,
        bbox: List[float],
        default_value: Optional[str] = "",
        options: Optional[List[str]] = None,
        font_size: Optional[float] = 11.0,
        is_required: bool = False,
        is_read_only: bool = False,
        border_color: Optional[List[float]] = None,
        fill_color: Optional[List[float]] = None
    ) -> bytes:
        """Create a new AcroForm widget (text, textarea, checkbox, radio, combobox, signature, date) on a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            
            widget = fitz.Widget()
            widget.rect = fitz.Rect(bbox)
            widget.field_name = field_name
            
            flags = 0
            if is_required:
                flags |= fitz.PDF_FIELD_IS_REQUIRED
            if is_read_only:
                flags |= fitz.PDF_FIELD_IS_READ_ONLY

            if field_type in ("textarea", "multiline"):
                flags |= fitz.PDF_TX_FIELD_IS_MULTILINE
            elif field_type == "radio":
                flags |= fitz.PDF_BTN_FIELD_IS_RADIO

            widget.field_flags = flags
            widget.text_fontsize = float(font_size or 11.0)
            widget.text_font = "helv"
            
            if field_type == "checkbox":
                widget.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
                widget.field_value = (str(default_value).lower() in ("true", "1", "yes", "checked"))
            elif field_type == "radio":
                widget.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
                widget.field_value = (str(default_value).lower() in ("true", "1", "yes", "checked"))
            elif field_type in ("choice", "combobox", "dropdown"):
                widget.field_type = fitz.PDF_WIDGET_TYPE_COMBOBOX
                if options and len(options) > 0:
                    widget.choice_values = options
                widget.field_value = default_value or (options[0] if options else "")
            elif field_type == "listbox":
                widget.field_type = fitz.PDF_WIDGET_TYPE_LISTBOX
                if options and len(options) > 0:
                    widget.choice_values = options
                widget.field_value = default_value or (options[0] if options else "")
            elif field_type == "signature":
                widget.field_type = fitz.PDF_WIDGET_TYPE_SIGNATURE
            else:
                widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
                widget.field_value = default_value or ""

            b_color = border_color or [0.2, 0.4, 0.8]
            if any(c > 1.0 for c in b_color):
                b_color = [c / 255.0 for c in b_color]
            widget.border_color = b_color
            widget.border_width = 1

            if fill_color:
                f_color = fill_color
                if any(c > 1.0 for c in f_color):
                    f_color = [c / 255.0 for c in f_color]
                widget.fill_color = f_color

            page.add_widget(widget)
            
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def update_form_field(
        pdf_bytes: bytes,
        page_num: int,
        field_name: str,
        new_name: Optional[str] = None,
        new_value: Optional[Any] = None,
        new_bbox: Optional[List[float]] = None,
        new_choices: Optional[List[str]] = None,
        font_size: Optional[float] = None,
        is_required: Optional[bool] = None,
        is_read_only: Optional[bool] = None
    ) -> bytes:
        """Update properties of an existing AcroForm widget cleanly without ghosting residue."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            target = None
            for w in page.widgets():
                if w.field_name == field_name:
                    target = w
                    break
            if target:
                ftype = target.field_type
                fname = new_name if new_name else target.field_name
                fflags = target.field_flags
                if is_required is not None:
                    if is_required:
                        fflags |= fitz.PDF_FIELD_IS_REQUIRED
                    else:
                        fflags &= ~fitz.PDF_FIELD_IS_REQUIRED
                if is_read_only is not None:
                    if is_read_only:
                        fflags |= fitz.PDF_FIELD_IS_READ_ONLY
                    else:
                        fflags &= ~fitz.PDF_FIELD_IS_READ_ONLY

                fval = new_value if new_value is not None else target.field_value
                if ftype == fitz.PDF_WIDGET_TYPE_CHECKBOX and new_value is not None:
                    fval = (str(new_value).lower() in ("true", "1", "yes", "checked"))
                elif new_value is not None and ftype != fitz.PDF_WIDGET_TYPE_CHECKBOX:
                    fval = str(new_value)

                fchoices = new_choices if new_choices is not None else (target.choice_values if hasattr(target, "choice_values") else None)
                ffontsize = float(font_size) if font_size is not None else (getattr(target, "text_fontsize", 11.0) or 11.0)
                fbcolor = getattr(target, "border_color", None)
                ffcolor = getattr(target, "fill_color", None)
                frect = fitz.Rect(new_bbox) if (new_bbox and len(new_bbox) == 4) else target.rect

                page.delete_widget(target)

                new_w = fitz.Widget()
                new_w.field_type = ftype
                new_w.field_name = fname
                new_w.field_flags = fflags
                new_w.field_value = fval
                new_w.text_font = "helv"
                new_w.text_fontsize = ffontsize
                if fchoices: new_w.choice_values = fchoices
                if fbcolor: new_w.border_color = fbcolor
                if ffcolor: new_w.fill_color = ffcolor
                new_w.rect = frect
                page.add_widget(new_w)

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def delete_form_field(
        pdf_bytes: bytes,
        page_num: int,
        field_name: str
    ) -> bytes:
        """Delete an AcroForm widget from a page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            for w in page.widgets():
                if w.field_name == field_name:
                    page.delete_widget(w)
                    break
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def move_form_field(
        pdf_bytes: bytes,
        page_num: int,
        field_name: str,
        new_bbox: List[float]
    ) -> bytes:
        """Update the bounding box position of an existing AcroForm widget cleanly without ghosting residue."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            target = None
            for w in page.widgets():
                if w.field_name == field_name:
                    target = w
                    break
            if target:
                ftype = target.field_type
                fname = target.field_name
                fflags = target.field_flags
                fval = target.field_value
                fchoices = target.choice_values if hasattr(target, "choice_values") else None
                ffontsize = getattr(target, "text_fontsize", 11.0) or 11.0
                fbcolor = getattr(target, "border_color", None)
                ffcolor = getattr(target, "fill_color", None)

                page.delete_widget(target)

                new_w = fitz.Widget()
                new_w.field_type = ftype
                new_w.field_name = fname
                new_w.field_flags = fflags
                new_w.field_value = fval
                new_w.text_font = "helv"
                new_w.text_fontsize = ffontsize
                if fchoices: new_w.choice_values = fchoices
                if fbcolor: new_w.border_color = fbcolor
                if ffcolor: new_w.fill_color = ffcolor
                new_w.rect = fitz.Rect(new_bbox)
                page.add_widget(new_w)

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def clear_form_fields(pdf_bytes: bytes) -> bytes:
        """Clear all AcroForm field values across the document."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for page in doc:
                for w in page.widgets():
                    w.reset()
                    if w.field_type in (fitz.PDF_WIDGET_TYPE_CHECKBOX, fitz.PDF_WIDGET_TYPE_RADIOBUTTON):
                        w.field_value = False
                        w.update()
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def export_form_data(pdf_bytes: bytes) -> Dict[str, Any]:
        """Export all form fields as a dictionary for JSON/CSV export."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        data = {}
        try:
            for page in doc:
                for w in page.widgets():
                    name = w.field_name or ""
                    if name:
                        val = w.field_value
                        if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                            val = bool(val) if val not in ("Off", "off", None) else False
                        data[name] = val if val is not None else ""
            return data
        finally:
            doc.close()

    @staticmethod
    def import_form_data(pdf_bytes: bytes, data: Dict[str, Any]) -> bytes:
        """Import form field values from a dictionary."""
        return PDFEngine.fill_form_fields(pdf_bytes, data)

    @staticmethod
    def flatten_forms(pdf_bytes: bytes) -> bytes:
        """Bake form fields and annotations permanently into the page stream."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            doc.bake(annots=True, widgets=True)
            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # --- 2. BOOKMARKS / TABLE OF CONTENTS TREE ---
    @staticmethod
    def get_bookmarks(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Retrieve the document Table of Contents / Bookmarks hierarchy."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            toc = doc.get_toc(simple=False)
            # toc is a list of [lvl, title, page, dest_dict]
            result = []
            for item in toc:
                lvl = item[0]
                title = item[1]
                page = item[2]
                result.append({
                    "level": lvl,
                    "title": title,
                    "page": page
                })
            return result
        finally:
            doc.close()

    @staticmethod
    def set_bookmarks(pdf_bytes: bytes, bookmarks: List[Dict[str, Any]]) -> bytes:
        """Replace the document Table of Contents / Bookmarks outline."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            toc_list = []
            for b in bookmarks:
                lvl = int(b.get("level", 1))
                title = str(b.get("title", "Untitled"))
                page = int(b.get("page", 1))
                toc_list.append([lvl, title, page])
            doc.set_toc(toc_list)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # --- 3. TRUE REDACTION & DOCUMENT SANITIZATION ---
    @staticmethod
    def apply_redactions_with_labels(
        pdf_bytes: bytes,
        redactions: List[Dict[str, Any]]
    ) -> bytes:
        """
        Permanently remove underlying text, vector graphics, and images within target bounding boxes,
        and optionally stamp a redaction label/reason.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for item in redactions:
                page_num = item.get("page", 1)
                if not (1 <= page_num <= len(doc)):
                    continue
                page = doc[page_num - 1]
                bbox = item.get("bbox")
                if not bbox or len(bbox) != 4:
                    continue
                
                rect = fitz.Rect(bbox)
                fill_color = item.get("fill_color", [0.0, 0.0, 0.0]) # Default black
                if any(c > 1.0 for c in fill_color):
                    fill_color = [c / 255.0 for c in fill_color]
                
                text_color = item.get("text_color", [1.0, 1.0, 1.0]) # White text
                if any(c > 1.0 for c in text_color):
                    text_color = [c / 255.0 for c in text_color]
                
                label_text = item.get("text", "")
                font_size = float(item.get("font_size", 9.0))
                
                annot = page.add_redact_annot(
                    rect,
                    text=label_text,
                    fontname="hebo",
                    fontsize=font_size,
                    text_color=text_color,
                    fill=fill_color,
                    align=fitz.TEXT_ALIGN_CENTER
                )
            
            # Apply all redactions permanently across all pages
            for page in doc:
                page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_PIXELS)

            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def sanitize_document(pdf_bytes: bytes, options: Dict[str, bool]) -> Tuple[bytes, Dict[str, Any]]:
        """
        Strip sensitive document artifacts (metadata, JavaScript, attachments, links, bookmarks, revision history).
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        report = {}
        try:
            if options.get("remove_metadata", True):
                doc.set_metadata({})
                report["metadata_removed"] = True

            if options.get("remove_attachments", True):
                emb_names = doc.embfile_names()
                for name in emb_names:
                    doc.embfile_del(name)
                report["attachments_removed"] = len(emb_names)

            if options.get("remove_bookmarks", False):
                doc.set_toc([])
                report["bookmarks_removed"] = True

            if options.get("remove_links", True):
                links_count = 0
                for page in doc:
                    links = list(page.get_links())
                    for l in links:
                        page.delete_link(l)
                        links_count += 1
                report["links_removed"] = links_count

            if options.get("remove_annotations", False):
                annots_count = 0
                for page in doc:
                    annots = list(page.annots())
                    for a in annots:
                        page.delete_annot(a)
                        annots_count += 1
                report["annotations_removed"] = annots_count

            # Purge document-level JavaScript actions & triggers (DEF-004)
            try:
                cat = doc.pdf_catalog()
                if cat:
                    for key in ("Names/JavaScript", "JavaScript", "AA", "OpenAction"):
                        try:
                            doc.xref_set_key(cat, key, "null")
                        except Exception:
                            pass
                report["javascript_removed"] = True
            except Exception:
                pass

            output = io.BytesIO()
            # Deep cleaning with highest garbage collection to discard all unreferenced revisions
            doc.save(output, garbage=4, deflate=True, clean=True)
            return output.getvalue(), report
        finally:
            doc.close()

    # --- 4. IMAGE & SIGNATURE PLACEMENT ---
    @staticmethod
    def insert_image_to_page(
        pdf_bytes: bytes,
        image_bytes: bytes,
        page_num: int,
        bbox: List[float],
        opacity: float = 1.0,
        rotation: int = 0,
        flip_h: bool = False,
        flip_v: bool = False,
        keep_proportion: bool = False
    ) -> bytes:
        """Insert/stamp an image or digital signature onto a page with rotation, flip, and opacity."""
        processed_img_bytes = PDFEngine._prepare_image_bytes(
            image_bytes, opacity=opacity, rotation=rotation, flip_h=flip_h, flip_v=flip_v
        )
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            rect = fitz.Rect(bbox)
            page.insert_image(rect, stream=processed_img_bytes, keep_proportion=keep_proportion)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # --- 5. FREEHAND INK & ANNOTATIONS ---
    @staticmethod
    def add_ink_annotations(
        pdf_bytes: bytes,
        ink_drawings: List[Dict[str, Any]]
    ) -> bytes:
        """Add smooth freehand drawing strokes (ink annotations)."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for item in ink_drawings:
                page_num = item.get("page", 1)
                if not (1 <= page_num <= len(doc)):
                    continue
                page = doc[page_num - 1]
                paths = item.get("paths", []) # list of point arrays [[x, y], [x, y]...]
                color = item.get("color", [0.0, 0.0, 0.0])
                if any(c > 1.0 for c in color):
                    color = [c / 255.0 for c in color]
                width = float(item.get("width", 2.0))
                
                fitz_paths = []
                for stroke in paths:
                    pt_list = [(float(p[0]), float(p[1])) for p in stroke if len(p) == 2]
                    if len(pt_list) >= 2:
                        fitz_paths.append(pt_list)
                
                if fitz_paths:
                    annot = page.add_ink_annot(fitz_paths)
                    if annot:
                        annot.set_colors(stroke=color)
                        annot.set_border(width=width)
                        annot.update()

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def add_stamp_annotation(
        pdf_bytes: bytes,
        page_num: int,
        bbox: List[float],
        stamp_text: str,
        color: Optional[List[float]] = None
    ) -> bytes:
        """Create a styled vector stamp annotation (e.g. APPROVED, CONFIDENTIAL, DRAFT)."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            rect = fitz.Rect(bbox)
            
            # Map common strings to standard PyMuPDF stamp types
            text_upper = stamp_text.upper()
            stamp_id = fitz.STAMP_Approved
            
            if "CONFIDENTIAL" in text_upper:
                stamp_id = fitz.STAMP_Confidential
            elif "DRAFT" in text_upper:
                stamp_id = fitz.STAMP_Draft
            elif "REJECTED" in text_upper or "NOT" in text_upper:
                stamp_id = fitz.STAMP_NotApproved
            elif "AS IS" in text_upper:
                stamp_id = fitz.STAMP_AsIs
            elif "EXPIRED" in text_upper:
                stamp_id = fitz.STAMP_Expired
            elif "FINAL" in text_upper:
                stamp_id = fitz.STAMP_Final
                
            annot = page.add_stamp_annot(rect, stamp=stamp_id)
            if annot:
                annot.update()

            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def add_sticky_note(
        pdf_bytes: bytes,
        page_num: int,
        point: List[float],
        content: str,
        author: str = "User"
    ) -> bytes:
        """Add an interactive sticky note (popup text annotation)."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            page = doc[page_idx]
            pt = fitz.Point(point[0], point[1])
            annot = page.add_text_annot(pt, content, icon="Comment")
            if annot:
                annot.set_info(title=author)
                annot.update()
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # --- 6. METADATA & SECURITY INSPECTOR ---
    @staticmethod
    def update_metadata(pdf_bytes: bytes, metadata: Dict[str, str]) -> bytes:
        """Update standard document metadata properties."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            curr = doc.metadata or {}
            for k in ("title", "author", "subject", "keywords", "creator", "producer"):
                if k in metadata:
                    curr[k] = str(metadata[k])
            doc.set_metadata(curr)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def get_security_and_compliance_info(pdf_bytes: bytes) -> Dict[str, Any]:
        """Comprehensive security, encryption, and compliance audit of the PDF."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            meta = doc.metadata or {}
            emb_names = doc.embfile_names()
            has_js = False
            try:
                # Check for document level JavaScript
                js_count = len(doc.get_js_actions()) if hasattr(doc, "get_js_actions") else 0
                has_js = js_count > 0
            except:
                has_js = False

            # Check permissions
            perms = doc.permissions
            can_print = bool(perms & fitz.PDF_PERM_PRINT)
            can_modify = bool(perms & fitz.PDF_PERM_MODIFY)
            can_copy = bool(perms & fitz.PDF_PERM_COPY)
            can_annotate = bool(perms & fitz.PDF_PERM_ANNOTATE)

            # Check PDF version
            version_str = f"PDF {doc.format[4:]}" if hasattr(doc, "format") and doc.format else "PDF 1.7"

            return {
                "format": version_str,
                "page_count": len(doc),
                "is_encrypted": doc.is_encrypted,
                "is_repaired": doc.is_repaired,
                "has_javascript": has_js,
                "attachments_count": len(emb_names),
                "attachments": emb_names,
                "permissions": {
                    "raw": perms,
                    "can_print": can_print,
                    "can_modify": can_modify,
                    "can_copy": can_copy,
                    "can_annotate": can_annotate
                },
                "metadata": meta,
                "is_pdfa": "pdfa" in str(meta).lower() or "conformance" in str(meta).lower()
            }
        finally:
            doc.close()

    # --- 7. ADVANCED PAGE OPERATIONS ---
    @staticmethod
    def insert_blank_page(
        pdf_bytes: bytes,
        at_page: int,
        width: float = 595.0,
        height: float = 842.0
    ) -> bytes:
        """Insert a blank page at the designated 1-based page index."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            # 0-based insertion index
            pno = max(0, min(at_page - 1, len(doc)))
            doc.new_page(pno=pno, width=width, height=height)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def duplicate_page(pdf_bytes: bytes, page_num: int) -> bytes:
        """Duplicate a specific page in place."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        src_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            page_idx = max(0, min(page_num - 1, len(doc) - 1))
            doc.insert_pdf(src_doc, from_page=page_idx, to_page=page_idx, start_at=page_idx + 1)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            src_doc.close()
            doc.close()

    @staticmethod
    def crop_page(pdf_bytes: bytes, page_num: int, crop_box: List[float], apply_all_pages: bool = False) -> bytes:
        """Set page cropbox to trim margins for a single page or all pages."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            rect = fitz.Rect(crop_box)
            if apply_all_pages:
                for page in doc:
                    page.set_cropbox(rect)
            else:
                page_idx = max(0, min(page_num - 1, len(doc) - 1))
                page = doc[page_idx]
                page.set_cropbox(rect)
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # --- 8. ADVANCED NEW FEATURES ---

    # Feature 1: Table Extraction & Export
    @staticmethod
    def detect_tables(pdf_bytes: bytes, page_num: int) -> List[Dict[str, Any]]:
        """
        Detect and extract tables on a page using advanced multi-strategy table extraction.
        Combines lines_strict (vector grid borders), lines/default (hybrid grids),
        fragment clustering (shaded rows), and borderless text alignments with scoring,
        empty column/row pruning, and hierarchical header consolidation.
        """
        import csv
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            if not (1 <= page_num <= len(doc)):
                return []
            page = doc[page_num - 1]
            
            def clean_cell(val: Any) -> str:
                if val is None:
                    return ""
                return str(val).replace("\n", " ").strip()

            def process_table_rows(raw_rows: List[List[Any]]) -> Tuple[List[str], List[List[str]]]:
                if not raw_rows:
                    return [], []
                
                # 1. Clean all cell contents
                cleaned = [[clean_cell(c) for c in row] for row in raw_rows]
                
                # 2. Normalize rectangular dimensions
                num_cols = max(len(r) for r in cleaned) if cleaned else 0
                cleaned = [r + [""] * (num_cols - len(r)) for r in cleaned]
                
                # 3. Prune 100% empty columns
                col_has_data = [False] * num_cols
                for r in cleaned:
                    for c_idx, val in enumerate(r):
                        if val:
                            col_has_data[c_idx] = True
                valid_cols = [i for i, has in enumerate(col_has_data) if has]
                if not valid_cols:
                    return [], []
                cleaned = [[r[i] for i in valid_cols] for r in cleaned]
                num_cols = len(valid_cols)
                
                # 4. Prune 100% empty rows
                cleaned = [r for r in cleaned if any(c for c in r)]
                if not cleaned:
                    return [], []
                
                # 5. Detect and resolve hierarchical multi-tier headers (top 2 rows)
                is_hierarchical = False
                if len(cleaned) >= 3:
                    r0 = cleaned[0]
                    r1 = cleaned[1]
                    
                    has_r1_blanks = any(not r1[i] and r0[i] for i in range(num_cols))
                    has_r0_blanks_or_group = any((not r0[i] and r1[i]) for i in range(num_cols))
                    has_stacked_headers = any(r0[i] and r1[i] for i in range(num_cols))
                    
                    if has_r1_blanks and (has_stacked_headers or has_r0_blanks_or_group):
                        r1_non_empty = [c for c in r1 if c]
                        r1_is_text = sum(
                            1 for c in r1_non_empty 
                            if not c.replace('.', '', 1).replace('%', '').replace('$', '').replace('sec', '').replace('n=', '').replace(',', '').strip().isdigit()
                        )
                        if r1_is_text >= len(r1_non_empty) * 0.6:
                            is_hierarchical = True
                            
                if is_hierarchical:
                    r0 = cleaned[0]
                    r1 = cleaned[1]
                    consolidated_headers = []
                    last_group_header = ""
                    for i in range(num_cols):
                        h0 = r0[i]
                        h1 = r1[i]
                        if h0:
                            last_group_header = h0
                        if h0 and h1:
                            consolidated_headers.append(f"{h0} - {h1}")
                        elif h1:
                            if last_group_header and last_group_header != h1:
                                consolidated_headers.append(f"{last_group_header} - {h1}")
                            else:
                                consolidated_headers.append(h1)
                        elif h0:
                            consolidated_headers.append(h0)
                        else:
                            consolidated_headers.append(f"Column {i+1}")
                    
                    final_rows = [consolidated_headers] + cleaned[2:]
                    return consolidated_headers, final_rows
                else:
                    return cleaned[0], cleaned

            def score_table(tab: Any) -> float:
                raw_rows = tab.extract()
                if not raw_rows:
                    return -9999.0
                
                total_cells = 0
                non_empty_cells = 0
                num_rows = len(raw_rows)
                num_cols = max(len(r) for r in raw_rows) if raw_rows else 0
                if num_rows == 0 or num_cols == 0:
                    return -9999.0
                    
                for r in raw_rows:
                    for c in r:
                        total_cells += 1
                        if c is not None and str(c).strip():
                            non_empty_cells += 1
                            
                fill_ratio = non_empty_cells / max(1, total_cells)
                penalty = 0.0
                if num_cols > 10 and fill_ratio < 0.35:
                    penalty -= (num_cols - 10) * 20.0
                if num_rows == 1:
                    penalty -= 10.0
                    
                return (non_empty_cells * 2.0) + (fill_ratio * 50.0) + penalty

            def bbox_overlap_ratio(bbox1: Any, bbox2: Any) -> float:
                x_left = max(bbox1[0], bbox2[0])
                y_top = max(bbox1[1], bbox2[1])
                x_right = min(bbox1[2], bbox2[2])
                y_bottom = min(bbox1[3], bbox2[3])
                if x_right <= x_left or y_bottom <= y_top:
                    return 0.0
                intersection_area = (x_right - x_left) * (y_bottom - y_top)
                area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
                area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
                min_area = min(area1, area2)
                return intersection_area / max(1.0, min_area)

            candidates = []

            # 1. Strategy 1: lines_strict (most accurate for vector bordered & shaded grid tables)
            try:
                res_strict = page.find_tables(vertical_strategy="lines_strict", horizontal_strategy="lines_strict")
                if res_strict and res_strict.tables:
                    for t in res_strict.tables:
                        candidates.append((score_table(t), t))
            except Exception:
                pass

            # 2. Strategy 2: default find_tables() with fragment clustering for shaded alternating rows
            try:
                base_tabs = page.find_tables()
                if base_tabs and base_tabs.tables:
                    well_formed = [t for t in base_tabs.tables if t.row_count > 1]
                    fragmented = [t for t in base_tabs.tables if t.row_count <= 1]
                    for t in well_formed:
                        candidates.append((score_table(t), t))
                    if fragmented:
                        sorted_tabs = sorted(fragmented, key=lambda t: t.bbox[1])
                        clusters = []
                        current_cluster = [sorted_tabs[0]]
                        for i in range(1, len(sorted_tabs)):
                            prev_tab = current_cluster[-1]
                            curr_tab = sorted_tabs[i]
                            prev_h = (prev_tab.bbox[3] - prev_tab.bbox[1])
                            curr_h = (curr_tab.bbox[3] - curr_tab.bbox[1])
                            threshold = max(prev_h, curr_h, 20) * 3.0
                            if (curr_tab.bbox[1] - prev_tab.bbox[3]) <= threshold:
                                current_cluster.append(curr_tab)
                            else:
                                clusters.append(current_cluster)
                                current_cluster = [curr_tab]
                        if current_cluster:
                            clusters.append(current_cluster)
                        for cluster in clusters:
                            min_x = min(t.bbox[0] for t in cluster)
                            min_y = min(t.bbox[1] for t in cluster)
                            max_x = max(t.bbox[2] for t in cluster)
                            max_y = max(t.bbox[3] for t in cluster)
                            avg_h = sum((t.bbox[3] - t.bbox[1]) for t in cluster) / len(cluster)
                            clip_rect = fitz.Rect(
                                max(0, min_x - 10),
                                max(0, min_y - (avg_h * 0.5)),
                                min(page.rect.width, max_x + 10),
                                min(page.rect.height, max_y + (avg_h * 1.5))
                            )
                            cl_tabs = page.find_tables(
                                clip=clip_rect,
                                vertical_strategy="text",
                                horizontal_strategy="text",
                                text_x_tolerance=15,
                                intersection_y_tolerance=15
                            )
                            if cl_tabs and cl_tabs.tables:
                                for t in cl_tabs.tables:
                                    candidates.append((score_table(t), t))
                            else:
                                for t in cluster:
                                    candidates.append((score_table(t), t))
            except Exception:
                pass

            # 3. Strategy 3: lines strategy (hybrid line borders)
            try:
                res_lines = page.find_tables(vertical_strategy="lines", horizontal_strategy="lines")
                if res_lines and res_lines.tables:
                    for t in res_lines.tables:
                        candidates.append((score_table(t), t))
            except Exception:
                pass

            # 4. Strategy 4: text fallback if no tables found or weak candidates
            if not candidates or all(c[0] < 10 for c in candidates):
                try:
                    res_text = page.find_tables(vertical_strategy="text", horizontal_strategy="text", text_x_tolerance=15)
                    if res_text and res_text.tables:
                        for t in res_text.tables:
                            candidates.append((score_table(t), t))
                except Exception:
                    pass

            # Rank candidates by score
            candidates.sort(key=lambda x: x[0], reverse=True)

            # Deduplicate overlapping bounding boxes (retaining highest scored candidate)
            selected_tables = []
            for score, tab in candidates:
                if score <= 0:
                    continue
                overlaps = False
                for sel_tab in selected_tables:
                    if bbox_overlap_ratio(tab.bbox, sel_tab.bbox) > 0.35:
                        overlaps = True
                        break
                if not overlaps:
                    selected_tables.append(tab)

            # Sort tables by vertical page coordinates
            selected_tables.sort(key=lambda t: t.bbox[1])

            result = []
            for idx, tab in enumerate(selected_tables):
                headers, processed_rows = process_table_rows(tab.extract())
                if not processed_rows:
                    continue

                csv_io = io.StringIO()
                writer = csv.writer(csv_io)
                for r in processed_rows:
                    writer.writerow(r)
                csv_str = csv_io.getvalue()

                md_lines = []
                if processed_rows:
                    md_lines.append("| " + " | ".join(processed_rows[0]) + " |")
                    md_lines.append("| " + " | ".join(["---"] * len(processed_rows[0])) + " |")
                    for r in processed_rows[1:]:
                        md_lines.append("| " + " | ".join(r) + " |")
                md_str = "\n".join(md_lines)

                bbox = [round(c, 2) for c in tab.bbox]
                result.append({
                    "id": f"table_{page_num}_{idx + 1}",
                    "page": page_num,
                    "bbox": bbox,
                    "row_count": len(processed_rows),
                    "col_count": len(headers),
                    "header": [str(h or "") for h in headers],
                    "rows": processed_rows,
                    "csv_data": csv_str,
                    "markdown": md_str
                })
            return result
        finally:
            doc.close()

    @staticmethod
    def export_table_to_csv(rows: List[List[str]]) -> str:
        """Convert 2D table data into CSV string."""
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        for r in rows:
            writer.writerow([str(c) for c in r])
        return output.getvalue()

    @staticmethod
    def export_table_to_excel(tables_data: List[Dict[str, Any]]) -> bytes:
        """Export one or multiple extracted tables to an Excel workbook (.xlsx)."""
        import openpyxl
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter
        
        wb = openpyxl.Workbook()
        if wb.sheetnames:
            wb.remove(wb.active)
        
        for idx, t in enumerate(tables_data):
            title = f"Table_{t.get('page', 1)}_{idx+1}"
            ws = wb.create_sheet(title=title[:31])
            rows = t.get("rows", [])
            
            header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
            header_font = Font(color="FFFFFF", bold=True, name="Calibri")
            border_side = Side(border_style="thin", color="CBD5E1")
            border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
            
            for row_idx, r in enumerate(rows, start=1):
                for col_idx, val in enumerate(r, start=1):
                    cell = ws.cell(row=row_idx, column=col_idx, value=val)
                    cell.border = border
                    if row_idx == 1:
                        cell.fill = header_fill
                        cell.font = header_font
                        cell.alignment = Alignment(horizontal="center", vertical="center")
                    else:
                        cell.alignment = Alignment(horizontal="left", vertical="center")
            
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
                
        out = io.BytesIO()
        wb.save(out)
        return out.getvalue()

    # Feature 2: PII Scanning, Key-Value Extraction & Auto-Redaction
    @staticmethod
    def _is_valid_luhn(card_str: str) -> bool:
        """Validate credit card number using the Luhn Algorithm (Mod 10)."""
        import re
        digits = [int(c) for c in re.sub(r'\D', '', card_str)]
        if not (13 <= len(digits) <= 19):
            return False
        checksum = 0
        reverse_digits = digits[::-1]
        for i, d in enumerate(reverse_digits):
            if i % 2 == 1:
                d *= 2
                if d > 9:
                    d -= 9
            checksum += d
        return checksum % 10 == 0

    @staticmethod
    def _is_valid_ssn(ssn_str: str) -> bool:
        """Validate US SSN against official SSA formatting rules."""
        import re
        digits = re.sub(r'\D', '', ssn_str)
        if len(digits) != 9:
            return False
        area = int(digits[:3])
        group = int(digits[3:5])
        serial = int(digits[5:])
        if area in (0, 666) or 900 <= area <= 999:
            return False
        if group == 0 or serial == 0:
            return False
        return True

    @staticmethod
    def _is_valid_ipv4(ip_str: str) -> bool:
        """Validate IPv4 address components."""
        parts = ip_str.strip().split('.')
        if len(parts) != 4:
            return False
        for p in parts:
            if not p.isdigit():
                return False
            val = int(p)
            if val < 0 or val > 255:
                return False
        # Avoid common non-PII zero/loopback addresses if isolated
        if ip_str.strip() in ("0.0.0.0", "255.255.255.255"):
            return False
        return True

    @staticmethod
    def scan_for_pii(
        pdf_bytes: bytes,
        page_num: int = 0,
        types: Optional[List[str]] = None,
        custom_keys: Optional[List[str]] = None,
        key_value_mode: Optional[str] = "value_only",
        custom_keywords: Optional[List[str]] = None,
        match_whole_word: bool = True,
        case_sensitive: bool = False,
        custom_pattern: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Scan document for built-in PII, user-defined Key-Value labels, custom keywords/phrases,
        and regular expressions with mathematical checksum verification.
        """
        import re
        patterns = {
            "email": (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,12}\b', "Email Address", None),
            "ssn": (r'\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b', "Social Security Number", PDFEngine._is_valid_ssn),
            "phone": (r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', "Phone Number", None),
            "credit_card": (r'\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{4}[-\s]?\d{6}[-\s]?\d{5}\b', "Credit Card Number", PDFEngine._is_valid_luhn),
            "iban": (r'\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b', "IBAN / Bank Account", None),
            "date": (r'\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b', "Date / DOB", None),
            "ipv4": (r'\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b', "IPv4 Address", PDFEngine._is_valid_ipv4),
            "secrets": (r'\b(?:AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|bearer\s+[a-zA-Z0-9_\-\.]{20,}|eyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,})\b', "API Key / Secret Token", None),
            "passport": (r'\b[A-Z]{1,2}[0-9]{7,9}\b', "Passport Number", None)
        }
        
        selected_patterns = {}
        if types:
            for t in types:
                if t in patterns:
                    selected_patterns[t] = patterns[t]
        elif types is None:
            # Default subset if none specified
            for t in ("email", "ssn", "phone", "credit_card", "date", "ipv4"):
                selected_patterns[t] = patterns[t]
            
        if custom_pattern and custom_pattern.strip():
            try:
                re.compile(custom_pattern)
                selected_patterns["custom_regex"] = (custom_pattern.strip(), "Custom Regex", None)
            except Exception:
                pass
                
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        matches = []
        try:
            target_pages = [page_num - 1] if (1 <= page_num <= len(doc)) else range(len(doc))
            match_id = 1
            for pno in target_pages:
                page = doc[pno]
                page_text = page.get_text()
                page_rect = page.rect
                
                # 1. Built-in PII patterns and custom regex
                for type_key, (pattern_str, label, validator) in selected_patterns.items():
                    flags = re.IGNORECASE if type_key != "secrets" else 0
                    for m in re.finditer(pattern_str, page_text, flags):
                        match_text = m.group().strip()
                        if not match_text or len(match_text) < 3:
                            continue
                        
                        if validator is not None and not validator(match_text):
                            continue
                        
                        quads = page.search_for(match_text)
                        for q in quads:
                            rect = q.rect if hasattr(q, "rect") else fitz.Rect(q)
                            bbox = [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)]
                            if not any(item["page"] == pno + 1 and item["bbox"] == bbox for item in matches):
                                matches.append({
                                    "id": f"pii_{match_id}",
                                    "page": pno + 1,
                                    "type": type_key,
                                    "label": label,
                                    "text": match_text,
                                    "bbox": bbox
                                })
                                match_id += 1

                # 2. Custom Key-Value Labels (e.g., "Account Number:", "Patient Name:")
                if custom_keys and len(custom_keys) > 0:
                    text_dict = page.get_text("dict")
                    for b in text_dict.get("blocks", []):
                        if b.get("type") != 0:
                            continue
                        for line in b.get("lines", []):
                            line_spans = line.get("spans", [])
                            if not line_spans:
                                continue
                            line_str = "".join(s.get("text", "") for s in line_spans)
                            line_bbox = line.get("bbox", [0, 0, 0, 0])
                            
                            for k in custom_keys:
                                k_clean = k.strip()
                                if not k_clean:
                                    continue
                                
                                # Search for key label with optional delimiter
                                rgx = rf'(?i)(?:\b|^){re.escape(k_clean)}\s*[:\-–=]?\s*'
                                m_key = re.search(rgx, line_str)
                                if m_key:
                                    val_str = line_str[m_key.end():].strip()
                                    if val_str and len(val_str) > 0:
                                        # Clip search to current line bounding region
                                        clip_r = fitz.Rect(
                                            max(0.0, line_bbox[0] - 2.0),
                                            max(0.0, line_bbox[1] - 3.0),
                                            min(page_rect.width, page_rect.width),
                                            min(page_rect.height, line_bbox[3] + 3.0)
                                        )
                                        
                                        target_str = line_str[m_key.start():].strip() if key_value_mode == "both" else val_str
                                        quads = page.search_for(target_str, clip=clip_r)
                                        if not quads:
                                            quads = page.search_for(target_str)
                                            
                                        for q in quads:
                                            rect = q.rect if hasattr(q, "rect") else fitz.Rect(q)
                                            bbox = [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)]
                                            if not any(item["page"] == pno + 1 and item["bbox"] == bbox for item in matches):
                                                matches.append({
                                                    "id": f"pii_{match_id}",
                                                    "page": pno + 1,
                                                    "type": "key_value",
                                                    "label": f"Key: {k_clean}",
                                                    "text": target_str,
                                                    "key_name": k_clean,
                                                    "value_text": val_str,
                                                    "bbox": bbox
                                                })
                                                match_id += 1

                # 3. Custom Keywords & Exact Phrases (e.g. "Acme Corp", "Project Titan")
                if custom_keywords and len(custom_keywords) > 0:
                    for kw in custom_keywords:
                        kw_clean = kw.strip()
                        if not kw_clean:
                            continue
                        kw_pattern = rf'\b{re.escape(kw_clean)}\b' if match_whole_word else re.escape(kw_clean)
                        kw_flags = 0 if case_sensitive else re.IGNORECASE
                        for m_kw in re.finditer(kw_pattern, page_text, kw_flags):
                            matched_kw = m_kw.group().strip()
                            if not matched_kw:
                                continue
                            quads = page.search_for(matched_kw)
                            for q in quads:
                                rect = q.rect if hasattr(q, "rect") else fitz.Rect(q)
                                bbox = [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)]
                                if not any(item["page"] == pno + 1 and item["bbox"] == bbox for item in matches):
                                    matches.append({
                                        "id": f"pii_{match_id}",
                                        "page": pno + 1,
                                        "type": "keyword",
                                        "label": f"Keyword: {kw_clean}",
                                        "text": matched_kw,
                                        "bbox": bbox
                                    })
                                    match_id += 1

            return matches
        finally:
            doc.close()

    @staticmethod
    def auto_redact_pii(
        pdf_bytes: bytes,
        items: List[Dict[str, Any]],
        fill_color: Optional[List[float]] = None,
        text_color: Optional[List[float]] = None,
        label: Optional[str] = "[REDACTED]",
        sanitize_metadata: bool = True
    ) -> bytes:
        """
        Apply permanent vector redactions to matched items and purge hidden metadata streams.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        fill_col = fill_color if fill_color is not None else [0.0, 0.0, 0.0]
        if any(c > 1.0 for c in fill_col):
            fill_col = [c / 255.0 for c in fill_col]
        txt_col = text_color if text_color is not None else [1.0, 1.0, 1.0]
        if any(c > 1.0 for c in txt_col):
            txt_col = [c / 255.0 for c in txt_col]
            
        try:
            pages_to_redact = set()
            for item in items:
                pno = item.get("page", 1)
                if not (1 <= pno <= len(doc)):
                    continue
                bbox = item.get("bbox")
                if not bbox or len(bbox) != 4:
                    continue
                page = doc[pno - 1]
                rect = fitz.Rect(bbox)
                # Expand rect slightly by 0.5pt for clean edge coverage
                expanded_rect = fitz.Rect(rect.x0 - 0.5, rect.y0 - 0.5, rect.x1 + 0.5, rect.y1 + 0.5)
                lbl = item.get("label_text", label or "")
                
                page.add_redact_annot(
                    expanded_rect,
                    text=lbl if (lbl and lbl.strip()) else "",
                    fontname="hebo",
                    fontsize=7.5,
                    text_color=txt_col,
                    fill=fill_col,
                    align=fitz.TEXT_ALIGN_CENTER
                )
                pages_to_redact.add(pno - 1)
                
            for pno in pages_to_redact:
                doc[pno].apply_redactions(
                    images=fitz.PDF_REDACT_IMAGE_NONE,
                    graphics=fitz.PDF_REDACT_LINE_ART_NONE
                )
                
            if sanitize_metadata:
                try:
                    doc.scrub(
                        attached_files=True,
                        clean_pages=True,
                        embedded_files=True,
                        hidden_text=False,
                        javascript=True,
                        metadata=True,
                        redactions=True,
                        reset_fields=False,
                        reset_responses=False,
                        thumbnails=True,
                        xml_metadata=True
                    )
                except Exception:
                    pass
                
            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # Feature 3: Text Markup Suite
    @staticmethod
    def add_text_markup(
        pdf_bytes: bytes,
        page_num: int,
        markup_type: str,
        bboxes: Optional[List[List[float]]] = None,
        search_text: Optional[str] = None,
        color: Optional[List[float]] = None
    ) -> bytes:
        """Add text markup annotations (highlight, underline, strikeout, squiggly) to page."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        default_colors = {
            "highlight": [1.0, 0.95, 0.0],
            "underline": [0.1, 0.65, 0.3],
            "strikeout": [0.85, 0.15, 0.15],
            "squiggly": [0.55, 0.25, 0.8]
        }
        col = color or default_colors.get(markup_type.lower(), [1.0, 0.95, 0.0])
        if any(c > 1.0 for c in col):
            col = [c / 255.0 for c in col]
            
        try:
            if not (1 <= page_num <= len(doc)):
                raise ValueError("Invalid page number")
            page = doc[page_num - 1]
            
            quad_list = []
            if bboxes:
                for b in bboxes:
                    if len(b) == 4:
                        quad_list.append(fitz.Rect(b).quad)
            elif search_text and search_text.strip():
                quad_list = page.search_for(search_text.strip())
                
            mtype = markup_type.lower()
            for q in quad_list:
                annot = None
                if mtype == "highlight":
                    annot = page.add_highlight_annot(q)
                elif mtype == "underline":
                    annot = page.add_underline_annot(q)
                elif mtype in ("strikeout", "strikethrough", "strike"):
                    annot = page.add_strikeout_annot(q)
                elif mtype in ("squiggly", "squiggle"):
                    annot = page.add_squiggly_annot(q)
                else:
                    annot = page.add_highlight_annot(q)
                    
                if annot:
                    annot.set_colors(stroke=col)
                    annot.update()
                    
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    # Feature 4: Visual Document Comparison
    @staticmethod
    def compare_documents(
        doc_a_bytes: bytes,
        doc_b_bytes: bytes,
        page_a: int = 1,
        page_b: int = 1,
        zoom: float = 1.5
    ) -> Dict[str, Any]:
        """Compare two PDF pages visually and generate side-by-side and pixel diff overlay images."""
        import base64
        from PIL import Image, ImageChops
        
        doc_a = fitz.open(stream=doc_a_bytes, filetype="pdf")
        doc_b = fitz.open(stream=doc_b_bytes, filetype="pdf")
        try:
            p_a = max(0, min(page_a - 1, len(doc_a) - 1))
            p_b = max(0, min(page_b - 1, len(doc_b) - 1))
            
            mat = fitz.Matrix(zoom, zoom)
            pix_a = doc_a[p_a].get_pixmap(matrix=mat, alpha=False)
            pix_b = doc_b[p_b].get_pixmap(matrix=mat, alpha=False)
            
            img_a = Image.open(io.BytesIO(pix_a.tobytes("png"))).convert("RGB")
            img_b = Image.open(io.BytesIO(pix_b.tobytes("png"))).convert("RGB")
            
            w = max(img_a.width, img_b.width)
            h = max(img_a.height, img_b.height)
            
            canvas_a = Image.new("RGB", (w, h), (255, 255, 255))
            canvas_a.paste(img_a, (0, 0))
            
            canvas_b = Image.new("RGB", (w, h), (255, 255, 255))
            canvas_b.paste(img_b, (0, 0))
            
            diff = ImageChops.difference(canvas_a, canvas_b)
            diff_gray = diff.convert("L")
            
            hist = diff_gray.histogram()
            non_zero_pixels = sum(hist[1:])
            total_pixels = w * h
            diff_percentage = round((non_zero_pixels / total_pixels) * 100, 2)
            similarity_percentage = round(100.0 - diff_percentage, 2)
            
            diff_overlay = Image.new("RGBA", (w, h), (255, 255, 255, 255))
            pixels_a = canvas_a.load()
            pixels_b = canvas_b.load()
            pixels_diff = diff_overlay.load()
            
            for y in range(h):
                for x in range(w):
                    pa = pixels_a[x, y]
                    pb = pixels_b[x, y]
                    if pa != pb:
                        lum_a = 0.299 * pa[0] + 0.587 * pa[1] + 0.114 * pa[2]
                        lum_b = 0.299 * pb[0] + 0.587 * pb[1] + 0.114 * pb[2]
                        if lum_a < lum_b:
                            pixels_diff[x, y] = (239, 68, 68, 255)
                        else:
                            pixels_diff[x, y] = (16, 185, 129, 255)
                    else:
                        avg = int(0.299 * pa[0] + 0.587 * pa[1] + 0.114 * pa[2])
                        dim = int(avg * 0.7 + 76)
                        pixels_diff[x, y] = (dim, dim, dim, 255)
                        
            def to_b64(img):
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
                
            return {
                "page_a": page_a,
                "page_b": page_b,
                "total_pages_a": len(doc_a),
                "total_pages_b": len(doc_b),
                "similarity_score": similarity_percentage,
                "diff_pixels": non_zero_pixels,
                "is_identical": non_zero_pixels == 0,
                "image_a": to_b64(canvas_a),
                "image_b": to_b64(canvas_b),
                "diff_image": to_b64(diff_overlay)
            }
        finally:
            doc_a.close()
            doc_b.close()

    # Feature 5: Format Conversions
    @staticmethod
    def convert_images_to_pdf(images_data: List[Tuple[str, bytes]]) -> bytes:
        """Convert a list of (filename, image_bytes) into a single PDF."""
        doc = fitz.open()
        try:
            for fname, img_bytes in images_data:
                ext = os.path.splitext(fname)[1].lower().lstrip(".") or "png"
                img_doc = fitz.open(stream=img_bytes, filetype=ext)
                pdf_bytes = img_doc.convert_to_pdf()
                img_pdf = fitz.open("pdf", pdf_bytes)
                doc.insert_pdf(img_pdf)
                img_doc.close()
                img_pdf.close()
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()

    @staticmethod
    def convert_pdf_to_images_zip(pdf_bytes: bytes, dpi: int = 150, image_format: str = "png") -> bytes:
        """Convert each PDF page into high-resolution images and return as a ZIP file."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        zip_buf = io.BytesIO()
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        fmt = image_format.lower() if image_format.lower() in ("png", "jpeg", "jpg") else "png"
        ext = "jpg" if fmt in ("jpeg", "jpg") else "png"
        
        try:
            with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for idx, page in enumerate(doc):
                    pix = page.get_pixmap(matrix=mat, alpha=(ext == "png"))
                    img_data = pix.tobytes(ext)
                    zf.writestr(f"page_{idx + 1:03d}.{ext}", img_data)
            return zip_buf.getvalue()
        finally:
            doc.close()

    # Feature 8: Automatic Margin Trimming
    @staticmethod
    def trim_margins(
        pdf_bytes: bytes,
        page_num: int = 0,
        padding_pt: float = 18.0
    ) -> bytes:
        """Automatically detect content boundaries on page(s) and trim whitespace margins."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            target_pages = [page_num - 1] if (1 <= page_num <= len(doc)) else range(len(doc))
            for pno in target_pages:
                page = doc[pno]
                content_rects = []
                
                blocks = page.get_text("blocks")
                for b in blocks:
                    if b[4].strip():
                        content_rects.append(fitz.Rect(b[:4]))
                        
                for d in page.get_drawings():
                    rect = d.get("rect")
                    if rect:
                        content_rects.append(fitz.Rect(rect))
                        
                for img_info in page.get_images():
                    for r in page.get_image_rects(img_info[0]):
                        content_rects.append(fitz.Rect(r))
                        
                if content_rects:
                    union_rect = content_rects[0]
                    for r in content_rects[1:]:
                        union_rect |= r
                        
                    padded_rect = fitz.Rect(
                        max(0, union_rect.x0 - padding_pt),
                        max(0, union_rect.y0 - padding_pt),
                        min(page.rect.width, union_rect.x1 + padding_pt),
                        min(page.rect.height, union_rect.y1 + padding_pt)
                    )
                    
                    if padded_rect.width > 20 and padded_rect.height > 20:
                        page.set_cropbox(padded_rect)
                        
            output = io.BytesIO()
            doc.save(output, garbage=3, deflate=True)
            return output.getvalue()
        finally:
            doc.close()


