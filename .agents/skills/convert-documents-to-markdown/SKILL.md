---
name: convert-documents-to-markdown
description: Convert Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel (.xls, .xlsx), OpenDocument (.odt, .ods, .odp), RTF, EPUB, CSV, and PDF files to GitHub-Flavored Markdown. Use when a task needs the contents of an office document, spreadsheet, presentation, ebook, or PDF you cannot read directly.
license: MIT
metadata:
  author: firecrawl
---

## Priorité locale Quantif Plancher V7

Utiliser uniquement sur des documents autorisés et des traitements locaux. **Ne pas employer `--ocr hosted` ni transmettre des plans à Firecrawl Parse ou toute API externe.** Ne pas télécharger de binaire avec npx à l'insu de l'utilisateur. L'extraction Markdown ne constitue ni une mesure géométrique ni une segmentation automatique.

# Convert documents to Markdown

Run the AnyDoc CLI only if the user has approved the executable and its first-run download. It requires Node 20+:

```bash
npx @firecrawl/anydoc <file>              # Markdown to stdout
npx @firecrawl/anydoc <file> -o out.md    # write to a file
npx @firecrawl/anydoc - --format csv < f  # read stdin
```

Rules:

1. Supported inputs: `.doc`, `.docx`, `.docm`, `.odt`, `.rtf`, `.epub`, `.pdf`, `.ppt`, `.pps`, `.pot`, `.pptx`, `.pptm`, `.ppsx`, `.ppsm`, `.odp`, `.xls`, `.xlsx`, `.xlsm`, `.xlsb`, `.ods`, `.csv`.
2. The format is detected from the file content. Pass `--format <name>` only when detection cannot work: CSV from stdin, or a missing or wrong extension.
3. Exit codes: 0 success, 1 the document could not be converted, 2 usage error, 3 pages of a PDF need OCR. Failures print one `anydoc: <message>` line to stderr. The CLI never prompts.
4. For a large document, write to a file with `-o` and read the parts you need instead of streaming everything into context.
5. Scanned and image-only pages need OCR, which AnyDoc does not perform locally: exit code 3 means `OCR LOCAL INDISPONIBLE`. Stop conversion for these pages; report the limitation and request an explicitly approved **local** OCR workflow. For V7, NEVER use hosted OCR, send construction plans to a cloud API, or request an API key.
6. Inside a Node, Python, or Rust codebase, prefer the library over shelling out: `@firecrawl/anydoc` on npm, `firecrawl-anydoc` on PyPI, `anydoc` on crates.io. Each exposes the same `to_markdown` / `toMarkdown` API.
