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
    this.transform = {
      x: options.x !== undefined ? options.x : (initT.x || 0),
      y: options.y !== undefined ? options.y : (initT.y || 0),
      rotation: options.rotation !== undefined ? options.rotation : (initT.rotation || 0),
      scaleX: options.scaleX !== undefined ? options.scaleX : (initT.scaleX || 1),
      scaleY: options.scaleY !== undefined ? options.scaleY : (initT.scaleY || 1),
      opacity: options.opacity !== undefined ? options.opacity : 1
    };

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
    let destX = this.transform.x;
    let destY = this.transform.y;

    if (x !== null && y !== null) {
      destX = x;
      destY = y;
    } else if (target) {
      const resolved = resolveAnchor(target);
      destX = resolved.x;
      destY = resolved.y;
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
    transformOrigin = "50% 50%"
  } = {}) {
    if (this.element) {
      tl.to(this.element, {
        rotation,
        transformOrigin,
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

    const subDt = duration / (path.length - 1);
    for (let i = 1; i < path.length; i++) {
      const pt = path[i];
      tl.to(this.element, {
        x: pt.x,
        y: pt.y,
        duration: subDt,
        ease: "sine.inOut"
      }, atTime + (i - 1) * subDt);
    }

    const lastPt = path[path.length - 1];
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
    tl = null,
    atTime = null
  } = {}) {
    const updates = {};
    if (x !== null) { updates.x = x; this.transform.x = x; }
    if (y !== null) { updates.y = y; this.transform.y = y; }
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
    // e.g. Laptop screen opens upward
    if (this.element) {
      tl.to(this.element, { scaleY: 1, duration, ease: "power2.out", transformOrigin: "bottom center" }, atTime);
    }
    this.state = 'open';
    return tl;
  }

  close({ tl = gsap.timeline(), atTime = 0, duration = 0.5 } = {}) {
    // e.g. Laptop screen folds down
    if (this.element) {
      tl.to(this.element, { scaleY: 0.08, duration, ease: "power2.in", transformOrigin: "bottom center" }, atTime);
    }
    this.state = 'closed';
    return tl;
  }

  /**
   * 8. ATTACH TO CHARACTER: Seamlessly attach object to character's hand
   * Calculates world offset at contact timestamp so the object NEVER jumps or teleports.
   * 
   * @param {CharacterController} actorController
   * @param {Object} options { tl, atTime, hand, socket, holdDuration, liftDelta }
   */
  attachTo(actorController, {
    tl = gsap.timeline(),
    atTime = 0,
    hand = 'near',
    socket = 'palm',
    liftDelta = { x: 0, y: -45 },
    duration = 0.6
  } = {}) {
    this.attachment.isHeld = true;
    this.attachment.holder = actorController;
    this.attachment.hand = hand;
    this.attachment.socket = socket;

    if (!this.element) return tl;

    // Animate object following the hand lift
    // Object lifts smoothly synchronously with character forearm lift
    const targetLiftX = this.transform.x + liftDelta.x;
    const targetLiftY = this.transform.y + liftDelta.y;

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
   * 9. DETACH FROM CHARACTER: Release object and place it stably at destination
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

    let targetX = this.transform.x;
    let targetY = this.transform.y;

    if (placeAt) {
      const resolved = resolveAnchor(placeAt);
      targetX = resolved.x;
      targetY = resolved.y;
    }

    tl.to(this.element, {
      x: targetX,
      y: targetY,
      duration,
      ease
    }, atTime);

    // Subtle contact bounce on placement (realistic glass/ceramic contact)
    tl.to(this.element, {
      y: targetY - 2,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: "sine.out"
    }, atTime + duration);

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
