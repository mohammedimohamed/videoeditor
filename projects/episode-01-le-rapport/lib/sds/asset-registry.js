/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Asset & Anchor Registry
 * 
 * Central authoritative registry mapping high-level asset identifiers,
 * character morphologies, environmental objects, and spatial socket anchors
 * to concrete world coordinates and DOM selectors.
 * 
 * Guarantees:
 * 1. World-space anchor resolution for targets (pointing, reaching, gaze, seating).
 * 2. Static object anchors and dynamic character-relative anchors.
 * 3. Formal error reporting on invalid or missing anchor references.
 */

import { pointWorld } from '../rigging/ik.js';

export const ASSET_REGISTRY = {
  version: "2.0.0",

  // Environment & Stage Dimensions
  stage: {
    width: 1080,
    height: 1920,
    floorY: 1386.0,
    bounds: { xMin: 0, xMax: 1080, yMin: 0, yMax: 1920 }
  },

  // Environment Prop Anchors & Sockets (Canvas Coordinates)
  props: {
    desk: {
      id: "desk",
      name: "Office Desk",
      selector: "#office-desk",
      zIndex: 3,
      bounds: { xMin: 140, xMax: 760, yMin: 1060, yMax: 1386 },
      anchors: {
        surface: { x: 450, y: 1090 },
        topCenter: { x: 450, y: 1080 },
        edgeRight: { x: 740, y: 1090 },
        edgeLeft: { x: 160, y: 1090 },
        lampSocket: { x: 195, y: 1070 }
      }
    },

    laptop: {
      id: "laptop",
      name: "Office Laptop",
      selector: "#office-laptop",
      parentProp: "desk",
      bounds: { xMin: 420, xMax: 630, yMin: 940, yMax: 1100 },
      anchors: {
        screen: { x: 525, y: 985 },       // Primary validated pointing & gaze target
        screenCenter: { x: 525, y: 985 },
        screenTop: { x: 525, y: 945 },
        keyboard: { x: 550, y: 1075 },     // Typing contact target
        touchpad: { x: 550, y: 1090 }
      },
      states: ["raw-data", "error-highlight", "formula-typing", "pivot-table"]
    },

    chair: {
      id: "chair",
      name: "Office Chair",
      selector: "#office-chair",
      zIndex: 1,
      anchors: {
        seat: { x: 320, y: 1120 },         // Pelvis seating anchor
        backrest: { x: 260, y: 1020 }
      }
    },

    clock: {
      id: "clock",
      name: "Wall Clock",
      selector: "#office-wall-clock",
      anchors: {
        face: { x: 380, y: 480 },          // High pointing & gaze target
        center: { x: 380, y: 480 }
      },
      states: ["ticking", "stopped"]
    },

    mug: {
      id: "mug",
      name: "Coffee Mug",
      selector: "#office-coffee-mug",
      anchors: {
        handle: { x: 640, y: 1055 },       // Physical reach contact target (d=234px <= 240px)
        top: { x: 640, y: 1040 }
      }
    },

    shelf: {
      id: "shelf",
      name: "Upper Bookshelf",
      selector: "#office-shelf",
      anchors: {
        unreachable: { x: 880, y: 450 }    // Known clamped reach target (d=647px > 240px)
      }
    },

    window: {
      id: "window",
      name: "Office Window",
      selector: "#office-window",
      anchors: {
        center: { x: 780, y: 550 }
      }
    }
  },

  // Character Templates & Dynamic Anatomical Sockets
  actors: {
    karim: {
      template: "employee",
      name: "Karim",
      role: "Financial Analyst",
      defaultPose: "seated",
      defaultFacing: 1, // Facing right towards desk
      anchors: {
        head: { relativeX: 0, relativeY: -195 },
        eyes: { relativeX: 18, relativeY: -190 },
        mouth: { relativeX: 18, relativeY: -160 },
        shoulderL: { relativeX: -25, relativeY: -140 },
        shoulderR: { relativeX: 25, relativeY: -140 },
        handR: { relativeX: 65, relativeY: -40 },
        handL: { relativeX: 45, relativeY: -40 }
      }
    },

    mohamed: {
      template: "mohamed",
      name: "Mohamed",
      role: "Excel Mentor & Expert",
      defaultPose: "standing",
      defaultFacing: -1, // Facing left towards desk/Karim
      anchors: {
        head: { relativeX: 0, relativeY: -210 },
        eyes: { relativeX: -18, relativeY: -205 },
        mouth: { relativeX: -18, relativeY: -175 },
        shoulderL: { relativeX: -48, relativeY: -152 },
        shoulderR: { relativeX: 48, relativeY: -152 },
        handL: { relativeX: -120, relativeY: -100 },
        indexFingerL: { relativeX: -140, relativeY: -95 },
        handR: { relativeX: 30, relativeY: -20 },
        feet: { relativeX: 0, relativeY: 282 }
      }
    }
  }
};

/**
 * Authoritative Spatial Anchor Resolver
 * Resolves anchor names (e.g., 'laptop.screen', 'karim.eyes', 'desk.surface')
 * or explicit coordinate objects into validated world {x, y} coordinates.
 * 
 * @param {string|Object} ref Anchor name or {x, y} coordinate
 * @param {Map<string, Object>} [runtimeControllers] Active controllers for dynamic socket evaluation
 * @returns {{ x: number, y: number, name: string, type: string }}
 */
export function resolveAnchor(ref, runtimeControllers = null) {
  if (!ref) {
    throw new Error(`[AssetRegistry] Cannot resolve null or undefined anchor reference.`);
  }

  // Direct coordinate object or X number
  if (typeof ref === 'number') {
    return { x: ref, y: 1104, name: `coordX(${ref})`, type: 'coordinateX' };
  }

  if (typeof ref === 'object' && typeof ref.x === 'number' && typeof ref.y === 'number') {
    return { x: ref.x, y: ref.y, name: `coord(${ref.x},${ref.y})`, type: 'coordinate' };
  }

  if (typeof ref !== 'string') {
    throw new Error(`[AssetRegistry] Invalid anchor reference type: ${typeof ref}`);
  }

  const parts = ref.split('.');
  const base = parts[0];
  const sub = parts[1] || 'center';

  // 1. Check Props
  if (ASSET_REGISTRY.props[base]) {
    const prop = ASSET_REGISTRY.props[base];
    if (prop.anchors && prop.anchors[sub]) {
      return {
        x: prop.anchors[sub].x,
        y: prop.anchors[sub].y,
        name: ref,
        type: 'propAnchor'
      };
    }
    // Fallback to first anchor if sub not specified
    const firstKey = Object.keys(prop.anchors || {})[0];
    if (firstKey) {
      return {
        x: prop.anchors[firstKey].x,
        y: prop.anchors[firstKey].y,
        name: `${base}.${firstKey}`,
        type: 'propAnchor'
      };
    }
  }

  // 2. Check Dynamic Character Sockets
  if (runtimeControllers && runtimeControllers.has(base)) {
    const ctrl = runtimeControllers.get(base);
    const p = ctrl.rig.parts;
    
    // Direct DOM element lookup for maximum precision
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
    if (sub === 'handL' || sub === 'indexFingerL') {
      const handEl = p.handL || p.forearmL;
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
  const knownProps = Object.keys(ASSET_REGISTRY.props).join(', ');
  const knownActors = Object.keys(ASSET_REGISTRY.actors).join(', ');
  throw new Error(`[AssetRegistry] Unknown anchor reference: "${ref}". Known props: [${knownProps}], Known actors: [${knownActors}].`);
}
