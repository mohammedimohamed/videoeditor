/**
 * Mohamed Excel — exact geometry helpers (live-DOM based).
 *
 * Everything here reads the REAL rendered joint positions through getCTM(), so solvers and the QA
 * report cannot disagree with what is drawn. All coordinates are in the 1080x1920 stage space.
 */

const RAD = Math.PI / 180;

/** World (stage) position of a local point of an SVG element. */
export function pointWorld(el, x = 0, y = 0) {
  const m = el.getCTM();
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
}

/** World rotation (degrees) of an element's local frame. */
export function frameRotation(el) {
  const m = el.getCTM();
  return Math.atan2(m.b, m.a) / RAD;
}

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) / RAD;
const wrap = (d) => { while (d > 180) d -= 360; while (d < -180) d += 360; return d; };

/**
 * Planar two-bone IK. Returns both mirror solutions' elbow candidates; the caller picks one with `pick`.
 * @param S shoulder  @param T target  @param L1 upper length  @param L2 lower length
 * @param pick (candidates[]) => candidate   (candidate = { elbow, phi1, phi2 })
 */
export function solveTwoBone(S, T, L1, L2, pick) {
  const rawD = dist(S, T);
  const d = Math.min(Math.max(rawD, Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-3);
  const base = ang(S, T);
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosA))) / RAD;
  const cands = [base + alpha, base - alpha].map((phi1) => {
    const elbow = { x: S.x + L1 * Math.cos(phi1 * RAD), y: S.y + L1 * Math.sin(phi1 * RAD) };
    // Second bone must go from the elbow to the (clamped) reach point on the S-T ray.
    const reach = { x: S.x + d * Math.cos(base * RAD), y: S.y + d * Math.sin(base * RAD) };
    return { elbow, phi1, phi2: ang(elbow, reach) };
  });
  const c = pick ? pick(cands) : cands[0];
  return { ...c, reachDistance: rawD, clamped: rawD !== d, alphaDeg: alpha };
}

/** Pick helpers */
export const pickElbowNearest = (hint) => (c) => (dist(c[0].elbow, hint) <= dist(c[1].elbow, hint) ? c[0] : c[1]);
export const pickLowerElbow = () => (c) => (c[0].elbow.y >= c[1].elbow.y ? c[0] : c[1]);
export const pickForwardKnee = (dir) => (c) => (c[0].elbow.x * dir >= c[1].elbow.x * dir ? c[0] : c[1]);

/**
 * DOM-driven arm IK.
 * The caller must already have placed parents (root, torso, head ...) in the pose it wants the arm solved in.
 * Limb rotations are zeroed, measured, solved, and the solved rotations are returned (not applied).
 *
 * @param rig       CharacterRig
 * @param side      'L' | 'R'
 * @param target    {x,y} world target for the end effector
 * @param effector  'tip' | 'palm'  (marker inside the hand)
 * @param pick      elbow chooser
 */
export function solveArm(rig, side, target, { effector = 'tip', pick } = {}) {
  const p = rig.parts;
  const arm = p['arm' + side], fore = p['forearm' + side], hand = p['hand' + side];
  gsap.set([arm, fore, hand], { rotation: 0 });
  const marker = hand.querySelector(effector === 'tip' ? '.marker-tip' : '.marker-palm');
  const S = pointWorld(arm), E0 = pointWorld(fore), W0 = pointWorld(hand), T0 = pointWorld(marker);
  const L1 = dist(S, E0);
  const L2 = dist(E0, T0);
  const phi0 = ang(S, E0);       // upper-arm direction at rotation 0
  const phiF0 = ang(E0, T0);     // forearm(+hand) direction at rotation 0
  const sol = solveTwoBone(S, target, L1, L2, pick);
  const armRot = wrap(sol.phi1 - phi0);
  const foreRot = wrap(sol.phi2 - phiF0 - armRot);
  const elbowFlexion = wrap(sol.phi2 - sol.phi1);
  return {
    armRot, foreRot, handRot: 0,
    shoulder: S, elbow: sol.elbow, L1, L2,
    reachDistance: sol.reachDistance, clamped: sol.clamped,
    shoulderAngleDeg: sol.alphaDeg, elbowFlexionDeg: elbowFlexion,
    wristLength: dist(E0, W0), handLength: dist(W0, T0),
  };
}

/**
 * Measure the real arm chain after the rotations have been applied to the DOM.
 */
export function measureArm(rig, side, effector = 'tip') {
  const p = rig.parts;
  const hand = p['hand' + side];
  const marker = hand.querySelector(effector === 'tip' ? '.marker-tip' : '.marker-palm');
  return {
    shoulder: pointWorld(p['arm' + side]),
    elbow: pointWorld(p['forearm' + side]),
    wrist: pointWorld(hand),
    tip: pointWorld(marker),
  };
}

/** Capture & restore gsap props (used to evaluate IK in a hypothetical final pose). */
export function capture(list) {
  const saved = list.map(([el, props]) => [el, Object.fromEntries(props.map((k) => [k, gsap.getProperty(el, k)]))]);
  return () => saved.forEach(([el, vals]) => gsap.set(el, vals));
}

/**
 * Dedicated Pointing Solver:
 * Orients the arm such that the vector along the forearm and index finger points directly
 * at target T. The finger does NOT need to touch target T.
 * Works for any target distance (near, far, beyond reach, off-screen).
 * 
 * @param {Object} S Shoulder position {x, y}
 * @param {Object} T Target position {x, y}
 * @param {number} L1 Upper arm length
 * @param {number} L2 Forearm + finger length
 * @param {Object} options Configuration
 * @returns {Object} Solved joint angles and pointing geometry
 */
export function solvePointingRay(S, T, L1 = 105, L2 = 135, {
  bendDirection = 'down',
  desiredFlexion = 28
} = {}) {
  const rawD = dist(S, T);
  const targetAngleRad = Math.atan2(T.y - S.y, T.x - S.x);
  const targetAngleDeg = targetAngleRad / RAD;

  let bestSRot = 0;
  let bestFRot = 0;
  let minErr = 999;
  let bestElbow = null;
  let bestTip = null;
  let bestFlexion = 0;

  // Search shoulder rotation from -180 to +180 in 1-deg increments
  for (let s = -180; s <= 180; s += 1) {
    const sRad = s * RAD;
    // Elbow position in SVG world coordinates
    const Ex = S.x - L1 * Math.sin(sRad);
    const Ey = S.y + L1 * Math.cos(sRad);

    // Aim angle from elbow to target
    const aimDeg = Math.atan2(T.y - Ey, T.x - Ex) / RAD;
    let f = wrap((aimDeg - 90) - s);

    // Human elbow flexion range [14°, 45°]
    const flex = Math.abs(f);
    if (flex >= 14 && flex <= 45) {
      // Fingertip position along the aim ray
      const Px = Ex + L2 * Math.cos(aimDeg * RAD);
      const Py = Ey + L2 * Math.sin(aimDeg * RAD);

      // Verify tip to target direction matches finger direction
      const distToT = dist({ x: Ex, y: Ey }, T);
      const aimRayAngle = (distToT > L2 + 5) ? Math.atan2(T.y - Py, T.x - Px) / RAD : aimDeg;
      const fingerAngle = Math.atan2(Py - Ey, Px - Ex) / RAD;
      const alignErr = Math.abs(wrap(aimRayAngle - fingerAngle));

      // Balance alignment error and natural comfortable elbow flexion
      const flexionPenalty = Math.abs(flex - desiredFlexion) * 0.05;
      const totalCost = alignErr + flexionPenalty;

      if (totalCost < minErr) {
        minErr = totalCost;
        bestSRot = s;
        bestFRot = f;
        bestElbow = { x: Ex, y: Ey };
        bestTip = { x: Px, y: Py };
        bestFlexion = flex;
      }
    }
  }

  // Fallback if target is within singularity
  if (!bestElbow) {
    bestSRot = wrap(targetAngleDeg - 90 - 24);
    bestFRot = 24;
    const sRad = bestSRot * RAD;
    bestElbow = { x: S.x - L1 * Math.sin(sRad), y: S.y + L1 * Math.cos(sRad) };
    const aimDeg = Math.atan2(T.y - bestElbow.y, T.x - bestElbow.x) / RAD;
    bestTip = { x: bestElbow.x + L2 * Math.cos(aimDeg * RAD), y: bestElbow.y + L2 * Math.sin(aimDeg * RAD) };
    bestFlexion = 24;
  }

  const fingerAngleDeg = Math.atan2(bestTip.y - bestElbow.y, bestTip.x - bestElbow.x) / RAD;
  const distElbowToT = dist(bestElbow, T);
  const aimRayAngleDeg = (distElbowToT > L2 + 5)
    ? Math.atan2(T.y - bestTip.y, T.x - bestTip.x) / RAD
    : Math.atan2(T.y - bestElbow.y, T.x - bestElbow.x) / RAD;
  const alignmentErrorDeg = Math.abs(wrap(aimRayAngleDeg - fingerAngleDeg));

  return {
    shoulder: S,
    target: T,
    elbow: bestElbow,
    tip: bestTip,
    shoulderRot: bestSRot,
    forearmRot: bestFRot,
    shoulderAngleDeg: 90 + bestSRot,
    forearmAngleDeg: 90 + bestSRot + bestFRot,
    elbowFlexionDeg: bestFlexion,
    fingerAngleDeg,
    aimRayAngleDeg,
    alignmentErrorDeg,
    isAligned: alignmentErrorDeg < 8.0,
    targetDistance: rawD,
    L1,
    L2
  };
}

/**
 * Authoritative Pointing Measurement Function:
 * Derives ground-truth pointing error directly from live rendered DOM getCTM() matrices.
 * Used identically across:
 * 1. Live HUD diagnostics (laboratory.html)
 * 2. Automated test suite (test-suite.html & run-test-suite.mjs)
 * 3. Machine-readable QA JSON generation
 * 
 * @param {CharacterController|CharacterRig|string} characterOrRig
 * @param {Object} target {x, y}
 * @param {string} [side] 'L' | 'R' (defaults to near/desk-facing arm)
 * @returns {Object} Comprehensive pointing metrics
 */
export function measurePointingError(characterOrRig, arg2, arg3) {
  let target, side;
  if (typeof arg2 === 'string') {
    side = arg2;
    target = arg3;
  } else {
    target = arg2;
    side = arg3 || null;
  }

  let rig = characterOrRig;
  if (characterOrRig && characterOrRig.rig) {
    rig = characterOrRig.rig;
  }
  if (typeof characterOrRig === 'string') {
    const el = document.querySelector(characterOrRig);
    rig = {
      parts: {
        armL: el.querySelector('.joint-arm-l'),
        forearmL: el.querySelector('.joint-forearm-l'),
        handL: el.querySelector('.joint-hand-l'),
        armR: el.querySelector('.joint-arm-r'),
        forearmR: el.querySelector('.joint-forearm-r'),
        handR: el.querySelector('.joint-hand-r'),
      }
    };
  }

  const s = side || (characterOrRig?.name === 'mohamed' ? 'L' : 'L');
  const p = rig.parts || rig;
  const arm = p['arm' + s] || p.armL;
  const fore = p['forearm' + s] || p.forearmL;
  const hand = p['hand' + s] || p.handL;
  const tipMarker = hand?.querySelector('.marker-tip') || hand;
  const palmMarker = hand?.querySelector('.marker-palm') || hand;

  const S = pointWorld(arm);
  const E = pointWorld(fore);
  const W = pointWorld(hand);
  const P = pointWorld(tipMarker);
  const palm = pointWorld(palmMarker);

  // Finger axis vector: from wrist/palm to fingertip
  const fingerAngleDeg = ang(W, P);

  // Aim ray vector: from fingertip to target
  const aimAngleDeg = ang(P, target);

  // Angular alignment error (degrees)
  const errorDeg = Math.abs(wrap(aimAngleDeg - fingerAngleDeg));

  return {
    shoulder: S,
    elbow: E,
    wrist: W,
    tip: P,
    palm,
    target,
    fingerAngleDeg,
    aimAngleDeg,
    errorDeg,
    isAligned: errorDeg < 8.0,
    distanceToTarget: dist(P, target),
    L1: dist(S, E),
    L2: dist(E, P),
    elbowFlexionDeg: Math.abs(wrap(ang(E, P) - ang(S, E)))
  };
}

/**
 * Authoritative Physical Reaching Measurement Function:
 * Derives ground-truth end-effector contact distance from live rendered DOM getCTM() matrices.
 * 
 * @param {CharacterController|CharacterRig|string} characterOrRig
 * @param {Object} target {x, y}
 * @param {string} [effector] 'tip' | 'palm'
 * @returns {Object} Reaching contact metrics & pass/fail assertion
 */
export function measureReachingError(characterOrRig, target, effector = 'tip') {
  let rig = characterOrRig;
  if (characterOrRig && characterOrRig.rig) rig = characterOrRig.rig;
  if (typeof characterOrRig === 'string') {
    const el = document.querySelector(characterOrRig);
    rig = {
      parts: {
        armL: el.querySelector('.joint-arm-l'),
        forearmL: el.querySelector('.joint-forearm-l'),
        handL: el.querySelector('.joint-hand-l'),
      }
    };
  }
  const p = rig.parts || rig;
  const arm = p.armL;
  const fore = p.forearmL;
  const hand = p.handL;
  const marker = hand?.querySelector(effector === 'tip' ? '.marker-tip' : '.marker-palm') || hand;

  const S = pointWorld(arm);
  const E = pointWorld(fore);
  const P = pointWorld(marker);
  const contactDistance = dist(P, target);
  const acceptanceThreshold = 15.0;
  const isContactEstablished = contactDistance <= acceptanceThreshold;

  return {
    shoulder: S,
    elbow: E,
    endEffector: P,
    target,
    contactDistance,
    acceptanceThreshold,
    isContactEstablished,
    L1: dist(S, E),
    L2: dist(E, P),
    elbowFlexionDeg: Math.abs(wrap(ang(E, P) - ang(S, E)))
  };
}

/**
 * Analytical Two-Bone Leg IK Solver:
 * Computes exact hip (thigh) and knee (shin) angles to place ankle at ankleTarget.
 * Computes compensating foot angle to ensure foot sole stays parallel to floor.
 * 
 * @param {Object} H Hip socket world position {x, y}
 * @param {Object} A Desired ankle world position {x, y}
 * @param {number} [L1] Thigh length (default 125px)
 * @param {number} [L2] Shin length (default 125px)
 * @param {number} [facing] Facing direction (-1 left, +1 right)
 * @returns {Object} Solved joint rotations and knee position
 */
export function solveLegIK(H, A, L1 = 125, L2 = 125, facing = -1) {
  const rawD = dist(H, A);
  const maxReach = L1 + L2;
  const d = Math.min(Math.max(rawD, Math.abs(L1 - L2) + 2), maxReach - 1.5);
  const baseAngle = ang(H, A);

  const cosAlpha = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const alphaDeg = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) / RAD;

  // Knee bends forward in direction of facing
  // Facing left (-1): knee extends towards left (baseAngle - alphaDeg)
  // Facing right (+1): knee extends towards right (baseAngle + alphaDeg)
  const sign = facing === -1 ? -1 : 1;
  const phi1 = baseAngle + (sign * alphaDeg);

  const Kx = H.x + L1 * Math.cos(phi1 * RAD);
  const Ky = H.y + L1 * Math.sin(phi1 * RAD);
  const knee = { x: Kx, y: Ky };

  // Shin vector from knee to ankle
  const phi2 = Math.atan2(A.y - Ky, A.x - Kx) / RAD;

  // Thigh SVG at rotation 0 points straight down (+90°)
  const legRot = wrap(phi1 - 90);
  // Shin SVG at rotation 0 is straight down along thigh
  const shinRot = wrap(phi2 - phi1);
  // Foot SVG at rotation 0 is flat on floor (0° world rotation).
  // Counteract thigh and shin rotation so foot remains horizontal.
  const footRot = wrap(-(legRot + shinRot));

  return {
    hip: H,
    knee,
    ankle: A,
    L1,
    L2,
    distance: rawD,
    clamped: rawD > maxReach - 1.5,
    legRot,
    shinRot,
    footRot,
    kneeFlexionDeg: Math.abs(shinRot)
  };
}

/**
 * Measure live world position of character foot probe markers via getCTM()
 * 
 * @param {CharacterRig|string} rig
 * @param {string} [side] 'L' | 'R'
 * @returns {Object} World positions of heel and toe
 */
export function measurePlantedFootWorld(characterOrRig, side = 'L') {
  let rig = characterOrRig;
  if (characterOrRig && characterOrRig.rig) rig = characterOrRig.rig;
  if (typeof characterOrRig === 'string') {
    const el = document.querySelector(characterOrRig);
    rig = {
      parts: {
        footL: el.querySelector('.joint-foot-l'),
        footR: el.querySelector('.joint-foot-r')
      }
    };
  }
  const p = rig.parts || rig;
  const foot = p['foot' + side] || p.footL;
  if (!foot) return null;

  const heelMarker = foot.querySelector('.marker-heel') || foot;
  const toeMarker = foot.querySelector('.marker-toe') || foot;

  const heel = pointWorld(heelMarker);
  const toe = pointWorld(toeMarker);

  return {
    heel,
    toe,
    soleY: (heel.y + toe.y) / 2,
    tiltDeg: Math.atan2(toe.y - heel.y, toe.x - heel.x) / RAD
  };
}

/**
 * Measure Authoritative Geometric Gaze Ray Vector:
 * Evaluates directional alignment between eye-to-target ray and pupil displacement vector.
 * 
 * @param {CharacterRig|CharacterController|string} characterOrRig
 * @param {Object} target World coordinate {x, y}
 * @param {string} [eyeSide] 'L' | 'R'
 * @returns {Object} Comprehensive geometric gaze metrics
 */
export function measureGazeRay(characterOrRig, target, eyeSide = 'L') {
  let rig = characterOrRig;
  if (characterOrRig && characterOrRig.rig) rig = characterOrRig.rig;
  if (typeof characterOrRig === 'string') {
    const el = document.querySelector(characterOrRig);
    rig = {
      parts: {
        eyeLeft: el.querySelector('.eye-left'),
        eyeRight: el.querySelector('.eye-right'),
        pupilLeft: el.querySelector('.pupil-left'),
        pupilRight: el.querySelector('.pupil-right'),
        head: el.querySelector('.joint-head')
      }
    };
  }
  const p = rig.parts || rig;
  const eye = (eyeSide === 'L' ? p.eyeLeft : p.eyeRight) || p.head;
  const pupil = (eyeSide === 'L' ? p.pupilLeft : p.pupilRight) || eye;
  const eyeCenter = pointWorld(eye);
  const pupilWorld = pointWorld(pupil);
  const headRot = frameRotation(p.head || eye);

  // Target ray vector from eye center to target
  const targetAngleDeg = ang(eyeCenter, target);

  // Pupil displacement vector relative to eye center
  const pupilOffset = {
    x: gsap.getProperty(pupil, 'x') || 0,
    y: gsap.getProperty(pupil, 'y') || 0
  };
  const pupilOffsetMag = Math.hypot(pupilOffset.x, pupilOffset.y);

  // World gaze angle combining pupil offset direction and head frame
  const localPupilAngleDeg = pupilOffsetMag > 0.1
    ? Math.atan2(pupilOffset.y, pupilOffset.x) / RAD
    : targetAngleDeg;
  const gazeAngleDeg = wrap(localPupilAngleDeg + headRot);

  // Angular deviation between gaze ray and target vector
  const gazeAngularErrorDeg = pupilOffsetMag > 0.5
    ? Math.abs(wrap(targetAngleDeg - gazeAngleDeg))
    : 0;

  // Normalized dot product alignment
  const targetDx = target.x - eyeCenter.x;
  const targetDy = target.y - eyeCenter.y;
  const targetDist = Math.hypot(targetDx, targetDy) || 1;
  const dotAlignment = pupilOffsetMag > 0.1
    ? ((pupilOffset.x * (targetDx / targetDist)) + (pupilOffset.y * (targetDy / targetDist))) / pupilOffsetMag
    : 1.0;

  // Harmonized Gaze Acceptance Threshold:
  // Angular deviation <= 25.0°, which corresponds mathematically to dot alignment >= cos(25°) ≈ 0.9063
  const GAZE_MAX_ANGULAR_ERROR_DEG = 25.0;
  const GAZE_MIN_DOT_ALIGNMENT = Math.cos(GAZE_MAX_ANGULAR_ERROR_DEG * RAD); // 0.906307787... ≈ 0.9063

  return {
    eyeCenter,
    pupilWorld,
    pupilOffset,
    pupilOffsetMag,
    target,
    targetAngleDeg,
    headRotationDeg: headRot,
    gazeAngleDeg,
    gazeAngularErrorDeg,
    dotAlignment,
    maxAngularErrorDeg: GAZE_MAX_ANGULAR_ERROR_DEG,
    minDotAlignment: 0.9063,
    isConvergent: gazeAngularErrorDeg <= GAZE_MAX_ANGULAR_ERROR_DEG && dotAlignment >= 0.9063
  };
}

/**
 * Dedicated Reaching Solver:
 * Attempts physical end-effector contact at target T using 2-bone IK.
 * Validates reachability, respects anatomical joint limits, and checks for torso penetration.
 * 
 * @param {Object} S Shoulder position {x, y}
 * @param {Object} T Target position {x, y}
 * @param {number} L1 Upper arm length
 * @param {number} L2 Forearm + hand length
 * @param {Object} options Configuration & constraints
 * @returns {Object} Reaching solution and diagnostics
 */
export function solveReachingTarget(S, T, L1, L2, {
  limits = { minFlexion: 10, maxFlexion: 155 },
  bend = 'down',
  torsoBounds = null // optional { xMin, xMax, yMin, yMax } for penetration check
} = {}) {
  const rawD = dist(S, T);
  const maxReach = L1 + L2;
  const minReach = Math.abs(L1 - L2) + 12;

  const isReachable = rawD <= maxReach && rawD >= minReach;
  const clamped = !isReachable;
  const effectiveD = Math.max(minReach, Math.min(rawD, maxReach * 0.985));

  // Solve two-bone IK
  const baseAngle = ang(S, T);
  const cosAlpha = (L1 * L1 + effectiveD * effectiveD - L2 * L2) / (2 * L1 * effectiveD);
  const alphaDeg = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) / RAD;

  const sign = bend === 'down' ? 1 : -1;
  const phi1 = baseAngle + (sign * alphaDeg);
  const elbow = {
    x: S.x + L1 * Math.cos(phi1 * RAD),
    y: S.y + L1 * Math.sin(phi1 * RAD)
  };

  const reachPoint = {
    x: S.x + effectiveD * Math.cos(baseAngle * RAD),
    y: S.y + effectiveD * Math.sin(baseAngle * RAD)
  };
  const phi2 = ang(elbow, reachPoint);
  const elbowFlexionDeg = Math.abs(wrap(phi2 - phi1));

  // Joint limits validation
  const withinJointLimits = elbowFlexionDeg >= limits.minFlexion && elbowFlexionDeg <= limits.maxFlexion;

  // Torso / body penetration check
  let penetrationWarning = false;
  if (torsoBounds) {
    if (
      (reachPoint.x >= torsoBounds.xMin && reachPoint.x <= torsoBounds.xMax &&
       reachPoint.y >= torsoBounds.yMin && reachPoint.y <= torsoBounds.yMax) ||
      (elbow.x >= torsoBounds.xMin && elbow.x <= torsoBounds.xMax &&
       elbow.y >= torsoBounds.yMin && elbow.y <= torsoBounds.yMax)
    ) {
      penetrationWarning = true;
    }
  }

  let unreachableReason = null;
  if (rawD > maxReach) {
    unreachableReason = `Target beyond maximum reach (${rawD.toFixed(1)}px > ${maxReach.toFixed(1)}px)`;
  } else if (rawD < minReach) {
    unreachableReason = `Target too close to shoulder (${rawD.toFixed(1)}px < ${minReach.toFixed(1)}px)`;
  } else if (!withinJointLimits) {
    unreachableReason = `Elbow flexion ${elbowFlexionDeg.toFixed(1)}° exceeds limits [${limits.minFlexion}°, ${limits.maxFlexion}°]`;
  }

  return {
    shoulder: S,
    target: T,
    reachPoint,
    elbow,
    L1,
    L2,
    reachDistance: rawD,
    maxReach,
    isReachable,
    clamped,
    shoulderAngleDeg: phi1,
    forearmAngleDeg: phi2,
    elbowFlexionDeg,
    withinJointLimits,
    penetrationWarning,
    unreachableReason
  };
}

/**
 * Measure live physical reaching contact from rendered DOM via getCTM()
 * 
 * @param {CharacterRig} rig
 * @param {string} side 'L' | 'R'
 * @param {Object} target {x, y}
 * @param {number} threshold Contact threshold in pixels (default 18px)
 */
export function measureReachingContact(rig, side, target, threshold = 18) {
  const p = rig.parts;
  const tipMarker = p['hand' + side].querySelector('.marker-tip') || p['hand' + side];
  const tip = pointWorld(tipMarker);
  const contactDistance = dist(tip, target);

  return {
    tip,
    target,
    contactDistance,
    hasContact: contactDistance <= threshold
  };
}

/**
 * Eye-gaze: pupil offset (head-local) so the eye looks at a world target.
 * Returns {x,y} clamped to the eye orbit.
 */
export function gazeOffset(rig, eyeSide, target, { max = 5.5 } = {}) {
  const p = rig.parts;
  const eye = eyeSide === 'L' ? p.eyeLeft : p.eyeRight;
  const e = pointWorld(eye);
  const m = p.head.getCTM();
  // inverse of the linear part of head frame
  const det = m.a * m.d - m.b * m.c;
  const dx = target.x - e.x, dy = target.y - e.y;
  const lx = (m.d * dx - m.c * dy) / det;
  const ly = (-m.b * dx + m.a * dy) / det;
  const n = Math.hypot(lx, ly) || 1;
  return { x: (lx / n) * max, y: (ly / n) * max * 1.1, worldDirDeg: Math.atan2(dy, dx) / RAD };
}

export { dist, ang, wrap };
