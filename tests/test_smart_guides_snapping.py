import os
import re
from bs4 import BeautifulSoup
import pytest

def test_smart_guides_ui_elements_in_html():
    index_path = os.path.join(os.path.dirname(__file__), "..", "templates", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Overlay exists inside pageCanvasWrapper
    wrapper = soup.find(id="pageCanvasWrapper")
    assert wrapper is not None, "pageCanvasWrapper must exist"
    guide_overlay = wrapper.find(id="smartGuideOverlay")
    assert guide_overlay is not None, "smartGuideOverlay SVG must exist inside pageCanvasWrapper"
    assert "smart-guide-overlay" in guide_overlay.get("class", []), "smartGuideOverlay must have class smart-guide-overlay"

    # 2. Toggle button in viewer toolbar
    btn_snap = soup.find(id="btnToggleSnapping")
    assert btn_snap is not None, "btnToggleSnapping button must exist in viewer toolbar"
    assert "active" in btn_snap.get("class", []), "btnToggleSnapping must be active by default"
    assert "Alt" in btn_snap.get("title", ""), "btnToggleSnapping title must mention Alt bypass"

    # 3. Strict emoji check
    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]'
    )
    matches = emoji_pattern.findall(str(btn_snap) + str(guide_overlay))
    assert len(matches) == 0, f"Found emojis in Smart Guides HTML: {matches}"


def test_smart_guides_css_styles():
    css_path = os.path.join(os.path.dirname(__file__), "..", "static", "css", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()

    assert ".smart-guide-overlay" in css
    assert ".smart-guide-line" in css
    assert ".smart-guide-line.guide-page" in css
    assert ".smart-guide-line.guide-object" in css
    assert ".smart-guide-line.guide-spacing" in css
    assert ".smart-guide-badge" in css
    assert ".smart-guide-spacing-tick" in css

    # Strict emoji check
    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]'
    )
    matches = emoji_pattern.findall(css[css.find(".smart-guide-overlay"):])
    assert len(matches) == 0, f"Found emojis in smart guide CSS: {matches}"


def test_smart_guides_js_functions_and_integration():
    js_path = os.path.join(os.path.dirname(__file__), "..", "static", "js", "app.js")
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Verify functions are defined and exported
    assert "function getCandidateSnapTargets(" in js
    assert "function calculateSmartSnapping(" in js
    assert "function getSmartGuideOverlay(" in js
    assert "function clearSmartGuides(" in js
    assert "function renderSmartGuides(" in js

    assert "window.calculateSmartSnapping = calculateSmartSnapping;" in js
    assert "window.renderSmartGuides = renderSmartGuides;" in js
    assert "window.clearSmartGuides = clearSmartGuides;" in js
    assert "window.getCandidateSnapTargets = getCandidateSnapTargets;" in js

    # Verify state initialization
    assert "smartSnappingEnabled: true" in js

    # Verify integration in makeDraggable
    assert "cachedSnapTargets = getCandidateSnapTargets(elem);" in js
    assert "const snap = calculateSmartSnapping({" in js
    assert "renderSmartGuides(snap.guides," in js
    assert "clearSmartGuides();" in js

    # Verify integration in makeResizable
    assert "resizeDir: dir" in js

    # Verify toggle button handler in setupViewerControls
    assert "btnToggleSnapping.addEventListener(" in js
    assert "state.smartSnappingEnabled = !state.smartSnappingEnabled;" in js

    # Strict emoji check on smart guides JS block
    start_idx = js.find("// Smart Magnetic Alignment Guides & Precision Snapping (Plan Q1)")
    end_idx = js.find("// Canvas Interaction & WYSIWYG")
    assert start_idx != -1 and end_idx != -1
    smart_guides_js = js[start_idx:end_idx]

    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]'
    )
    matches = emoji_pattern.findall(smart_guides_js)
    assert len(matches) == 0, f"Found emojis in smart guides JS: {matches}"


def test_smart_snapping_mathematical_precision():
    import subprocess
    node_script = """
const fs = require('fs');
const js = fs.readFileSync('static/js/app.js', 'utf8');

global.window = {};
global.state = { smartSnappingEnabled: true, pageWidthPt: 600, pageHeightPt: 800 };
global.document = {
  getElementById: (id) => {
    if (id === 'interactiveOverlay') {
      return {
        getBoundingClientRect: () => ({ width: 600, height: 800 }),
        querySelectorAll: () => []
      };
    }
    if (id === 'smartGuideOverlay') {
      return {
        setAttribute: () => {},
        style: {},
        firstChild: null,
        appendChild: () => {},
        removeChild: () => {}
      };
    }
    return null;
  }
};

eval(js.substring(js.indexOf('function getCandidateSnapTargets'), js.indexOf('// Canvas Interaction & WYSIWYG')));

// 1. Alt Key bypass
const r1 = calculateSmartSnapping({ x: 100, y: 100, width: 50, height: 50, altKey: true });
if (r1.snappedX !== 100 || r1.snappedY !== 100 || r1.guides.length !== 0) throw new Error('Alt key bypass failed');

// 2. Page Center X Snap (W = 600, Center = 300; element width = 100, x = 248 -> center is 298, diff 2px)
const r2 = calculateSmartSnapping({ x: 248, y: 100, width: 100, height: 50 });
if (r2.snappedX !== 250 || !r2.guides.some(g => g.type === 'page' && g.label === 'Page Center')) throw new Error('Page center X snap failed: ' + r2.snappedX);

// 3. Object Align Left Snap (Target at x: 120, element at x: 122)
const targets = [{ left: 120, right: 200, center: 160, top: 50, bottom: 90, middle: 70, width: 80, height: 40 }];
const r3 = calculateSmartSnapping({ x: 122, y: 200, width: 80, height: 50, cachedTargets: targets });
if (r3.snappedX !== 120 || !r3.guides.some(g => g.type === 'object' && g.label === 'Align Left')) throw new Error('Object align left failed: ' + r3.snappedX);

// 4. Equidistant Spacing Distribution
const targetsSpacing = [
  { left: 20, right: 100, center: 60, top: 100, bottom: 150, middle: 125, width: 80, height: 50 },
  { left: 300, right: 380, center: 340, top: 100, bottom: 150, middle: 125, width: 80, height: 50 }
];
const r4 = calculateSmartSnapping({ x: 162, y: 100, width: 80, height: 50, cachedTargets: targetsSpacing });
if (r4.snappedX !== 160 || !r4.guides.some(g => g.type === 'spacing')) throw new Error('Equal spacing snap failed: ' + r4.snappedX);

// 5. Margin Snapping (0.5 inch = 36pt = 36px when W=600, pageWidthPt=600)
const r5 = calculateSmartSnapping({ x: 38, y: 100, width: 100, height: 50 });
if (r5.snappedX !== 36 || !r5.guides.some(g => g.type === 'page' && g.label.includes('Margin'))) throw new Error('Margin snap failed: ' + r5.snappedX);

// 6. Page Middle Y Snap (H = 800, Middle = 400; element height = 60, y = 368 -> middle is 398, diff 2px)
const r6 = calculateSmartSnapping({ x: 100, y: 368, width: 100, height: 60 });
if (r6.snappedY !== 370 || !r6.guides.some(g => g.type === 'page' && g.label === 'Page Middle')) throw new Error('Page middle Y snap failed: ' + r6.snappedY);

// 7. Object Vertical Align Middle (Target middle at 300; element height = 80, y = 258 -> middle is 298)
const vTargets = [{ left: 50, right: 150, center: 100, top: 250, bottom: 350, middle: 300, width: 100, height: 100 }];
const r7 = calculateSmartSnapping({ x: 200, y: 258, width: 80, height: 80, cachedTargets: vTargets });
if (r7.snappedY !== 260 || !r7.guides.some(g => g.type === 'object' && g.label === 'Align Middle')) throw new Error('Object align middle failed: ' + r7.snappedY);

// 8. Resizing East snap to Target Left (Target left at 400; resizing element x=100, width=298 -> right edge 398)
const r8 = calculateSmartSnapping({ x: 100, y: 100, width: 298, height: 100, isResize: true, resizeDir: 'e', cachedTargets: [{ left: 400, right: 500, center: 450, top: 100, bottom: 200, middle: 150, width: 100, height: 100 }] });
if (r8.snappedWidth !== 300 || !r8.guides.some(g => g.type === 'object' && g.label === 'Snap to Edge')) throw new Error('Resize east snap failed: ' + r8.snappedWidth);

// 9. Resizing South snap to Page Margin Bottom (0.5" = 36pt = 36px from bottom; H=800 -> guide at 764; x=100, y=500, height=262 -> bottom 762)
const r9 = calculateSmartSnapping({ x: 100, y: 500, width: 100, height: 262, isResize: true, resizeDir: 's' });
if (r9.snappedHeight !== 264 || !r9.guides.some(g => g.type === 'page' && g.label.includes('Bottom Margin'))) throw new Error('Resize south snap failed: ' + r9.snappedHeight);

// 10. Toggle disabled snapping check
state.smartSnappingEnabled = false;
const r10 = calculateSmartSnapping({ x: 248, y: 368, width: 100, height: 60 });
if (r10.snappedX !== 248 || r10.snappedY !== 368 || r10.guides.length !== 0) throw new Error('Disabled snapping failed');
state.smartSnappingEnabled = true;

console.log('OK');
"""
    res = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), ".."))
    assert res.returncode == 0, f"Node snapping validation failed:\n{res.stderr}"
    assert "OK" in res.stdout


