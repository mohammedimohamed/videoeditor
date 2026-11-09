/**
 * Mohamed Excel — 2D Character Animation System
 * Reusable Character Controller & Unified Animation Interface
 * 
 * Provides a high-level, capability-based API for characters (Mohamed, Karim, future characters).
 * Separates high-level storytelling and behavior orchestration from low-level joint transforms.
 * 
 * Key Architectural Guarantees:
 * 1. Unified interface across both characters where anatomical rigs support it.
 * 2. Strict separation between pointAt(target) [orientation & angular alignment]
 *    and reachTo(target) [physical contact & 2-bone inverse kinematics].
 * 3. Track segregation to prevent GSAP transform conflicts during concurrent behaviors.
 * 4. Deterministic HyperFrames seekability and empirical live DOM diagnostics.
 */

import { CharacterRig } from './character-rig.js';
import {
  pointWorld,
  dist,
  ang,
  wrap,
  solvePointingRay,
  measurePointingError,
  solveReachingTarget,
  measureReachingContact,
  solveLegIK,
  measurePlantedFootWorld,
  measureGazeRay,
  gazeOffset
} from './ik.js';

export class CharacterController {
  /**
   * @param {CharacterRig|string} rig CharacterRig instance or selector
   * @param {Object} options Configuration
   */
  constructor(rig, options = {}) {
    if (typeof rig === 'string' || (rig instanceof Element)) {
      this.rig = new CharacterRig(rig, options);
    } else if (rig instanceof CharacterRig) {
      this.rig = rig;
    } else {
      throw new Error('CharacterController: valid CharacterRig or SVG element required.');
    }

    this.id = options.id || this.rig.id;
    this.name = options.name || this.rig.name || 'Character';
    this.type = options.type || this.rig.type || 'employee';

    // Auto-detect pose from SVG structure
    const rootEl = this.rig.parts.characterGroup;
    const isSeatedDom = !!rootEl.querySelector('.seated-near-leg') || !!rootEl.querySelector('.seated-far-leg');
    this.pose = options.pose || (isSeatedDom ? 'seated' : 'standing');

    // Capabilities based on rig morphology
    this.capabilities = new Set([
      'facial',
      'speech',
      'gaze',
      'pointing',
      'reaching',
      'gestures'
    ]);

    if (this.pose === 'standing') {
      this.capabilities.add('locomotion');
      this.capabilities.add('turn');
    } else {
      this.capabilities.add('seated-desk');
      this.capabilities.add('typing');
      this.capabilities.add('handToForehead');
    }

    // Default configuration
    this.groundY = options.groundY !== undefined ? options.groundY : 1104; // Pelvis Y so shoes touch floor y=1386
    this.nativeFacing = options.nativeFacing || (this.name === 'mohamed' ? -1 : 1);
    this.facing = options.facing || this.nativeFacing;

    // Behavior state tracking
    this.state = {
      currentExpression: 'neutral',
      gazeTarget: null,
      pointingTarget: null,
      reachingTarget: null,
      isWalking: false,
      isSpeaking: false,
      lastPointingDiagnostics: null,
      lastReachingDiagnostics: null
    };
  }

  /**
   * Query if character rig supports a given behavior capability
   * @param {string} capability e.g. 'locomotion', 'seated-desk', 'pointing'
   */
  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  /**
   * 1. IDLE: Natural biological breathing and periodic blinking
   * @param {Object} options { tl, atTime, duration, breathing, blinking }
   */
  idle({ tl = gsap.timeline(), atTime = 0, duration = 4.0, breathing = true, blinking = true } = {}) {
    if (breathing) {
      this.rig.addIdleBreathing(tl, atTime, duration);
    }
    if (blinking) {
      const blinks = Math.max(1, Math.floor(duration / 2.2));
      for (let i = 0; i < blinks; i++) {
        const blinkTime = atTime + (i * 2.2) + 0.8;
        if (blinkTime < atTime + duration) {
          this.rig.addBlink(tl, blinkTime, 0.16);
        }
      }
    }
    return tl;
  }

  /**
   * 2. LOCOMOTION: Grounded bipedal walk to an absolute X coordinate
   * Supports two distinct quality tiers:
   * - 'basic': Standard sinusoidal FK locomotion with floor contact, swing clearance and stable stopping.
   * - 'foot-locked': High-precision inverse kinematics foot anchoring with root trajectory compensation.
   * 
   * @param {Object} options { tl, atTime, targetX, startX, duration, speed, groundY, mode }
   */
  walkTo({
    tl = gsap.timeline(),
    atTime = 0,
    targetX = 855,
    startX = null,
    duration = null,
    speed = 135, // pixels per second
    groundY = null,
    mode = 'basic' // 'basic' | 'foot-locked'
  } = {}) {
    if (!this.hasCapability('locomotion')) {
      console.warn(`[CharacterController] ${this.name} (${this.pose}) does not support locomotion.`);
      return tl;
    }

    const p = this.rig.parts;
    const gY = groundY !== null ? groundY : this.groundY;
    const curX = startX !== null ? startX : (gsap.getProperty(p.characterGroup, "x") || 1180);
    const deltaX = targetX - curX;
    const distance = Math.abs(deltaX);

    if (distance < 5) return tl;

    const walkDuration = duration !== null ? duration : Math.max(1.2, distance / speed);
    const direction = deltaX > 0 ? 1 : -1;

    // Step calculations
    const stepLength = mode === 'foot-locked' ? 50.0 : 81.25;
    const numSteps = Math.max(2, Math.round(distance / stepLength));
    const activeWalkDur = Math.max(0.8, walkDuration - 0.25);
    const stepDuration = activeWalkDur / numSteps;

    if (mode === 'foot-locked') {
      return this._walkFootLocked({
        tl,
        atTime,
        curX,
        targetX,
        gY,
        walkDuration,
        activeWalkDur,
        direction,
        distance,
        numSteps,
        stepDuration,
        p
      });
    }

    // Translate root along X with natural deceleration at the end (Basic FK tier)
    tl.fromTo(p.characterGroup, 
      { x: curX, y: gY }, 
      { x: targetX, y: gY, duration: activeWalkDur, ease: "power1.inOut", immediateRender: false }, 
      atTime
    );
    this.state.x = targetX;
    this.state.y = gY;

    // Bipedal leg alternation (Basic FK locomotion)
    for (let i = 0; i < numSteps; i++) {
      const t = atTime + (i * stepDuration);
      const isEven = i % 2 === 0;
      const swingLeg = isEven ? p.legL : p.legR;
      const swingShin = isEven ? p.shinL : p.shinR;
      const swingFoot = isEven ? p.footL : p.footR;
      const stanceLeg = isEven ? p.legR : p.legL;
      const stanceShin = isEven ? p.shinR : p.shinL;
      const stanceFoot = isEven ? p.footR : p.footL;

      const armLeading = isEven ? p.armR : p.armL;
      const armTrailing = isEven ? p.armL : p.armR;

      // Pelvis vertical bounce
      tl.to(p.pelvis, {
        y: -5,
        duration: stepDuration * 0.45,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, t);

      // Swing leg: flex knee to 28° to clear ground, forward swing
      tl.to(swingLeg, {
        rotation: direction * -12,
        duration: stepDuration * 0.5,
        ease: "power2.in"
      }, t);
      tl.to(swingShin, {
        rotation: 28,
        duration: stepDuration * 0.5,
        ease: "power2.in"
      }, t);
      tl.to(swingFoot, {
        rotation: -10,
        duration: stepDuration * 0.5,
        ease: "power2.in"
      }, t);

      // Swing leg plant (heel strike & roll flat)
      tl.to(swingLeg, {
        rotation: direction * 9.0,
        duration: stepDuration * 0.5,
        ease: "power2.out"
      }, t + (stepDuration * 0.5));
      tl.to(swingShin, {
        rotation: 0,
        duration: stepDuration * 0.5,
        ease: "power2.out"
      }, t + (stepDuration * 0.5));
      tl.to(swingFoot, {
        rotation: 0,
        duration: stepDuration * 0.5,
        ease: "power2.out"
      }, t + (stepDuration * 0.5));

      // Stance leg sweep back
      tl.to(stanceLeg, {
        rotation: direction * -9.0,
        duration: stepDuration,
        ease: "none"
      }, t);
      tl.to(stanceShin, {
        rotation: 0,
        duration: stepDuration,
        ease: "none"
      }, t);
      tl.to(stanceFoot, {
        rotation: 0,
        duration: stepDuration,
        ease: "none"
      }, t);

      // Arm antiphase counter-swing (subtle cartoon counter-balance)
      tl.to(armLeading, {
        rotation: direction * 14,
        duration: stepDuration * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, t);
      tl.to(armTrailing, {
        rotation: direction * -14,
        duration: stepDuration * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, t);
    }

    // Final settlement: both feet flat on floor
    const settleTime = atTime + activeWalkDur;
    tl.to([p.legL, p.shinL, p.footL, p.legR, p.shinR, p.footR], {
      rotation: 0,
      duration: 0.25,
      ease: "power2.out"
    }, settleTime);
    tl.to([p.armL, p.armR], {
      rotation: 0,
      duration: 0.25,
      ease: "power2.out"
    }, settleTime);

    this.state.isWalking = true;
    return tl;
  }

  /**
   * High-Precision Foot-Locked Locomotion (Kinematic IK Compensated)
   * Ensures stance foot remains horizontally stationary (|drift| <= 3px) during ground contact.
   */
  _walkFootLocked({
    tl,
    atTime,
    curX,
    targetX,
    gY,
    walkDuration,
    activeWalkDur,
    direction,
    distance,
    numSteps,
    stepDuration,
    p
  }) {
    const isFlipped = (this.facing !== this.nativeFacing);
    const rotSign = isFlipped ? -1 : 1;
    // Walk posture groundY: calibrated +6.0px so leg extension stays safely below 246px without singularity
    const walkPelvisY = gY + 6.0;

    // Translate root along X with natural ease (Foot-locked tier)
    tl.fromTo(p.characterGroup, 
      { x: curX, y: walkPelvisY }, 
      { x: targetX, y: walkPelvisY, duration: activeWalkDur, ease: "none", immediateRender: false }, 
      atTime
    );
    this.state.x = targetX;
    this.state.y = gY;

    const ankleY = 1365.2; // Calibrated ankle target so shoe sole rests flat on floor Y = 1386.0 (|dev| <= 1.2px)
    const subIntervals = 16;
    const subDt = stepDuration / subIntervals;

    for (let i = 0; i < numSteps; i++) {
      const tStep = atTime + (i * stepDuration);
      const isEven = i % 2 === 0;
      // Stance / Swing alternation:
      // When moving right (direction > 0), step 0 plants legR (trailing), swings legL (leading)
      // When moving left (direction < 0), step 0 plants legR (trailing), swings legL (leading)
      const stanceLeg = isEven ? p.legR : p.legL;
      const stanceShin = isEven ? p.shinR : p.shinL;
      const stanceFoot = isEven ? p.footR : p.footL;
      const swingLeg = isEven ? p.legL : p.legR;
      const swingShin = isEven ? p.shinL : p.shinR;
      const swingFoot = isEven ? p.footL : p.footR;

      const armLeading = isEven ? p.armR : p.armL;
      const armTrailing = isEven ? p.armL : p.armR;

      // Hip socket world offset for stance leg
      const isStanceNear = (stanceLeg === p.legL);
      const localHipX = isStanceNear ? -22 : 24;
      const worldHipOffsetX = localHipX * rotSign;

      // Root position at start of this step
      const stepStartFrac = i / numSteps;
      const rootXStart = curX + stepStartFrac * (targetX - curX);
      const stepStride = Math.abs(targetX - curX) / numSteps;
      const rootXMid = rootXStart + direction * (stepStride * 0.5);

      // World X plant position of the stance ankle (centered at mid-step so deltaX is in [-stride/2, +stride/2])
      const X_plant = rootXMid + worldHipOffsetX;

      // Set initial stance pose directly at start of step so there is 0 startup transient
      const H_start_step = { x: rootXStart + worldHipOffsetX, y: walkPelvisY + 10 };
      const sol0 = solveLegIK(H_start_step, { x: X_plant, y: ankleY }, 125, 125, this.facing);
      tl.set(stanceLeg, { rotation: wrap(sol0.legRot * rotSign) }, tStep);
      tl.set(stanceShin, { rotation: wrap(sol0.shinRot * rotSign) }, tStep);
      tl.set(stanceFoot, { rotation: wrap(sol0.footRot * rotSign) }, tStep);

      // Pelvis vertical compensation: subtle 1.5px drop so leg extension stays <= 246px
      tl.to(p.pelvis, {
        y: 1.5,
        duration: stepDuration * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, tStep);

      // Solve stance leg IK across sub-intervals to hold X_plant fixed
      for (let k = 0; k < subIntervals; k++) {
        const tk = tStep + (k * subDt);
        const nextFrac = (i + (k + 1) / subIntervals) / numSteps;
        const rootXNext = curX + nextFrac * (targetX - curX);
        const pelvisBounce = 1.5 * Math.sin(((k + 1) / subIntervals) * Math.PI);
        const H_next = { x: rootXNext + worldHipOffsetX, y: walkPelvisY + pelvisBounce + 10 };

        const sol = solveLegIK(H_next, { x: X_plant, y: ankleY }, 125, 125, this.facing);

        tl.to(stanceLeg, { rotation: wrap(sol.legRot * rotSign), duration: subDt, ease: "none" }, tk);
        tl.to(stanceShin, { rotation: wrap(sol.shinRot * rotSign), duration: subDt, ease: "none" }, tk);
        tl.to(stanceFoot, { rotation: wrap(sol.footRot * rotSign), duration: subDt, ease: "none" }, tk);
      }

      // Swing leg: lifts off floor (flex knee to 38° for >= 12px clearance) then extends to plant
      tl.to(swingLeg, {
        rotation: wrap(direction * -12 * rotSign),
        duration: stepDuration * 0.45,
        ease: "power2.in"
      }, tStep);
      tl.to(swingShin, {
        rotation: wrap(38 * rotSign),
        duration: stepDuration * 0.45,
        ease: "power2.in"
      }, tStep);
      tl.to(swingFoot, {
        rotation: wrap(-14 * rotSign),
        duration: stepDuration * 0.45,
        ease: "power2.in"
      }, tStep);

      // Swing leg touchdown
      tl.to(swingLeg, {
        rotation: wrap(direction * 8.0 * rotSign),
        duration: stepDuration * 0.55,
        ease: "power2.out"
      }, tStep + (stepDuration * 0.45));
      tl.to(swingShin, {
        rotation: 0,
        duration: stepDuration * 0.55,
        ease: "power2.out"
      }, tStep + (stepDuration * 0.45));
      tl.to(swingFoot, {
        rotation: 0,
        duration: stepDuration * 0.55,
        ease: "power2.out"
      }, tStep + (stepDuration * 0.45));

      // Arm antiphase counter-swing
      tl.to(armLeading, {
        rotation: direction * 14,
        duration: stepDuration * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, tStep);
      tl.to(armTrailing, {
        rotation: direction * -14,
        duration: stepDuration * 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, tStep);
    }

    // Final settlement: both feet flat on floor, root returns to groundY
    const settleTime = atTime + activeWalkDur;
    tl.to(p.characterGroup, {
      y: gY,
      duration: 0.25,
      ease: "power2.out"
    }, settleTime);
    tl.to([p.legL, p.shinL, p.footL, p.legR, p.shinR, p.footR], {
      rotation: 0,
      duration: 0.25,
      ease: "power2.out"
    }, settleTime);
    tl.to([p.armL, p.armR], {
      rotation: 0,
      duration: 0.25,
      ease: "power2.out"
    }, settleTime);
    tl.to(p.pelvis, {
      y: 0,
      duration: 0.28,
      ease: "power2.out"
    }, settleTime);

    this.state.isWalking = true;
    return tl;
  }

  /**
   * 3. TURN: Face character left (-1) or right (+1)
   */
  turnTo(direction = 1, { tl = gsap.timeline(), atTime = 0, duration = 0.3 } = {}) {
    this.facing = direction;
    const targetScaleX = (direction === this.nativeFacing) ? 1 : -1;
    tl.to(this.rig.parts.characterGroup, {
      scaleX: targetScaleX,
      duration,
      ease: "power2.inOut"
    }, atTime);
    return tl;
  }

  /**
   * 4. GAZE: Look at world coordinate or target entity
   * @param {Object|Element|CharacterController} target World {x,y} or element
   */
  lookAt(target, { tl = gsap.timeline(), atTime = 0, duration = 0.35, headFollow = true } = {}) {
    let targetPos = { x: 540, y: 960 };

    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      targetPos = target;
    } else if (target instanceof CharacterController) {
      // Look at the other character's head
      const headEl = target.rig.parts.head || target.rig.parts.torso;
      targetPos = pointWorld(headEl);
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) targetPos = pointWorld(el);
    }

    this.state.gazeTarget = targetPos;

    // Use rig's eye/head solver
    const p = this.rig.parts;
    const eyePos = pointWorld(p.eyeLeft || p.head);
    const dx = targetPos.x - eyePos.x;
    const dy = targetPos.y - eyePos.y;

    // Normalize to pupil offset range [-9 to +9, -7 to +7]
    const maxOffset = 8;
    const distTarget = Math.hypot(dx, dy) || 1;
    const pupilX = Math.max(-9, Math.min(9, (dx / distTarget) * maxOffset * 1.5));
    const pupilY = Math.max(-7, Math.min(7, (dy / distTarget) * maxOffset * 1.2));

    this.rig.addGaze(tl, atTime, { x: pupilX, y: pupilY, headFollow, duration });
    return tl;
  }

  /**
   * 5. POINTING: Orient index finger towards target
   * 
   * Strict Specification Requirement:
   * - Orients index finger along pointing ray towards target.
   * - Calculates angular alignment.
   * - Fingertip does NOT need to physically touch the target.
   * - Works for targets at any distance (near, far, beyond reach, offscreen).
   * - Measurable pointing-angle error (< 8°).
   * 
   * @param {Object} target World coordinate {x, y}
   * @param {Object} options { tl, atTime, arm, duration, ease }
   */
  pointAt(target, {
    tl = gsap.timeline(),
    atTime = 0,
    arm = 'near', // 'near' (foreground) or 'far' (background)
    duration = 0.55,
    ease = "power2.out",
    bendDirection = 'down',
    rootPos = null,
    shoulderPos = null
  } = {}) {
    const p = this.rig.parts;
    const side = (this.name === 'mohamed') 
      ? 'L' 
      : (arm === 'near' ? (this.facing === -1 ? 'L' : 'R') : 'R');

    const armEl = p['arm' + side];
    const foreEl = p['forearm' + side];
    const handEl = p['hand' + side];

    let S;
    const activeRoot = rootPos || (this.state.x !== undefined ? { x: this.state.x, y: this.state.y } : null);
    if (shoulderPos) {
      S = shoulderPos;
    } else if (activeRoot) {
      const offsetX = (this.name === 'mohamed')
        ? (this.facing === -1 ? -55 : 55)
        : (this.facing === -1 ? -48 : 48);
      const offsetY = (this.name === 'mohamed') ? -152 : -165;
      S = { x: activeRoot.x + offsetX, y: activeRoot.y + offsetY };
    } else {
      S = pointWorld(armEl);
    }

    const L1 = 105; // Upper arm length (shoulder to elbow)
    const L2 = 135; // Forearm + index hand length (elbow to tip)

    // Solve analytical pointing geometry
    const sol = solvePointingRay(S, target, L1, L2, { bendDirection });
    this.state.pointingTarget = target;
    this.state.lastPointingDiagnostics = sol;

    const curScaleX = gsap.getProperty(this.rig.parts.characterGroup, "scaleX");
    const rotSign = (curScaleX !== null && curScaleX !== undefined && curScaleX < 0) ? -1 : 1;

    let shoulderRot = wrap(sol.shoulderRot * rotSign);
    let foreRot = wrap(sol.forearmRot * rotSign);

    // Anticipation: subtle shoulder pull-back before extension
    const antDuration = duration * 0.3;
    const pointDuration = duration * 0.7;

    tl.to(armEl, {
      rotation: shoulderRot * 0.75,
      duration: antDuration,
      ease: "power1.in"
    }, atTime);

    // Main pointing extension
    tl.to(armEl, {
      rotation: shoulderRot,
      duration: pointDuration,
      ease
    }, atTime + antDuration);

    tl.to(foreEl, {
      rotation: foreRot,
      duration: pointDuration,
      ease
    }, atTime + antDuration);

    // Keep hand aligned with forearm (extended index finger)
    tl.to(handEl, {
      rotation: 0,
      duration: pointDuration,
      ease
    }, atTime + antDuration);

    return tl;
  }

  /**
   * 6. REACHING: Attempt physical hand contact with an object via 2-Bone IK
   * 
   * Strict Specification Requirement:
   * - Attempts physical hand contact.
   * - Uses analytical 2-bone inverse kinematics.
   * - Checks reachability (d <= L1 + L2).
   * - Respects joint limits and prevents body/object penetration.
   * - Reports unreachable targets and clamping state.
   * 
   * @param {Object} target World coordinate {x, y}
   * @param {Object} options { tl, atTime, arm, duration, ease, effector }
   */
  reachTo(target, {
    tl = gsap.timeline(),
    atTime = 0,
    arm = 'near',
    duration = 0.6,
    ease = "power2.out",
    effector = 'tip',
    rootPos = null,
    shoulderPos = null
  } = {}) {
    const p = this.rig.parts;
    const side = (this.name === 'mohamed') 
      ? 'L' 
      : (arm === 'near' ? (this.facing === -1 ? 'L' : 'R') : 'R');

    const armEl = p['arm' + side];
    const foreEl = p['forearm' + side];
    const handEl = p['hand' + side];

    let S;
    const activeRoot = rootPos || (this.state.x !== undefined ? { x: this.state.x, y: this.state.y } : null);
    if (shoulderPos) {
      S = shoulderPos;
    } else if (activeRoot) {
      const offsetX = (this.name === 'mohamed')
        ? (this.facing === -1 ? -55 : 55)
        : (this.facing === -1 ? -48 : 48);
      const offsetY = (this.name === 'mohamed') ? -152 : -165;
      S = { x: activeRoot.x + offsetX, y: activeRoot.y + offsetY };
    } else {
      S = pointWorld(armEl);
    }

    const L1 = 105;
    const L2 = effector === 'tip' ? 135 : 100;

    // Torso bounds for collision detection
    const pelvisWorld = pointWorld(p.pelvis);
    const torsoBounds = {
      xMin: pelvisWorld.x - 55,
      xMax: pelvisWorld.x + 55,
      yMin: pelvisWorld.y - 180,
      yMax: pelvisWorld.y + 10
    };

    const sol = solveReachingTarget(S, target, L1, L2, { torsoBounds });
    this.state.reachingTarget = target;
    this.state.lastReachingDiagnostics = sol;

    const curScaleX = gsap.getProperty(this.rig.parts.characterGroup, "scaleX");
    const rotSign = (curScaleX !== null && curScaleX !== undefined && curScaleX < 0) ? -1 : 1;

    let shoulderRot = wrap((sol.shoulderAngleDeg - 90) * rotSign);
    let foreRot = wrap((sol.forearmAngleDeg - sol.shoulderAngleDeg) * rotSign);

    tl.to(armEl, {
      rotation: shoulderRot,
      duration,
      ease
    }, atTime);

    tl.to(foreEl, {
      rotation: foreRot,
      duration,
      ease
    }, atTime);

    tl.to(handEl, {
      rotation: 0,
      duration,
      ease
    }, atTime);

    return tl;
  }

  /**
   * 7. EXPRESSION: Switch facial emotions and eyebrow/mouth visemes
   * @param {string} emotion 'neutral' | 'worried' | 'happy' | 'curious' | 'frustrated' | 'surprised'
   */
  express(emotion = 'neutral', { tl = gsap.timeline(), atTime = 0, duration = 0.3 } = {}) {
    this.state.currentExpression = emotion;
    this.rig.addExpression(tl, atTime, emotion, duration);
    return tl;
  }

  /**
   * 8. SPEECH: Speak dialogue with synchronized mouth visemes and head cadence
   */
  speak(dialogue = '', {
    tl = gsap.timeline(),
    atTime = 0,
    duration = 2.0,
    gesture = null,
    visemes = ['openWide', 'openO', 'smile', 'openWide', 'curious', 'neutral']
  } = {}) {
    this.state.isSpeaking = true;
    this.rig.addSpeech(tl, atTime, duration, visemes);

    // Subtle head cadence nods during speech
    const p = this.rig.parts;
    const nods = Math.max(1, Math.floor(duration / 0.8));
    for (let i = 0; i < nods; i++) {
      const nodTime = atTime + (i * 0.8) + 0.1;
      tl.to(p.head, {
        rotation: 4,
        y: 2,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      }, nodTime);
    }

    if (gesture) {
      this.gesture(gesture, { tl, atTime, duration });
    }

    return tl;
  }

  /**
   * 9. LISTEN: Actively listen to another speaking character
   */
  listenTo(speakerController, { tl = gsap.timeline(), atTime = 0, duration = 2.0, responsiveNods = true } = {}) {
    // Focus gaze on speaker
    this.lookAt(speakerController, { tl, atTime, duration: 0.35 });

    // Attentive posture
    const p = this.rig.parts;
    tl.to(p.torso, {
      rotation: this.facing * 3,
      duration: 0.4,
      ease: "power2.out"
    }, atTime);

    if (responsiveNods) {
      // Responsive comprehension micro-nods
      tl.to(p.head, {
        rotation: 3,
        duration: 0.25,
        yoyo: true,
        repeat: 2,
        ease: "sine.inOut"
      }, atTime + 0.8);

      // Expression soft transition to comprehension/curiosity
      this.express('curious', { tl, atTime: atTime + 0.5, duration: 0.3 });
    }

    return tl;
  }

  /**
   * 10. GESTURE: Play named iconic gesture
   * @param {string} name 'explain' | 'wave' | 'handToForehead' | 'typing' | 'shrug' | 'welcome'
   */
  gesture(name, { tl = gsap.timeline(), atTime = 0, duration = 1.0 } = {}) {
    const p = this.rig.parts;

    switch (name) {
      case 'explain': {
        // Conversational open-hand gesture
        tl.to(p.armR, { rotation: -38, duration: duration * 0.4, ease: "power2.out" }, atTime);
        tl.to(p.forearmR, { rotation: 52, duration: duration * 0.4, ease: "power2.out" }, atTime);
        tl.to(p.handR, { rotation: 18, duration: duration * 0.4, ease: "power2.out" }, atTime);

        // Secondary subtle torso emphasis
        tl.to(p.torso, { rotation: -2, duration: duration * 0.4, yoyo: true, repeat: 1 }, atTime);

        // Settle back to neutral
        tl.to([p.armR, p.forearmR, p.handR], { rotation: 0, duration: duration * 0.4, ease: "power2.inOut" }, atTime + (duration * 0.6));
        break;
      }

      case 'wave': {
        // Friendly greeting wave
        tl.to(p.armR, { rotation: -120, duration: duration * 0.3, ease: "power2.out" }, atTime);
        tl.to(p.forearmR, { rotation: -30, duration: duration * 0.3, ease: "power2.out" }, atTime);
        // Hand wave oscillation
        tl.to(p.handR, {
          rotation: 35,
          duration: 0.16,
          yoyo: true,
          repeat: 3,
          ease: "sine.inOut"
        }, atTime + (duration * 0.3));

        tl.to([p.armR, p.forearmR, p.handR], { rotation: 0, duration: duration * 0.3, ease: "power2.inOut" }, atTime + (duration * 0.7));
        break;
      }

      case 'handToForehead': {
        // Frustration / fatigue pose with clear blue sleeve positioning
        tl.to(p.armR, { rotation: -70, duration: duration * 0.5, ease: "power2.out" }, atTime);
        tl.to(p.forearmR, { rotation: -155, duration: duration * 0.5, ease: "power2.out" }, atTime);
        tl.to(p.handR, { rotation: 15, duration: duration * 0.5, ease: "power2.out" }, atTime);
        tl.to(p.head, { rotation: 8, y: 5, duration: duration * 0.5, ease: "power2.out" }, atTime + 0.1);
        break;
      }

      case 'typing': {
        // Micro-motion of hands over keyboard
        tl.to(p.handR, { y: -3, duration: 0.12, yoyo: true, repeat: 5, ease: "power1.inOut" }, atTime);
        tl.to(p.handL, { y: 2, duration: 0.12, yoyo: true, repeat: 5, ease: "power1.inOut" }, atTime + 0.06);
        break;
      }

      case 'shrug': {
        // Uncertainty / question shrug
        tl.to(p.torso, { y: -4, duration: duration * 0.35, yoyo: true, repeat: 1 }, atTime);
        tl.to([p.armL, p.armR], { rotation: -25, duration: duration * 0.35, yoyo: true, repeat: 1 }, atTime);
        tl.to([p.forearmL, p.forearmR], { rotation: 40, duration: duration * 0.35, yoyo: true, repeat: 1 }, atTime);
        break;
      }

      default:
        console.warn(`[CharacterController] Unknown gesture: ${name}`);
    }

    return tl;
  }

  /**
   * 11. SIT DOWN & STAND UP
   */
  sitDown({ chairX = 320, chairY = 1120, duration = 0.8, tl = gsap.timeline(), atTime = 0 } = {}) {
    const p = this.rig.parts;
    tl.to(p.characterGroup, { x: chairX, y: chairY, duration, ease: "power2.inOut" }, atTime);
    this.pose = 'seated';
    return tl;
  }

  standUp({ duration = 0.8, tl = gsap.timeline(), atTime = 0 } = {}) {
    const p = this.rig.parts;
    tl.to(p.characterGroup, { y: this.groundY, duration, ease: "power2.out" }, atTime);
    this.pose = 'standing';
    return tl;
  }

  /**
   * Read live diagnostics from rendered DOM via getCTM()
   */
  getDiagnostics() {
    const p = this.rig.parts;
    const rootPos = pointWorld(p.characterGroup);
    const headPos = pointWorld(p.head || p.characterGroup);
    const pelvisPos = pointWorld(p.pelvis || p.characterGroup);

    // Foot ground contact
    const heelL = p.footL ? pointWorld(p.footL.querySelector('.marker-heel') || p.footL) : null;
    const toeL = p.footL ? pointWorld(p.footL.querySelector('.marker-toe') || p.footL) : null;
    const heelR = p.footR ? pointWorld(p.footR.querySelector('.marker-heel') || p.footR) : null;
    const toeR = p.footR ? pointWorld(p.footR.querySelector('.marker-toe') || p.footR) : null;

    let pointingReport = null;
    if (this.state.pointingTarget) {
      const side = (this.facing === -1 ? 'L' : 'R');
      pointingReport = measurePointingError(this.rig, side, this.state.pointingTarget);
    }

    let reachingReport = null;
    if (this.state.reachingTarget) {
      const side = (this.facing === -1 ? 'L' : 'R');
      reachingReport = measureReachingContact(this.rig, side, this.state.reachingTarget);
    }

    return {
      name: this.name,
      pose: this.pose,
      facing: this.facing,
      root: rootPos,
      pelvis: pelvisPos,
      head: headPos,
      expression: this.state.currentExpression,
      feet: {
        near: { heel: heelL, toe: toeL },
        far: { heel: heelR, toe: toeR }
      },
      pointing: pointingReport,
      reaching: reachingReport,
      capabilities: Array.from(this.capabilities)
    };
  }
}
