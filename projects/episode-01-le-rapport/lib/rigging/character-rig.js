/**
 * Mohamed Excel — 2D Character Animation System
 * Core Character Rigging Engine (GSAP-powered, Deterministic, SVG-native)
 * 
 * Supports:
 * - Hierarchical parent-child joint forward kinematics
 * - Reusable expression state machine (mouth visemes, eyebrows, eyelids, pupils)
 * - Gaze direction & attention tracking
 * - Natural physical secondary action (breathing, blink cycles, balance recoil)
 * - Deterministic frame-by-frame rendering compatibility
 */

export class CharacterRig {
  /**
   * @param {SVGElement|string} svgRoot SVG root or selector
   * @param {Object} options Configuration and joint mappings
   */
  constructor(svgRoot, options = {}) {
    this.root = typeof svgRoot === 'string' ? document.querySelector(svgRoot) : svgRoot;
    if (!this.root) {
      throw new Error(`CharacterRig: Element not found: ${svgRoot}`);
    }

    this.id = options.id || this.root.id || 'char';
    this.name = options.name || 'Character';
    this.type = options.type || 'employee'; // 'employee' | 'mohamed'
    
    // Joint & part references
    this.parts = this._resolveParts();
    
    // Current physiological state
    this.state = {
      expression: 'neutral',
      gaze: { x: 0, y: 0 },
      isSitting: false,
      isSpeaking: false,
      armState: { left: 'idle', right: 'idle' }
    };

    // Pre-defined mouth path geometries (visemes)
    this.mouthShapes = {
      neutral: "M 10 12 Q 25 15 40 12",
      smile: "M 8 10 Q 25 24 42 10",
      happy: "M 8 10 Q 25 24 42 10",
      curious: "M 10 12 Q 25 18 40 14",
      openSmile: "M 8 10 Q 25 28 42 10 C 40 18 30 20 8 10 Z",
      openO: "M 16 10 C 16 4 34 4 34 10 C 34 20 16 20 16 10 Z",
      openWide: "M 8 8 Q 25 6 42 8 C 42 26 8 26 8 8 Z",
      frown: "M 10 18 Q 25 9 40 18",
      worried: "M 12 16 Q 25 12 38 18",
      frustrated: "M 10 18 Q 25 8 40 18",
      pucker: "M 18 12 Q 25 10 32 12 Q 25 17 18 12"
    };

    // Pre-defined eyebrow postures (Y delta & rotation angles)
    this.eyebrowShapes = {
      neutral: { leftY: 0, leftRot: 0, rightY: 0, rightRot: 0 },
      worried: { leftY: -3, leftRot: -12, rightY: -3, rightRot: 12 },
      frustrated: { leftY: 4, leftRot: 14, rightY: 4, rightRot: -14 },
      curious: { leftY: -6, leftRot: -8, rightY: 1, rightRot: 3 },
      surprised: { leftY: -8, leftRot: -4, rightY: -8, rightRot: 4 },
      happy: { leftY: -2, leftRot: -5, rightY: -2, rightRot: 5 },
      confident: { leftY: -2, leftRot: -4, rightY: 0, rightRot: 2 }
    };

    this._initializeJointOrigins();
  }

  /**
   * Resolve and cache DOM elements for all animated joints
   */
  _resolveParts() {
    const q = (sel) => this.root.querySelector(sel);
    return {
      characterGroup: q('.character-root') || this.root,
      shadow: q('.char-shadow'),
      body: q('.char-body'),
      pelvis: q('.joint-pelvis'),
      torso: q('.joint-torso'),
      neck: q('.joint-neck'),
      head: q('.joint-head'),
      hair: q('.part-hair'),
      face: q('.part-face'),
      eyebrowLeft: q('.eyebrow-left'),
      eyebrowRight: q('.eyebrow-right'),
      eyeLeft: q('.eye-left'),
      eyeRight: q('.eye-right'),
      eyelidLeft: q('.eyelid-left'),
      eyelidRight: q('.eyelid-right'),
      pupilLeft: q('.pupil-left'),
      pupilRight: q('.pupil-right'),
      mouth: q('.part-mouth-path'),
      mouthGroup: q('.part-mouth'),
      glasses: q('.part-glasses'),
      beard: q('.part-beard'),
      // Left limb hierarchy (viewer's left or character's left)
      armL: q('.joint-arm-l'),
      forearmL: q('.joint-forearm-l'),
      handL: q('.joint-hand-l'),
      // Right limb hierarchy
      armR: q('.joint-arm-r'),
      forearmR: q('.joint-forearm-r'),
      handR: q('.joint-hand-r'),
      // Legs
      legL: q('.joint-leg-l'),
      shinL: q('.joint-shin-l'),
      footL: q('.joint-foot-l'),
      legR: q('.joint-leg-r'),
      shinR: q('.joint-shin-r'),
      footR: q('.joint-foot-r')
    };
  }

  /**
   * Set explicit, anatomically accurate SVG transform origins for all rotating joints
   */
  _initializeJointOrigins() {
    const p = this.parts;
    const setOrigin = (el, origin) => {
      if (el) gsap.set(el, { transformOrigin: origin, transformBox: "fill-box" });
    };

    // Anatomical pivots:
    // Torso & Head use fill-box percentages
    setOrigin(p.head, "50% 90%");        // Neck / base of skull pivot
    setOrigin(p.torso, "50% 100%");      // Pelvis / waist pivot
    setOrigin(p.eyelidLeft, "50% 0%");   // Eyelids close downward
    setOrigin(p.eyelidRight, "50% 0%");
    setOrigin(p.eyebrowLeft, "20% 50%");
    setOrigin(p.eyebrowRight, "80% 50%");

    // Limb joints are structured with (0, 0) precisely at the hinge/socket pivot.
    // Using "0px 0px" prevents dynamic bounding box drift from child transforms.
    const setLimbOrigin = (el) => {
      if (el) gsap.set(el, { transformOrigin: "0px 0px" });
    };
    setLimbOrigin(p.armL);
    setLimbOrigin(p.forearmL);
    setLimbOrigin(p.handL);
    setLimbOrigin(p.armR);
    setLimbOrigin(p.forearmR);
    setLimbOrigin(p.handR);
    setLimbOrigin(p.legL);
    setLimbOrigin(p.shinL);
    setLimbOrigin(p.footL);
    setLimbOrigin(p.legR);
    setLimbOrigin(p.shinR);
    setLimbOrigin(p.footR);
  }

  /**
   * Append subtle biological idle breathing motion to a timeline
   * Deterministic finite loop.
   */
  addIdleBreathing(tl, startTime = 0, duration = 4, cycleDuration = 2.4) {
    const p = this.parts;
    const cycles = Math.max(1, Math.floor(duration / cycleDuration));
    
    for (let i = 0; i < cycles; i++) {
      const t = startTime + (i * cycleDuration);
      // Inhale
      tl.to(p.torso, {
        scaleY: 1.018,
        scaleX: 0.992,
        y: -1.5,
        duration: cycleDuration * 0.45,
        ease: "sine.inOut",
        overwrite: "auto"
      }, t);
      tl.to(p.head, {
        y: -1.8,
        duration: cycleDuration * 0.45,
        ease: "sine.inOut",
        overwrite: "auto"
      }, t);
      // Exhale
      tl.to(p.torso, {
        scaleY: 1.0,
        scaleX: 1.0,
        y: 0,
        duration: cycleDuration * 0.55,
        ease: "sine.inOut",
        overwrite: "auto"
      }, t + (cycleDuration * 0.45));
      tl.to(p.head, {
        y: 0,
        duration: cycleDuration * 0.55,
        ease: "sine.inOut",
        overwrite: "auto"
      }, t + (cycleDuration * 0.45));
    }
    return tl;
  }

  /**
   * Append a natural eyelid blink to a timeline
   */
  addBlink(tl, atTime = 0, blinkDuration = 0.16) {
    const p = this.parts;
    if (!p.eyelidLeft || !p.eyelidRight) return tl;

    tl.to([p.eyelidLeft, p.eyelidRight], {
      scaleY: 1.0, // Fully closed
      duration: blinkDuration * 0.45,
      ease: "power2.in"
    }, atTime);

    tl.to([p.eyelidLeft, p.eyelidRight], {
      scaleY: 0.05, // Open
      duration: blinkDuration * 0.55,
      ease: "power2.out"
    }, atTime + (blinkDuration * 0.45));

    return tl;
  }

  /**
   * Set pupil gaze direction and subtle head tilt towards target coordinates
   * @param {Object} options { x: -10 to +10, y: -8 to +8, headFollow: true, duration: 0.3 }
   */
  addGaze(tl, atTime = 0, { x = 0, y = 0, headFollow = true, duration = 0.35, ease = "power2.out" } = {}) {
    const p = this.parts;
    
    // Move pupils within orbit limits
    const clampedX = Math.max(-9, Math.min(9, x));
    const clampedY = Math.max(-7, Math.min(7, y));

    if (p.pupilLeft && p.pupilRight) {
      tl.to([p.pupilLeft, p.pupilRight], {
        x: clampedX,
        y: clampedY,
        duration,
        ease
      }, atTime);
    }

    if (headFollow && p.head) {
      tl.to(p.head, {
        rotation: clampedX * 0.6,
        y: clampedY * 0.4,
        duration: duration * 1.15,
        ease
      }, atTime);
    }

    return tl;
  }

  /**
   * Set facial expression (eyebrows + mouth viseme)
   */
  addExpression(tl, atTime = 0, expressionName = 'neutral', duration = 0.28) {
    const p = this.parts;
    const eb = this.eyebrowShapes[expressionName] || this.eyebrowShapes.neutral;
    const mouthPath = this.mouthShapes[expressionName] || this.mouthShapes.neutral;

    // Eyebrows
    if (p.eyebrowLeft) {
      tl.to(p.eyebrowLeft, {
        y: eb.leftY,
        rotation: eb.leftRot,
        duration,
        ease: "power2.out"
      }, atTime);
    }
    if (p.eyebrowRight) {
      tl.to(p.eyebrowRight, {
        y: eb.rightY,
        rotation: eb.rightRot,
        duration,
        ease: "power2.out"
      }, atTime);
    }

    // Mouth shape
    if (p.mouth) {
      tl.to(p.mouth, {
        attr: { d: mouthPath },
        duration,
        ease: "power2.out"
      }, atTime);
    }

    return tl;
  }

  /**
   * Dialogue speech animation: cycles natural mouth visemes synchronized to syllables
   * @param {Array<string>} visemeSequence e.g. ['openWide', 'smile', 'openO', 'neutral']
   */
  addSpeech(tl, startTime = 0, totalDuration = 2.0, visemeSequence = ['openWide', 'openO', 'smile', 'openWide', 'neutral']) {
    const p = this.parts;
    if (!p.mouth) return tl;

    const stepDuration = totalDuration / visemeSequence.length;

    visemeSequence.forEach((viseme, idx) => {
      const t = startTime + (idx * stepDuration);
      const path = this.mouthShapes[viseme] || this.mouthShapes.neutral;
      tl.to(p.mouth, {
        attr: { d: path },
        duration: stepDuration * 0.85,
        ease: "power1.inOut"
      }, t);
    });

    // Always settle mouth closed at speech finish
    tl.to(p.mouth, {
      attr: { d: this.mouthShapes.neutral },
      duration: 0.15,
      ease: "power2.out"
    }, startTime + totalDuration);

    return tl;
  }

  /**
   * Turn whole character to face direction (-1 = left, 1 = right)
   */
  addTurn(tl, atTime = 0, direction = 1, duration = 0.3) {
    const p = this.parts;
    tl.to(p.characterGroup, {
      scaleX: direction,
      duration,
      ease: "power2.inOut"
    }, atTime);
    return tl;
  }
}

/**
 * Analytical 2-Bone Inverse Kinematics in 2D
 * Solves exact joint angles so that the terminal index finger points directly to target (targetX, targetY).
 * 
 * @param {Object} shoulder { x, y } in world/canvas coordinates
 * @param {Object} target { x, y } in world/canvas coordinates
 * @param {number} L1 Length of upper arm (shoulder to elbow, default 110)
 * @param {number} L2 Length of forearm + hand + finger (elbow to index tip, default 195)
 * @param {string} bendDirection 'down' | 'up' (default 'down' for natural elbow gravity hang)
 * @returns {Object} { shoulderAngleDeg, elbowAngleDeg, elbow: {x,y}, distance, isReachable }
 */
export function solveTwoBoneIK(shoulder, target, L1 = 110, L2 = 195, bendDirection = 'down') {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  let dist = Math.sqrt(dx * dx + dy * dy);

  // Prevent hyper-extension singularity
  const maxReach = (L1 + L2) * 0.985;
  const minReach = Math.abs(L1 - L2) + 10;
  dist = Math.max(minReach, Math.min(dist, maxReach));

  // Base angle from shoulder to target (radians in standard 2D cartesian)
  const thetaBase = Math.atan2(dy, dx);

  // Law of cosines for shoulder interior angle (alpha)
  const cosAlpha = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

  // Law of cosines for elbow interior angle (beta)
  const cosBeta = (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2);
  const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));

  // Elbow flexion angle from straight collinear line
  const gamma = Math.PI - beta;

  // Bend direction sign
  const sign = bendDirection === 'down' ? -1 : 1;

  // Shoulder world angle
  const thetaShoulderWorld = thetaBase + (sign * alpha);

  // In rest pose, upper arm hangs vertically along +Y (+90 deg or PI/2 rad).
  // GSAP rotation is delta from rest (0 deg = straight down).
  let shoulderDeg = (thetaShoulderWorld - Math.PI / 2) * (180 / Math.PI);
  
  // Forearm bend relative to upper arm:
  // In rest pose, forearm hangs down along upper arm vector.
  // Relative flexion angle to align with target ray:
  let elbowDeg = (sign * -gamma) * (180 / Math.PI);

  // Normalize shoulderDeg to [-180, 180]
  while (shoulderDeg > 180) shoulderDeg -= 360;
  while (shoulderDeg < -180) shoulderDeg += 360;

  // Calculate actual world coordinates of elbow
  const elbowX = shoulder.x + L1 * Math.cos(thetaShoulderWorld);
  const elbowY = shoulder.y + L1 * Math.sin(thetaShoulderWorld);

  return {
    shoulderDeg,
    elbowDeg,
    elbow: { x: elbowX, y: elbowY },
    distance: dist,
    isReachable: dist <= (L1 + L2)
  };
}
