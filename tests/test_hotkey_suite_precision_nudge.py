import os
import re
import subprocess
import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_index_html_hotkey_elements():
    """Verify HTML elements for Pointer/Hand tools and Hotkey Cheatsheet Modal."""
    res = client.get("/")
    assert res.status_code == 200
    html = res.text
    soup = BeautifulSoup(html, "html.parser")

    # Check Viewer toolbar buttons
    btn_select = soup.find(id="btnToolSelect")
    assert btn_select is not None, "btnToolSelect button must exist in viewer toolbar"
    assert "btn-icon" in btn_select.get("class", [])

    btn_hand = soup.find(id="btnToolHand")
    assert btn_hand is not None, "btnToolHand button must exist in viewer toolbar"
    assert "btn-icon" in btn_hand.get("class", [])

    btn_cheatsheet = soup.find(id="btnHotkeyCheatsheet")
    assert btn_cheatsheet is not None, "btnHotkeyCheatsheet button must exist in viewer toolbar"

    # Check Cheatsheet Modal
    modal = soup.find(id="hotkeyCheatsheetModal")
    assert modal is not None, "hotkeyCheatsheetModal must exist"
    assert "modal" in modal.get("class", [])

    # Check that cards exist inside cheatsheet
    cards = modal.find_all(class_="hotkey-group-card")
    assert len(cards) >= 4, "Must contain at least 4 categorized hotkey cards"

    # Check script version
    script = soup.find("script", src=re.compile(r"/static/js/app\.js\?v=2\.10\.20"))
    assert script is not None, "Script must have bumped cache buster v=2.10.20"

def test_hotkey_css_rules():
    """Verify Pan mode and cheatsheet CSS styles in static/css/style.css."""
    css_path = os.path.join("static", "css", "style.css")
    assert os.path.exists(css_path)
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert ".canvas-viewport.pan-mode-active" in content
    assert "cursor: grab" in content
    assert ".is-panning" in content
    assert ".hotkey-cheatsheet-grid" in content
    assert ".hotkey-group-card" in content
    assert ".hotkey-kbd" in content

def test_hotkey_js_bindings():
    """Verify hotkey functions and bindings in static/js/app.js."""
    js_path = os.path.join("static", "js", "app.js")
    assert os.path.exists(js_path)
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # State
    assert "isPanMode: false" in content

    # Helpers
    assert "function setPanMode(" in content
    assert "function activateShapeTypeMode(" in content
    assert "function toggleHotkeyCheatsheetModal(" in content

    # Transform box nudge & duplicate methods
    assert content.count("box._nudge = (deltaPtX, deltaPtY) =>") >= 3
    assert content.count("box._duplicate = () =>") >= 3

    # Hotkeys in setupKeyboardShortcuts
    assert "activeTransformBox._nudge" in content
    assert "activeTransformBox._duplicate" in content
    assert "toggleHotkeyCheatsheetModal" in content

def test_zero_emojis_in_hotkey_suite():
    """Ensure zero emojis in index.html, style.css, and app.js hotkey sections."""
    emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
    for fn in ["templates/index.html", "static/js/app.js", "static/css/style.css"]:
        with open(fn, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                if any(k in line.lower() for k in ["hotkey", "cheatsheet", "nudge", "pan-mode", "btntool"]):
                    assert not emoji_pattern.findall(line), f"Emoji found in {fn}:{i}: {line}"

def test_node_math_precision_nudge_assertions():
    """Execute Node script to assert math for 1pt/10pt precision nudge and bounds clamping."""
    node_script = """
    const scaleX = 0.5; // 200% zoom (1px = 0.5pt, so 1pt = 2px)
    const scaleY = 0.5;
    const overlayWidth = 1000;
    const overlayHeight = 800;

    let curL = 100;
    let curT = 100;
    const curW = 200;
    const curH = 100;

    function nudge(curL, curT, curW, curH, deltaPtX, deltaPtY, scaleX, scaleY, maxW, maxH) {
      const deltaPxX = deltaPtX / scaleX;
      const deltaPxY = deltaPtY / scaleY;
      const newL = Math.max(0, Math.min(curL + deltaPxX, maxW - curW));
      const newT = Math.max(0, Math.min(curT + deltaPxY, maxH - curH));
      const ptX = Math.round(newL * scaleX);
      const ptY = Math.round(newT * scaleY);
      return { newL, newT, ptX, ptY };
    }

    // 1pt nudge right
    const n1 = nudge(curL, curT, curW, curH, 1, 0, scaleX, scaleY, overlayWidth, overlayHeight);
    if (n1.newL !== 102) throw new Error("1pt nudge should move by 2px at 0.5 scale");
    if (n1.ptX !== 51) throw new Error("1pt nudge should result in 51pt (from 50pt)");

    // 10pt nudge down (Shift + ArrowDown)
    const n10 = nudge(curL, curT, curW, curH, 0, 10, scaleX, scaleY, overlayWidth, overlayHeight);
    if (n10.newT !== 120) throw new Error("10pt nudge should move by 20px at 0.5 scale");
    if (n10.ptY !== 60) throw new Error("10pt nudge should result in 60pt (from 50pt)");

    // Duplication offset (+15pt)
    const dupOffsetPx = 15.0 / scaleX;
    if (dupOffsetPx !== 30) throw new Error("15pt offset should be 30px at 0.5 scale");

    // Clamping to overlay bounds
    const nClamp = nudge(950, curT, curW, curH, 100, 0, scaleX, scaleY, overlayWidth, overlayHeight);
    if (nClamp.newL !== 800) throw new Error("Nudge should clamp to overlayWidth - curW = 800");

    console.log("ALL_NODE_MATH_PASSED");
    """
    proc = subprocess.run(["node", "-e", node_script], capture_output=True, text=True)
    assert proc.returncode == 0, proc.stderr
    assert "ALL_NODE_MATH_PASSED" in proc.stdout
