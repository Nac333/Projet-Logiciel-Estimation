"""Private MarkItDown document reader for Quantif Plancher V7.

The existing 3+ MB HTML remains untouched. This localhost server injects a
navigation link into the copy served to the browser and processes documents
in temporary storage only. No external AI, OCR, or account is required.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.util import find_spec
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import parse_qs, urlsplit
import argparse
import json
import re

DEFAULT_LIMIT = 20 * 1024 * 1024
ALLOWED_SUFFIXES = frozenset({".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".html", ".htm", ".csv", ".txt"})
CODES = re.compile(r"(?<![A-Za-z0-9])(?:CE|VY|TA|RS|PL|PB|ML|MU|VT)[\s_-]?\d{1,3}(?![A-Za-z0-9])", re.I)
NAV_MARKER = '<button class="primary" id="exportBtn"'
NAV_LINK = ('<a id="documentsNav" href="/analyse-documents" target="_blank" rel="noopener" '
            'title="Lire les devis et tableaux de finis avec MarkItDown local" '
            'style="display:inline-flex;align-items:center;white-space:nowrap;padding:9px 11px;'
            'border:1px solid #7faaca;border-radius:6px;background:#eff8ff;color:#18354d;'
            'text-decoration:none;font-size:13px">📄 Devis &amp; finis</a>')


def extract_finish_candidates(markdown):
    """Return verifiable code/line excerpts, never inferred product mappings."""
    found, rows = set(), []
    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            continue
        for match in CODES.finditer(line):
            code = re.sub(r"\s+", "", match.group(0)).upper()
            key = (code, line)
            if key in found:
                continue
            found.add(key)
            rows.append({"code": code, "extrait": line[:500]})
            if len(rows) >= 500:
                return rows
    return rows


def normalize_filename(name):
    """Keep only a safe basename and an explicitly supported document type."""
    if not isinstance(name, str) or not name or any(ord(char) < 32 for char in name):
        raise ValueError("Nom de fichier invalide")
    basename = name.replace("\\", "/").rsplit("/", 1)[-1]
    if not basename or basename.startswith(".") or len(basename) > 180:
        raise ValueError("Nom de fichier invalide")
    if Path(basename).suffix.lower() not in ALLOWED_SUFFIXES:
        raise ValueError("Format non pris en charge")
    return basename


def inject_document_link(html):
    """Decorate the served copy only, preserving the original single-file app."""
    if 'id="documentsNav"' in html:
        return html
    return html.replace(NAV_MARKER, NAV_LINK + NAV_MARKER, 1)


def default_converter_factory():
    from markitdown import MarkItDown
    return MarkItDown(enable_plugins=False)


def create_server(port=8765, app_path=None, analysis_path=None,
                  converter_factory=None, max_upload=DEFAULT_LIMIT):
    root = Path(__file__).resolve().parent.parent
    source = Path(app_path) if app_path is not None else root / "Quantif-Plancher-V7.html"
    analysis = Path(analysis_path) if analysis_path is not None else root / "markitdown_local" / "analyse-documents.html"
    convert_factory = converter_factory if converter_factory is not None else default_converter_factory

    class Handler(BaseHTTPRequestHandler):
        server_version = "QuantifDocumentReader/1.0"

        def log_message(self, format_string, *args):
            # Query strings contain original client filenames: do not log them.
            return

        def _valid_host(self):
            return self.headers.get("Host") == f"127.0.0.1:{self.server.server_port}"

        def _send(self, status, content, content_type):
            data = content.encode("utf-8") if isinstance(content, str) else content
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "DENY")
            self.end_headers()
            self.wfile.write(data)

        def _json(self, status, data):
            self._send(status, json.dumps(data, ensure_ascii=False), "application/json; charset=utf-8")

        def do_GET(self):
            if not self._valid_host():
                return self._json(403, {"error": "Hôte non autorisé"})
            route = urlsplit(self.path).path
            if route in ("/", "/Quantif-Plancher-V7.html"):
                try:
                    html = source.read_text(encoding="utf-8")
                except OSError:
                    return self._json(404, {"error": "Quantif-Plancher-V7.html introuvable"})
                return self._send(200, inject_document_link(html), "text/html; charset=utf-8")
            if route == "/analyse-documents":
                try:
                    html = analysis.read_text(encoding="utf-8")
                except OSError:
                    return self._json(404, {"error": "Interface documentaire introuvable"})
                return self._send(200, html, "text/html; charset=utf-8")
            if route == "/api/status":
                return self._json(200, {"available": find_spec("markitdown") is not None,
                                         "limit_bytes": max_upload,
                                         "ocr_available": False,
                                         "local_only": True})
            return self._json(404, {"error": "Chemin inconnu"})

        def do_POST(self):
            if not self._valid_host():
                return self._json(403, {"error": "Hôte non autorisé"})
            origin = self.headers.get("Origin")
            if origin and origin != f"http://127.0.0.1:{self.server.server_port}":
                return self._json(403, {"error": "Origine non autorisée"})
            if urlsplit(self.path).path != "/api/convert":
                return self._json(404, {"error": "Chemin inconnu"})
            params = parse_qs(urlsplit(self.path).query)
            try:
                filename = normalize_filename(params.get("name", [""])[0])
            except ValueError as exc:
                status = 415 if str(exc) == "Format non pris en charge" else 400
                return self._json(status, {"error": str(exc)})
            length = self.headers.get("Content-Length", "")
            if not length.isdigit():
                return self._json(411, {"error": "Taille du fichier obligatoire"})
            size = int(length)
            if size == 0:
                return self._json(400, {"error": "Fichier vide"})
            if size > max_upload:
                return self._json(413, {"error": "Fichier trop volumineux"})
            payload = self.rfile.read(size)
            if len(payload) != size:
                return self._json(400, {"error": "Téléversement incomplet"})
            try:
                with TemporaryDirectory(prefix="quantif-markitdown-") as tmp:
                    temp_file = Path(tmp) / filename
                    temp_file.write_bytes(payload)
                    converted = convert_factory().convert(str(temp_file))
                    markdown = converted.text_content or ""
                if len(markdown) > 2_000_000:
                    return self._json(413, {"error": "Texte extrait trop volumineux"})
            except (ModuleNotFoundError, ImportError):
                return self._json(503, {"error": "MarkItDown non installé. Voir docs/MARKITDOWN_LOCAL.md"})
            except Exception:
                return self._json(422, {"error": "Conversion impossible : document illisible, protégé ou format non pris en charge"})
            warnings = ["Codes repérés automatiquement : chaque association doit être vérifiée dans les documents d'origine."]
            if not markdown.strip():
                warnings.append("Aucun texte extrait : document possiblement numérisé. OCR local non installé.")
            return self._json(200, {"filename": filename, "markdown": markdown,
                                    "finishes": extract_finish_candidates(markdown), "warnings": warnings})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser(description="Quantif Plancher V7 + MarkItDown local (sans API payante)")
    parser.add_argument("--port", type=int, default=8765, help="Port local (défaut : 8765)")
    options = parser.parse_args()
    with create_server(port=options.port) as server:
        print(f"Quantif Plancher V7 : http://127.0.0.1:{server.server_port}/")
        print(f"Analyse documentaire : http://127.0.0.1:{server.server_port}/analyse-documents")
        print("Arrêter avec Ctrl+C. Documents traités uniquement sur cette machine.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
