# playable-checker / Проверка и превью плейблов

A tiny, static, client-side tool for previewing HTML5 playable ads on a phone mockup and running quality/compliance checks before submitting them to ad networks. No backend, no build step, no dependencies — everything runs in the browser. Files are never uploaded anywhere.

Небольшой статический инструмент для превью HTML5-плейблов на макете смартфона и проверки их на соответствие требованиям рекламных сетей перед отправкой. Без бэкенда, без сборки, без зависимостей — всё считается прямо в браузере. Файлы никуда не загружаются.

## What it does / Что делает

- Drag & drop (or click to browse) up to 10 `.html` playable files at once.
- Preview each one inside a phone-shaped frame, switch between loaded files with prev/next.
- Per-file checks: file size vs. 5 MB network cap, whether every asset is embedded (base64) with no external references, base64 asset integrity (corrupted/truncated data detection), valid HTML structure, viewport tag, absence of live network calls (fetch/XHR/WebSocket), detected click-through URL / clickTag / MRAID usage / AppLovin hooks.
- A compliance table against AppLovin MAX, Unity Ads, Mintegral, Moloco, Google Ads (AdMob/UAC), ironSource/Liftoff and Vungle/Digital Turbine (general public guidelines — always double-check against the network's current official docs before submitting, as limits can change).
- English / Russian interface toggle.

## Run locally / Запуск локально

No build step needed. Any static file server works, for example:

```bash
cd playable-checker
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just open `index.html` directly in a browser (drag & drop still works via `file://`, though some browsers are stricter about local iframes — a local server is more reliable).

## Deploy with GitHub + Vercel / Деплой через GitHub и Vercel

1. **Create a GitHub repo** (on github.com: "New repository", any name, e.g. `playable-checker`). Don't initialize it with a README (this folder already has one).
2. **Push this folder** to it:
   ```bash
   cd playable-checker
   git init
   git add .
   git commit -m "Initial commit: playable preview & QA tool"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. **Import into Vercel**: go to [vercel.com/new](https://vercel.com/new), choose "Import Git Repository", select the repo you just pushed. Vercel auto-detects it as a static site — no framework, no build command, no environment variables needed. Click Deploy.
4. Every future `git push` to `main` will redeploy automatically.

That's it — steps 1 and 3 need to happen in your own GitHub/Vercel accounts, since I can't create accounts or push on your behalf.

## Project structure

```
playable-checker/
├── index.html     # page structure (phone mockup, drop zone, checks panel)
├── styles.css     # all styling
├── i18n.js        # EN/RU string dictionary + translation helper
├── checks.js      # the actual analysis engine (pure functions, no DOM)
├── app.js         # drag & drop, file list, preview, rendering
├── vercel.json    # static-site config (cleanUrls)
└── README.md
```

## Notes on the checks / О проверках

- The "external references" check flags any `src=`/`href=` pointing to a real `http(s)://` URL (other than the App Store / Google Play link used for the click-through, which is tracked separately as "Click-through / store URL"). For single-file networks (AppLovin, Unity, Mintegral, Moloco, ironSource, Vungle) any such reference is a hard fail. Google Ads/AdMob also accepts a multi-file ZIP bundle, so external refs are shown as a warning rather than a fail for that row.
- The base64 integrity check tries to `atob()`-decode every embedded asset; a decode failure means the data is very likely truncated or corrupted. It's a best-effort signal, not a 100% guarantee — some corruption can still silently decode to garbled bytes.
- Network file-size limits (5 MB) and single-file requirements reflect each network's publicly documented guidelines at the time this tool was built. Networks change their specs — re-check the official docs (AppLovin/Axon, Unity Docs, Mintegral Help Center, Moloco Help Center, Google Ads Help) if something looks off.
