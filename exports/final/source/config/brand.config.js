/**
 * Mohamed Excel Creative Studio — Brand Config (Provisional)
 * 
 * All color codes and values are marked as provisional until official
 * brand tokens and vectors are verified.
 * 
 * All asset paths are kept relative to the project root for full portability.
 */

export const brandConfig = {
  brand: {
    name: "Mohamed Excel",
    parentBrand: "TechWise Advisors",
    tagline: "Maîtrisez les Tableaux Croisés Dynamiques",
    targetAudience: "Professionals, Analysts, Managers, Students",
  },
  colors: {
    // Primary visual direction: Excel Green, Dark Navy, White
    primaryGreen: "#107C41",    // Provisional Excel brand green
    accentGreen: "#21A366",     // Provisional vibrant highlight
    deepNavy: "#0B132B",        // Background dark base
    cardSurface: "#1C2541",     // Elevated UI container
    borderNavy: "#3A506B",      // Grid / structural lines
    textPrimary: "#FFFFFF",     // White headline text
    textMuted: "#E0E6ED",       // Subtitle / body text
  },
  typography: {
    fontFamilyDisplay: "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif",
    fontFamilyMono: "'JetBrains Mono', Consolas, monospace",
    lineHeights: {
      tight: 1.1,
      normal: 1.4,
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  dimensions: {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    fps: 30,
  },
  assets: {
    logos: {
      mohamedExcel: "assets/logos/mohamed-excel.svg",
      techwiseAdvisors: "assets/logos/techwise-advisors.svg",
    },
    payments: {
      cib: "assets/payments/cib.png",
      edahabia: "assets/payments/edahabia.png",
    },
    qrCode: {
      websiteQr: "assets/qr-code/website-qr.png",
    },
    screenshots: {
      rawData: "assets/screenshots/excel-raw-data.png",
      pivotTable: "assets/screenshots/excel-pivot-table.png",
      dashboard: "assets/screenshots/excel-dashboard.png",
    },
    fonts: "assets/fonts",
    audio: "assets/audio",
  },
};

export default brandConfig;
