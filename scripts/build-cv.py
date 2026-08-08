#!/usr/bin/env python3
"""Build files/vu_the_dung_cv.pdf from files/vu_the_dung_cv.md.

The Markdown file is the source of truth: edit it, then run this script to
regenerate the PDF that the site links to from the navbar download button.

    python3 scripts/build-cv.py

Requires the `markdown` package (pip install markdown) and Google Chrome,
which renders the styled HTML to PDF. Set CHROME to override the browser path.
"""
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

REPO = pathlib.Path(__file__).resolve().parent.parent
SOURCE = REPO / "files" / "vu_the_dung_cv.md"
TARGET = REPO / "files" / "vu_the_dung_cv.pdf"

# Chrome locations to try when CHROME is not set in the environment.
CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
]

# Print styling. The two-column contact table at the top of the Markdown file
# renders headerless, so its left column acts as field labels.
CSS = """
@page { size: A4; margin: 14mm 15mm; }
* { box-sizing: border-box; }
body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 10.2pt; line-height: 1.45; color: #222; margin: 0;
}
h1 {
  font-size: 21pt; margin: 0 0 2px; letter-spacing: .5px;
  color: #111; text-transform: uppercase;
}
h1 + p { margin: 0 0 10px; font-size: 11pt; color: #d35400; font-weight: bold; }
h2 {
  font-size: 12pt; margin: 16px 0 7px; padding-bottom: 3px;
  color: #d35400; text-transform: uppercase; letter-spacing: .6px;
  border-bottom: 1.4px solid #d35400;
}
h3 { font-size: 10.6pt; margin: 11px 0 1px; color: #111; }
h3 + p { margin: 0 0 3px; font-size: 9.4pt; color: #666; }
p { margin: 0 0 6px; }
ul { margin: 3px 0 8px; padding-left: 17px; }
li { margin-bottom: 2.5px; }
a { color: #222; text-decoration: none; }
hr { display: none; }
table { border-collapse: collapse; margin: 0 0 4px; }
td { padding: 1.5px 14px 1.5px 0; vertical-align: top; font-size: 9.6pt; }
td:first-child { color: #666; white-space: nowrap; width: 78px; }
thead { display: none; }
h2, h3 { break-after: avoid; }
li, h3 + p { break-inside: avoid; }
"""


def find_chrome():
    """Return a usable Chrome/Chromium executable, or exit with guidance."""
    candidates = [os.environ["CHROME"]] if os.environ.get("CHROME") else CHROME_CANDIDATES
    for candidate in candidates:
        resolved = candidate if os.path.isfile(candidate) else shutil.which(candidate)
        if resolved:
            return resolved
    sys.exit("Chrome not found. Install Google Chrome or set CHROME to its path.")


def main():
    try:
        import markdown
    except ImportError:
        sys.exit("The markdown package is missing. Install it with: pip install markdown")

    if not SOURCE.exists():
        sys.exit(f"Missing CV source: {SOURCE}")

    body = markdown.markdown(SOURCE.read_text(encoding="utf-8"), extensions=["tables"])
    page = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>Vu The Dung - CV</title>"
        f"<style>{CSS}</style></head><body>{body}</body></html>"
    )

    # Chrome needs the HTML on disk to load it as a file:// URL.
    with tempfile.TemporaryDirectory() as tmp:
        html_path = pathlib.Path(tmp) / "cv.html"
        html_path.write_text(page, encoding="utf-8")
        subprocess.run(
            [
                find_chrome(),
                "--headless",
                "--disable-gpu",
                "--no-pdf-header-footer",
                f"--print-to-pdf={TARGET}",
                html_path.as_uri(),
            ],
            check=True,
            capture_output=True,
        )

    print(f"Wrote {TARGET.relative_to(REPO)}")


if __name__ == "__main__":
    main()
