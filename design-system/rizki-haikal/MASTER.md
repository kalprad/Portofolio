# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Rizki Haikal
**Generated:** 2026-08-23 15:58:49
**Category:** Academic Journal / Scholarly Publishing
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 4/10 (Standard)

---

## As-built — keputusan yang benar-benar dipakai

> Bagian ini ditulis setelah implementasi dan **mengalahkan** spesifikasi
> komponen generik di bawah kalau keduanya berbeda. Sumber kebenaran token
> sesungguhnya ada di `src/app/globals.css`.

**Gaya:** Editorial Minimal — tipografi besar, whitespace lega, hierarki
dibangun oleh ukuran dan ruang, bukan oleh bayangan.

Perbedaan yang disengaja dari template generik di bawah:

| Hal | Template generik | Yang dipakai | Alasan |
|---|---|---|---|
| Radius | 8–12px | 6px (`--radius`) | Sudut yang lebih tegas cocok dengan karakter editorial |
| Elevasi kartu | `box-shadow` + `translateY(-2px)` saat hover | Garis `1px` border, warna border menguat saat hover | Bayangan menambah kedalaman palsu pada halaman yang isinya teks; garis lebih jujur dan tidak memicu repaint |
| Tombol utama | Latar aksen biru | Latar `--primary` (near-black); biru dipakai untuk tautan dan penanda | Biru disimpan sebagai satu-satunya aksen supaya tetap punya bobot |
| Pemisah seksi | Kartu melayang | `border-top` + `.eyebrow` huruf kapital | Ritme editorial, bukan ritme dashboard |
| Animasi | `transform` saat hover | Transisi warna 200ms + `.reveal` sekali saat masuk | Motion 3/10 — gerak hanya untuk menandai perubahan keadaan |

**Skala spasi yang terpakai** (berbeda dari tabel di bawah — lebih lapang,
sesuai karakter editorial):

`--space-2xs` 8px · `--space-xs` 12px · `--space-sm` 16px · `--space-md` 24px ·
`--space-lg` 40px · `--space-xl` 64px · `--space-2xl` 96px

**Kelas komposit** yang tersedia di `globals.css`: `.display-xl`, `.display-lg`,
`.eyebrow`, `.rule`, `.link-underline`, `.reveal`, `.prose-body`,
`.table-scroll`.

**Mode gelap** aktif penuh lewat class `.dark` di elemen `<html>`, disetel
sebelum cat pertama oleh skrip di `src/app/layout.tsx`.

**Aturan yang tidak boleh dilanggar:** ikon selalu SVG (lucide-react), tidak
pernah emoji · target sentuh minimal 44px · cincin fokus keyboard tidak pernah
dihapus · `prefers-reduced-motion` dihormati.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#18181B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3F3F46` | `--color-secondary` |
| Accent/CTA | `#2563EB` | `--color-accent` |
| Background | `#FAFAFA` | `--color-background` |
| Foreground | `#09090B` | `--color-foreground` |
| Muted | `#E8ECF0` | `--color-muted` |
| Border | `#E4E4E7` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#18181B` | `--color-ring` |

**Color Notes:** Monochrome + blue accent

### Typography

- **Heading Font:** Crimson Pro
- **Body Font:** Atkinson Hyperlegible
- **Mood:** academic, research, scholarly, accessible, readable, educational
- **Google Fonts:** [Crimson Pro + Atkinson Hyperlegible](https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Crimson+Pro:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Crimson+Pro:wght@400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 4/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #2563EB;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #18181B;
  border: 2px solid #18181B;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FAFAFA;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #18181B;
  outline: none;
  box-shadow: 0 0 0 3px #18181B20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Exaggerated Minimalism

**Keywords:** Bold minimalism, oversized typography, high contrast, negative space, loud minimal, statement design

**Best For:** Fashion, architecture, portfolios, agency landing pages, luxury brands, editorial

**Key Effects:** font-size: clamp(3rem 10vw 12rem), font-weight: 900, letter-spacing: -0.05em, massive whitespace

### Page Pattern

**Pattern Name:** Portfolio Grid

- **Conversion Strategy:** Visuals first. Filter by category. Fast loading essential.
- **CTA Placement:** Project Card Hover + Footer Contact
- **Section Order:** 1. Hero (Name/Role), 2. Project Grid (Masonry), 3. About/Philosophy, 4. Contact

---

## Motion

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out`

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger)

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- ⚡ toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

---

## Anti-Patterns (Do NOT Use)

- ❌ Flat design without depth
- ❌ Text-heavy pages

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
