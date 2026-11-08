# Mohamed Excel — Tableaux Croisés Dynamiques (TCD) Video Ad

This project contains the programmatic video ad composition for the **Mohamed Excel** online Pivot Tables (Tableaux Croisés Dynamiques) training course.

## Project Structure

- `index.html` — Root composition declaring the 1080×1920 (9:16) canvas, overall duration, and mounting sub-compositions.
- `compositions/` — Modular scene files (`scene1.html`, `scene2.html`) wrapped in `<template>` tags with dedicated GSAP timelines.
- `config/` — Configurable brand tokens and dimensions (`brand.config.js`).
- `public/` (and linked `assets/`) — Static media assets (logos, images, fonts, audio).
- `scripts/` — Project-specific automation scripts.

## Quick Commands

```bash
# Preview in browser
npm run dev

# Check composition against HyperFrames quality gates
npm run check

# Render to MP4
npm run render
```
