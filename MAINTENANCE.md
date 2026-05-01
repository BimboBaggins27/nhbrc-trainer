# NHBRC Trainer — content maintenance

Goal: keep every module, quiz question and citation factually accurate over time
without burning a day every month doing it.

## Layered system

```
Layer 1 — Continuous (automated)        weekly      tools/check_updates.py
Layer 2 — Real-time alerts              passive     Google Alerts → email
Layer 3 — Quarterly deep review         3-monthly   you, ~2 hours
Layer 4 — User feedback                 continuous  GitHub Issues + email
```

## Layer 1 — automated weekly scan

The `Regulations watch` GitHub Action runs every Monday at 06:00 UTC. It fetches:

- nhbrc.org.za news & publications pages
- Government Gazette index for "building regulations"
- SABS Webstore SANS 10400 catalogue page
- Engineering News construction tag
- sans10400.co.za sitemap (new posts)
- Cape Town building plan portal

It diffs each source against the saved baseline (`tools/.regs-baseline.json`).
If anything changed, it commits the new report (`tools/REGS-WATCH-REPORT.md`)
and opens / updates a tracking issue.

**Your job:** when the issue lands in your inbox, spend 10 minutes reading the
diffs. If a change is real (a new SANS edition, a new HBM revision, an NHBRC
policy update), open a PR.

## Layer 2 — Google Alerts (set up once, free, real-time)

Create alerts at https://www.google.com/alerts using these queries — set each
to "as it happens" + email delivery.

```
"SANS 10400" OR "SANS 10400-XA"
"NHBRC" "building regulation"
"National Building Regulations" "South Africa" amendment
"Housing Consumers Protection Act" amendment
"Act 103 of 1977" amendment
```

Heavy lifting is on Google's side. Most weeks you'll get nothing; when
something real lands you'll see it within a day.

## Layer 3 — quarterly deep review (you, every 3 months)

Block 2 hours, work through this list:

- [ ] Open https://store.sabs.co.za/ — note any new editions of SANS 10400 parts
- [ ] Open https://www.nhbrc.org.za/publications/ — any new HBM volumes or guides?
- [ ] Open https://www.nhbrc.org.za/category/news/ — disciplinary news, fee changes, new circulars
- [ ] Search Government Gazette index (gov.za/documents/notices) for "building" since last review
- [ ] Skim the "Regulations watch" issue history for missed signals
- [ ] Open the trainer; click into 3 random modules; sanity-check accuracy
- [ ] Run the master quiz and the mock test once each — flag anything stale
- [ ] Update `app.js` MODULE_ORDER if any new module added
- [ ] Bump the SW VERSION + ASSET_VER together
- [ ] Push

Add the next quarterly review date to your calendar at the end of every session.

## Layer 4 — user feedback

- Public bug-reporting at https://github.com/BimboBaggins27/nhbrc-trainer/issues
- Each module page should link to "Report an inaccuracy" (planned: Issue
  template that auto-includes the module ID + app version)
- Before answering, verify the user's claim against your sources

## Versioning policy

Every content update bumps the trainer to a new SW version so installed PWAs
auto-evict old caches:

| Change | Version step |
|---|---|
| Typo / wording fix | patch (e.g. 2.10.0 → 2.10.1) |
| New question(s), new module, new diagram | minor (2.10.x → 2.11.0) |
| New regulation update, new HBM edition incorporated | major (2.x → 3.0) |

Always bump these together:
- `docs/sw.js` — `VERSION` and `ASSET_VER`
- `docs/index.html` — `?v=X.Y.Z` on every script + stylesheet tag

## Sources of truth (in citation order of preference)

1. **Government Gazette** — authoritative for any regulation
2. **Act 103 of 1977 + Act 95 of 1998** — the parent legislation
3. **SANS 10400 published editions** — for each Part's prescriptive content (paid)
4. **NHBRC Home Building Manual** — for builder-facing requirements (paid)
5. **Local-authority by-laws** — site-specific rules (free, online)
6. **NRCS / DTIC compliance copies** — for cross-checks
7. **Industry / training-provider material** — useful for current-practice context

When wording new content, cite the highest-up source you actually verified. Do
not cite the HBM unless you also have it open.
