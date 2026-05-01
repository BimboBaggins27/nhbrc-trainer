import fitz
import json
import sys

doc = fitz.open(r"C:\Users\matte\nhbrc-app\SANS10400A.pdf")
print(f"Pages: {doc.page_count}", file=sys.stderr)

pages = []
for i, page in enumerate(doc):
    text = page.get_text("text")
    pages.append({"page": i + 1, "text": text})

with open(r"C:\Users\matte\nhbrc-app\sans_pages.json", "w", encoding="utf-8") as f:
    json.dump(pages, f, ensure_ascii=False, indent=2)

total_chars = sum(len(p["text"]) for p in pages)
print(f"Total characters: {total_chars}", file=sys.stderr)
print(f"Saved {len(pages)} pages to sans_pages.json", file=sys.stderr)
