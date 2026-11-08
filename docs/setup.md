# Development Setup & Operator Guide — Mohamed Excel Creative Studio

This guide outlines the complete setup, directory architecture, reproducible CLI commands, and operating procedures for authoring and rendering advertising videos using **HyperFrames**.

---

## 1. Prerequisites & Dependencies

The development environment requires:
- **Windows 10/11 (64-bit)**
- **Node.js 22+** (Current: `v22.19.0`)
- **FFmpeg & FFprobe** (Current: `6.0-essentials` in PATH)
- **Git** (Current: `2.43.0.windows.1` in PATH)
- **Headless Chrome / Puppeteer** (Managed automatically by HyperFrames)

---

## 2. Workspace Architecture

The workspace is organized into independent, modular domains:

```
D:\source\TWA\ExcelMohamed
│
├── .agents/
│   └── skills/                  # HyperFrames & motion design agent skills
│
├── projects/
│   └── mohamed-excel-tcd/       # Primary advertising composition project
│       ├── compositions/        # Modular sub-compositions (scene1.html, scene2.html)
│       ├── config/              # Brand config tokens (brand.config.js)
│       ├── public/              # Production media assets
│       │   ├── audio/           # Soundtracks, voiceovers, SFX
│       │   ├── fonts/           # Local @font-face families
│       │   ├── images/          # Excel captures, interface assets
│       │   └── logos/           # High-resolution logos
│       ├── assets/              # NTFS junction pointing to public/
│       ├── src/                 # Helper utilities / animation helpers
│       ├── scripts/             # Local build/render automation
│       ├── index.html           # Main timeline mounting sub-compositions
│       ├── hyperframes.json     # Framework path & registry config
│       └── package.json         # Project npm scripts
│
├── brand/
│   ├── logos/                   # Mohamed Excel, TWA, CIB, Edahabia slots
│   ├── qr-code/                 # Campaign QR code slot
│   ├── references/              # Excel screenshot & reference captures
│   └── brand-guidelines.md      # Provisional brand identity & color tokens
│
├── exports/
│   ├── previews/                # Review renders (MP4 & frame captures)
│   └── final/                   # Master delivery MP4 exports
│
├── docs/
│   ├── setup.md                 # This setup guide
│   └── environment-audit.md     # System audit and technical validation log
│
└── package.json                 # Studio root dependencies & maintenance scripts
```

---

## 3. Installation & Re-installation Procedure

From the workspace root (`D:\source\TWA\ExcelMohamed`):

### 1. Install Project-Local Dependencies
```powershell
npm install
```

### 2. Update / Reinstall HyperFrames Skills for Antigravity
```powershell
npx skills add heygen-com/hyperframes -y --agent antigravity
```

### 3. Run System Diagnostic
```powershell
npm run doctor
# Or directly:
npx hyperframes doctor
```

---

## 4. Authoring & Validation Commands

All commands should be executed from within the project directory:
```powershell
cd D:\source\TWA\ExcelMohamed\projects\mohamed-excel-tcd
```

### Live Interactive Studio Preview
Starts the local development server with frame-accurate timeline scrubbing:
```powershell
npm run dev
# Or:
npx hyperframes preview
```

### Quality & Contract Verification Gates
Before rendering, always run the automated gates to catch lint, layout, contrast, and motion issues:
```powershell
# Fast static linting
npx hyperframes lint

# Comprehensive gate (lint, runtime, layout, WCAG contrast, craft floor)
npm run check
# Or:
npx hyperframes check --json
```

---

## 5. Rendering Video Exports

To render high-quality MP4 videos without exhausting the system drive partition:

### Preview Render (9:16 Vertical, 1080×1920)
```powershell
npx hyperframes render `
  --frames-cache-dir="D:\source\TWA\ExcelMohamed\.cache\hyperframes" `
  -o "D:\source\TWA\ExcelMohamed\exports\previews\preview-ad.mp4"
```

### Delivery Render (Final High-Quality Output)
```powershell
npx hyperframes render `
  --quality delivery `
  --frames-cache-dir="D:\source\TWA\ExcelMohamed\.cache\hyperframes" `
  -o "D:\source\TWA\ExcelMohamed\exports\final\mohamed-excel-tcd-master.mp4"
```

---

## 6. Windows-Specific Notes & Best Practices

1. **Extract Cache Relocation (`--frames-cache-dir`):**  
   Windows temp directories typically live on `C:\Users\<user>\AppData\Local\Temp`. If the C: drive is low on space, HyperFrames frame extraction will fail during long renders. Always specify `--frames-cache-dir="D:\source\TWA\ExcelMohamed\.cache\hyperframes"` or set the permanent environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("HYPERFRAMES_EXTRACT_CACHE_DIR", "D:\source\TWA\ExcelMohamed\.cache\hyperframes", "User")
   ```

2. **Asset Directory Junction:**  
   HyperFrames conventionally looks for `assets/...` in HTML documents, while web conventions often use `public/...`. To avoid breaking either convention, an NTFS junction (`mklink /J assets public`) links both inside `projects/mohamed-excel-tcd`.

3. **Hardware Acceleration:**  
   Headless Chrome runs with ANGLE Direct3D11 hardware acceleration on Windows. If headless GPU crashes occur in constrained virtualized environments, pass `--browser-gpu=swiftshader` or `--force-screenshot`.
