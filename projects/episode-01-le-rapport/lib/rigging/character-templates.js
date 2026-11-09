/**
 * Mohamed Excel — 2D Character Animation System
 * SVG Character Templates & Rig Structure
 * 
 * Anatomical Origin: (0, 0) at character Pelvis/Hips
 * When pelvis is at y=1080 on the 1080x1920 stage:
 *   - Feet touch floor at y=1385 (delta = +305px)
 *   - Head apex at y=820 (delta = -260px)
 * Proportions: 1:3.2 educational cartoon ratio.
 * Dark outlines: 3.5px #1E293B.
 * 
 * Embedded Probe Markers:
 *   - .marker-heel, .marker-toe on feet for stance phase QA
 *   - .marker-palm, .marker-tip on hands for target-driven IK QA
 */

/**
 * Generate Employee (Karim) SVG Rig
 * 
 * @param {string} id Unique SVG element ID
 * @param {Object} options Configuration
 *   - pose: 'seated' | 'standing'
 *   - facing: 'right' | 'front'
 *   - viewBox: string (defaults to "0 0 1080 1920" for stage, or "-160 -320 360 620" for cards)
 *   - width: string | number
 *   - height: string | number
 *   - style: string
 */
export function getEmployeeSVG(id = "char-employee", {
  pose = "seated",
  facing = "right",
  viewBox = "0 0 1080 1920",
  width = "1080",
  height = "1920",
  style = "position: absolute; inset: 0;"
} = {}) {
  const isSeated = pose === "seated";
  const isFront = facing === "front";

  return `
  <svg id="${id}" class="character-svg employee-svg" data-layout-allow-overflow="true" data-layout-ignore="true" viewBox="${viewBox}" width="${width}" height="${height}" style="${style}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="${id}-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    
    <!-- Character Root Group (Positioned via GSAP x/y at Pelvis) -->
    <g class="character-root">
      <!-- Ground Contact Shadow -->
      <ellipse class="char-shadow" cx="${isSeated ? 60 : 0}" cy="${isSeated ? 265 : 305}" rx="${isSeated ? 75 : 85}" ry="14" fill="#0F172A" opacity="0.22" filter="url(#${id}-shadow-blur)" />

      ${isSeated ? `
      <!-- ======================================================= -->
      <!-- SEATED LOWER BODY (Anatomically Coherent Desk Interaction) -->
      <!-- Thighs extend horizontally forward (+X towards desk) -->
      <!-- Calves drop vertically down to floor (y=265 relative to pelvis) -->
      <!-- Shoes rest firmly planted on floor plane -->
      <!-- ======================================================= -->
      
      <!-- Far Leg (Left - Behind) -->
      <g class="joint-leg-l seated-far-leg" transform="translate(6, 12)">
        <path d="M -16 -14 L 92 -14 C 104 -14 112 -4 112 10 C 112 24 104 32 90 32 L -16 32 Z" 
              fill="#141C28" stroke="#0F172A" stroke-width="3.5" stroke-linejoin="round" />
        
        <g class="joint-shin-l" transform="translate(94, 18)">
          <rect x="-14" y="0" width="28" height="205" rx="14" fill="#141C28" stroke="#0F172A" stroke-width="3.5" />
          
          <g class="joint-foot-l" transform="translate(0, 195)">
            <path d="M -14 0 L 32 0 C 44 0 50 12 44 24 L -16 24 C -20 24 -22 16 -22 8 Z" fill="#090E17" stroke="#090E17" stroke-width="3" />
            <!-- Foot probe markers -->
            <g class="marker-heel" transform="translate(-14, 24)"></g>
            <g class="marker-toe" transform="translate(44, 24)"></g>
          </g>
        </g>
      </g>

      <!-- Near Leg (Right - Foreground) -->
      <g class="joint-leg-r seated-near-leg" transform="translate(18, 16)">
        <path d="M -16 -15 L 98 -15 C 112 -15 120 -4 120 12 C 120 26 112 34 96 34 L -16 34 Z" 
              fill="#1E293B" stroke="#0F172A" stroke-width="3.5" stroke-linejoin="round" />
        
        <g class="joint-shin-r" transform="translate(102, 20)">
          <rect x="-14" y="0" width="28" height="205" rx="14" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
          
          <g class="joint-foot-r" transform="translate(0, 195)">
            <path d="M -14 0 L 36 0 C 48 0 54 12 48 24 L -16 24 C -20 24 -22 16 -22 8 Z" fill="#0F172A" stroke="#0F172A" stroke-width="3" />
            <g class="marker-heel" transform="translate(-14, 24)"></g>
            <g class="marker-toe" transform="translate(48, 24)"></g>
          </g>
        </g>
      </g>
      ` : `
      <!-- STANDING LEGS (Front / 3/4 View) -->
      <!-- Left Leg (Back) -->
      <g class="joint-leg-l" transform="translate(-28, 10)">
        <rect x="-16" y="0" width="32" height="140" rx="16" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
        <g class="joint-shin-l" transform="translate(0, 125)">
          <rect x="-14" y="0" width="28" height="135" rx="14" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
          <g class="joint-foot-l" transform="translate(0, 125)">
            <path d="M -14 0 L 22 0 C 32 0 38 12 34 24 L -16 24 C -20 24 -22 16 -22 8 Z" fill="#0F172A" stroke="#0F172A" stroke-width="3" />
            <g class="marker-heel" transform="translate(-14, 24)"></g>
            <g class="marker-toe" transform="translate(34, 24)"></g>
          </g>
        </g>
      </g>

      <!-- Right Leg (Front) -->
      <g class="joint-leg-r" transform="translate(28, 10)">
        <rect x="-16" y="0" width="32" height="140" rx="16" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
        <g class="joint-shin-r" transform="translate(0, 125)">
          <rect x="-14" y="0" width="28" height="135" rx="14" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
          <g class="joint-foot-r" transform="translate(0, 125)">
            <path d="M -14 0 L 22 0 C 32 0 38 12 34 24 L -16 24 C -20 24 -22 16 -22 8 Z" fill="#0F172A" stroke="#0F172A" stroke-width="3" />
            <g class="marker-heel" transform="translate(-14, 24)"></g>
            <g class="marker-toe" transform="translate(34, 24)"></g>
          </g>
        </g>
      </g>
      `}

      <!-- Pelvis Anchor (Hips) -->
      <g class="joint-pelvis">
        <path d="M -48 -10 L 48 -10 C 48 16 34 32 0 32 C -34 32 -48 16 -48 -10 Z" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
      </g>

      <!-- Far Arm (Left - Behind Torso) -->
      <g class="joint-arm-l" transform="translate(-48, -165)">
        <path d="M -12 0 L 12 0 L 10 95 L -10 95 Z" fill="#2563EB" stroke="#1E293B" stroke-width="3.5" rx="10" />
        <g class="joint-forearm-l" transform="translate(0, 90)">
          <rect x="-9" y="0" width="18" height="85" rx="9" fill="#F9D5BD" stroke="#1E293B" stroke-width="3.5" />
          <g class="joint-hand-l" transform="translate(0, 80)">
            <circle cx="0" cy="10" r="11" fill="#F9D5BD" stroke="#1E293B" stroke-width="2.5" />
            <path d="M 4 4 C 10 6 12 12 8 16 Z" fill="#F9D5BD" stroke="#1E293B" stroke-width="2" />
            <g class="marker-palm" transform="translate(0, 10)"></g>
            <g class="marker-tip" transform="translate(0, 21)"></g>
          </g>
        </g>
      </g>

      <!-- Torso Hierarchy (Origin at Pelvis: 0, 0) -->
      <g class="joint-torso">
        <!-- Main Blue Shirt Body -->
        <path d="M -48 0 L -54 -140 C -54 -160 -38 -175 -12 -178 L 12 -178 C 38 -175 54 -160 54 -140 L 48 0 Z" 
              fill="#3B82F6" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />
        
        <!-- Shirt Placket & White Buttons -->
        <line x1="0" y1="-176" x2="0" y2="-5" stroke="#2563EB" stroke-width="3.5" />
        <circle cx="0" cy="-140" r="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5" />
        <circle cx="0" cy="-105" r="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5" />
        <circle cx="0" cy="-70" r="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5" />
        <circle cx="0" cy="-35" r="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5" />

        <!-- Collar -->
        <polygon points="-26,-178 0,-154 -5,-178" fill="#2563EB" stroke="#1E293B" stroke-width="2.5" />
        <polygon points="26,-178 0,-154 5,-178" fill="#2563EB" stroke="#1E293B" stroke-width="2.5" />

        <!-- Neck -->
        <g class="joint-neck" transform="translate(0, -178)">
          <rect x="-12" y="-28" width="24" height="32" rx="5" fill="#F9D5BD" stroke="#1E293B" stroke-width="3" />

          <!-- Head Anchor (Origin at base of neck: 0, -25) -->
          <g class="joint-head" transform="translate(0, -25)">
            <!-- Ears -->
            <circle cx="-54" cy="-50" r="12" fill="#F9D5BD" stroke="#1E293B" stroke-width="3" />
            <circle cx="54" cy="-50" r="12" fill="#F9D5BD" stroke="#1E293B" stroke-width="3" />

            <!-- Face Oval -->
            <path d="M -50 -58 C -52 -115 -35 -142 0 -142 C 35 -142 52 -115 50 -58 C 48 0 30 14 0 14 C -30 14 -48 0 -50 -58 Z" 
                  fill="#F9D5BD" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />

            <!-- Dark Hair Crop -->
            <path d="M -52 -85 C -54 -140 -20 -154 0 -154 C 25 -154 54 -140 52 -85 C 44 -95 32 -98 24 -95 C 16 -104 -4 -106 -16 -100 C -28 -106 -42 -100 -52 -85 Z" 
                  fill="#2D231E" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />
            <path d="M -52 -85 L -48 -54 L -40 -68 Z" fill="#2D231E" stroke="#1E293B" stroke-width="2.5" />
            <path d="M 52 -85 L 48 -54 L 40 -68 Z" fill="#2D231E" stroke="#1E293B" stroke-width="2.5" />

            <!-- Facial Features Group -->
            <g class="part-face">
              <!-- Eyebrows -->
              <g class="eyebrow-left" transform="translate(-24, -74)">
                <path d="M -14 0 Q 0 -4 14 0" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round" fill="none" />
              </g>
              <g class="eyebrow-right" transform="translate(24, -74)">
                <path d="M -14 0 Q 0 -4 14 0" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round" fill="none" />
              </g>

              <!-- Left Eye -->
              <g class="eye-left" transform="translate(-24, -54)">
                <ellipse cx="0" cy="0" rx="12" ry="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />
                <g class="pupil-left">
                  <circle cx="0" cy="1" r="6" fill="#1E293B" />
                  <circle cx="2" cy="-1.5" r="2.2" fill="#FFFFFF" />
                </g>
                <rect class="eyelid-left" x="-14" y="-16" width="28" height="32" fill="#F9D5BD" stroke="#1E293B" stroke-width="2" transform="scale(1, 0.05)" />
              </g>

              <!-- Right Eye -->
              <g class="eye-right" transform="translate(24, -54)">
                <ellipse cx="0" cy="0" rx="12" ry="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />
                <g class="pupil-right">
                  <circle cx="0" cy="1" r="6" fill="#1E293B" />
                  <circle cx="2" cy="-1.5" r="2.2" fill="#FFFFFF" />
                </g>
                <rect class="eyelid-right" x="-14" y="-16" width="28" height="32" fill="#F9D5BD" stroke="#1E293B" stroke-width="2" transform="scale(1, 0.05)" />
              </g>

              <!-- Nose -->
              <path class="part-nose" d="M 0 -44 C 2 -38 6 -34 0 -30" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />

              <!-- Mouth Container -->
              <g class="part-mouth" transform="translate(-25, -24)">
                <path class="part-mouth-path" d="M 10 12 Q 25 15 40 12" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </g>
          </g>
        </g>

        <!-- Near Arm (Right - Foreground, Desk Facing) -->
        <!-- Layering: Upper arm sleeve is drawn cleanly; forearm is layered over/around it -->
        <g class="joint-arm-r" transform="translate(48, -165)">
          <!-- Upper Arm (Sleeve) -->
          <path d="M -12 0 L 12 0 L 10 95 L -10 95 Z" fill="#3B82F6" stroke="#1E293B" stroke-width="3.5" rx="10" />
          
          <!-- Forearm (Flesh tone, clearly articulated) -->
          <g class="joint-forearm-r" transform="translate(0, 90)">
            <rect x="-9" y="0" width="18" height="85" rx="9" fill="#F9D5BD" stroke="#1E293B" stroke-width="3.5" />
            
            <!-- Hand / Wrist -->
            <g class="joint-hand-r" transform="translate(0, 80)">
              <circle cx="0" cy="10" r="11" fill="#F9D5BD" stroke="#1E293B" stroke-width="2.5" />
              <path d="M -4 4 C -10 6 -12 12 -8 16 Z" fill="#F9D5BD" stroke="#1E293B" stroke-width="2" />
              <g class="marker-palm" transform="translate(0, 10)"></g>
              <g class="marker-tip" transform="translate(0, 21)"></g>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
  `;
}

/**
 * Generate Mohamed SVG Rig
 * 
 * @param {string} id Unique SVG element ID
 * @param {Object} options Configuration
 *   - facing: '3/4-left' | 'front'
 *   - viewBox: string
 *   - width: string | number
 *   - height: string | number
 *   - style: string
 */
export function getMohamedSVG(id = "char-mohamed", {
  facing = "3/4-left",
  viewBox = "0 0 1080 1920",
  width = "1080",
  height = "1920",
  style = "position: absolute; inset: 0;"
} = {}) {
  const isLeftFacing = facing === "3/4-left" || facing === "left";

  return `
  <svg id="${id}" class="character-svg mohamed-svg" data-layout-allow-overflow="true" data-layout-ignore="true" viewBox="${viewBox}" width="${width}" height="${height}" style="${style}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="${id}-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    
    <!-- Character Root Group (Positioned via GSAP x/y at Pelvis) -->
    <g class="character-root">
      <!-- Ground Shadow (Positioned at floor y=305 relative to pelvis) -->
      <ellipse class="char-shadow" cx="0" cy="305" rx="95" ry="14" fill="#0F172A" opacity="0.25" filter="url(#${id}-shadow-blur)" />

      <!-- Far Leg (Right - Behind Torso, Shaded for Depth) -->
      <g class="joint-leg-r" transform="translate(${isLeftFacing ? 24 : 28}, 10)">
        <rect x="-15" y="0" width="30" height="140" rx="15" fill="#141C28" stroke="#0F172A" stroke-width="3.5" />
        <g class="joint-shin-r" transform="translate(0, 125)">
          <rect x="-13" y="0" width="26" height="135" rx="13" fill="#141C28" stroke="#0F172A" stroke-width="3.5" />
          <g class="joint-foot-r" transform="translate(0, 125)">
            <!-- Sneaker with green brand accent -->
            <path d="${isLeftFacing ? 'M -28 0 L 16 0 C 24 0 28 10 26 22 L -30 22 C -34 22 -36 15 -36 8 Z' : 'M -14 0 L 22 0 C 32 0 40 10 36 22 L -16 22 C -20 22 -22 15 -22 8 Z'}" 
                  fill="#E2E8F0" stroke="#0F172A" stroke-width="3" />
            <path d="${isLeftFacing ? 'M -28 18 L 18 18 L 18 22 L -28 22 Z' : 'M -12 18 L 30 18 L 30 22 L -12 22 Z'}" fill="#0D6836" />
            <!-- Foot probe markers -->
            <g class="marker-heel" transform="translate(${isLeftFacing ? 18 : -14}, 22)"></g>
            <g class="marker-toe" transform="translate(${isLeftFacing ? -32 : 36}, 22)"></g>
          </g>
        </g>
      </g>

      <!-- Near Leg (Left - Foreground, Leading toward Desk) -->
      <g class="joint-leg-l" transform="translate(${isLeftFacing ? -22 : -28}, 10)">
        <rect x="-16" y="0" width="32" height="140" rx="16" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
        <g class="joint-shin-l" transform="translate(0, 125)">
          <rect x="-14" y="0" width="28" height="135" rx="14" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
          <g class="joint-foot-l" transform="translate(0, 125)">
            <!-- Sneaker facing leftwards -->
            <path d="${isLeftFacing ? 'M -32 0 L 16 0 C 24 0 28 10 26 22 L -34 22 C -38 22 -40 15 -40 8 Z' : 'M -14 0 L 22 0 C 32 0 40 10 36 22 L -16 22 C -20 22 -22 15 -22 8 Z'}" 
                  fill="#FFFFFF" stroke="#0F172A" stroke-width="3" />
            <path d="${isLeftFacing ? 'M -32 18 L 18 18 L 18 22 L -32 22 Z' : 'M -12 18 L 30 18 L 30 22 L -12 22 Z'}" fill="#107C41" />
            <g class="marker-heel" transform="translate(${isLeftFacing ? 18 : -14}, 22)"></g>
            <g class="marker-toe" transform="translate(${isLeftFacing ? -36 : 36}, 22)"></g>
          </g>
        </g>
      </g>

      <!-- Pelvis Anchor -->
      <g class="joint-pelvis">
        <path d="M -48 -10 L 48 -10 C 48 16 34 32 0 32 C -34 32 -48 16 -48 -10 Z" fill="#1E293B" stroke="#0F172A" stroke-width="3.5" />
      </g>

      <!-- Far Arm (Right - Behind Torso, Swings during walk) -->
      <g class="joint-arm-r" transform="translate(${isLeftFacing ? 36 : 54}, -165)">
        <path d="M -12 0 L 12 0 L 10 100 L -10 100 Z" fill="#0D6836" stroke="#0F172A" stroke-width="3.5" rx="10" />
        <g class="joint-forearm-r" transform="translate(0, 95)">
          <rect x="-9" y="0" width="18" height="90" rx="9" fill="#D4A37F" stroke="#0F172A" stroke-width="3.5" />
          <g class="joint-hand-r" transform="translate(0, 85)">
            <circle cx="0" cy="10" r="11" fill="#D4A37F" stroke="#0F172A" stroke-width="2.5" />
            <g class="marker-palm" transform="translate(0, 10)"></g>
            <g class="marker-tip" transform="translate(0, 21)"></g>
          </g>
        </g>
      </g>

      <!-- Torso Hierarchy (Origin at Pelvis: 0, 0) -->
      <g class="joint-torso">
        <!-- Green Knit Sweater (Brand Color #107C41) -->
        <path d="M -50 0 L -56 -142 C -56 -162 -40 -178 -12 -180 L 12 -180 C 40 -178 56 -162 56 -142 L 50 0 Z" 
              fill="#107C41" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />
        
        <!-- White Shirt Collar Peeking Out (Angled 3/4) -->
        <polygon points="-24,-180 -6,-156 -10,-180" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />
        <polygon points="18,-180 -6,-156 4,-180" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />

        <!-- Neck -->
        <g class="joint-neck" transform="translate(${isLeftFacing ? -6 : 0}, -180)">
          <rect x="-13" y="-28" width="26" height="32" rx="5" fill="#E8BA97" stroke="#1E293B" stroke-width="3" />

          <!-- Head Anchor (Origin at base of neck: 0, -25) -->
          <g class="joint-head" transform="translate(0, -25)">
            <!-- Ears -->
            <circle cx="${isLeftFacing ? 48 : 54}" cy="-50" r="12" fill="#E8BA97" stroke="#1E293B" stroke-width="3" />
            ${isLeftFacing ? '' : '<circle cx="-54" cy="-50" r="12" fill="#E8BA97" stroke="#1E293B" stroke-width="3" />'}

            <!-- Face Base (Contoured 3/4 towards Left) -->
            <path d="${isLeftFacing 
              ? 'M -52 -58 C -54 -115 -32 -142 6 -142 C 40 -142 54 -115 50 -58 C 46 0 24 16 -12 16 C -38 16 -50 0 -52 -58 Z' 
              : 'M -50 -58 C -52 -115 -35 -142 0 -142 C 35 -142 52 -115 50 -58 C 48 0 30 14 0 14 C -30 14 -48 0 -50 -58 Z'}" 
                  fill="#E8BA97" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />

            <!-- Neatly Groomed Dark Beard & Mustache -->
            <path class="part-beard" d="${isLeftFacing 
              ? 'M -50 -48 C -52 -4 -34 22 -6 22 C 26 22 46 -6 44 -48 C 34 -34 22 -26 10 -22 C -2 -18 -18 -18 -32 -24 C -42 -30 -48 -38 -50 -48 Z' 
              : 'M -46 -48 C -48 -8 -30 20 0 20 C 30 20 48 -8 46 -48 C 36 -34 26 -26 16 -22 C 7 -18 -7 -18 -16 -22 C -26 -26 -36 -34 -46 -48 Z'}" 
                  fill="#18181B" stroke="#0F172A" stroke-width="2.5" />
            <path d="${isLeftFacing ? 'M -28 -34 Q -8 -40 14 -34 C 8 -26 0 -26 -8 -30 C -16 -26 -22 -26 -28 -34 Z' : 'M -20 -34 Q 0 -40 20 -34 C 14 -26 7 -26 0 -30 C -7 -26 -14 -26 -20 -34 Z'}" 
                  fill="#18181B" stroke="#0F172A" stroke-width="2" />

            <!-- Dark Hair Crop -->
            <path d="${isLeftFacing 
              ? 'M -54 -85 C -56 -140 -16 -154 6 -154 C 32 -154 54 -140 50 -85 C 42 -96 28 -100 18 -96 C 8 -106 -10 -108 -24 -102 C -38 -108 -48 -100 -54 -85 Z' 
              : 'M -52 -85 C -54 -140 -20 -154 0 -154 C 25 -154 54 -140 52 -85 C 44 -96 32 -100 22 -96 C 13 -106 -4 -108 -18 -102 C -32 -108 -44 -100 -52 -85 Z'}" 
                  fill="#18181B" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" />

            <!-- Facial Features Group -->
            <g class="part-face">
              <!-- Eyebrows -->
              <g class="eyebrow-left" transform="translate(${isLeftFacing ? -28 : -24}, -74)">
                <path d="M -14 0 Q 0 -5 14 0" stroke="#18181B" stroke-width="5" stroke-linecap="round" fill="none" />
              </g>
              <g class="eyebrow-right" transform="translate(${isLeftFacing ? 18 : 24}, -74)">
                <path d="M -14 0 Q 0 -5 14 0" stroke="#18181B" stroke-width="5" stroke-linecap="round" fill="none" />
              </g>

              <!-- Left Eye (Front Eye in 3/4 Left) -->
              <g class="eye-left" transform="translate(${isLeftFacing ? -28 : -24}, -54)">
                <ellipse cx="0" cy="0" rx="12" ry="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2" />
                <g class="pupil-left">
                  <circle cx="0" cy="1" r="6" fill="#1E293B" />
                  <circle cx="-2" cy="-1.5" r="2.2" fill="#FFFFFF" />
                </g>
                <rect class="eyelid-left" x="-14" y="-16" width="28" height="32" fill="#E8BA97" stroke="#1E293B" stroke-width="2" transform="scale(1, 0.05)" />
              </g>

              <!-- Right Eye (Profile Eye in 3/4 Left) -->
              <g class="eye-right" transform="translate(${isLeftFacing ? 18 : 24}, -54)">
                <ellipse cx="0" cy="0" rx="${isLeftFacing ? 10 : 12}" ry="14" fill="#FFFFFF" stroke="#1E293B" stroke-width="2" />
                <g class="pupil-right">
                  <circle cx="0" cy="1" r="${isLeftFacing ? 5 : 6}" fill="#1E293B" />
                  <circle cx="-2" cy="-1.5" r="2.2" fill="#FFFFFF" />
                </g>
                <rect class="eyelid-right" x="-14" y="-16" width="28" height="32" fill="#E8BA97" stroke="#1E293B" stroke-width="2" transform="scale(1, 0.05)" />
              </g>

              <!-- Mohamed's Glasses (Signature Brand Feature - 3/4 Left Perspective) -->
              <g class="part-glasses">
                <!-- Left Frame (Front) -->
                <rect x="${isLeftFacing ? -44 : -42}" y="-70" width="${isLeftFacing ? 32 : 32}" height="28" rx="8" 
                      fill="#E0F2FE" fill-opacity="0.25" stroke="#0F172A" stroke-width="3.5" />
                <line x1="${isLeftFacing ? -38 : -36}" y1="-64" x2="${isLeftFacing ? -28 : -26}" y2="-64" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
                
                <!-- Right Frame (Perspective compressed) -->
                <rect x="${isLeftFacing ? 6 : 10}" y="-70" width="${isLeftFacing ? 26 : 32}" height="28" rx="8" 
                      fill="#E0F2FE" fill-opacity="0.25" stroke="#0F172A" stroke-width="3.5" />
                <line x1="${isLeftFacing ? 12 : 16}" y1="-64" x2="${isLeftFacing ? 22 : 26}" y2="-64" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
                
                <!-- Bridge -->
                <path d="M ${isLeftFacing ? -12 : -10} -56 Q ${isLeftFacing ? -2 : 0} -60 ${isLeftFacing ? 6 : 10} -56" stroke="#0F172A" stroke-width="3.5" fill="none" />
                
                <!-- Temple to ear -->
                <line x1="${isLeftFacing ? 32 : 42}" y1="-58" x2="${isLeftFacing ? 48 : 56}" y2="-54" stroke="#0F172A" stroke-width="3" />
              </g>

              <!-- Nose (Profile pointing Left) -->
              <path class="part-nose" d="${isLeftFacing ? 'M -8 -46 C -14 -40 -12 -34 -6 -32' : 'M 0 -46 C 2 -40 6 -36 0 -32'}" 
                    stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />

              <!-- Mouth Container -->
              <g class="part-mouth" transform="translate(${isLeftFacing ? -32 : -25}, -20)">
                <path class="part-mouth-path" d="M 10 12 Q 25 15 40 12" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" fill="none" />
              </g>
            </g>
          </g>
        </g>

        <!-- ======================================================= -->
        <!-- NEAR ARM (Left/Front - Primary Desk-Facing Interaction Arm) -->
        <!-- Features anatomically precise pointing hand & extended index -->
        <!-- Pivot at Shoulder: (0, 0) relative to joint-arm-l -->
        <!-- Lengths: L1 = 105px (shoulder to elbow), L2 = 185px (elbow to fingertip) -->
        <!-- ======================================================= -->
        <g class="joint-arm-l" transform="translate(${isLeftFacing ? -40 : -54}, -165)">
          <!-- Upper Arm (Bicep/Tricep) -->
          <path d="M -13 0 L 13 0 L 11 110 L -11 110 Z" fill="#107C41" stroke="#1E293B" stroke-width="3.5" rx="10" />
          
          <!-- Elbow Joint & Forearm -->
          <g class="joint-forearm-l" transform="translate(0, 105)">
            <rect x="-10" y="0" width="20" height="90" rx="10" fill="#E8BA97" stroke="#1E293B" stroke-width="3.5" />
            
            <!-- Wrist Joint & Pointing Hand -->
            <g class="joint-hand-l" transform="translate(0, 85)">
              <!-- Palm & Knuckles -->
              <circle cx="0" cy="10" r="12" fill="#E8BA97" stroke="#1E293B" stroke-width="2.5" />
              
              <!-- Curled Supporting Fingers (Thumb and knuckles) -->
              <path d="M 5 8 C 12 10 14 18 8 20 C 4 18 4 12 5 8 Z" fill="#E8BA97" stroke="#1E293B" stroke-width="2" />
              <path d="M -5 12 C -11 14 -11 22 -5 22 Z" fill="#D4A37F" stroke="#1E293B" stroke-width="1.5" />
              
              <!-- Extended Index Finger (Aligned along forearm reach axis) -->
              <path class="part-index-finger" 
                    d="M -4 14 L -4 48 C -4 54 4 54 4 48 L 4 14 Z" 
                    fill="#E8BA97" stroke="#1E293B" stroke-width="2.5" stroke-linejoin="round" />
              
              <!-- Hand probe markers for target-driven IK QA -->
              <g class="marker-palm" transform="translate(0, 10)"></g>
              <g class="marker-tip" transform="translate(0, 50)"></g>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
  `;
}
