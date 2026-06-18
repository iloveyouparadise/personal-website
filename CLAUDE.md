# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Tang Ye (唐烨), showcasing video editing and new media operations work. Pure static site: HTML5 + vanilla JS + CSS3, no frameworks or build tools. Hosted on Vercel at tangye7.top.

## Commands

```bash
npm start          # Start dev server with live-reload (live-server)
```

No build step, no TypeScript, no test suite. `live-server` watches for file changes. Push to `main` triggers Vercel auto-deploy.

## High-Level Architecture

Three core files + static assets:

**`index.html`** (~520 lines) — Page sections in order:
- Loader overlay (`#loader`)
- `.hero-shell` > `.hero`: video background via `<video>` (`.hero-frame-bg`), two SVG mask overlays (`.hero-mask--desktop` / `--mobile`), portfolio button in `<foreignObject>` (desktop) / native SVG `<a>` (mobile)
- `#about-me`: two-column layout with TiltedCard 3D hover effect on photo (`关于我照片.JPG`), headings in "今年也要加油鸭" font
- `#experience`: `.exp-list` > `.exp-item` × 6, GSAP scroll animations
- `#projects`: TrueFocus filter tabs, stagger stacked card carousel (`.portfolio-strip`), single dynamic detail container (`#portfolioDetail`), scroll arrow buttons
- `.design-works-section`: image carousel with click-to-preview lightbox
- `.footer` `#contact`: SVG irregular-shape mask (`.contact-mask` desktop / `.contact-mask--mobile`), contact links, tag cloud marquee

**`styles.css`** (~3850 lines) — Four stacked layers (later overrides earlier):
1. Lines 1-127: `@font-face` declarations (12 fonts, all subsetted) + `:root` variables
2. Lines 128-1645: Brutalist/Swiss typography (largely overridden)
3. Lines ~2088-2680: Rivr-inspired glass-morphism (Hero, nav, cards)
4. Lines ~2681+: **Raw materials final aesthetic** — active layer, add overrides here

**`script.js`** (~1100 lines) — Global scope, no modules. Key systems:
- **Loader**: simulated progress bar → 98% max, `window.load` trigger + 8s timeout fallback
- **Scroll**: localStorage save/restore, IntersectionObserver `.reveal` animations, parallax
- **GSAP + ScrollTrigger** (CDN, defer): `initExpAnimation()` character-level line animation, heading slide-in, tag marquee, metrics slide-in, experience bg parallax
- **Stagger carousel** (`renderStagger`): cards positioned by JS with pixel offsets (`cardWidth/1.5 * dist`), center card raised 30px, ±2.5° rotation, side cards hidden beyond ±2 positions. Scroll buttons shift center index with circular wrap.
- **Portfolio data**: `portfolioData` object in JS — titles, subtitles, video paths, descriptions for all 14 items (7 school + 7 internship). Dynamic detail via `renderDetailContent()` populating single `#portfolioDetail` container.
- **Video lazy-load**: videos created on demand via `ensurePlayerVideo()` when detail opens, fully destroyed on close (pause → clear innerHTML → src="" → removeChild)
- **TiltedCard**: vanilla JS 3D perspective tilt on `#about-me` photo, mouse tracking with spring-like CSS transitions
- **TrueFocus**: vanilla JS reimplementation of React hover effect on filter buttons (blur non-hovered, frame follows cursor)

## Key Patterns

- **CSS layering**: Always add new rules in raw-materials section (after line ~2681). Match existing specificity. Never refactor CSS into separate files.
- **Hero mask system**: Desktop SVG (`viewBox="0 0 1861.64 1022.24"`) and mobile SVG (`viewBox="0 0 360.15 805.98"`) switched via `@media (max-aspect-ratio: 1/1)`. Desktop button in `<foreignObject>`, mobile uses native SVG `<a>` with `<polygon>` + `<text>`.
- **Contact mask system**: Same dual-SVG pattern for footer irregular container. Mobile mask uses `viewBox="0 0 555.87 936.74"`.
- **Cover images**: Static CSS `background-image` on `.portfolio-strip-media.cover-XX-XX` classes. First 3 school covers preloaded via `<link rel="preload">`. No JS thumbnail generation.
- **Stagger positioning**: JS computes position per card, set via inline `style.transform`. CSS only handles visibility (beyond ±2), z-index, and center card border/shadow (`#637891`).
- **Card clip-path**: `polygon(0 0, calc(100% - 50px) 0, 100% 50px, 100% 100%, 0 100%)` — pentagon with top-right cut. Diagonal accent line via `::before`.
- **Color accents**: Center card border/shadow `#637891`. Filter button hover `#9fa384`. Portfolio bg `#9eb39b`. Design works bg `#eaedc5`. Loader + hero button `#9fbd95`. Contact container `#e0c6a6`.
- **Fonts**: 12 subsetted fonts in `./fonts/` (~1.7MB total). `_originals/` folder gitignored. All fonts have `font-display: swap`. Key fonts: ZhiyiSans (body), SourceHanSansSC-Heavy (headings), 今年也要加油鸭 (about heading), LorchinSansP0 (about text).
- **Video assets**: `./vedio/` contains 13 `.mp4` files. Naming: all lowercase. Dangerous characters in filenames (like `+`) break URL routing on Linux/Vercel — always test new filenames.
