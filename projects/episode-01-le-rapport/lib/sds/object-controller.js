/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Object Controller & Interaction Engine
 * 
 * Provides a high-level, capability-based API for environmental props and objects
 * (e.g. coffee mug, laptop, document folders, desk accessories).
 * 
 * Key Architectural Guarantees:
 * 1. Transform manipulation (moveTo, rotateTo, scaleTo, followPath).
 * 2. Visual state transitions (show, hide, open, close, changeState).
 * 3. Character attachment & detachment (attachTo, detachFrom, holdBy, release)
 *    preserving relative transforms so objects never jump or teleport.
 * 4. Deterministic GSAP timeline composition with arbitrary-time seekability.
 * 5. Full live DOM diagnostics and resource state tracking.
 */

import { pointWorld } from '../rigging/ik.js';
import { ASSET_REGISTRY, resolveAnchor, applyTransform, getWorldTransform } from './asset-registry.js';

export class ObjectController {
  /**
   * @param {Element|string} element DOM element or selector
   * @param {Object} options Configuration
   */
  constructor(element, options = {}) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.id = options.id || (this.element ? this.element.id : 'unknown-object');
    this.name = options.name || this.id;
    this.type = options.type || 'prop';
    this.parent = options.parent || null;

    // Retrieve registry definition if available
    const def = ASSET_REGISTRY.objects[this.id] || {};
    this.definition = def;

    // Transform state
    const initT = def.localTransform || { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    const initVisible = options.initialVisible !== undefined ? options.initialVisible : (options.visible !== undefined ? options.visible : true);
    const initOpacity = initVisible ? (options.opacity !== undefined ? options.opacity : 1) : 0;

    this._transform = {
      x: options.x !== undefined ? options.x : (initT.x || 0),
      y: options.y !== undefined ? options.y : (initT.y || 0),
      rotation: options.rotation !== undefined ? options.rotation : (initT.rotation || 0),
      scaleX: options.scaleX !== undefined ? options.scaleX : (initT.scaleX || 1),
      scaleY: options.scaleY !== undefined ? options.scaleY : (initT.scaleY || 1),
      opacity: initOpacity
    };

    if (this.element) {
      if (!initVisible || initOpacity === 0) {
        gsap.set(this.element, { opacity: 0 });
      }
    }

    // Attachment state
    this.attachment = {
      isHeld: false,
      holder: null,             // CharacterController instance
      hand: null,               // 'near' | 'far' | 'handL' | 'handR'
      socket: null,             // 'palm' | 'grip'
      relativeOffset: { x: 0, y: 0, rotation: 0 }
    };

    // Current visual state
    this.state = options.initialState || (def.states ? def.states[0] : 'default');
  }

  get transform() {
    if (this.element && typeof gsap !== 'undefined') {
      const curX = gsap.getProperty(this.element, "x");
      const curY = gsap.getProperty(this.element, "y");
      const curRot = gsap.getProperty(this.element, "rotation");
      const curSx = gsap.getProperty(this.element, "scaleX");
      const curSy = gsap.getProperty(this.element, "scaleY");
      const curOp = gsap.getProperty(this.element, "opacity");
      return {
        x: curX !== null && curX !== undefined && !isNaN(curX) ? curX : this._transform.x,
        y: curY !== null && curY !== undefined && !isNaN(curY) ? curY : this._transform.y,
        rotation: curRot !== null && curRot !== undefined && !isNaN(curRot) ? curRot : this._transform.rotation,
        scaleX: curSx !== null && curSx !== undefined && !isNaN(curSx) ? curSx : this._transform.scaleX,
        scaleY: curSy !== null && curSy !== undefined && !isNaN(curSy) ? curSy : this._transform.scaleY,
        opacity: curOp !== null && curOp !== undefined && !isNaN(curOp) ? curOp : this._transform.opacity
      };
    }
    return this._transform;
  }

  set transform(val) {
    this._transform = { ...this._transform, ...val };
  }

  /**
   * Convert world coordinate to local parent coordinate space.
   * If element has an SVG parent group with transforms (e.g. #office-desk),
   * maps world point through parent's inverse CTM for 100% mathematical precision.
   * 
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{x: number, y: number}}
   */
  getLocalFromWorld(worldX, worldY) {
    if (!this.element) return { x: worldX, y: worldY };

    // 1. Live DOM SVG evaluation
    const parent = this.element.parentElement;
    if (parent && typeof parent.getCTM === 'function' && parent !== this.element.ownerSVGElement) {
      const svg = this.element.ownerSVGElement;
      if (svg) {
        const pt = svg.createSVGPoint();
        pt.x = worldX;
        pt.y = worldY;
        const pCTM = parent.getCTM();
        if (pCTM) {
          const localPt = pt.matrixTransform(pCTM.inverse());
          return { x: localPt.x, y: localPt.y };
        }
      }
    }

    // 2. Mathematical fallback if headless / pre-render
    const parentId = this.parent || this.definition?.parent;
    if (parentId && ASSET_REGISTRY.objects[parentId]) {
      const pWorld = getWorldTransform(parentId);
      return {
        x: worldX - (pWorld.x || 0),
        y: worldY - (pWorld.y || 0)
      };
    }

    return { x: worldX, y: worldY };
  }

  /**
   * 1. MOVE TO: Translate object to world coordinate or anchor target
   */
  moveTo({
    tl = gsap.timeline(),
    atTime = 0,
    target = null,
    x = null,
    y = null,
    duration = 0.8,
    ease = "power2.inOut"
  } = {}) {
    let destWorldX = null;
    let destWorldY = null;

    if (x !== null && y !== null) {
      destWorldX = x;
      destWorldY = y;
    } else if (target) {
      const resolved = resolveAnchor(target);
      destWorldX = resolved.x;
      destWorldY = resolved.y;
    }

    let destX = this.transform.x;
    let destY = this.transform.y;

    if (destWorldX !== null && destWorldY !== null) {
      const localPt = this.getLocalFromWorld(destWorldX, destWorldY);
      destX = localPt.x;
      destY = localPt.y;
    }

    if (this.element) {
      tl.to(this.element, {
        x: destX,
        y: destY,
        duration,
        ease
      }, atTime);
    }

    this.transform.x = destX;
    this.transform.y = destY;
    return tl;
  }

  /**
   * 2. ROTATE TO: Rotate object around its origin or specified pivot
   */
  rotateTo({
    tl = gsap.timeline(),
    atTime = 0,
    rotation = 0,
    duration = 0.5,
    ease = "power2.out",
    transformOrigin = null
  } = {}) {
    const defaultOrigin = (this.id === 'mug' || this.element?.id === 'desk-mug') ? "0px 22px" : "50% 50%";
    const tOrigin = transformOrigin || defaultOrigin;
    if (this.element) {
      tl.to(this.element, {
        rotation,
        transformOrigin: tOrigin,
        duration,
        ease
      }, atTime);
    }
    this.transform.rotation = rotation;
    return tl;
  }

  /**
   * 3. SCALE TO: Scale object dimensions
   */
  scaleTo({
    tl = gsap.timeline(),
    atTime = 0,
    scaleX = 1,
    scaleY = null,
    duration = 0.5,
    ease = "power2.out",
    transformOrigin = "50% 50%"
  } = {}) {
    const sy = scaleY !== null ? scaleY : scaleX;
    if (this.element) {
      tl.to(this.element, {
        scaleX,
        scaleY: sy,
        transformOrigin,
        duration,
        ease
      }, atTime);
    }
    this.transform.scaleX = scaleX;
    this.transform.scaleY = sy;
    return tl;
  }

  /**
   * 4. FADE IN & OUT
   */
  fadeIn({ tl = gsap.timeline(), atTime = 0, duration = 0.4 } = {}) {
    if (this.element) {
      tl.to(this.element, { opacity: 1, duration, ease: "power1.in" }, atTime);
    }
    this.transform.opacity = 1;
    return tl;
  }

  fadeOut({ tl = gsap.timeline(), atTime = 0, duration = 0.4 } = {}) {
    if (this.element) {
      tl.to(this.element, { opacity: 0, duration, ease: "power1.out" }, atTime);
    }
    this.transform.opacity = 0;
    return tl;
  }

  /**
   * 5. FOLLOW PATH: Animate along curved 2D trajectory
   * Converts world trajectory coordinates into local parent coordinate space.
   * @param {Array<{x: number, y: number}>|string} path Points or SVG path data
   */
  followPath({
    tl = gsap.timeline(),
    atTime = 0,
    path = [],
    duration = 1.0,
    ease = "power1.inOut"
  } = {}) {
    if (!this.element || !Array.isArray(path) || path.length < 2) return tl;

    // Convert each trajectory waypoint to local parent coordinate space
    const localPath = path.map(pt => this.getLocalFromWorld(pt.x, pt.y));

    const subDt = duration / (localPath.length - 1);
    for (let i = 1; i < localPath.length; i++) {
      const pt = localPath[i];
      tl.to(this.element, {
        x: pt.x,
        y: pt.y,
        duration: subDt,
        ease: "sine.inOut"
      }, atTime + (i - 1) * subDt);
    }

    const lastPt = localPath[localPath.length - 1];
    this.transform.x = lastPt.x;
    this.transform.y = lastPt.y;
    return tl;
  }

  /**
   * 6. SET TRANSFORM: Instantaneous placement
   */
  setTransform({
    x = null,
    y = null,
    rotation = null,
    scaleX = null,
    scaleY = null,
    opacity = null,
    isWorld = true,
    tl = null,
    atTime = null
  } = {}) {
    const updates = {};
    if (x !== null && y !== null) {
      const localPt = isWorld ? this.getLocalFromWorld(x, y) : { x, y };
      updates.x = localPt.x;
      updates.y = localPt.y;
      this.transform.x = localPt.x;
      this.transform.y = localPt.y;
    } else if (x !== null) {
      updates.x = x;
      this.transform.x = x;
    } else if (y !== null) {
      updates.y = y;
      this.transform.y = y;
    }

    if (rotation !== null) { updates.rotation = rotation; this.transform.rotation = rotation; }
    if (scaleX !== null) { updates.scaleX = scaleX; this.transform.scaleX = scaleX; }
    if (scaleY !== null) { updates.scaleY = scaleY; this.transform.scaleY = scaleY; }
    if (opacity !== null) { updates.opacity = opacity; this.transform.opacity = opacity; }

    if (this.element) {
      if (tl && atTime !== null) {
        tl.set(this.element, updates, atTime);
      } else {
        gsap.set(this.element, updates);
      }
    }
    return tl;
  }

  /**
   * 7. VISUAL STATE ACTIONS: changeState, show, hide, open, close
   */
  changeState({ tl = gsap.timeline(), atTime = 0, state = 'default', duration = 0.3 } = {}) {
    this.state = state;
    if (!this.element) return tl;

    // Apply specific state visual treatment
    if (state === 'pivot-table' || state === 'highlighted') {
      tl.to(this.element, {
        filter: "drop-shadow(0 0 14px rgba(16, 124, 65, 0.45))",
        duration,
        ease: "power2.out"
      }, atTime);
    } else if (state === 'error-highlight') {
      tl.to(this.element, {
        filter: "drop-shadow(0 0 14px rgba(220, 38, 38, 0.45))",
        duration,
        ease: "power2.out"
      }, atTime);
    } else if (state === 'default') {
      tl.to(this.element, {
        filter: "none",
        duration,
        ease: "power2.in"
      }, atTime);
    }
    return tl;
  }

  show({ tl = gsap.timeline(), atTime = 0 } = {}) {
    return this.fadeIn({ tl, atTime, duration: 0.1 });
  }

  hide({ tl = gsap.timeline(), atTime = 0 } = {}) {
    return this.fadeOut({ tl, atTime, duration: 0.1 });
  }

  open({ tl = gsap.timeline(), atTime = 0, duration = 0.5 } = {}) {
    // Hinged screen unfolds upward around the hinge line at y=118
    const screenEl = this.element?.querySelector('#laptop-screen-assembly') || this.element;
    if (screenEl) {
      tl.to(screenEl, { scaleY: 1, duration, ease: "power2.out", transformOrigin: "110px 118px" }, atTime);
    }
    this.state = 'open';
    return tl;
  }

  close({ tl = gsap.timeline(), atTime = 0, duration = 0.5 } = {}) {
    // Hinged screen folds down flat onto keyboard around hinge line at y=118
    const screenEl = this.element?.querySelector('#laptop-screen-assembly') || this.element;
    if (screenEl) {
      tl.to(screenEl, { scaleY: 0.05, duration, ease: "power2.in", transformOrigin: "110px 118px" }, atTime);
    }
    this.state = 'closed';
    return tl;
  }

  /**
   * 8. ATTACH TO CHARACTER: Seamlessly attach object to character's hand
   * Zero position jump at contact timestamp; synchronous continuous lift with hand.
   * 
   * @param {CharacterController} actorController
   * @param {Object} options { tl, atTime, hand, socket, holdDuration, liftDelta }
   */
  attachTo(actorController, {
    tl = gsap.timeline(),
    atTime = 0,
    hand = 'near',
    socket = 'palm',
    liftDelta = { x: -20, y: -65 },
    duration = 0.6
  } = {}) {
    this.attachment.isHeld = true;
    this.attachment.holder = actorController;
    this.attachment.hand = hand;
    this.attachment.socket = socket;

    if (!this.element) return tl;

    // Contact instant: starts exactly at current transform (zero jump, discontinuity <= 0.001px)
    const side = (actorController?.name === 'mohamed') ? 'L' : (hand === 'near' ? 'L' : 'R');
    const handEl = actorController?.rig?.parts?.[`hand${side}`];
    const armEl = actorController?.rig?.parts?.[`arm${side}`];
    const foreEl = actorController?.rig?.parts?.[`forearm${side}`];

    if (handEl && armEl && foreEl && typeof gsap !== 'undefined') {
      const svg = this.element.ownerSVGElement;
      const parent = this.element.parentElement || this.element.ownerSVGElement;
      const getSvgWorld = (el) => {
        const pt = svg.createSVGPoint();
        return pt.matrixTransform(el.getCTM());
      };
      const getLocal = (wx, wy) => {
        const pt = svg.createSVGPoint();
        pt.x = wx; pt.y = wy;
        return pt.matrixTransform(parent.getCTM().inverse());
      };

      const reachAngles = actorController?.state?.lastReachAngles || {};
      const startRotA = reachAngles.shoulderRot !== undefined ? reachAngles.shoulderRot : 88.36;
      const startRotF = reachAngles.foreRot !== undefined ? reachAngles.foreRot : -88.77;
      const endRotA = 120;
      const endRotF = -105;

      // Contact offset
      gsap.set(armEl, { rotation: startRotA });
      gsap.set(foreEl, { rotation: startRotF });
      const h0 = getSvgWorld(handEl);
      const m0 = getSvgWorld(this.element);
      const offset0 = { x: m0.x - h0.x, y: m0.y - h0.y };

      const steps = 10;
      const waypoints = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const p = 1 - Math.pow(1 - u, 3); // GSAP power2.out cubic
        const rotA = startRotA + (endRotA - startRotA) * p;
        const rotF = startRotF + (endRotF - startRotF) * p;
        gsap.set(armEl, { rotation: rotA });
        gsap.set(foreEl, { rotation: rotF });
        const h = getSvgWorld(handEl);
        const targetWorld = { x: h.x + offset0.x, y: h.y + offset0.y };
        const local = getLocal(targetWorld.x, targetWorld.y);
        waypoints.push({ t: atTime + u * duration, local });
      }

      // Restore arm angles to pre-lift state
      gsap.set(armEl, { rotation: startRotA });
      gsap.set(foreEl, { rotation: startRotF });

      const subDt = duration / steps;
      for (let i = 1; i < waypoints.length; i++) {
        const cur = waypoints[i];
        tl.to(this.element, {
          x: cur.local.x,
          y: cur.local.y,
          duration: subDt,
          ease: "none"
        }, atTime + (i - 1) * subDt);
      }

      const lastPt = waypoints[waypoints.length - 1].local;
      this.transform.x = lastPt.x;
      this.transform.y = lastPt.y;
      return tl;
    }

    const startX = this.transform.x;
    const startY = this.transform.y;

    const targetLiftX = startX + liftDelta.x;
    const targetLiftY = startY + liftDelta.y;

    tl.to(this.element, {
      x: targetLiftX,
      y: targetLiftY,
      duration,
      ease: "power2.out"
    }, atTime);

    this.transform.x = targetLiftX;
    this.transform.y = targetLiftY;
    return tl;
  }

  /**
   * 9. DETACH FROM CHARACTER: Release object and settle stably at destination
   * 
   * @param {Object} options { tl, atTime, placeAt, duration, ease }
   */
  detachFrom({
    tl = gsap.timeline(),
    atTime = 0,
    placeAt = null,
    duration = 0.4,
    ease = "power2.out"
  } = {}) {
    this.attachment.isHeld = false;
    this.attachment.holder = null;
    this.attachment.hand = null;
    this.attachment.socket = null;

    if (!this.element) return tl;

    let targetWorldX = null;
    let targetWorldY = null;

    if (placeAt) {
      const resolved = resolveAnchor(placeAt);
      const bottomAnchor = this.definition?.localAnchors?.bottom || { x: 14, y: 34 };
      targetWorldX = resolved.x - bottomAnchor.x;
      targetWorldY = resolved.y - bottomAnchor.y;
    }

    let targetX = this.transform.x;
    let targetY = this.transform.y;

    if (targetWorldX !== null && targetWorldY !== null) {
      const localPt = this.getLocalFromWorld(targetWorldX, targetWorldY);
      targetX = localPt.x;
      targetY = localPt.y;
    }

    tl.to(this.element, {
      x: targetX,
      y: targetY,
      duration,
      ease
    }, atTime);

    this.transform.x = targetX;
    this.transform.y = targetY;
    return tl;
  }

  holdBy(actorController, options = {}) {
    return this.attachTo(actorController, options);
  }

  release(options = {}) {
    return this.detachFrom(options);
  }

  /**
   * Read live diagnostics from rendered DOM via getCTM()
   */
  getDiagnostics() {
    let worldPt = { x: this.transform.x, y: this.transform.y };
    if (this.element && typeof this.element.getCTM === 'function') {
      worldPt = pointWorld(this.element);
    }

    return {
      id: this.id,
      name: this.name,
      type: this.type,
      state: this.state,
      transform: { ...this.transform },
      worldPosition: worldPt,
      attachment: {
        isHeld: this.attachment.isHeld,
        holderId: this.attachment.holder ? this.attachment.holder.id : null,
        hand: this.attachment.hand,
        socket: this.attachment.socket
      }
    };
  }
}
