# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Tang Ye (唐烨), showcasing video editing and new media operations work. Pure static site: HTML5 + vanilla JS + CSS3, no frameworks or build tools.

## Commands

```bash
npm start          # Start dev server with live-reload (live-server)
```

No build step, no TypeScript, no test suite. Live-server watches for file changes.

## High-Level Architecture

Three core files + static assets:

**`index.html`** (~757 lines):
- `.hero-shell` > `.hero`: video background (`.hero-frame`), two SVG mask overlays (`.hero-mask--desktop` / `--mobile` with `fill-rule="evenodd"`), portfolio button via `<foreignObject>`, nav, heading
- `#experience`: `.exp-list` > `.exp-item` × 6 (`.exp-heading` + `.exp-title` + `.exp-body`)
- `#projects`: two filter tabs (`学校作品` / `实习作品`), carousel strips (`<button class="portfolio-strip">`), expandable detail panels (`.portfolio-detail`) with `<video>` players
- `.design-works-section`: image carousel with click-to-preview lightbox
- `.stack-section`: tag cloud with CSS marquee animation
- `.metrics-section`: 3 metric cards with GSAP slide-in
- `#contact`: footer with SVG irregular-shape mask

**`styles.css`** (~3440 lines) — Four stacked visual layers (later overrides earlier):
1. Lines 1-127: `@font-face` declarations (14 fonts) + `:root` variables
2. Lines 128-1645: Brutalist/Swiss black-and-white typography (largely overridden)
3. Lines ~2088-2680: Rivr-inspired glass-morphism (Hero, nav, cards)
4. Lines ~2681+: **Raw materials final aesthetic** — warm paper tones (`--bg: #ede8df`, `--paper: #ede8df`), hairline dark outlines, accent colors. **This is the active layer — add overrides here.**

**`script.js`** (~1067 lines) — No modules, global scope. Key systems:
- **Loader**: Simulated loading bar with pixel aesthetic, hides on `window.load`
- **Scroll**: `localStorage` save/restore, IntersectionObserver `.reveal` animations, parallax
- **GSAP + ScrollTrigger** (CDN): `initExpAnimation()` — splits titles/body per-line, animates `letterSpacing` + `opacity` on scroll; heading horizontal slide-in; tag cloud marquee; metrics cards slide-in; experience background parallax
- **Portfolio**: filter tabs, carousel autoplay (clone 3x), detail panel open/close with video pause, scroll buttons, video thumbnail via canvas, portrait video detection (`is-portrait-video` class)
- **Portfolio video player**: Fullscreen button injection, play/pause on click, 9:16 video adaptive aspect-ratio switching

## Key Patterns

- **CSS layering**: Always add new rules in the raw-materials section (after line ~2681). Match existing specificity. Never refactor CSS into separate files.
- **Hero mask system**: Two SVGs with `fill-rule="evenodd"` fill `#ede8df` everywhere except the irregular frame window. Switched via `@media (max-aspect-ratio: 1/1)`. Portfolio button is `<foreignObject>` with inline `onmouseenter`/`onmouseleave`.
- **Experience animations**: `initExpAnimation()` on load + resize (300ms debounce). Splits by character, groups lines by `getBoundingClientRect().top`, wraps each line in `<div>` with pixel-locked width, animates via GSAP. ScrollTrigger IDs prefixed `exp-` for cleanup.
- **Portfolio portrait video handling**: Internship videos 01/02/04/05 have `is-portrait-video` class manually set in HTML. CSS `@media (max-aspect-ratio: 1/1)` switches player to `aspect-ratio: 9/16`. 03/06 remain landscape 16/9.
- **Video assets**: Local `.mp4` in `./vedio/`. Hero uses `.webp` image. Portfolio detail players contain `<video>` elements dynamically.
- **Nav bar**: `position: absolute; z-index: 10` within `.hero`. Logo: `position: absolute; z-index: 200` relative to `<body>`.
- **Font path**: All custom fonts in `./fonts/`. When adding `@font-face`, use existing `font-display: swap` pattern and verify the file extension (`.otf` / `.ttf`).
