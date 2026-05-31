# Digital Future Dialogue

Interactive website for the Digital Future Dialogue conference (Brussels, 1–3 June 2026).

**Live:** https://digital-future-dialogue.vercel.app

## Pages

- `/` — Landing page with interactive dot-matrix typography grid and 6 color themes
- `/day1/` — Day 1 programme schedule with sticky navigation, accordions, and interactive footer

## Quick start

```bash
npm install
npm run dev
```

## Build

| Command | Output | Description |
|---------|--------|-------------|
| `npm run build` | `dist/` | Full site (both pages, for Vercel/server deploy) |
| `npm run build:landing` | `dist-landing/` | Landing page only (standalone) |
| `npm run build:day1` | `dist-day1/` | Day 1 page only (standalone) |

## Create standalone zips

Each zip is fully self-contained — unzip and open `index.html` in a browser. No server or install required.

```bash
npm run zip:landing    # → dfd-landing.zip
npm run zip:day1       # → dfd-day1.zip
npm run zip:all        # → both zips
```

## Project structure

```
├── index.html                  Landing page entry
├── day1/index.html             Day 1 entry
├── src/
│   ├── App.tsx                 Landing page (grid, themes, layout)
│   ├── Day1Page.tsx            Day 1 programme (schedule, accordions, nav)
│   ├── DfdGrid.tsx             Reusable interactive dot-matrix grid
│   ├── glyphs.ts               Dot-matrix letter definitions
│   ├── style.css               All styles (mobile-first, responsive)
│   ├── main.tsx                Landing page React mount
│   ├── day1entry.tsx           Day 1 React mount
│   ├── dfd-logo.svg            Logo
│   └── SuisseIntl-Medium.ttf   Font
├── vite.config.ts              Full site build config
├── vite.config.landing.ts      Standalone landing build config
├── vite.config.day1.ts         Standalone Day 1 build config
└── vercel.json                 Vercel headers (noindex, no-cache)
```

## Stack

React 19 + TypeScript + Vite. No runtime dependencies beyond React. All config hardcoded as constants. Build output is static files.

## Deploy

Vercel (automatic via `vercel.json`):

```bash
npx vercel --yes --prod
```

Or serve the `dist/` folder from any static host.
