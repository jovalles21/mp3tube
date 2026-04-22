# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A minimal Astro SSR app that downloads YouTube audio as MP3 files via `sadaslk-dlcore`. The UI is in Spanish. Requires Node 22+ (`.node-version` sets this via nodenv).

## Commands

```bash
npm run dev      # dev server at http://localhost:4321
npm run build    # build to dist/
node dist/server/entry.mjs  # run production build
```

## Deployment

Hosted on Vercel. Uses `@astrojs/vercel` adapter — Vercel detecta el proyecto Astro automáticamente. No se necesita configuración extra.

## Architecture

Two files do all the work:

- **`src/pages/index.astro`** — Single-page frontend. JS submits the form to `/api/download`, receives the response as a Blob, and triggers a browser download. All user-facing text is in Spanish.
- **`src/pages/api/download.ts`** — POST endpoint. Accepts a YouTube URL, calls `ytmp3(url)` from `sadaslk-dlcore`, extracts the download URL from the result, then proxy-fetches the MP3 and streams it back to the browser. Logs `result` keys on first call to reveal the actual response shape (the library is obfuscated).
