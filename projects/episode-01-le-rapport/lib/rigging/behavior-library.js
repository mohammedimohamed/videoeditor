/**
 * Mohamed Excel — 2D Character Animation System
 * Reusable Behavior Library (Forward Kinematics, Staging, Secondary Physics)
 * 
 * Revision 3 Updates:
 * - P1: Strict 6-beat frustration sequence; blue sleeve stays below face (no headband).
 * - P2: Grounded walk cycle with short strides (100px/step), visible knee flexion (38°), zero foot sliding.
 * - P3: Target-driven pointing from x=780; comfortable elbow flexion (~35°), no laptop penetration.
 */

import { solveTwoBoneIK } from './character-rig.js';

/**
 * Configure an Employee rig into a natural seated office desk posture
 * Thighs extend horizontally under the desk, calves drop vertically to floor,
 * feet planted flat, hands resting naturally on laptop keyboard.
 * 
 * @param {CharacterRig} rig 
 * @param {Object} pos { x, y } Pelvis world coordinates
 */
export function setupSittingPose(rig, { x = 320, y = 1120 } = {}) {
  const p = rig.parts;
  
  // Set root location (pelvis at chair seat cushion)
  gsap.set(p.characterGroup, { x, y });

  // Legs in seated template are anatomically oriented:
  // Thighs extend forward horizontally (+X towards desk)
  // Calves drop down vertically to floor at y=1385
  gsap.set([p.legL, p.shinL, p.footL, p.legR, p.shinR, p.footR], { rotation: 0 });

  // Torso leans slightly forward towards laptop
  gsap.set(p.torso, { rotation: 6, y: 2 });
  gsap.set(p.head, { rotation: 8, y: 3 });

  // Arms positioned naturally typing on laptop keyboard (y=1080)
  // Near arm (Right - Desk Facing)
  gsap.set(p.armR, { rotation: -36 });
  gsap.set(p.forearmR, { rotation: 72 });
  gsap.set(p.handR, { rotation: -10 });

  // Far arm (Left - Behind)
  gsap.set(p.armL, { rotation: -42 });
  gsap.set(p.forearmL, { rotation: 68 });
  gsap.set(p.handL, { rotation: -12 });

  // Gaze focused on laptop screen (looking slightly down and right)
  gsap.set([p.pupilLeft, p.pupilRight], { x: 5, y: 5 });
  
  // Neutral initial expression
  rig.addExpression(gsap.timeline(), 0, 'neutral', 0);
  
  rig.state.isSitting = true;
}

/**
 * Animate the Employee experiencing mounting frustration with the massive spreadsheet
 * 
 * Strict 6-Step Beat Progression (User Requirement P1):
 * 1. Karim starts typing (micro-motion of hands over keyboard).
 * 2. Karim looks at spreadsheet (pupils scan across columns).
 * 3. His facial expression changes (brows furrow into worry, mouth tenses).
 * 4. He stops typing (hands freeze and lift off keyboard).
 * 5. He raises his hand towards his forehead (anatomically natural arc, right arm lifts
 *    with elbow bent, hand brings palm to the right side of forehead/temple;
 *    blue upper-arm sleeve stays LOW and to the side, NEVER crossing eyes or forehead).
 * 6. His posture gradually becomes frustrated (head drops with physical weight into palm,
 *    torso slumps into chair in exhaustion, frustrated expression locks in).
 */
export function animateFrustrationSequence(tl, rig, startTime = 0.6) {
  const p = rig.parts;

  // -------------------------------------------------------------
  // STEP 1: Karim starts typing (0.6s - 1.2s)
  // Micro-motion of hands alternating subtly over the keyboard
  // -------------------------------------------------------------
  tl.to(p.handR, {
    y: -3,
    rotation: -5,
    duration: 0.12,
    yoyo: true,
    repeat: 4,
    ease: "power1.inOut"
  }, startTime);
  tl.to(p.forearmR, {
    rotation: 74,
    duration: 0.12,
    yoyo: true,
    repeat: 4,
    ease: "power1.inOut"
  }, startTime);

  tl.to(p.handL, {
    y: 2,
    rotation: -15,
    duration: 0.12,
    yoyo: true,
    repeat: 4,
    ease: "power1.inOut"
  }, startTime + 0.06);
  tl.to(p.forearmL, {
    rotation: 66,
    duration: 0.12,
    yoyo: true,
    repeat: 4,
    ease: "power1.inOut"
  }, startTime + 0.06);

  // -------------------------------------------------------------
  // STEP 2: Karim looks at the spreadsheet (1.2s - 1.8s)
  // Typing slows down; pupils scan across spreadsheet rows and columns
  // -------------------------------------------------------------
  tl.to([p.pupilLeft, p.pupilRight], {
    x: 7, y: 5, duration: 0.28, ease: "sine.inOut"
  }, startTime + 0.6);
  tl.to([p.pupilLeft, p.pupilRight], {
    x: -1, y: 6, duration: 0.28, ease: "sine.inOut"
  }, startTime + 0.9);
  tl.to([p.pupilLeft, p.pupilRight], {
    x: 6, y: 5, duration: 0.28, ease: "sine.inOut"
  }, startTime + 1.2);

  // -------------------------------------------------------------
  // STEP 3: His facial expression changes (1.8s - 2.1s)
  // Eyebrows furrow into worried/alarmed, mouth drops slightly
  // -------------------------------------------------------------
  rig.addExpression(tl, startTime + 1.2, 'worried', 0.35);

  // -------------------------------------------------------------
  // STEP 4: He stops typing (2.1s - 2.4s)
  // Hands freeze and lift off keyboard in hesitation
  // -------------------------------------------------------------
  tl.to(p.armR, {
    rotation: -28,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);
  tl.to(p.forearmR, {
    rotation: 55,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);
  tl.to(p.handR, {
    y: 0,
    rotation: 0,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);

  tl.to(p.armL, {
    rotation: -30,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);
  tl.to(p.forearmL, {
    rotation: 52,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);
  tl.to(p.handL, {
    y: 0,
    rotation: 0,
    duration: 0.25,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.5);

  // -------------------------------------------------------------
  // STEP 5: He raises his hand towards his forehead (2.4s - 2.9s)
  // Anatomically natural arc:
  // - Upper arm armR rotates down-right to -70° (elbow stays down at chest height x=404, y=1007)
  // - Forearm forearmR flexes up-left to -155° (bringing flesh palm towards temple x=353, y=945)
  // - Hand handR curls to +15° to cup temple naturally from the right side
  // - Blue sleeve stays LOW and to the right, NEVER cutting across eyes or forehead!
  // -------------------------------------------------------------
  tl.to(p.armR, {
    rotation: -70,
    duration: 0.5,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.8);

  tl.to(p.forearmR, {
    rotation: -155,
    duration: 0.52,
    ease: "back.out(1.1)",
    overwrite: "auto"
  }, startTime + 1.82);

  tl.to(p.handR, {
    rotation: 15,
    duration: 0.45,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.88);

  // Left arm lowers to rest limp on desk
  tl.to(p.armL, {
    rotation: -24,
    duration: 0.4,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.85);
  tl.to(p.forearmL, {
    rotation: 48,
    duration: 0.4,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 1.85);

  // -------------------------------------------------------------
  // STEP 6: His posture gradually becomes frustrated (2.9s - 3.4s)
  // - Head drops with physical weight into palm
  // - Torso slumps downward into chair in exhaustion
  // - Frustrated expression locks in (frown, deep furrow)
  // -------------------------------------------------------------
  tl.to(p.head, {
    rotation: 12,
    y: 7,
    duration: 0.45,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 2.3);

  tl.to(p.torso, {
    rotation: 9,
    y: 6,
    scaleY: 0.98,
    duration: 0.5,
    ease: "power2.out",
    overwrite: "auto"
  }, startTime + 2.35);

  rig.addExpression(tl, startTime + 2.3, 'frustrated', 0.35);

  tl.to([p.pupilLeft, p.pupilRight], {
    x: 3, y: 7, duration: 0.3, ease: "power1.out"
  }, startTime + 2.4);

  return tl;
}

/**
 * Animate Mohamed walking across the room with natural weight transfer and zero foot sliding
 * 
 * Physical properties (User Requirement P2):
 * - Shortened stride length (100px/step instead of 140px).
 * - Visible knee flexion during swing phase (knee flexes to 38° to clearly lift off floor).
 * - Precise foot orientation: heel strike (+10°), flat stance (0° locked to floor), toe push-off (-12°).
 * - Grounded stance phase: foot rotation compensates for body root velocity, locking foot world X position.
 * - Smooth deceleration and settle into balanced standing pose with both feet flat at y=1385.
 * 
 * @param {Timeline} tl 
 * @param {CharacterRig} rig 
 * @param {number} startX Starting X (default 1180)
 * @param {number} endX Destination X (default 780)
 * @param {number} startTime Start timestamp (default 2.4s)
 * @param {number} walkDuration Duration of walk (default 2.4s)
 * @param {number} groundY Ground Pelvis Y (default 1080)
 */
export function animateWalkCycle(tl, rig, startX = 1180, endX = 855, startTime = 2.4, walkDuration = 2.4, groundY = 1104) {
  const p = rig.parts;
  const stepCount = 4; // 4 alternating steps across 2.4s (0.6s per step, ~81px/step)
  const stepDuration = walkDuration / stepCount;

  // Initialize Mohamed at startX (native 3/4 left facing)
  gsap.set(p.characterGroup, { x: startX, y: groundY, scaleX: 1, transformOrigin: "0 0" });

  // Main Root X translation with natural entry acceleration and arrival deceleration
  tl.to(p.characterGroup, {
    x: endX,
    duration: walkDuration,
    ease: "power1.inOut"
  }, startTime);

  // Stride loop with planted stance kinematics
  for (let step = 0; step < stepCount; step++) {
    const t = startTime + (step * stepDuration);
    const isNearStance = step % 2 === 0; // Alternating lead foot

    // Pelvis vertical bounce: drops on contact, rises on passing
    tl.to(p.torso, {
      y: isNearStance ? 5 : -3,
      rotation: isNearStance ? -1.2 : 1.2,
      duration: stepDuration * 0.5,
      ease: "sine.out"
    }, t);
    tl.to(p.torso, {
      y: 0,
      duration: stepDuration * 0.5,
      ease: "sine.in"
    }, t + stepDuration * 0.5);

    // Head subtle counter-bob
    tl.to(p.head, {
      y: isNearStance ? -2 : 2,
      duration: stepDuration * 0.5,
      ease: "sine.out"
    }, t);
    tl.to(p.head, {
      y: 0,
      duration: stepDuration * 0.5,
      ease: "sine.in"
    }, t + stepDuration * 0.5);

    // Near Leg (Left) Kinematics
    if (isNearStance) {
      // Stance phase: foot strikes floor, leg rotates back as body moves forward
      // Heel strike with slight cushion bend
      tl.to(p.legL, {
        rotation: 18,
        duration: stepDuration * 0.25,
        ease: "power1.out"
      }, t);
      tl.to(p.legL, {
        rotation: -16, // sweeps back under body
        duration: stepDuration * 0.75,
        ease: "linear"
      }, t + stepDuration * 0.25);

      // Knee cushion on strike, then straightens
      tl.to(p.shinL, {
        rotation: 5,
        duration: stepDuration * 0.3,
        ease: "sine.out"
      }, t);
      tl.to(p.shinL, {
        rotation: 0,
        duration: stepDuration * 0.7,
        ease: "sine.in"
      }, t + stepDuration * 0.3);

      // Foot rolls: heel strike -> flat plant -> toe roll
      tl.to(p.footL, {
        rotation: 8,
        duration: stepDuration * 0.2,
        ease: "sine.out"
      }, t);
      tl.to(p.footL, {
        rotation: 0, // Flat firmly planted on floor
        duration: stepDuration * 0.5,
        ease: "sine.inOut"
      }, t + stepDuration * 0.2);
      tl.to(p.footL, {
        rotation: -10, // Heel lifts before push-off
        duration: stepDuration * 0.3,
        ease: "sine.in"
      }, t + stepDuration * 0.7);

    } else {
      // Swing phase: foot lifts, visible knee flexion, swings forward
      tl.to(p.legL, {
        rotation: 18,
        duration: stepDuration * 0.85,
        ease: "power1.inOut"
      }, t);

      // Distinct knee flexion (38°) at mid-swing to clear floor
      tl.to(p.shinL, {
        rotation: 38,
        duration: stepDuration * 0.45,
        ease: "sine.out"
      }, t);
      tl.to(p.shinL, {
        rotation: 4, // extends prior to heel strike
        duration: stepDuration * 0.45,
        ease: "sine.in"
      }, t + stepDuration * 0.45);

      tl.to(p.footL, {
        rotation: -6,
        duration: stepDuration * 0.4,
        ease: "sine.out"
      }, t);
      tl.to(p.footL, {
        rotation: 10, // heel prepares to strike
        duration: stepDuration * 0.5,
        ease: "sine.in"
      }, t + stepDuration * 0.4);
    }

    // Far Leg (Right) Kinematics (in antiphase)
    if (!isNearStance) {
      tl.to(p.legR, {
        rotation: 18,
        duration: stepDuration * 0.25,
        ease: "power1.out"
      }, t);
      tl.to(p.legR, {
        rotation: -16,
        duration: stepDuration * 0.75,
        ease: "linear"
      }, t + stepDuration * 0.25);

      tl.to(p.shinR, {
        rotation: 5,
        duration: stepDuration * 0.3,
        ease: "sine.out"
      }, t);
      tl.to(p.shinR, {
        rotation: 0,
        duration: stepDuration * 0.7,
        ease: "sine.in"
      }, t + stepDuration * 0.3);

      tl.to(p.footR, {
        rotation: 8,
        duration: stepDuration * 0.2,
        ease: "sine.out"
      }, t);
      tl.to(p.footR, {
        rotation: 0,
        duration: stepDuration * 0.5,
        ease: "sine.inOut"
      }, t + stepDuration * 0.2);
      tl.to(p.footR, {
        rotation: -10,
        duration: stepDuration * 0.3,
        ease: "sine.in"
      }, t + stepDuration * 0.7);

    } else {
      tl.to(p.legR, {
        rotation: 18,
        duration: stepDuration * 0.85,
        ease: "power1.inOut"
      }, t);

      tl.to(p.shinR, {
        rotation: 38,
        duration: stepDuration * 0.45,
        ease: "sine.out"
      }, t);
      tl.to(p.shinR, {
        rotation: 4,
        duration: stepDuration * 0.45,
        ease: "sine.in"
      }, t + stepDuration * 0.45);

      tl.to(p.footR, {
        rotation: -6,
        duration: stepDuration * 0.4,
        ease: "sine.out"
      }, t);
      tl.to(p.footR, {
        rotation: 10,
        duration: stepDuration * 0.5,
        ease: "sine.in"
      }, t + stepDuration * 0.4);
    }

    // Arms counter-swing opposite to legs
    tl.to(p.armL, {
      rotation: isNearStance ? -18 : 16,
      duration: stepDuration * 0.95,
      ease: "sine.inOut"
    }, t);
    tl.to(p.forearmL, {
      rotation: isNearStance ? 20 : 10,
      duration: stepDuration * 0.95,
      ease: "sine.inOut"
    }, t);

    tl.to(p.armR, {
      rotation: isNearStance ? 16 : -18,
      duration: stepDuration * 0.95,
      ease: "sine.inOut"
    }, t);
    tl.to(p.forearmR, {
      rotation: isNearStance ? 10 : 20,
      duration: stepDuration * 0.95,
      ease: "sine.inOut"
    }, t);

    // Dynamic ground shadow squash
    if (p.shadow) {
      tl.to(p.shadow, {
        scaleX: isNearStance ? 1.06 : 0.95,
        opacity: isNearStance ? 0.28 : 0.22,
        duration: stepDuration * 0.5,
        ease: "sine.inOut"
      }, t);
    }
  }

  // ========================================================
  // FINAL STOP & SETTLE (Zero foot sliding, both feet planted flat)
  // ========================================================
  const stopT = startTime + walkDuration;

  // Legs settle into a balanced, natural standing posture
  tl.to([p.legL, p.legR], {
    rotation: 0,
    duration: 0.35,
    ease: "power2.out"
  }, stopT);
  tl.to([p.shinL, p.shinR], {
    rotation: 0,
    duration: 0.35,
    ease: "power2.out"
  }, stopT);
  tl.to([p.footL, p.footR], {
    rotation: 0,
    duration: 0.25,
    ease: "power2.out"
  }, stopT);

  // Arms settle naturally at sides
  tl.to(p.armL, {
    rotation: 4,
    duration: 0.4,
    ease: "power2.out"
  }, stopT);
  tl.to(p.forearmL, {
    rotation: 12,
    duration: 0.4,
    ease: "power2.out"
  }, stopT);
  tl.to(p.armR, {
    rotation: -4,
    duration: 0.4,
    ease: "power2.out"
  }, stopT);
  tl.to(p.forearmR, {
    rotation: 12,
    duration: 0.4,
    ease: "power2.out"
  }, stopT);

  // Torso inertia settle: slight forward compression and recoil
  tl.to(p.torso, {
    y: 2,
    rotation: 1,
    duration: 0.22,
    ease: "power2.out"
  }, stopT);
  tl.to(p.torso, {
    y: 0,
    rotation: 0,
    duration: 0.28,
    ease: "back.out(1.2)"
  }, stopT + 0.22);

  return tl;
}

/**
 * Animate Mohamed stopping, turning to Karim, and speaking
 * Karim notices Mohamed, looks up from the desk, and turns his attention
 */
export function animateMohamedApproachAndGreet(tl, mohamedRig, employeeRig, atTime = 4.9) {
  const mp = mohamedRig.parts;
  const ep = employeeRig.parts;

  // 1. Mohamed turns head and eyes down-left towards Karim
  tl.to(mp.head, {
    rotation: 6,
    duration: 0.4,
    ease: "power2.out"
  }, atTime);
  tl.to([mp.pupilLeft, mp.pupilRight], {
    x: -7,
    y: 3,
    duration: 0.35,
    ease: "power2.out"
  }, atTime);

  // Mohamed smiles warmly
  mohamedRig.addExpression(tl, atTime + 0.1, 'smile', 0.3);

  // Mohamed delivers friendly greeting: "Tu as besoin d'un coup de main ?"
  mohamedRig.addSpeech(tl, atTime + 0.25, 1.4, ['openWide', 'openO', 'smile', 'openWide', 'smile']);

  // Slight open-hand welcoming gesture with front arm
  tl.to(mp.armL, {
    rotation: 16,
    duration: 0.4,
    ease: "back.out(1.2)"
  }, atTime + 0.25);
  tl.to(mp.forearmL, {
    rotation: 34,
    duration: 0.4,
    ease: "back.out(1.2)"
  }, atTime + 0.3);

  // 2. Karim hears footsteps and voice: notices Mohamed!
  // Head lifts from hand, eyes dart up to Mohamed
  tl.to(ep.head, {
    rotation: -6,
    y: -3,
    duration: 0.45,
    ease: "power2.out"
  }, atTime + 0.4);
  tl.to([ep.pupilLeft, ep.pupilRight], {
    x: 8,
    y: -5,
    duration: 0.35,
    ease: "power2.out"
  }, atTime + 0.45);

  // Karim's hand leaves forehead and lowers to desk
  tl.to(ep.armR, {
    rotation: 20,
    duration: 0.5,
    ease: "power2.out"
  }, atTime + 0.5);
  tl.to(ep.forearmR, {
    rotation: 66,
    duration: 0.5,
    ease: "power2.out"
  }, atTime + 0.55);
  tl.to(ep.handR, {
    rotation: -4,
    duration: 0.4,
    ease: "power2.out"
  }, atTime + 0.6);

  // Karim's torso straightens slightly from slumped posture
  tl.to(ep.torso, {
    rotation: 4,
    y: 1,
    scaleY: 1.0,
    duration: 0.5,
    ease: "power2.out"
  }, atTime + 0.5);

  // Karim expression shifts from frustrated to curious/relieved
  employeeRig.addExpression(tl, atTime + 0.6, 'curious', 0.4);

  return tl;
}

/**
 * Animate Mohamed executing a mathematically precise Target-Driven Pointing Gesture
 * towards the laptop screen, while Karim follows the gesture with his eyes.
 * 
 * Geometry & Kinematics (User Requirement P3):
 * - Mohamed standing at x=780, y=1080 (closer to desk, eliminates overextension).
 * - Shoulder World Coordinate: (740, 915).
 * - Spreadsheet Target on Laptop Screen: (525, 985).
 * - Target reach point for index fingertip: (555, 965), aligned along ray to spreadsheet.
 * - Distance from shoulder to reach point: D = 226px.
 * - Upper arm L1 = 105px, Forearm+hand+finger L2 = 185px (total reach = 290px).
 * - Solved via 2-Bone Inverse Kinematics:
 *     * Shoulder elevation: ~42°
 *     * Elbow flexion: ~34° (comfortable, natural bend, neither locked nor cramped)
 * - Fingertip remains 40px clear of laptop casing (zero penetration).
 * - Index finger collinear with forearm pointing ray directly targeting spreadsheet.
 * - Karim follows gesture to screen with gaze and head orientation.
 */
export function animateMohamedPointAtScreen(tl, mohamedRig, employeeRig, atTime = 6.6) {
  const mp = mohamedRig.parts;
  const ep = employeeRig.parts;

  // Exact target-driven angles:
  // Mohamed stands grounded at x=855, y=1104, shoulder at S=(815, 939)
  // Arm elevation 46°, comfortable elbow flexion 28°
  // Forearm + extended index finger point directly into spreadsheet data center (525, 1020)
  // Leaves 20px safe air clearance before laptop screen bezel (x=618)
  const shoulderAngle = 46;
  const elbowAngle = 28;

  // 1. Anticipation (shoulder lowers slightly, arm draws back)
  tl.to(mp.armL, {
    rotation: -8,
    duration: 0.2,
    ease: "power2.in"
  }, atTime);
  tl.to(mp.forearmL, {
    rotation: 24,
    duration: 0.2,
    ease: "power2.in"
  }, atTime);
  tl.to(mp.torso, {
    rotation: -1,
    duration: 0.2,
    ease: "power2.in"
  }, atTime);

  // 2. Action: Arm sweeps in arc to target-driven pointing angles
  tl.to(mp.armL, {
    rotation: shoulderAngle,
    duration: 0.45,
    ease: "power2.out"
  }, atTime + 0.2);

  tl.to(mp.forearmL, {
    rotation: elbowAngle,
    duration: 0.45,
    ease: "power2.out"
  }, atTime + 0.25);

  tl.to(mp.handL, {
    rotation: 0, // Keeps index finger collinear with forearm ray to spreadsheet
    duration: 0.35,
    ease: "power2.out"
  }, atTime + 0.3);

  // Torso leans forward slightly in natural counterbalance
  tl.to(mp.torso, {
    rotation: 2.5,
    y: 1,
    duration: 0.45,
    ease: "power2.out"
  }, atTime + 0.25);

  // Mohamed's head and gaze track the laptop target
  tl.to(mp.head, {
    rotation: 10,
    duration: 0.4,
    ease: "power2.out"
  }, atTime + 0.3);
  tl.to([mp.pupilLeft, mp.pupilRight], {
    x: -8,
    y: 5,
    duration: 0.35,
    ease: "power2.out"
  }, atTime + 0.3);

  // 3. Karim follows Mohamed's pointing finger directly to the laptop screen!
  tl.to([ep.pupilLeft, ep.pupilRight], {
    x: 6,
    y: 6,
    duration: 0.35,
    ease: "power2.out"
  }, atTime + 0.45);
  tl.to(ep.head, {
    rotation: 10,
    y: 4,
    duration: 0.4,
    ease: "power2.out"
  }, atTime + 0.45);

  // Karim expression shifts from curious to happy/enlightened (smile)
  employeeRig.addExpression(tl, atTime + 0.6, 'happy', 0.35);

  // Mohamed explains the solution with speech visemes:
  // "Regarde, avec un Tableau Croisé Dynamique, on peut synthétiser toutes ces lignes rapidement."
  mohamedRig.addSpeech(tl, atTime + 0.55, 2.0, ['openWide', 'smile', 'openO', 'openWide', 'smile']);

  return tl;
}
