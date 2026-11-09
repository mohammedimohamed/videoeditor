/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Asset, Object & Dynamic Anchor Registry (v2.1.0)
 * 
 * Central authoritative registry mapping high-level asset identifiers,
 * character morphologies, environmental objects, and spatial socket anchors
 * to concrete world coordinates and DOM selectors.
 * 
 * Milestone 3 Extensions:
 * 1. Full hierarchical parent-child transforms (e.g., office.desk.laptop.screen.data_region).
 * 2. Dynamic local-space to world-space transform propagation.
 * 3. Interaction sockets: character palms/grips, object handles/bases.
 * 4. Dual resolution: Mathematical matrix chain (for node/tests) & live getCTM() (for browser).
 * 5. Full backward compatibility with Milestone 2 single-dot anchor references.
 */

import { pointWorld } from '../rigging/ik.js';

export const ASSET_REGISTRY = {
  version: "2.1.0",

  // Environment & Stage Dimensions
  stage: {
    width: 1080,
    height: 1920,
    floorY: 1386.0,
    bounds: { xMin: 0, xMax: 1080, yMin: 0, yMax: 1920 }
  },

  // Hierarchical Scene Objects & Interactive Props
  objects: {
    office: {
      id: "office",
      name: "Office Stage",
      parent: null,
      selector: "#office-env",
      localTransform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 1080, height: 1920 },
      localAnchors: {
        origin: { x: 0, y: 0 },
        center: { x: 540, y: 960 },
        floor: { x: 540, y: 1386.0 }
      }
    },

    desk: {
      id: "desk",
      name: "Office Desk",
      parent: "office",
      selector: "#office-desk",
      zIndex: 3,
      localTransform: { x: 180, y: 1080, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 560, height: 350 },
      localAnchors: {
        surface: { x: 270, y: 10 },        // World: x=450, y=1090
        topCenter: { x: 270, y: 0 },         // World: x=450, y=1080
        edgeRight: { x: 560, y: 10 },        // World: x=740, y=1090
        edgeLeft: { x: 0, y: 10 },           // World: x=180, y=1090
        rightArea: { x: 460, y: 10 },        // World: x=640, y=1090 (Clean placement target)
        centerArea: { x: 270, y: 10 }
      }
    },

    laptop: {
      id: "laptop",
      name: "Office Laptop",
      parent: "desk",
      selector: "#desk-laptop, #office-laptop",
      localTransform: { x: 230, y: -115, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 220, height: 140 },
      localAnchors: {
        screen: { x: 115, y: 20 },           // World: x=525, y=985
        screenCenter: { x: 115, y: 20 },
        screenTop: { x: 115, y: -20 },
        keyboard: { x: 140, y: 110 },        // World: x=550, y=1075
        touchpad: { x: 140, y: 125 },
        dataRegion: { x: 115, y: 60 },       // World: x=525, y=1025
        hinge: { x: 110, y: 118 }            // World: x=520, y=1083
      },
      states: ["raw-data", "error-highlight", "formula-typing", "pivot-table", "closed"]
    },

    mug: {
      id: "mug",
      name: "Ceramic Coffee Mug",
      parent: "desk",
      selector: "#desk-mug",
      zIndex: 4,
      localTransform: { x: 490, y: -18, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 38, height: 34 },
      localAnchors: {
        handle: { x: 33, y: 15 },            // World: x=703, y=1077 (Grip socket)
        center: { x: 14, y: 17 },            // World: x=684, y=1079
        top: { x: 14, y: 0 },                // World: x=684, y=1062
        bottom: { x: 14, y: 34 },            // World: x=684, y=1096 (Desk contact surface)
        liquidSurface: { x: 14, y: 6 }
      },
      states: ["full", "empty", "held", "placed"]
    },

    document: {
      id: "document",
      name: "Report Document Folder",
      parent: "desk",
      selector: "#desk-document",
      zIndex: 4,
      localTransform: { x: 340, y: 5, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 70, height: 48 },
      localAnchors: {
        center: { x: 35, y: 24 },
        cornerTL: { x: 0, y: 0 },
        cornerBR: { x: 70, y: 48 }
      },
      states: ["default", "highlighted", "folded"]
    },

    clock: {
      id: "clock",
      name: "Wall Clock",
      parent: "office",
      selector: "#wall-clock",
      localTransform: { x: 840, y: 320, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 150, height: 150 },
      localAnchors: {
        face: { x: 0, y: 0 },                // World: x=840, y=320 (or legacy 380, 480)
        center: { x: 0, y: 0 }
      },
      states: ["ticking", "stopped"]
    },

    chair: {
      id: "chair",
      name: "Office Chair",
      parent: "office",
      selector: "#office-chair",
      localTransform: { x: 320, y: 1080, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 110, height: 180 },
      localAnchors: {
        seat: { x: 0, y: 40 },               // World: x=320, y=1120
        backrest: { x: -60, y: -60 }
      }
    },

    shelf: {
      id: "shelf",
      name: "Upper Bookshelf",
      parent: "office",
      selector: "#office-shelf",
      localTransform: { x: 880, y: 450, rotation: 0, scaleX: 1, scaleY: 1 },
      dimensions: { width: 180, height: 60 },
      localAnchors: {
        unreachable: { x: 0, y: 0 }          // World: x=880, y=450 (Clamped reach target)
      }
    }
  },

  // Legacy prop map for Milestone 2 backward compatibility
  props: {},

  // Character Templates & Dynamic Anatomical Sockets
  actors: {
    karim: {
      template: "employee",
      name: "Karim",
      role: "Financial Analyst",
      defaultPose: "seated",
      defaultFacing: 1,
      anchors: {
        head: { relativeX: 0, relativeY: -195 },
        eyes: { relativeX: 18, relativeY: -190 },
        mouth: { relativeX: 18, relativeY: -160 },
        shoulderL: { relativeX: -25, relativeY: -140 },
        shoulderR: { relativeX: 25, relativeY: -140 },
        handR: { relativeX: 65, relativeY: -40 },
        handL: { relativeX: 45, relativeY: -40 },
        palm: { relativeX: 65, relativeY: -40 },
        grip: { relativeX: 65, relativeY: -40 }
      }
    },

    mohamed: {
      template: "mohamed",
      name: "Mohamed",
      role: "Excel Mentor & Expert",
      defaultPose: "standing",
      defaultFacing: -1,
      anchors: {
        head: { relativeX: 0, relativeY: -210 },
        eyes: { relativeX: -18, relativeY: -205 },
        mouth: { relativeX: -18, relativeY: -175 },
        shoulderL: { relativeX: -48, relativeY: -152 },
        shoulderR: { relativeX: 48, relativeY: -152 },
        handL: { relativeX: -120, relativeY: -100 },
        indexFingerL: { relativeX: -140, relativeY: -95 },
        palm: { relativeX: -120, relativeY: -95 },
        grip: { relativeX: -120, relativeY: -95 },
        handR: { relativeX: 30, relativeY: -20 },
        feet: { relativeX: 0, relativeY: 282 }
      }
    }
  }
};

// Initialize props map for backward compatibility
for (const [k, obj] of Object.entries(ASSET_REGISTRY.objects)) {
  ASSET_REGISTRY.props[k] = {
    id: obj.id,
    name: obj.name,
    selector: obj.selector,
    zIndex: obj.zIndex,
    bounds: obj.bounds || { xMin: 0, xMax: 1080, yMin: 0, yMax: 1920 },
    anchors: {}
  };
}
// Seed known legacy anchor points
ASSET_REGISTRY.props.desk.anchors = {
  surface: { x: 450, y: 1090 },
  topCenter: { x: 450, y: 1080 },
  edgeRight: { x: 740, y: 1090 },
  edgeLeft: { x: 160, y: 1090 },
  rightArea: { x: 640, y: 1090 }
};
ASSET_REGISTRY.props.laptop.anchors = {
  screen: { x: 525, y: 985 },
  screenCenter: { x: 525, y: 985 },
  screenTop: { x: 525, y: 945 },
  keyboard: { x: 550, y: 1075 },
  touchpad: { x: 550, y: 1090 },
  dataRegion: { x: 525, y: 1025 },
  hinge: { x: 520, y: 1083 }
};
ASSET_REGISTRY.props.clock.anchors = {
  face: { x: 380, y: 480 },
  center: { x: 380, y: 480 }
};
ASSET_REGISTRY.props.chair.anchors = {
  seat: { x: 320, y: 1120 },
  backrest: { x: 260, y: 1020 }
};
ASSET_REGISTRY.props.mug.anchors = {
  handle: { x: 703, y: 1077 },
  center: { x: 684, y: 1079 },
  top: { x: 684, y: 1062 },
  bottom: { x: 684, y: 1096 }
};
ASSET_REGISTRY.props.shelf.anchors = {
  unreachable: { x: 880, y: 450 }
};

/**
 * Create a 2D affine transformation matrix [a, b, c, d, e, f]
 * equivalent to SVGMatrix / getCTM().
 */
export function makeAffineMatrix(t = {}) {
  const sx = t.scaleX !== undefined ? t.scaleX : 1;
  const sy = t.scaleY !== undefined ? t.scaleY : 1;
  const r = ((t.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return {
    a: sx * cos,
    b: sx * sin,
    c: -sy * sin,
    d: sy * cos,
    e: t.x || 0,
    f: t.y || 0
  };
}

/**
 * Multiply two 2D affine transformation matrices (m1 * m2).
 */
export function multiplyAffineMatrices(m1, m2) {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f
  };
}

/**
 * Apply 2D affine transformation to a local point.
 * Supports both matrix representation and {x, y, rotation, scaleX, scaleY} representation.
 * @param {Object} transformOrMatrix
 * @param {{x: number, y: number}} point
 * @returns {{x: number, y: number}}
 */
export function applyTransform(transformOrMatrix, point) {
  let m;
  if (transformOrMatrix.a !== undefined && transformOrMatrix.d !== undefined) {
    m = transformOrMatrix;
  } else {
    m = makeAffineMatrix(transformOrMatrix);
  }
  return {
    x: m.a * point.x + m.c * point.y + m.e,
    y: m.b * point.x + m.d * point.y + m.f
  };
}

/**
 * Compute the accumulated world transform for an object by traversing its parent chain.
 * Uses exact 2D affine matrix multiplication matching SVG getCTM() down to floating point limits.
 * 
 * @param {string} objectId
 * @param {Map<string, Object>} [runtimeObjects] Optional live ObjectControllers with runtime transforms
 * @returns {{x: number, y: number, rotation: number, scaleX: number, scaleY: number, a: number, b: number, c: number, d: number, e: number, f: number}}
 */
export function getWorldTransform(objectId, runtimeObjects = null) {
  const chain = [];
  let currentId = objectId;

  while (currentId && ASSET_REGISTRY.objects[currentId]) {
    const objDef = ASSET_REGISTRY.objects[currentId];
    let t = objDef.localTransform || { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

    // Check runtime override
    if (runtimeObjects && runtimeObjects.has(currentId)) {
      const runtimeObj = runtimeObjects.get(currentId);
      if (runtimeObj.transform) {
        t = { ...t, ...runtimeObj.transform };
      }
    }

    chain.unshift(t);
    currentId = objDef.parent;
  }

  // Concatenate affine matrices from root to child
  let accumMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  for (const t of chain) {
    const m = makeAffineMatrix(t);
    accumMatrix = multiplyAffineMatrices(accumMatrix, m);
  }

  // Decomposed properties for backward compatibility
  const rotRad = Math.atan2(accumMatrix.b, accumMatrix.a);
  const rotDeg = (rotRad * 180) / Math.PI;
  const sx = Math.hypot(accumMatrix.a, accumMatrix.b);
  const sy = Math.hypot(accumMatrix.c, accumMatrix.d);

  return {
    ...accumMatrix,
    x: accumMatrix.e,
    y: accumMatrix.f,
    rotation: rotDeg,
    scaleX: sx,
    scaleY: sy
  };
}

/**
 * Authoritative Spatial Anchor Resolver (Extended for Milestone 3)
 * Resolves dot-syntax paths (e.g., 'office.desk.laptop.screen.data_region', 'mug.handle', 'karim.eyes')
 * or explicit coordinate objects into validated world {x, y} coordinates.
 * 
 * Supports both:
 * 1. Mathematical parent-chain transform propagation.
 * 2. Live DOM SVG element getCTM() evaluation when available in the browser.
 * 
 * @param {string|Object} ref Anchor name or coordinate
 * @param {Map<string, Object>} [runtimeControllers] Active character controllers
 * @param {Map<string, Object>} [runtimeObjects] Active object controllers
 * @returns {{ x: number, y: number, name: string, type: string }}
 */
export function resolveAnchor(ref, runtimeControllers = null, runtimeObjects = null) {
  if (!ref) {
    throw new Error(`[AssetRegistry] Cannot resolve null or undefined anchor reference.`);
  }

  // Direct coordinate number (X-axis shorthand)
  if (typeof ref === 'number') {
    return { x: ref, y: 1104, name: `coordX(${ref})`, type: 'coordinateX' };
  }

  // Direct coordinate object
  if (typeof ref === 'object' && typeof ref.x === 'number' && typeof ref.y === 'number') {
    return { x: ref.x, y: ref.y, name: `coord(${ref.x},${ref.y})`, type: 'coordinate' };
  }

  if (typeof ref !== 'string') {
    throw new Error(`[AssetRegistry] Invalid anchor reference type: ${typeof ref}`);
  }

  const segments = ref.split('.');

  // 1. Check Hierarchical Object Tree (e.g., office.desk.laptop.screen.dataRegion or desk.mug.handle)
  // Find which segment matches a registered object
  let targetObjId = null;
  let remainingSegments = [];

  for (let i = segments.length - 1; i >= 0; i--) {
    const candidate = segments[i];
    if (ASSET_REGISTRY.objects[candidate]) {
      targetObjId = candidate;
      remainingSegments = segments.slice(i + 1);
      break;
    }
  }

  if (targetObjId) {
    const objDef = ASSET_REGISTRY.objects[targetObjId];
    
    // Normalize anchor search keys
    const normalize = (s) => (s ? s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()) : s);
    
    let localAnchor = null;
    let anchorKey = null;

    if (remainingSegments.length === 0) {
      anchorKey = 'center';
      localAnchor = (objDef.localAnchors && (objDef.localAnchors.center || Object.values(objDef.localAnchors)[0])) || { x: 0, y: 0 };
    } else {
      const fullSubKey = remainingSegments.join('.');
      const firstSubKey = remainingSegments[0];
      const lastSubKey = remainingSegments[remainingSegments.length - 1];

      const candidates = [
        fullSubKey,
        normalize(fullSubKey),
        lastSubKey,
        normalize(lastSubKey),
        firstSubKey,
        normalize(firstSubKey)
      ];

      for (const cand of candidates) {
        if (objDef.localAnchors && objDef.localAnchors[cand]) {
          anchorKey = cand;
          localAnchor = objDef.localAnchors[cand];
          break;
        } else if (ASSET_REGISTRY.props[targetObjId]?.anchors?.[cand]) {
          anchorKey = cand;
          break;
        }
      }
    }

    // Live DOM Element Check (Highest accuracy in browser if element is mounted)
    if (typeof document !== 'undefined' && objDef.selector && anchorKey) {
      const el = document.querySelector(objDef.selector);
      if (el) {
        // Check for specific sub-socket element (e.g. .mug-handle or #clock-face)
        const subEl = el.querySelector(`[data-socket="${anchorKey}"], .socket-${anchorKey}`);
        if (subEl) {
          let sx = localAnchor ? localAnchor.x : 0;
          let sy = localAnchor ? localAnchor.y : 0;
          if (subEl.hasAttribute('cx') && subEl.hasAttribute('cy')) {
            sx = parseFloat(subEl.getAttribute('cx')) || 0;
            sy = parseFloat(subEl.getAttribute('cy')) || 0;
          }
          const pt = pointWorld(subEl, sx, sy);
          return { x: pt.x, y: pt.y, name: ref, type: 'domSocket' };
        }
      }
    }

    // If sub-segments were explicitly passed but neither localAnchor nor legacy prop anchor matched:
    if (remainingSegments.length > 0 && !localAnchor && !ASSET_REGISTRY.props[targetObjId]?.anchors?.[anchorKey]) {
      throw new Error(`[AssetRegistry] Unknown anchor reference: "${ref}". Object "${targetObjId}" has no anchor "${remainingSegments.join('.')}". Available anchors on "${targetObjId}": [${Object.keys(objDef.localAnchors || {}).join(', ')}].`);
    }

    // If legacy props map has an exact pre-calibrated override and no runtime override, prioritize legacy
    if (anchorKey && ASSET_REGISTRY.props[targetObjId]?.anchors?.[anchorKey] && (!runtimeObjects || !runtimeObjects.has(targetObjId))) {
      const legacyPt = ASSET_REGISTRY.props[targetObjId].anchors[anchorKey];
      return {
        x: legacyPt.x,
        y: legacyPt.y,
        name: ref,
        type: 'legacyPropAnchor'
      };
    }

    if (localAnchor) {
      const worldTransform = getWorldTransform(targetObjId, runtimeObjects);
      const worldPoint = applyTransform(worldTransform, localAnchor);
      return {
        x: worldPoint.x,
        y: worldPoint.y,
        name: ref,
        type: 'hierarchicalAnchor'
      };
    }
  }

  // 2. Check Dynamic Character Sockets (e.g., mohamed.palm, karim.eyes)
  const base = segments[0];
  const sub = segments[1] || 'head';

  if (runtimeControllers && runtimeControllers.has(base)) {
    const ctrl = runtimeControllers.get(base);
    const p = ctrl.rig.parts;
    
    if (sub === 'eyes' || sub === 'gaze') {
      const eyeEl = p.eyeLeft || p.head;
      const pt = pointWorld(eyeEl);
      return { x: pt.x, y: pt.y, name: ref, type: 'actorSocket' };
    }
    if (sub === 'head') {
      const headEl = p.head || p.characterGroup;
      const pt = pointWorld(headEl);
      return { x: pt.x, y: pt.y, name: ref, type: 'actorSocket' };
    }
    if (sub === 'handL' || sub === 'indexFingerL' || sub === 'palm' || sub === 'grip') {
      const handEl = p.handL || p.forearmL;
      const pt = pointWorld(handEl);
      return { x: pt.x, y: pt.y, name: ref, type: 'actorSocket' };
    }
    if (sub === 'handR') {
      const handEl = p.handR || p.forearmR;
      const pt = pointWorld(handEl);
      return { x: pt.x, y: pt.y, name: ref, type: 'actorSocket' };
    }
    if (sub === 'root' || sub === 'pelvis') {
      const rootPt = pointWorld(p.characterGroup);
      return { x: rootPt.x, y: rootPt.y, name: ref, type: 'actorSocket' };
    }
  }

  // 3. Check Character Static Definitions with Fallback Roots
  if (ASSET_REGISTRY.actors[base]) {
    const actorDef = ASSET_REGISTRY.actors[base];
    const defaultRoot = base === 'karim' ? { x: 320, y: 1120 } : { x: 855, y: 1104 };
    if (actorDef.anchors[sub]) {
      return {
        x: defaultRoot.x + actorDef.anchors[sub].relativeX,
        y: defaultRoot.y + actorDef.anchors[sub].relativeY,
        name: ref,
        type: 'actorStaticSocket'
      };
    }
  }

  // 4. Unknown Anchor Error
  const knownObjects = Object.keys(ASSET_REGISTRY.objects).join(', ');
  const knownActors = Object.keys(ASSET_REGISTRY.actors).join(', ');
  throw new Error(`[AssetRegistry] Unknown anchor reference: "${ref}". Known objects: [${knownObjects}], Known actors: [${knownActors}].`);
}
