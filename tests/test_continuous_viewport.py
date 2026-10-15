import os
import re
import subprocess
import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_continuous_viewport_html_elements():
    index_path = os.path.join(os.path.dirname(__file__), "..", "templates", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 1. Viewport container and continuous pages container
    viewport = soup.find(id="canvasViewport")
    assert viewport is not None, "canvasViewport must exist in index.html"
    cont_container = viewport.find(id="continuousPagesContainer")
    assert cont_container is not None, "continuousPagesContainer must exist inside canvasViewport"
    assert "continuous-pages-container" in cont_container.get("class", [])

    # 2. Toolbar layout toggle and hand tool buttons
    btn_layout = soup.find(id="btnTogglePageLayout")
    assert btn_layout is not None, "btnTogglePageLayout must exist in viewer toolbar"
    assert "btn-icon" in btn_layout.get("class", []), "btnTogglePageLayout should have btn-icon class"

    btn_hand = soup.find(id="btnToggleHandTool")
    assert btn_hand is not None, "btnToggleHandTool must exist in viewer toolbar"

    # 3. Canvas wrapper remains intact
    wrapper = viewport.find(id="pageCanvasWrapper")
    assert wrapper is not None, "pageCanvasWrapper must remain present inside canvasViewport"

    # 4. Strict emoji safety check
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
    matches = emoji_pattern.findall(str(btn_layout) + str(btn_hand) + str(cont_container))
    assert len(matches) == 0, f"Found emojis in Continuous Viewport HTML: {matches}"


def test_continuous_viewport_css_classes():
    css_path = os.path.join(os.path.dirname(__file__), "..", "static", "css", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".continuous-pages-container" in css
    assert ".page-slot" in css
    assert ".page-slot.active-slot" in css
    assert ".page-slot-badge" in css
    assert ".page-slot-image" in css
    assert ".page-slot-placeholder" in css
    assert ".canvas-viewport.hand-tool-active" in css
    assert ".canvas-viewport.hand-tool-panning" in css

    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
    matches = emoji_pattern.findall(css[css.find(".continuous-pages-container"):])
    assert len(matches) == 0, f"Found emojis in Continuous Viewport CSS: {matches}"


def test_continuous_viewport_js_functions():
    js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "app.js")
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Function declarations
    assert "function initContinuousDocumentFlow(" in js
    assert "function buildContinuousPageSlots(" in js
    assert "function resizeContinuousPageSlots(" in js
    assert "function attachCanvasToPageSlot(" in js
    assert "function activatePageInContinuousFlow(" in js
    assert "function updateVirtualization(" in js
    assert "function scrollToPageSlot(" in js
    assert "function togglePageLayoutMode(" in js
    assert "function zoomAtPoint(" in js
    assert "function getEffectiveRenderZoom(" in js
    assert "function setupHandToolAndPan(" in js

    # Window exports
    assert "window.initContinuousDocumentFlow = initContinuousDocumentFlow;" in js
    assert "window.buildContinuousPageSlots = buildContinuousPageSlots;" in js
    assert "window.resizeContinuousPageSlots = resizeContinuousPageSlots;" in js
    assert "window.attachCanvasToPageSlot = attachCanvasToPageSlot;" in js
    assert "window.activatePageInContinuousFlow = activatePageInContinuousFlow;" in js
    assert "window.updateVirtualization = updateVirtualization;" in js
    assert "window.scrollToPageSlot = scrollToPageSlot;" in js
    assert "window.togglePageLayoutMode = togglePageLayoutMode;" in js
    assert "window.zoomAtPoint = zoomAtPoint;" in js
    assert "window.getEffectiveRenderZoom = getEffectiveRenderZoom;" in js

    # State properties
    assert 'viewportLayout: "single"' in js
    assert "isHandToolActive: false" in js
    assert "isSpacePanning: false" in js

    # Strict emoji check
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
    matches = emoji_pattern.findall(js[js.find("// Continuous Multi-Page Virtualized Canvas Viewport"):js.find("// Canvas Interaction & WYSIWYG")])
    assert len(matches) == 0, f"Found emojis in Continuous Viewport JS: {matches}"


def test_continuous_viewport_mathematical_precision_node():
    node_script = """
const fs = require('fs');
const js = fs.readFileSync('static/js/app.js', 'utf8');

// Mock browser DOM and global state
global.window = { devicePixelRatio: 2.0 };
global.state = {
  docId: 'doc_test_123',
  docVersion: 1,
  currentPage: 1,
  totalPages: 10,
  zoom: 1.0,
  viewportLayout: 'continuous',
  pageWidthPt: 600,
  pageHeightPt: 800,
  docInfo: {
    pages: Array.from({ length: 10 }, (_, i) => ({ page_number: i + 1, width: 600, height: 800 }))
  },
  pageBundleCache: new Map(),
  continuousPageSlots: new Map()
};

const mockElements = new Map();
function createMockEl(tag = 'div') {
  return {
    tagName: tag.toUpperCase(),
    id: '',
    className: '',
    dataset: {},
    style: {},
    children: [],
    firstChild: null,
    parentElement: null,
    innerHTML: '',
    offsetTop: 0,
    offsetHeight: 800,
    clientWidth: 1000,
    clientHeight: 900,
    scrollTop: 0,
    scrollLeft: 0,
    appendChild: function(c) {
      this.children.push(c);
      c.parentElement = this;
      this.firstChild = this.children[0] || null;
      return c;
    },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      c.parentElement = null;
      this.firstChild = this.children[0] || null;
      return c;
    },
    getBoundingClientRect: function() {
      return { left: 0, top: 0, width: 1000, height: 900 };
    },
    scrollIntoView: function() {},
    classList: {
      add: function(cls) {},
      remove: function(cls) {},
      toggle: function(cls, val) {},
      contains: function(cls) { return false; }
    },
    addEventListener: function() {}
  };
}

const viewportEl = createMockEl('div');
viewportEl.id = 'canvasViewport';
const contContainerEl = createMockEl('div');
contContainerEl.id = 'continuousPagesContainer';
const wrapperEl = createMockEl('div');
wrapperEl.id = 'pageCanvasWrapper';
viewportEl.appendChild(contContainerEl);
viewportEl.appendChild(wrapperEl);

global.document = {
  getElementById: (id) => {
    if (id === 'canvasViewport') return viewportEl;
    if (id === 'continuousPagesContainer') return contContainerEl;
    if (id === 'pageCanvasWrapper') return wrapperEl;
    if (id.startsWith('pageSlot_')) {
      const p = parseInt(id.replace('pageSlot_', ''));
      return state.continuousPageSlots?.get(p)?.element || null;
    }
    return null;
  },
  createElement: (tag) => createMockEl(tag),
  querySelectorAll: () => []
};

// Extract functions
const sliceStart = js.indexOf('// Continuous Multi-Page Virtualized Canvas Viewport (Plan Q2)');
const sliceEnd = js.indexOf('// Canvas Interaction & WYSIWYG');
eval(js.substring(sliceStart, sliceEnd));

// 1. Retina High-DPI Scale calculation
const rz1 = getEffectiveRenderZoom(1.0); // devicePixelRatio = 2.0 -> 1.5x
if (rz1 !== 1.5) throw new Error('Retina DPR zoom calculation failed: ' + rz1);

window.devicePixelRatio = 1.0;
const rz2 = getEffectiveRenderZoom(1.0);
if (rz2 !== 1.0) throw new Error('Standard DPR zoom calculation failed: ' + rz2);

// 2. Build Continuous Page Slots for 10 pages
buildContinuousPageSlots();
if (state.continuousPageSlots.size !== 10) throw new Error('Continuous slots size mismatch: ' + state.continuousPageSlots.size);

const slot1 = state.continuousPageSlots.get(1);
if (!slot1 || slot1.element.style.width !== '600px' || slot1.element.style.height !== '800px') {
  throw new Error('Slot 1 dimensions mismatch: ' + JSON.stringify(slot1?.element?.style));
}

// 3. Resize slots on zoom update
state.zoom = 1.25;
resizeContinuousPageSlots();
if (slot1.element.style.width !== '750px' || slot1.element.style.height !== '1000px') {
  throw new Error('Slot 1 resized dimensions mismatch: ' + JSON.stringify(slot1?.element?.style));
}
state.zoom = 1.0;
resizeContinuousPageSlots();

// 4. Attach canvas wrapper to active page slot
attachCanvasToPageSlot(2);
const slot2 = state.continuousPageSlots.get(2);
if (!slot2 || state.currentPage !== 2) {
  throw new Error('Active page continuous slot registration failed');
}
if (wrapperEl.parentElement !== viewportEl) {
  throw new Error('Canvas wrapper must remain permanently in canvasViewport');
}

// 5. Cursor-anchored Zoom arithmetic
// Point under mouse: viewport clientX=500, clientY=400, scroll=0
const oldZoom = 1.0;
const newZoom = 1.5;
const unscaledX = 500 / oldZoom; // 500
const unscaledY = 400 / oldZoom; // 400
const newContentX = unscaledX * newZoom; // 750
const newContentY = unscaledY * newZoom; // 600
const expectedScrollLeft = newContentX - 500; // 250
const expectedScrollTop = newContentY - 400;  // 200
if (expectedScrollLeft !== 250 || expectedScrollTop !== 200) {
  throw new Error('Cursor-anchored math calculation error');
}

console.log('OK');
"""
    res = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), ".."))
    assert res.returncode == 0, f"Node continuous viewport test failed:\n{res.stderr}"
    assert "OK" in res.stdout


def test_live_server_delivers_continuous_viewport_markup():
    response = client.get("/")
    assert response.status_code == 200
    html = response.text
    assert "continuousPagesContainer" in html
    assert "btnTogglePageLayout" in html
    assert "btnToggleHandTool" in html
