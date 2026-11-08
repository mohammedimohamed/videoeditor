# Mohamed Excel Creative Studio

A dedicated local motion design and programmatic video generation studio for **Mohamed Excel** (TechWise Advisors), powered by **HyperFrames**.

This workspace is fully isolated from production applications and databases, providing a deterministic environment for creating, previewing, and rendering high-impact advertising videos targeted at Facebook Ads and Instagram Ads.

---

## Workspace Structure

```
D:\source\TWA\ExcelMohamed
│
├── .agents/
│   └── skills/                  # HyperFrames motion design agent skills for Antigravity
│
├── projects/
│   └── mohamed-excel-tcd/       # Pivot Tables (TCD) advertising video project
│       ├── compositions/        # Modular scenes (scene1.html, scene2.html)
│       ├── config/              # Provisional brand configuration tokens
│       ├── public/              # Production media (images, logos, fonts, audio)
│       ├── assets/              # NTFS junction pointing to public/
│       ├── src/                 # Utilities and layout helpers
│       ├── scripts/             # Local project scripts
│       ├── index.html           # Root composition & timeline mounting
│       ├── hyperframes.json     # Framework path & registry configuration
│       └── README.md            # Project specific guide
│
├── brand/
│   ├── logos/                   # Reserved slots for Mohamed Excel, TWA, CIB, Edahabia
│   ├── qr-code/                 # Reserved slot for functional course QR code
│   ├── references/              # Reserved slot for Excel screenshots & references
│   └── brand-guidelines.md      # Provisional visual identity & palette definitions
│
├── exports/
│   ├── previews/                # Review video renders and snapshot frames
│   └── final/                   # Production-ready master exports
│
├── docs/
│   ├── setup.md                 # Complete developer setup & operator guide
│   └── environment-audit.md     # Audit report, diagnostics & validation results
│
└── package.json                 # Studio root dependencies and toolchain scripts
```

---

## Development Workflow

1. **Verify Environment:**
   ```powershell
   npm run doctor
   ```

2. **Develop & Scrub Compositions:**
   ```powershell
   cd projects/mohamed-excel-tcd
   npx hyperframes preview
   ```

3. **Validate Quality Gates (Lint, Layout, WCAG Contrast, Craft Floor):**
   ```powershell
   npx hyperframes check --json
   ```

4. **Render Preview Videos:**
   ```powershell
   npx hyperframes render `
     --frames-cache-dir="D:\source\TWA\ExcelMohamed\.cache\hyperframes" `
     -o "D:\source\TWA\ExcelMohamed\exports\previews\test-validation.mp4"
   ```

---

## Export Locations

- **Preview Renders:** `D:\source\TWA\ExcelMohamed\exports\previews\`
- **Final Master Renders:** `D:\source\TWA\ExcelMohamed\exports\final\`
