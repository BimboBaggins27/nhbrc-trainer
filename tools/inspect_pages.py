import json
import sys

with open(r"C:\Users\matte\nhbrc-app\sans_pages.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

# Print first 12 pages (front matter, TOC, foreword, scope)
mode = sys.argv[1] if len(sys.argv) > 1 else "front"

if mode == "front":
    for p in pages[:12]:
        print(f"\n========== PAGE {p['page']} ==========")
        print(p["text"][:3000])
elif mode == "range":
    start = int(sys.argv[2]) - 1
    end = int(sys.argv[3])
    for p in pages[start:end]:
        print(f"\n========== PAGE {p['page']} ==========")
        print(p["text"])
elif mode == "toc":
    # Find pages with "Contents" / "CONTENTS"
    for p in pages[:20]:
        if "Contents" in p["text"] or "CONTENTS" in p["text"]:
            print(f"\n========== PAGE {p['page']} (TOC candidate) ==========")
            print(p["text"])
elif mode == "headings":
    import re
    # Print short lines that look like clause headings
    for p in pages:
        for line in p["text"].split("\n"):
            line = line.strip()
            if re.match(r"^[A-Z]?\.?\s?\d+(\.\d+)*\s+[A-Z]", line) and len(line) < 120:
                print(f"p{p['page']}: {line}")
