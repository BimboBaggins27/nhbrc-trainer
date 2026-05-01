#!/usr/bin/env python3
"""Weekly regulations watch — fetches the sources that matter for SA building regs,
diffs them against the last-known baseline, and writes a report.

The GitHub Actions workflow runs this every Monday and opens an issue if anything
has changed.
"""
from __future__ import annotations
import hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.parse import urlparse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "tools" / ".regs-baseline.json"
REPORT = ROOT / "tools" / "REGS-WATCH-REPORT.md"
UA = "Mozilla/5.0 NHBRC-Trainer-RegsWatch/1.0 (+study-only)"

# ---------- Sources ----------
# (label, url, [keywords]) — keywords filter: only count fetched content as
# 'relevant' if at least one appears. Empty list = always relevant.
SOURCES = [
    ("NHBRC — homepage / news block",
     "https://www.nhbrc.org.za/",
     ["news", "publication", "circular", "amendment"]),
    ("NHBRC — Publications",
     "https://www.nhbrc.org.za/publications/",
     []),
    ("Government Gazette — Subordinate Legislation index",
     "https://www.gov.za/documents/notices?keys=building+regulations",
     ["building", "regulation", "national building"]),
    ("SABS Webstore — SANS 10400 catalogue",
     "https://store.sabs.co.za/sans-10400-the-application-of-the-national-building-regulations",
     ["10400", "Edition"]),
    ("Engineering News — construction tag",
     "https://www.engineeringnews.co.za/page/construction",
     ["NHBRC", "SANS 10400", "building regulations"]),
    ("sans10400.co.za blog index",
     "https://www.sans10400.co.za/wp-sitemap-posts-post-1.xml",
     []),
    ("Cape Town building plans page (LA reference)",
     "https://www.capetown.gov.za/Family%20and%20home/find-a-municipal-service/Building-plans",
     ["building plan", "regulation", "submission"]),
]

KEYWORD_HEADLINES = re.compile(
    r"(NHBRC|SANS\s*10400|National Building Regulation|Act\s*103|Act\s*95|Housing Consumers Protection|"
    r"Home Building Manual|R\.574|R\.711|Government Gazette)",
    re.I,
)

def fetch(url: str, timeout: int = 30) -> tuple[int, str]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = r.read()
        try:
            return r.status, data.decode("utf-8", errors="replace")
        except Exception:
            return r.status, data.decode("latin-1", errors="replace")
    except Exception as e:
        return 0, f"FETCH-ERROR: {e}"

def fingerprint(text: str, keywords: list[str]) -> dict:
    """Return a content fingerprint for change-detection."""
    body_hash = hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()[:16]
    headlines = KEYWORD_HEADLINES.findall(text)[:80]
    keyword_hits = (
        sum(text.lower().count(k.lower()) for k in keywords)
        if keywords else len(headlines)
    )
    return {
        "len": len(text),
        "hash": body_hash,
        "keywordHits": keyword_hits,
        "headlinesSample": list({h.strip() for h in headlines})[:10],
    }

def load_state() -> dict:
    if STATE.exists():
        try:
            return json.loads(STATE.read_text(encoding="utf-8"))
        except Exception:
            return {}
    return {}

def save_state(state: dict) -> None:
    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")

def main() -> int:
    state = load_state()
    today = time.strftime("%Y-%m-%d")
    new_state = {"lastRun": today, "sources": {}}
    changes: list[str] = []
    errors: list[str] = []

    for label, url, keywords in SOURCES:
        status, text = fetch(url)
        if status == 0:
            errors.append(f"❌ {label} — {text}")
            new_state["sources"][label] = state.get("sources", {}).get(label) or {}
            continue
        fp = fingerprint(text, keywords)
        new_state["sources"][label] = {**fp, "url": url, "fetchedAt": today, "status": status}
        prev = (state.get("sources", {}) or {}).get(label)
        if prev is None:
            changes.append(f"🆕 **{label}** — first scan ({fp['len']:,} bytes, {fp['keywordHits']} keyword hits)")
        elif prev.get("hash") != fp["hash"]:
            delta = fp["len"] - prev.get("len", 0)
            changes.append(
                f"🔄 **{label}** — content changed (Δ {delta:+,} bytes, "
                f"{prev.get('keywordHits',0)}→{fp['keywordHits']} keyword hits)\n"
                f"   {url}"
            )

    # Render report
    lines = [
        f"# Regulations watch — {today}",
        "",
        f"Sources scanned: {len(SOURCES)}. Detected {len(changes)} change(s), {len(errors)} error(s).",
        "",
    ]
    if changes:
        lines.append("## Changes detected")
        lines.append("")
        lines.extend(changes)
        lines.append("")
        lines.append("👉 Review each diff. If a change touches the trainer's content, open a PR updating the relevant module/quiz/regulation entry and bump the SW version.")
    else:
        lines.append("✅ No changes since last scan.")
    if errors:
        lines.append("")
        lines.append("## Fetch errors")
        lines.append("")
        lines.extend(errors)
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    save_state(new_state)

    print("\n".join(lines))
    # Exit code 0 always — workflow uses the report content to decide
    return 0

if __name__ == "__main__":
    sys.exit(main())
