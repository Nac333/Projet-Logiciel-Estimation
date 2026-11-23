"""Indexer les modules JavaScript embarqués du fichier HTML autonome d'AITE.

Depuis la racine, lancer « python tools/graphify/sync_index.py » après une
modification du HTML. L'option --check vérifie que la copie est à jour.
Les définitions et les appels conservent les numéros de ligne du HTML.
"""

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path


# Le module AITE embarque PDF.js et son worker sous forme de deux URL de données.
# Le contenu de ces bibliothèques est indépendant des appels du code métier.
BUNDLED_JS = re.compile(r"(data:text/javascript;base64,)[A-Za-z0-9+/=]+")


class InlineModules(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.collecting = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            attributes = dict(attrs)
            self.collecting = (
                (attributes.get("type") or "").strip().lower() == "module"
                and "src" not in attributes
            )

    def handle_endtag(self, tag):
        if tag == "script":
            self.collecting = False

    def handle_data(self, data):
        if self.collecting and data.strip():
            line, _ = self.getpos()
            self.parts.append((line, BUNDLED_JS.sub(r"\1", data)))


def javascript_index(source):
    parser = InlineModules()
    parser.feed(source)
    parser.close()
    if not parser.parts:
        raise ValueError("Aucun module JavaScript intégré au HTML.")
    lines = [""] * (source.count("\n") + 1)
    lines[0] = "/* Index Graphify. Modifier Quantif-Plancher-V7.html puis exécuter python tools/graphify/sync_index.py. Mêmes numéros de ligne. */"
    for start, contents in parser.parts:
        for offset, line in enumerate(contents.split("\n"), start=start - 1):
            if lines[offset] and line:
                lines[offset] += " ; "
            lines[offset] += line
    return "\n".join(lines).rstrip("\n") + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("Quantif-Plancher-V7.html"))
    parser.add_argument("--output", type=Path, default=Path("tools/graphify/Quantif-Plancher-V7.js"))
    parser.add_argument("--check", action="store_true", help="Signaler un index absent ou périmé.")
    args = parser.parse_args()
    if args.source.resolve() == args.output.resolve():
        parser.error("Choisir une sortie distincte du HTML source.")
    expected = javascript_index(args.source.read_text(encoding="utf-8"))
    if args.check:
        if not args.output.is_file() or args.output.read_text(encoding="utf-8") != expected:
            parser.exit(1, "Index Graphify absent ou périmé. Relancer le générateur.\n")
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8", newline="\n") as output:
            output.write(expected)


if __name__ == "__main__":
    main()
