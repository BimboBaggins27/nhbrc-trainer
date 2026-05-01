import json
import sys

with open(r"C:\Users\matte\nhbrc-app\sans_pages.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

# Find a section by keyword on a page
needle = sys.argv[1] if len(sys.argv) > 1 else "DEFINITIONS"
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 3

count = 0
for p in pages:
    if needle in p["text"]:
        count += 1
        print(f"\n========== PAGE {p['page']} (match) ==========")
        print(p["text"][:4500])
        if count >= limit:
            break
