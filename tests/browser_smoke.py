"""Optional end-to-end browser smoke test with a deterministic converter.

Run: python3 -m tests.browser_smoke
This checks the live local UI, not the real Microsoft conversion engine.
"""
from contextlib import contextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from types import SimpleNamespace
from playwright.sync_api import sync_playwright
from markitdown_local.server import create_server


class FakeConverter:
    def convert(self, path):
        assert Path(path).read_bytes() == b"sample local pdf"
        return SimpleNamespace(text_content="CE-01 | Carrelage au plancher\nVY1 | Vinyle colle")


@contextmanager
def fake_server():
    with TemporaryDirectory() as tmp:
        html = Path(tmp) / "Quantif-Plancher-V7.html"
        html.write_text('<html><body><div><button class="primary" id="exportBtn">Excel</button></div></body></html>', encoding='utf-8')
        frontend = Path(__file__).resolve().parents[1] / "markitdown_local" / "analyse-documents.html"
        srv = create_server(port=0, app_path=html, analysis_path=frontend, converter_factory=FakeConverter)
        thread = Thread(target=srv.serve_forever, daemon=True)
        thread.start()
        try:
            yield srv.server_port
        finally:
            srv.shutdown()
            srv.server_close()
            thread.join(timeout=3)


def main():
    with fake_server() as port, sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        try:
            page = browser.new_page(accept_downloads=True, viewport={"width": 1150, "height": 900}, locale="fr-CA")
            page.goto(f"http://127.0.0.1:{port}/analyse-documents")
            page.wait_for_selector("#choose")
            assert page.get_by_text("Analyse des devis et des finis").count() == 1
            page.locator("#files").set_input_files({"name":"devis.txt","mimeType":"text/plain","buffer":b"sample local pdf"})
            assert "devis.txt" in page.locator("#selected").inner_text()
            page.locator("#convert").click()
            page.wait_for_function("document.querySelectorAll('article.result').length===1")
            assert page.get_by_text("CE-01 | Carrelage au plancher").count() > 0
            assert "0 erreur(s)" in page.locator("#progress").inner_text()
            with page.expect_download() as received:
                page.locator("#exportCsv").click()
            download = received.value
            assert download.suggested_filename == "codes-finis-candidats.csv"
            data = Path(download.path()).read_text(encoding="utf-8-sig")
            assert "CE-01" in data and "VY1" in data
            page.screenshot(path="/mnt/data/markitdown-integration/docs/markitdown_browser_preview.png", full_page=True)
            print("BROWSER: local upload + preview + CSV passed; screenshot captured")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
