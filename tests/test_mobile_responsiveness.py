import re
import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestMobileResponsiveness:
    """Test suite for Feature B8: Mobile Responsiveness & Breakpoint Architecture."""

    def test_mobile_dom_elements_present_in_index_html(self):
        with open("templates/index.html", "r", encoding="utf-8") as f:
            html = f.read()

        soup = BeautifulSoup(html, "html.parser")

        # 1. Navbar mobile sidebar toggle
        btn_nav_toggle = soup.find(id="btnNavMobileSidebar")
        assert btn_nav_toggle is not None, "Missing #btnNavMobileSidebar in navbar"
        assert "mobile-only-inline" in btn_nav_toggle.get("class", [])

        # 2. Mobile sidebar header and close button
        mobile_header = soup.find(id="sidebarMobileHeader")
        assert mobile_header is not None, "Missing #sidebarMobileHeader in sidebar"
        btn_close_sidebar = soup.find(id="btnCloseMobileSidebar")
        assert btn_close_sidebar is not None, "Missing #btnCloseMobileSidebar"

        # 3. Mobile sidebar backdrop overlay
        backdrop = soup.find(id="sidebarBackdrop")
        assert backdrop is not None, "Missing #sidebarBackdrop overlay"

        # 4. Viewer toolbar mobile sidebar toggle
        btn_viewer_toggle = soup.find(id="btnMobileSidebarToggle")
        assert btn_viewer_toggle is not None, "Missing #btnMobileSidebarToggle in viewer toolbar"
        assert "mobile-only-inline" in btn_viewer_toggle.get("class", [])

        # 5. Mobile thumbnails panel close button
        btn_close_preview = soup.find(id="btnCloseMobilePreview")
        assert btn_close_preview is not None, "Missing #btnCloseMobilePreview in thumbnails panel"

    def test_mobile_responsive_css_breakpoints_in_style_css(self):
        with open("static/css/style.css", "r", encoding="utf-8") as f:
            css = f.read()

        # Check key media query breakpoints
        assert "@media (max-width: 1024px)" in css
        assert "@media (max-width: 899px)" in css
        assert "@media (max-width: 640px)" in css
        assert "@media (max-width: 380px)" in css

        # Check utility and responsive drawer classes
        assert ".mobile-only" in css
        assert ".mobile-only-inline" in css
        assert ".sidebar-backdrop" in css
        assert "body.mobile-drawer-open" in css
        assert ".sidebar.mobile-open" in css
        assert ".right-preview-panel.mobile-open" in css

        # Check iOS Safari auto-zoom prevention (16px minimum font size)
        assert "font-size: 16px !important;" in css

    def test_mobile_javascript_drawer_controllers_in_app_js(self):
        with open("static/js/app.js", "r", encoding="utf-8") as f:
            js = f.read()

        # Check element bindings
        assert "btnMobileSidebarToggle" in js
        assert "btnNavMobileSidebar" in js
        assert "btnCloseMobileSidebar" in js
        assert "btnCloseMobilePreview" in js
        assert "sidebarBackdrop" in js

        # Check mobile drawer functions & resize cleanup
        assert "openMobileSidebar" in js
        assert "closeMobileSidebar" in js
        assert "openMobileThumbnails" in js
        assert "closeMobileThumbnails" in js
        assert "mobile-drawer-open" in js
        assert "isMobile" in js

    def test_no_standard_unicode_emojis_in_source_files(self):
        emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]', flags=re.UNICODE)
        for fname in ["templates/index.html", "static/css/style.css", "static/js/app.js"]:
            with open(fname, "r", encoding="utf-8") as f:
                content = f.read()
            matches = emoji_pattern.findall(content)
            assert len(matches) == 0, f"Found emojis in {fname}: {matches}"

    def test_live_server_delivers_responsive_elements(self):
        response = client.get("/")
        assert response.status_code == 200
        html = response.text
        assert "sidebarBackdrop" in html
        assert "btnMobileSidebarToggle" in html
        assert "btnNavMobileSidebar" in html
        assert "btnCloseMobileSidebar" in html
        assert "btnCloseMobilePreview" in html
