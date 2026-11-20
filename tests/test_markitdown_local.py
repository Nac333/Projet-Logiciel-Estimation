"""User-visible contract tests for the opt-in, loopback-only document reader."""
from contextlib import contextmanager
from pathlib import Path
from threading import Thread
from tempfile import TemporaryDirectory
import json
import unittest
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from markitdown_local.server import (
    create_server, extract_finish_candidates, inject_document_link, normalize_filename
)


class DummyResult:
    def __init__(self, text):
        self.text_content = text


class DummyConverter:
    converted_paths = []

    def convert(self, path):
        self.converted_paths.append(path)
        assert Path(path).read_bytes() == b"sample local pdf"
        return DummyResult("# Tableau de finis\nCE-01 | Ceramique au plancher\nVY1 | Vinyle colle\nAucun code ici")


@contextmanager
def local_server(converter_factory=DummyConverter, max_upload=1024):
    with TemporaryDirectory() as folder:
        app_path = Path(folder) / "Quantif-Plancher-V7.html"
        app_path.write_text('<html><body><header><button class="primary" id="exportBtn">Excel</button></header></body></html>', encoding='utf-8')
        analysis_path = Path(folder) / "analyse-documents.html"
        analysis_path.write_text('<!doctype html><title>Analyse documentaire</title>', encoding='utf-8')
        server = create_server(port=0, app_path=app_path, analysis_path=analysis_path,
                               converter_factory=converter_factory, max_upload=max_upload)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield server, f"http://127.0.0.1:{server.server_port}"
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)


def post(url, body, name="devis.pdf", headers=None):
    request = Request(url + "/api/convert?name=" + quote(name), data=body,
                      headers=headers or {"Content-Type": "application/octet-stream"}, method="POST")
    with urlopen(request, timeout=3) as response:
        return response.status, json.loads(response.read())


class ExtractTests(unittest.TestCase):
    def test_candidates_are_evidence_only_and_do_not_infer_materials(self):
        result = extract_finish_candidates("CE-01 | Ceramique\nVY1 | Vinyle\nPL-3 | Plinthe\nCE-01 | Ceramique\nRien")
        self.assertEqual([row["code"] for row in result], ["CE-01", "VY1", "PL-3"])
        self.assertIn("Ceramique", result[0]["extrait"])
        self.assertNotIn("localisation", result[0])

    def test_normalize_filename_drops_path_and_rejects_disguised_uploads(self):
        self.assertEqual(normalize_filename(r"C:\\plans\\DEVIS.PDF"), "DEVIS.PDF")
        self.assertEqual(normalize_filename("../../devis.pdf"), "devis.pdf")
        self.assertRaises(ValueError, normalize_filename, "plans.exe")
        self.assertRaises(ValueError, normalize_filename, "test.pdf\nX: evil")

    def test_injection_only_changes_served_copy_not_source(self):
        original = '<button class="primary" id="exportBtn">Excel</button>'
        result = inject_document_link(original)
        self.assertIn('id="documentsNav"', result)
        self.assertIn('/analyse-documents', result)
        self.assertIn(original, result)
        self.assertEqual(result.count('id="documentsNav"'), 1)
        self.assertEqual(inject_document_link(result), result)


class HttpTests(unittest.TestCase):
    def test_local_html_contains_document_link_and_page_is_available(self):
        with local_server() as (_, base):
            with urlopen(base + "/", timeout=3) as result:
                text = result.read().decode()
                self.assertIn('id="documentsNav"', text)
                self.assertIn('id="exportBtn"', text)
            with urlopen(base + "/analyse-documents", timeout=3) as result:
                self.assertIn("Analyse documentaire", result.read().decode())

    def test_conversion_returns_markdown_codes_and_deletes_temp_file(self):
        DummyConverter.converted_paths = []
        with local_server() as (_, base):
            status, payload = post(base, b"sample local pdf", name="plans/Devis.pdf")
            self.assertEqual(status, 200)
            self.assertEqual(payload["filename"], "Devis.pdf")
            self.assertIn("Tableau de finis", payload["markdown"])
            self.assertEqual([x["code"] for x in payload["finishes"]], ["CE-01", "VY1"])
            self.assertTrue(DummyConverter.converted_paths)
            self.assertFalse(Path(DummyConverter.converted_paths[-1]).exists())

    def test_rejects_unsupported_extension_oversize_and_empty_upload(self):
        with local_server(max_upload=14) as (_, base):
            for name, body, code in [("secret.exe", b"abc", 415), ("devis.pdf", b"x"*20, 413),
                                     ("devis.pdf", b"", 400)]:
                with self.subTest(name=name, code=code):
                    with self.assertRaises(HTTPError) as cm:
                        post(base, body, name=name)
                    self.assertEqual(cm.exception.code, code)

    def test_missing_markitdown_dependency_reports_503_without_fabricated_results(self):
        def missing():
            raise ModuleNotFoundError("markitdown")
        with local_server(converter_factory=missing) as (_, base):
            with self.assertRaises(HTTPError) as cm:
                post(base, b"sample local pdf")
            self.assertEqual(cm.exception.code, 503)
            error = json.loads(cm.exception.read())
            self.assertIn("markitdown", error["error"].lower())

    def test_rejects_cross_origin_document_post(self):
        with local_server() as (_, base):
            with self.assertRaises(HTTPError) as cm:
                post(base, b"sample local pdf", headers={"Origin":"https://site-inconnu.example"})
            self.assertEqual(cm.exception.code, 403)


if __name__ == "__main__":
    unittest.main()
