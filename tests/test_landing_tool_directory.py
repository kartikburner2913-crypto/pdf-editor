import os
import re
from bs4 import BeautifulSoup
import pytest

def test_landing_tool_directory_html_structure():
    index_path = os.path.join(os.path.dirname(__file__), "..", "templates", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # 1. Tool Directory Section
    directory_section = soup.find(id="toolDirectorySection")
    assert directory_section is not None, "toolDirectorySection element must exist"

    # 2. Search Bar
    search_input = soup.find(id="toolSearchInput")
    assert search_input is not None, "toolSearchInput must exist"
    clear_btn = soup.find(id="btnClearToolSearch")
    assert clear_btn is not None, "btnClearToolSearch must exist"

    # 3. Category Filter Tabs
    cat_bar = soup.find(id="toolCategoriesBar")
    assert cat_bar is not None, "toolCategoriesBar must exist"
    cat_btns = cat_bar.find_all("button", class_="tool-cat-btn")
    categories = [btn.get("data-category") for btn in cat_btns]
    assert set(categories) == {"all", "organize", "edit", "convert", "security", "optimize"}, \
        f"Categories mismatch: {categories}"

    # 4. Count badges
    count_all = soup.find(id="countAll")
    assert count_all is not None and count_all.text == "23"
    assert soup.find(id="countOrganize").text == "5"
    assert soup.find(id="countEdit").text == "7"
    assert soup.find(id="countConvert").text == "4"
    assert soup.find(id="countSecurity").text == "4"
    assert soup.find(id="countOptimize").text == "3"
    assert soup.find(id="toolsCountVisible").text == "23"

    # 5. Tool Cards
    cards = directory_section.find_all("div", class_="tool-dir-card")
    assert len(cards) == 23, f"Expected exactly 23 tool cards, found {len(cards)}"

    valid_categories = {"organize", "edit", "convert", "security", "optimize"}
    cat_counts = {cat: 0 for cat in valid_categories}

    for card in cards:
        cat = card.get("data-category")
        assert cat in valid_categories, f"Invalid category '{cat}' on card"
        cat_counts[cat] += 1

        keywords = card.get("data-keywords")
        assert keywords and len(keywords) > 5, "Card must have search keywords"

        h4 = card.find("h4")
        assert h4 and len(h4.text.strip()) > 0, "Card must have a title"

        p = card.find("p")
        assert p and len(p.text.strip()) > 0, "Card must have a description"

        svg = card.find("svg")
        assert svg is not None, f"Card '{h4.text}' must have an SVG icon"

        onclick = card.get("onclick")
        assert onclick and len(onclick) > 0, f"Card '{h4.text}' must have an onclick launch handler"

    assert cat_counts["organize"] == 5
    assert cat_counts["edit"] == 7
    assert cat_counts["convert"] == 4
    assert cat_counts["security"] == 4
    assert cat_counts["optimize"] == 3

    # 6. Active Document Return Banner
    banner = soup.find(id="activeDocReturnBanner")
    assert banner is not None, "activeDocReturnBanner must exist"
    assert soup.find(id="activeDocBannerName") is not None
    assert soup.find(id="btnReturnToWorkspace") is not None

    # 7. Navigation Buttons
    assert soup.find(id="navBrandLogo") is not None, "navBrandLogo must exist for directory navigation"
    assert soup.find(id="btnNavToolsDirectory") is not None, "btnNavToolsDirectory must exist in nav"

    # 8. Empty Search Results State
    empty_state = soup.find(id="toolsEmptySearchState")
    assert empty_state is not None
    assert soup.find(id="emptySearchQueryText") is not None
    assert soup.find(id="btnResetToolFilter") is not None


def test_no_standard_emojis_in_landing_and_app():
    """Verify strictly no unicode emojis are present in templates or app js."""
    emoji_pattern = re.compile(
        r'[\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F900-\U0001F9FF\U00002600-\U000026FF\U00002700-\U000027BF]'
    )

    base_dir = os.path.join(os.path.dirname(__file__), "..")
    files_to_check = [
        os.path.join(base_dir, "templates", "index.html"),
        os.path.join(base_dir, "static", "js", "app.js")
    ]

    for fpath in files_to_check:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        matches = emoji_pattern.findall(content)
        assert len(matches) == 0, f"Found emojis in {os.path.basename(fpath)}: {matches}"
