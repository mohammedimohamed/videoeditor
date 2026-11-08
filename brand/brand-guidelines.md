# Mohamed Excel Creative Studio — Brand Guidelines & Asset Inventory

## 1. Brand Hierarchy & Positioning
- **Customer-Facing Brand:** Mohamed Excel
  - Focus: High-impact, practical Excel training (specifically Tableaux Croisés Dynamiques / Pivot Tables).
  - Voice: Authoritative, pedagogical, efficient, results-oriented, professional.
- **Parent Business Brand:** TechWise Advisors (TWA)
  - Focus: Enterprise consulting, high-level technological advisory, business systems.
  - Endorsement role: "A TechWise Advisors Initiative" or co-branding where credibility is reinforced.
- **Target Audience:** Professionals, managers, financial analysts, accountants, students, and entrepreneurs targeting data mastery on Facebook and Instagram Ads.

---

## 2. Visual Direction & Aesthetic Principles
- **Core Aesthetic:** Premium, modern, clean, Swiss-inspired, technical precision.
- **Atmosphere:** High-contrast corporate clarity; data fluency over gimmicks.
- **Strictly Avoid:**
  - Generic IT gradient meshes and cheap vector illustrations.
  - Excessive decorative clutter (confetti, cartoonish stickers, busy particle effects).
  - Slow, unmotivated transitions.
  - Non-standard fonts that degrade readability on mobile screens.

---

## 3. Color Palette *(Provisional — Pending Official Brand Token Sign-off)*

| Role | Color Name | Hex (Provisional) | RGB | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Accent** | Excel Deep Green | `#107C41` | `rgb(16, 124, 65)` | Primary callouts, active data badges, brand accents |
| **Secondary Accent** | Excel Vibrant Green | `#185C37` / `#21A366` | `rgb(33, 163, 102)` | Interactive highlights, success indicators |
| **Primary Base** | Deep Navy | `#0B132B` | `rgb(11, 19, 43)` | Main background canvas, dark mode luxury foundation |
| **Surface Dark** | Slate Navy | `#1C2541` | `rgb(28, 37, 65)` | Card backgrounds, containers, grid surfaces |
| **High Contrast** | Pure White | `#FFFFFF` | `rgb(255, 255, 255)` | Headlines, high-legibility text |
| **Muted Ink** | Off-White / Light Grey | `#E0E6ED` | `rgb(224, 230, 237)` | Body copy, secondary metadata |
| **Grid / Stroke** | Border Navy / Grey | `#3A506B` | `rgb(58, 80, 107)` | Table borders, grid lines, dividers |

> [!NOTE]
> All hex codes above are marked as **PROVISIONAL**. Exact corporate color codes from brand assets must be verified and substituted when official vectors/style books are supplied.

---

## 4. Typography *(Provisional)*

- **Display & Headlines:** `Inter`, `Segoe UI`, or system `sans-serif` (Clean, geometric, high-weight readability at 9:16 mobile aspect ratios).
- **Technical & Tabular Data:** `JetBrains Mono`, `Consolas`, or tabular numbers (`font-variant-numeric: tabular-nums`).
- **Body & Captions:** `Inter`, `Roboto`, or system clean sans-serif.

---

## 5. Comprehensive Asset Inventory

All brand assets are stored in the canonical `brand/` directory and mirrored relative to `projects/mohamed-excel-tcd/public/` (and accessed via `assets/`).

| Category | Filename | File Type | Dimensions | Transparency | Intended Usage | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Logos** | `mohamed-excel.svg` | SVG (Vector) | 400 × 120 (viewBox) | Transparent background | Primary brand logo for badges, headers, intro & outro scenes | Temporary Placeholder (Awaiting official vector) |
| **Logos** | `techwise-advisors.svg` | SVG (Vector) | 400 × 100 (viewBox) | Transparent background | Parent company endorsement in footer and outro cards | Temporary Placeholder (Awaiting official vector) |
| **Payments** | `cib.png` | PNG (Raster) | 240 × 120 px | Alpha channel (Transparent BG) | Trust badge in payment strip for Algerian CIB domestic interbank cards | Temporary Placeholder (Awaiting official vector) |
| **Payments** | `edahabia.png` | PNG (Raster) | 240 × 120 px | Alpha channel (Transparent BG) | Trust badge in payment strip for Algérie Poste Edahabia cards | Temporary Placeholder (Awaiting official vector) |
| **QR Code** | `website-qr.png` | PNG (Raster) | 400 × 400 px | Alpha channel (Transparent BG) | Direct scannable QR code linking to the course enrollment landing page | Temporary Placeholder (Awaiting target URL) |
| **Screenshots** | `excel-raw-data.png` | PNG (Raster) | 1080 × 720 px | Opaque | "Before" problem visual: unstructured, messy tabular data rows | Temporary Placeholder (Awaiting authentic UI capture) |
| **Screenshots** | `excel-pivot-table.png`| PNG (Raster) | 1080 × 720 px | Opaque | "Solution" visual: interactive Pivot Table synthesis and metrics | Temporary Placeholder (Awaiting authentic UI capture) |
| **Screenshots** | `excel-dashboard.png` | PNG (Raster) | 1080 × 720 px | Opaque | "Outcome" visual: dynamic executive dashboard with slicers | Temporary Placeholder (Awaiting authentic UI capture) |
| **Fonts** | `brand/fonts/` | Directory | N/A | N/A | Reserved directory for official proprietary font files (`.woff2`) | Empty (Using bundled & system fonts) |

> [!IMPORTANT]
> **No Fake or Counterfeit Assets Policy:**  
> In compliance with strict brand integrity rules, no counterfeit logos, fake payment marks, or fake scannable QR codes have been fabricated. All missing assets are explicitly rendered as wireframe developer placeholders displaying `[TEMPORARY PLACEHOLDER]` and their respective asset target name. Real assets will replace them seamlessly upon delivery without code restructuring.

---

## 6. Relative Project Asset Mapping

All asset references in HyperFrames compositions are referenced relative to the project root:

```html
<!-- Logos -->
<img src="assets/logos/mohamed-excel.svg" alt="Mohamed Excel" />
<img src="assets/logos/techwise-advisors.svg" alt="TechWise Advisors" />

<!-- Payment Trust Badges -->
<img src="assets/payments/cib.png" alt="CIB" />
<img src="assets/payments/edahabia.png" alt="Edahabia" />

<!-- QR Code -->
<img src="assets/qr-code/website-qr.png" alt="Scan to enroll" />

<!-- Screenshots -->
<img src="assets/screenshots/excel-raw-data.png" alt="Raw Excel Data" />
<img src="assets/screenshots/excel-pivot-table.png" alt="Excel Pivot Table" />
<img src="assets/screenshots/excel-dashboard.png" alt="Excel Dashboard" />
```
