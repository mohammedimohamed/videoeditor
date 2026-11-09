/**
 * Mohamed Excel — 2D Character Animation System
 * Office Environment & Interactive Props Template
 * 
 * Clean geometric vector office setting:
 * - Pastel walls and grounded floor plane
 * - Wall deadline clock with seekable ticking second hand
 * - Scandinavian oak office desk
 * - Ergonomic task chair
 * - Laptop displaying the dense, chaotic Excel spreadsheet
 * - Desk props (mug, plant, urgent paper stack)
 */

export function getOfficeEnvironmentSVG() {
  return `
  <svg id="office-env" class="office-env-svg" data-layout-allow-overflow="true" viewBox="0 0 1080 1920" width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Warm Pastel Background Wall Gradient -->
      <linearGradient id="wall-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FCFAF6" />
        <stop offset="65%" stop-color="#F7F3EB" />
        <stop offset="100%" stop-color="#EDE6DA" />
      </linearGradient>

      <!-- Warm Pastel Floor Gradient (Wood Planks) -->
      <linearGradient id="floor-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#E8DFD2" />
        <stop offset="100%" stop-color="#DCD1C0" />
      </linearGradient>

      <!-- Laptop Screen Glow Filter -->
      <filter id="screen-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#107C41" flood-opacity="0.18" />
      </filter>

      <!-- Desk Surface Drop Shadow -->
      <filter id="desk-shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.12" />
      </filter>
    </defs>

    <!-- 1. Background Wall -->
    <rect x="0" y="0" width="1080" height="1380" fill="url(#wall-gradient)" />

    <!-- Subtle Window Frame in Background (Left) -->
    <g class="bg-window" opacity="0.4" transform="translate(80, 220)" data-layout-ignore="true">
      <rect x="0" y="0" width="220" height="340" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4" />
      <line x1="110" y1="0" x2="110" y2="340" stroke="#CBD5E1" stroke-width="3" />
      <line x1="0" y1="170" x2="220" y2="170" stroke="#CBD5E1" stroke-width="3" />
      <!-- Soft Sun Rays -->
      <polygon points="0,0 220,100 220,340 0,240" fill="#FEF08A" opacity="0.15" />
    </g>

    <!-- 2. Minimalist Deadline Wall Clock (Right Wall) -->
    <g id="wall-clock" transform="translate(840, 320)" data-layout-ignore="true">
      <!-- Clock Case -->
      <circle cx="0" cy="0" r="75" fill="#FFFFFF" stroke="#1E293B" stroke-width="5" />
      <circle cx="0" cy="0" r="71" fill="none" stroke="#F1F5F9" stroke-width="4" />
      
      <!-- Hour Ticks -->
      <line x1="0" y1="-62" x2="0" y2="-50" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />
      <line x1="62" y1="0" x2="50" y2="0" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />
      <line x1="0" y1="62" x2="0" y2="50" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />
      <line x1="-62" y1="0" x2="-50" y2="0" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />

      <!-- Hour Hand (pointing near 11) -->
      <line id="clock-hour-hand" x1="0" y1="0" x2="-22" y2="-36" stroke="#1E293B" stroke-width="5" stroke-linecap="round" />
      <!-- Minute Hand (pointing to 10 - 11:50 PM!) -->
      <line id="clock-minute-hand" x1="0" y1="0" x2="-44" y2="-28" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" />
      <!-- Red Second Hand (Animates with GSAP) -->
      <g id="clock-second-hand">
        <line x1="0" y1="12" x2="0" y2="-56" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="0" cy="0" r="4" fill="#DC2626" />
      </g>
      <circle cx="0" cy="0" r="2.5" fill="#1E293B" />
      
      <!-- Urgency Subtitle Badge -->
      <rect x="-65" y="88" width="130" height="26" rx="13" fill="#FEE2E2" stroke="#DC2626" stroke-width="1.5" />
      <text x="0" y="105" font-family="'Segoe UI', system-ui, sans-serif" font-size="12" font-weight="700" fill="#991B1B" text-anchor="middle">
        DEMAIN MATIN !
      </text>
    </g>

    <!-- 3. Ground Baseboard & Floor Plane -->
    <rect x="0" y="1370" width="1080" height="16" fill="#B8A994" />
    <rect x="0" y="1386" width="1080" height="534" fill="url(#floor-gradient)" />
    <!-- Floor Planks Perspective Grid (Warm Wood Planks) -->
    <line x1="140" y1="1386" x2="-60" y2="1920" stroke="#C8BAA7" stroke-width="2" />
    <line x1="420" y1="1386" x2="310" y2="1920" stroke="#C8BAA7" stroke-width="2" />
    <line x1="720" y1="1386" x2="730" y2="1920" stroke="#C8BAA7" stroke-width="2" />
    <line x1="960" y1="1386" x2="1080" y2="1920" stroke="#C8BAA7" stroke-width="2" />

    <!-- 4. Office Task Chair (Behind the Desk) -->
    <g id="office-chair" transform="translate(320, 1080)" data-layout-ignore="true">
      <!-- Chair Backrest -->
      <path d="M -45 0 C -45 -145 -35 -180 0 -180 C 35 -180 45 -145 45 0 Z" 
            fill="#1E293B" stroke="#0F172A" stroke-width="4" stroke-linejoin="round" />
      <!-- Mesh Texture Indicator -->
      <line x1="-30" y1="-135" x2="30" y2="-135" stroke="#334155" stroke-width="2" />
      <line x1="-34" y1="-95" x2="34" y2="-95" stroke="#334155" stroke-width="2" />
      <line x1="-36" y1="-50" x2="36" y2="-50" stroke="#334155" stroke-width="2" />
      <!-- Armrests -->
      <path d="M -52 -30 L -62 -30 L -62 30" stroke="#0F172A" stroke-width="4" fill="none" stroke-linecap="round" />
      <path d="M 52 -30 L 62 -30 L 62 30" stroke="#0F172A" stroke-width="4" fill="none" stroke-linecap="round" />
      <!-- Padded Seat -->
      <rect x="-55" y="0" width="110" height="28" rx="10" fill="#334155" stroke="#0F172A" stroke-width="4" />
      <!-- Gas Cylinder Stem -->
      <rect x="-8" y="28" width="16" height="50" fill="#64748B" stroke="#0F172A" stroke-width="3" />
      <!-- 5-Star Caster Base -->
      <path d="M -50 78 L 0 70 L 50 78" stroke="#0F172A" stroke-width="5" stroke-linecap="round" fill="none" />
      <circle cx="-50" cy="83" r="6" fill="#0F172A" />
      <circle cx="50" cy="83" r="6" fill="#0F172A" />
    </g>

    <!-- 5. Scandinavian Oak Office Desk -->
    <g id="office-desk" transform="translate(180, 1080)" data-layout-ignore="true">
      <!-- Desk Floor Shadow -->
      <ellipse cx="280" cy="335" rx="270" ry="24" fill="#0F172A" opacity="0.16" filter="url(#desk-shadow)" />

      <!-- Steel Desk Legs -->
      <!-- Left Leg Frame -->
      <line x1="50" y1="35" x2="50" y2="330" stroke="#334155" stroke-width="7" stroke-linecap="round" />
      <line x1="85" y1="35" x2="85" y2="330" stroke="#1E293B" stroke-width="5" stroke-linecap="round" />
      <line x1="35" y1="330" x2="95" y2="330" stroke="#0F172A" stroke-width="7" stroke-linecap="round" />

      <!-- Right Leg Frame -->
      <line x1="510" y1="35" x2="510" y2="330" stroke="#334155" stroke-width="7" stroke-linecap="round" />
      <line x1="475" y1="35" x2="475" y2="330" stroke="#1E293B" stroke-width="5" stroke-linecap="round" />
      <line x1="465" y1="330" x2="525" y2="330" stroke="#0F172A" stroke-width="7" stroke-linecap="round" />

      <!-- Modesty Panel (Hangs down to y=150, leaving the lower 180px open for visible legs & feet) -->
      <rect x="70" y="55" width="420" height="95" rx="4" fill="#D8C8B4" stroke="#1E293B" stroke-width="3" />

      <!-- Desktop Bevel and Main Surface -->
      <!-- Under Bevel -->
      <path d="M 0 35 L 560 35 L 545 55 L 15 55 Z" fill="#D5C5B0" stroke="#1E293B" stroke-width="4" stroke-linejoin="round" />
      <!-- Top Oak Plate -->
      <path d="M 15 0 L 545 0 L 560 35 L 0 35 Z" fill="#EFE8DC" stroke="#1E293B" stroke-width="4" stroke-linejoin="round" />

      <!-- Desk Accessories on Surface -->
      <!-- Potted Desk Succulent (Left) -->
      <g id="desk-plant" transform="translate(48, -25)">
        <polygon points="12,28 36,28 42,0 6,0" fill="#A7F3D0" stroke="#1E293B" stroke-width="2.5" />
        <ellipse cx="24" cy="-2" rx="14" ry="16" fill="#10B981" stroke="#1E293B" stroke-width="2.5" />
        <ellipse cx="14" cy="4" rx="10" ry="12" fill="#059669" stroke="#1E293B" stroke-width="2" />
        <ellipse cx="34" cy="4" rx="10" ry="12" fill="#059669" stroke="#1E293B" stroke-width="2" />
      </g>

      <!-- Ceramic Coffee Mug (Right) -->
      <g id="desk-mug" transform="translate(490, -18)">
        <rect x="0" y="0" width="28" height="34" rx="5" fill="#60A5FA" stroke="#1E293B" stroke-width="2.5" />
        <!-- Mug Handle with Socket -->
        <path data-socket="handle" class="socket-handle" d="M 28 6 C 38 6 38 24 28 24" stroke="#1E293B" stroke-width="3" fill="none" />
        <!-- Subtle Steam Curl -->
        <path d="M 8 -4 Q 12 -12 8 -18" stroke="#94A3B8" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round" />
        <path d="M 18 -6 Q 22 -14 18 -22" stroke="#94A3B8" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round" />
      </g>

      <!-- 6. Laptop with Excel Spreadsheet UI -->
      <g id="desk-laptop" transform="translate(230, -115)" filter="url(#screen-glow)" data-layout-ignore="true">
        <!-- Keyboard Base Plate (Fixed on desk) -->
        <polygon points="10,118 210,118 225,138 -5,138" fill="#E2E8F0" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />
        <!-- Trackpad -->
        <rect x="85" y="124" width="50" height="10" rx="2" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1.5" />
        <!-- Screen Hinge Line (Anchor point) -->
        <circle id="laptop-hinge" data-socket="hinge" cx="110" cy="118" r="3" fill="#1E293B" opacity="0" />

        <!-- Hinged Screen Assembly (Folds down to hinge at y=118) -->
        <g id="laptop-screen-assembly">
          <!-- Open Screen Display Case -->
          <rect x="5" y="0" width="210" height="122" rx="7" fill="#0F172A" stroke="#1E293B" stroke-width="3.5" />
          <!-- Web Camera Dot -->
          <circle cx="110" cy="6" r="2" fill="#38BDF8" />

          <!-- Screen Surface -->
          <rect x="12" y="14" width="196" height="102" fill="#FFFFFF" />

          <!-- EXCEL APP UI DISPLAY -->
          <!-- Excel Green Ribbon Bar -->
          <rect x="12" y="14" width="196" height="18" fill="#107C41" />
          <!-- Excel Logo Icon -->
          <rect x="16" y="17" width="12" height="12" rx="2" fill="#FFFFFF" />
          <text x="22" y="26" font-family="'Segoe UI', system-ui, sans-serif" font-size="9" font-weight="900" fill="#107C41" text-anchor="middle">X</text>
          <text x="34" y="26" font-family="'Segoe UI', system-ui, sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF">
            Rapport_Ventes_Brutes.xlsx
          </text>

          <!-- Formula Bar -->
          <rect x="12" y="32" width="196" height="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1" />
          <text x="16" y="40" font-family="'Consolas', monospace" font-size="6.5" fill="#1E293B">
            fx =SOMMEPROD($A$2:$A$5842...)
          </text>

          <!-- Column Headers (A, B, C, D) -->
          <rect x="12" y="42" width="196" height="10" fill="#E2E8F0" />
          <text x="26" y="50" font-family="monospace" font-size="6" font-weight="700" fill="#1E293B">A: Date</text>
          <text x="68" y="50" font-family="monospace" font-size="6" font-weight="700" fill="#1E293B">B: Région</text>
          <text x="114" y="50" font-family="monospace" font-size="6" font-weight="700" fill="#1E293B">C: Client</text>
          <text x="165" y="50" font-family="monospace" font-size="6" font-weight="700" fill="#1E293B">D: Total DA</text>

          <!-- Scrolling Raw Data Rows (Chaotic, Unsummarized) -->
          <g id="laptop-scrolling-rows">
            <g transform="translate(12, 53)">
              <rect x="0" y="0" width="196" height="8" fill="#FFFFFF" />
              <text x="4" y="6.5" font-family="monospace" font-size="5" fill="#1E293B">01/11/2026</text>
              <text x="48" y="6.5" font-family="monospace" font-size="5" fill="#1E293B">Alger Centre</text>
              <text x="96" y="6.5" font-family="monospace" font-size="5" fill="#1E293B">SARL Al-Badr</text>
              <text x="156" y="6.5" font-family="monospace" font-size="5" fill="#1E293B">184 500 DA</text>

              <rect x="0" y="8" width="196" height="8" fill="#F8FAFC" />
              <text x="4" y="14.5" font-family="monospace" font-size="5" fill="#1E293B">01/11/2026</text>
              <text x="48" y="14.5" font-family="monospace" font-size="5" fill="#1E293B">Oran Ouest</text>
              <text x="96" y="14.5" font-family="monospace" font-size="5" fill="#1E293B">EURL Maghreb</text>
              <text x="156" y="14.5" font-family="monospace" font-size="5" fill="#1E293B">92 400 DA</text>

              <rect x="0" y="16" width="196" height="8" fill="#FFFFFF" />
              <text x="4" y="22.5" font-family="monospace" font-size="5" fill="#1E293B">02/11/2026</text>
              <text x="48" y="22.5" font-family="monospace" font-size="5" fill="#1E293B">Constantine</text>
              <text x="96" y="22.5" font-family="monospace" font-size="5" fill="#1E293B">SNC Numidia</text>
              <text x="156" y="22.5" font-family="monospace" font-size="5" fill="#1E293B">310 200 DA</text>

              <rect x="0" y="24" width="196" height="8" fill="#F8FAFC" />
              <text x="4" y="30.5" font-family="monospace" font-size="5" fill="#1E293B">02/11/2026</text>
              <text x="48" y="30.5" font-family="monospace" font-size="5" fill="#1E293B">Annaba Est</text>
              <text x="96" y="30.5" font-family="monospace" font-size="5" fill="#1E293B">ETS Seybouse</text>
              <text x="156" y="30.5" font-family="monospace" font-size="5" fill="#1E293B">45 800 DA</text>

              <rect x="0" y="32" width="196" height="8" fill="#FFFFFF" />
              <text x="4" y="38.5" font-family="monospace" font-size="5" fill="#1E293B">03/11/2026</text>
              <text x="48" y="38.5" font-family="monospace" font-size="5" fill="#1E293B">Sétif Sud</text>
              <text x="96" y="38.5" font-family="monospace" font-size="5" fill="#1E293B">SARL Ain Fouara</text>
              <text x="156" y="38.5" font-family="monospace" font-size="5" fill="#1E293B">128 900 DA</text>

              <rect x="0" y="40" width="196" height="8" fill="#F8FAFC" />
              <text x="4" y="46.5" font-family="monospace" font-size="5" fill="#1E293B">03/11/2026</text>
              <text x="48" y="46.5" font-family="monospace" font-size="5" fill="#1E293B">Ouargla</text>
              <text x="96" y="46.5" font-family="monospace" font-size="5" fill="#1E293B">Sahara Trading</text>
              <text x="156" y="46.5" font-family="monospace" font-size="5" fill="#1E293B">540 000 DA</text>

              <rect x="0" y="48" width="196" height="8" fill="#FFFFFF" />
              <text x="4" y="54.5" font-family="monospace" font-size="5" fill="#1E293B">04/11/2026</text>
              <text x="48" y="54.5" font-family="monospace" font-size="5" fill="#1E293B">Blida</text>
              <text x="96" y="54.5" font-family="monospace" font-size="5" fill="#1E293B">Mitidja Agro</text>
              <text x="156" y="54.5" font-family="monospace" font-size="5" fill="#1E293B">78 200 DA</text>
            </g>
          </g>

          <!-- Red Alert Badge: 5 842 lignes non synthétisées -->
          <g id="screen-alert-badge" transform="translate(18, 92)">
            <rect x="0" y="0" width="125" height="18" rx="9" fill="#DC2626" />
            <circle cx="8" cy="9" r="4" fill="#FFFFFF" />
            <text x="18" y="13" font-family="'Segoe UI', sans-serif" font-size="8" font-weight="700" fill="#FFFFFF">
              ⚠️ 5 842 lignes non filtrées !
            </text>
          </g>
        </g>
      </g>
    </g>
  </svg>
  `;
}
