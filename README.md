# NHBRC Trainer — installable mobile web app

A Progressive Web App (PWA) that teaches **NHBRC** and **SANS 10400** — South African National Building Regulations — distilled from the official PDF at `sans10400.co.za/wp-content/uploads/2012/12/SANS10400A.pdf`.

- 17 lesson modules (Parts A–W of SANS 10400, plus NHBRC role, build workflow, warranty)
- 56 quiz questions with explanations
- 26-term glossary with search
- Progress tracking, fully offline once installed
- Installable to phone home screen — no app store

The whole app is the contents of the **`docs/`** folder. There is no build step. The repo also includes:

- `tools/` — Python scripts used to extract content from the source PDF and generate the icons
- `.gitignore` excludes the 18 MB source PDF and its derived JSON

---

## 1 · Run it locally

```bash
cd nhbrc-app/docs
python -m http.server 8090
# then open http://localhost:8090 in Chrome on your laptop
```

To preview installation on your phone while your laptop is on the same Wi-Fi:

1. Find your laptop's LAN IP (`ipconfig` on Windows, look for IPv4).
2. On your phone visit `http://<laptop-ip>:8090` in Chrome.
3. Chrome menu → **Install app** (Android) or Safari Share → **Add to Home Screen** (iOS).

Note: iOS Safari requires HTTPS for full PWA features (Service Worker, install banner). Local HTTP works for "Add to Home Screen" but offline caching may not. Once you deploy to a real HTTPS host (steps below), iOS works fully.

---

## 2 · Deploy from the web (so you can install it on your phone)

Pick **one** of these. All of them are free for a tiny site like this.

### Option A · Netlify drag-and-drop (easiest — 30 seconds)

1. Go to https://app.netlify.com/drop
2. Drag the **`docs/`** folder onto the page.
3. Netlify gives you a URL like `https://thing-1234.netlify.app`. That URL is HTTPS and ready.
4. On your phone, open that URL in **Chrome (Android)** or **Safari (iOS)**:
   - **Android Chrome**: tap the ⋮ menu → **Install app** (or **Add to Home screen**). The icon appears like any other app.
   - **iOS Safari**: tap the Share icon → **Add to Home Screen** → **Add**.

To get a custom name (e.g. `nhbrc-trainer.netlify.app`): in Netlify dashboard → Site settings → Change site name.

### Option B · GitHub Pages (recommended — free, HTTPS, your URL stays put)

```bash
# inside C:\Users\matte\nhbrc-app
git remote add origin https://github.com/<your-username>/nhbrc-trainer.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / folder: `/docs`** → Save.
URL will be `https://<your-username>.github.io/nhbrc-trainer/`.

### Option C · Vercel

```bash
npm i -g vercel
cd docs
vercel --prod
```

### Option D · Cloudflare Pages

`pages.cloudflare.com` → upload the `docs` folder. Same idea as Netlify.

---

## 3 · Install to your phone

Once you have a public HTTPS URL:

### Android (Chrome / Edge / Brave)
1. Open the URL.
2. After a few seconds the app shows an **Install** button in the top-right of the header — tap it.
3. (Or) tap the browser ⋮ menu → **Install app** / **Add to Home screen**.
4. The NHBRC icon appears on your home screen. Open it and the app runs full-screen, offline.

### iPhone / iPad (Safari)
1. Open the URL in Safari (other browsers don't support installation on iOS).
2. Tap the **Share** icon at the bottom.
3. Scroll and tap **Add to Home Screen**.
4. Tap **Add**. The icon appears on your home screen. Tap it; the app runs in full-screen mode.
5. The first launch caches everything, so subsequent opens work offline (e.g. on a building site without signal).

---

## 4 · Update the content

All content is in `docs/data.js`. Edit a module, save the file, redeploy.

To force users' phones to pick up the new content, bump the `VERSION` constant in `docs/sw.js` (e.g. `'nhbrc-v1.0.1'`). The service worker will then evict the old cache on next visit.

---

## 5 · Source attribution

This app's content is distilled from:

- **SABS 0400-1990 / SANS 10400 — The Application of the National Building Regulations** (PDF: sans10400.co.za)
- **National Building Regulations & Building Standards Act 103 of 1977** including the **30 May 2008** amendments published in Government Gazette No. 31084 (Notice R.574)
- The NHBRC mandate under the **Housing Consumers Protection Measures Act 95 of 1998**
- **SANS 10400-XA** (energy usage, added 2011)

Note: the 1990 edition of SANS 10400 has been progressively superseded part-by-part since 2010. This is study material — for a real-world plan submission, always work to the **latest published part of SANS 10400** and the current NHBRC Home Building Manual.
