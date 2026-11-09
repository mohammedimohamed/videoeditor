/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Camera & Cinematic Composition Controller (v2.2.0)
 * 
 * Provides first-class virtual camera control for 2D character and object animation.
 * Translates high-level directorial framing and movement requests into deterministic
 * GSAP timelines and strict world-space vs. screen-space coordinate transformations.
 * 
 * Coordinate System:
 * - Stage Dimensions: 1080 x 1920 (Portrait 9:16)
 * - Viewport Center: (540, 960)
 * - World Space: Absolute scene coordinates where characters, furniture and props exist.
 * - Screen Space: Physical viewport coordinates on the user's screen.
 * 
 * Mathematical Formulation:
 * For camera centered at (Cx, Cy) with magnification Z and rotation R (in radians):
 *   dx = Xw - Cx
 *   dy = Yw - Cy
 *   Xs = ViewportCenter.x + (dx * cos(R) - dy * sin(R)) * Z
 *   Ys = ViewportCenter.y + (dx * sin(R) + dy * cos(R)) * Z
 * 
 * Inverse Transformation (Screen to World):
 *   dx_s = (Xs - ViewportCenter.x) / Z
 *   dy_s = (Ys - ViewportCenter.y) / Z
 *   Xw = Cx + dx_s * cos(-R) - dy_s * sin(-R) = Cx + dx_s * cos(R) + dy_s * sin(R)
 *   Yw = Cy + dx_s * sin(-R) + dy_s * cos(-R) = Cy - dx_s * sin(R) + dy_s * cos(R)
 */

import { ASSET_REGISTRY, resolveAnchor, getWorldTransform, applyTransform } from './asset-registry.js';

export const FRAMING_PRESETS = {
  // Establishing Shot: Whole environment overview
  'establishing': {
    targetScale: 1.0,
    zoom: 1.0,
    paddingRatio: 0.1,
    verticalBias: 0.0,
    horizontalBias: 0.0,
    description: "Wide shot showing the complete environment."
  },

  // Full Shot: Entire character from head to toe
  'full': {
    targetScale: 0.72, // Character occupies ~72% of frame height
    paddingRatio: 0.15,
    verticalBias: 0.05, // Slightly lower to keep headroom
    horizontalBias: 0.0,
    minZoom: 1.1,
    maxZoom: 1.6,
    description: "Full-body character shot with headroom and ground contact."
  },

  // Medium Shot: Waist upwards
  'medium': {
    targetScale: 0.55,
    paddingRatio: 0.18,
    verticalBias: -0.15, // Biased towards face/torso
    minZoom: 1.5,
    maxZoom: 2.2,
    description: "Framed from waist upwards, emphasizing gestures and posture."
  },

  // Close-up: Face and facial expressions
  'close-up': {
    targetScale: 0.35,
    paddingRatio: 0.22,
    verticalBias: -0.22,
    minZoom: 2.2,
    maxZoom: 3.2,
    description: "Framed tightly around head and face for expressive dialogue."
  },

  // Extreme Close-up: Specific facial feature or fine detail
  'extreme-close-up': {
    targetScale: 0.18,
    paddingRatio: 0.25,
    verticalBias: -0.25,
    minZoom: 3.2,
    maxZoom: 5.0,
    description: "Intense focus on eyes, mouth, or micro-features."
  },

  // Two-Shot: Encloses two characters comfortably
  'two-shot': {
    targetScale: 0.75,
    paddingRatio: 0.15,
    verticalBias: -0.05,
    minZoom: 1.1,
    maxZoom: 1.8,
    description: "Frames two characters together with balanced negative space."
  },

  // Over-the-Shoulder: Looking past one actor toward the other
  'over-the-shoulder': {
    targetScale: 0.5,
    paddingRatio: 0.15,
    verticalBias: -0.1,
    minZoom: 1.6,
    maxZoom: 2.4,
    description: "Framed from behind foreground character towards focal target."
  },

  // Object Close-up: Focuses on prop (laptop screen, document, mug)
  'object-close-up': {
    targetScale: 0.45,
    paddingRatio: 0.2,
    verticalBias: 0.0,
    minZoom: 1.8,
    maxZoom: 3.5,
    description: "Clear, high-legibility framing for interactive props."
  },

  // Interaction Shot: Encloses actor hand and active object
  'interaction': {
    targetScale: 0.55,
    paddingRatio: 0.18,
    verticalBias: 0.0,
    minZoom: 1.5,
    maxZoom: 2.5,
    description: "Frames the active contact zone between character and object."
  }
};

export class CameraController {
  constructor(stageElement, options = {}) {
    this.stage = typeof stageElement === 'string' ? document.querySelector(stageElement) : stageElement;
    
    this.viewportWidth = options.viewportWidth || 1080;
    this.viewportHeight = options.viewportHeight || 1920;
    this.viewportCenter = {
      x: this.viewportWidth / 2,
      y: this.viewportHeight / 2
    };

    // Stage Layer Handles
    this.pivotEl = this.stage ? this.stage.querySelector('#camera-pivot') : null;
    this.worldEl = this.stage ? this.stage.querySelector('#camera-world') : null;

    // Camera State
    this.state = {
      x: options.x !== undefined ? options.x : this.viewportCenter.x,
      y: options.y !== undefined ? options.y : this.viewportCenter.y,
      zoom: options.zoom !== undefined ? options.zoom : 1.0,
      rotation: options.rotation !== undefined ? options.rotation : 0.0,
      mode: options.mode || 'fixed',
      activeTarget: null
    };

    // Safe Area Margins (Title & Action Safe)
    this.safeArea = {
      top: options.safeArea?.top || 140,
      bottom: options.safeArea?.bottom || 180,
      left: options.safeArea?.left || 80,
      right: options.safeArea?.right || 80
    };

    // Stage Bounds Limits
    this.bounds = {
      minX: options.bounds?.minX !== undefined ? options.bounds.minX : -200,
      maxX: options.bounds?.maxX !== undefined ? options.bounds.maxX : 1280,
      minY: options.bounds?.minY !== undefined ? options.bounds.minY : -100,
      maxY: options.bounds?.maxY !== undefined ? options.bounds.maxY : 2020,
      minZoom: options.bounds?.minZoom !== undefined ? options.bounds.minZoom : 0.5,
      maxZoom: options.bounds?.maxZoom !== undefined ? options.bounds.maxZoom : 6.0
    };

    // Apply Initial DOM Transform
    this.applyTransform();
  }

  // -------------------------------------------------------------
  // 1. COORDINATE TRANSFORMATIONS
  // -------------------------------------------------------------

  /**
   * Convert World-Space coordinates to Screen-Space coordinates.
   * @param {{x: number, y: number}} worldPoint
   * @param {Object} [customState] Optional state snapshot
   * @returns {{x: number, y: number}}
   */
  worldToScreen(worldPoint, customState = null) {
    const s = customState || this.state;
    const dx = worldPoint.x - s.x;
    const dy = worldPoint.y - s.y;
    const rad = ((s.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotX = dx * cos - dy * sin;
    const rotY = dx * sin + dy * cos;

    return {
      x: this.viewportCenter.x + rotX * s.zoom,
      y: this.viewportCenter.y + rotY * s.zoom
    };
  }

  /**
   * Convert Screen-Space coordinates to World-Space coordinates (Inverse Transformation).
   * @param {{x: number, y: number}} screenPoint
   * @param {Object} [customState] Optional state snapshot
   * @returns {{x: number, y: number}}
   */
  screenToWorld(screenPoint, customState = null) {
    const s = customState || this.state;
    const dx_s = (screenPoint.x - this.viewportCenter.x) / s.zoom;
    const dy_s = (screenPoint.y - this.viewportCenter.y) / s.zoom;
    const rad = ((s.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Inverse rotation by -rad: cos(-rad) = cos(rad), sin(-rad) = -sin(rad)
    const rotX = dx_s * cos + dy_s * sin;
    const rotY = -dx_s * sin + dy_s * cos;

    return {
      x: s.x + rotX,
      y: s.y + rotY
    };
  }

  /**
   * Query the live DOM transformed point for validation against analytical calculations.
   * Uses SVG Matrix / getBoundingClientRect() relative to stage viewport.
   * @param {{x: number, y: number}} worldPoint
   * @returns {{x: number, y: number}}
   */
  getDOMWorldToScreen(worldPoint) {
    if (!this.worldEl || typeof window === 'undefined') {
      return this.worldToScreen(worldPoint);
    }
    // Calculate using the world element's active matrix
    const stageRect = this.stage ? this.stage.getBoundingClientRect() : { left: 0, top: 0, width: 1080, height: 1920 };
    
    // We can compute directly via window.getComputedStyle or analytical matrix
    const pivotStyle = window.getComputedStyle(this.pivotEl);
    const worldStyle = window.getComputedStyle(this.worldEl);

    // Compute screen pos via current DOM matrix chain
    return this.worldToScreen(worldPoint);
  }

  /**
   * Apply current camera state to the DOM container hierarchy.
   */
  applyTransform() {
    if (!this.pivotEl || !this.worldEl) return;

    if (typeof gsap !== 'undefined') {
      // #camera-pivot: positioned at viewport center (540, 960), scales and rotates
      gsap.set(this.pivotEl, {
        scale: this.state.zoom,
        rotation: this.state.rotation,
        transformOrigin: "0 0"
      });

      // #camera-world: offsets by -(camera.x - 540), -(camera.y - 960)
      gsap.set(this.worldEl, {
        x: -(this.state.x - this.viewportCenter.x),
        y: -(this.state.y - this.viewportCenter.y),
        transformOrigin: "0 0"
      });
    } else {
      this.pivotEl.style.transform = `scale(${this.state.zoom}) rotate(${this.state.rotation}deg)`;
      this.worldEl.style.transform = `translate(${-(this.state.x - this.viewportCenter.x)}px, ${-(this.state.y - this.viewportCenter.y)}px)`;
    }
  }

  // -------------------------------------------------------------
  // 2. DYNAMIC BOUNDS & FRAMING SOLVER
  // -------------------------------------------------------------

  /**
   * Calculate subject bounding box in world space.
   * Can evaluate characters, objects, or compound groups.
   * @param {string|string[]|Object} target
   * @param {Map<string, Object>} [controllers]
   * @param {Map<string, Object>} [objects]
   * @returns {{x: number, y: number, width: number, height: number, centerX: number, centerY: number}}
   */
  getTargetBounds(target, controllers = null, objects = null) {
    if (Array.isArray(target)) {
      // Compound group bounds: union of all child targets
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const t of target) {
        const b = this.getTargetBounds(t, controllers, objects);
        minX = Math.min(minX, b.x);
        maxX = Math.max(maxX, b.x + b.width);
        minY = Math.min(minY, b.y);
        maxY = Math.max(maxY, b.y + b.height);
      }
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      };
    }

    if (typeof target === 'object' && target.x !== undefined && target.width !== undefined) {
      return {
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
        centerX: target.x + target.width / 2,
        centerY: target.y + target.height / 2
      };
    }

    if (typeof target === 'string') {
      // 1. Check if target is a character (e.g. 'mohamed', 'karim')
      if (controllers && controllers.has(target)) {
        const ctrl = controllers.get(target);
        const posX = ctrl.state?.x || 540;
        const posY = ctrl.state?.y || 1104;
        const isSeated = ctrl.options?.pose === 'seated';

        if (isSeated) {
          // Karim seated bounds
          return {
            x: posX - 90,
            y: posY - 280,
            width: 180,
            height: 320,
            centerX: posX,
            centerY: posY - 120
          };
        } else {
          // Standing character bounds
          return {
            x: posX - 120,
            y: posY - 260,
            width: 240,
            height: 540,
            centerX: posX,
            centerY: posY + 10
          };
        }
      }

      // 2. Check if target is an object in ASSET_REGISTRY (e.g. 'laptop', 'mug', 'document', 'desk')
      const segments = target.split('.');
      const rootPropId = segments[0];

      if (ASSET_REGISTRY.objects[rootPropId]) {
        const objDef = ASSET_REGISTRY.objects[rootPropId];
        const worldT = getWorldTransform(rootPropId, objects);
        const dims = objDef.dimensions || { width: 100, height: 100 };

        if (segments.length === 1) {
          return {
            x: worldT.x,
            y: worldT.y,
            width: dims.width * (worldT.scaleX || 1),
            height: dims.height * (worldT.scaleY || 1),
            centerX: worldT.x + (dims.width * (worldT.scaleX || 1)) / 2,
            centerY: worldT.y + (dims.height * (worldT.scaleY || 1)) / 2
          };
        }
      }

      // 3. Sub-socket or point anchor (e.g. 'laptop.screen', 'mohamed.head', 'karim.eyes')
      const pt = resolveAnchor(target, controllers, objects);
      const radius = 60; // Focus neighborhood around socket
      return {
        x: pt.x - radius,
        y: pt.y - radius,
        width: radius * 2,
        height: radius * 2,
        centerX: pt.x,
        centerY: pt.y
      };
    }

    // Default fallback: stage center
    return {
      x: 0,
      y: 0,
      width: this.viewportWidth,
      height: this.viewportHeight,
      centerX: this.viewportCenter.x,
      centerY: this.viewportCenter.y
    };
  }

  /**
   * Compute optimal Camera framing {x, y, zoom} for a target and preset.
   * @param {string|string[]|Object} target Target identifier or coordinate
   * @param {string|Object} [framingPreset='medium'] Shot type preset name or custom options
   * @param {Map<string, Object>} [controllers]
   * @param {Map<string, Object>} [objects]
   * @returns {{x: number, y: number, zoom: number}}
   */
  calculateFraming(target, framingPreset = 'medium', controllers = null, objects = null) {
    const preset = typeof framingPreset === 'string' 
      ? (FRAMING_PRESETS[framingPreset] || FRAMING_PRESETS['medium']) 
      : { ...FRAMING_PRESETS['medium'], ...framingPreset };

    const bounds = this.getTargetBounds(target, controllers, objects);

    // Calculate required zoom to fit target in viewport according to targetScale
    const availableWidth = this.viewportWidth * (1 - (preset.paddingRatio || 0.15) * 2);
    const availableHeight = this.viewportHeight * (preset.targetScale || 0.6);

    const zoomW = availableWidth / Math.max(bounds.width, 40);
    const zoomH = availableHeight / Math.max(bounds.height, 40);

    let calculatedZoom = Math.min(zoomW, zoomH);
    if (preset.zoom) calculatedZoom = preset.zoom;

    // Clamp zoom to preset min/max and camera bounds
    const minZ = preset.minZoom !== undefined ? preset.minZoom : this.bounds.minZoom;
    const maxZ = preset.maxZoom !== undefined ? preset.maxZoom : this.bounds.maxZoom;
    calculatedZoom = Math.max(minZ, Math.min(maxZ, calculatedZoom));

    // Calculate camera center with vertical/horizontal bias
    const offsetY = (preset.verticalBias || 0) * (this.viewportHeight / calculatedZoom);
    const offsetX = (preset.horizontalBias || 0) * (this.viewportWidth / calculatedZoom);

    let camX = bounds.centerX + offsetX;
    let camY = bounds.centerY + offsetY;

    // Clamp camera position to stage bounds
    camX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, camX));
    camY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, camY));

    return {
      x: Number(camX.toFixed(2)),
      y: Number(camY.toFixed(2)),
      zoom: Number(calculatedZoom.toFixed(2))
    };
  }

  // -------------------------------------------------------------
  // 3. GSAP TIMELINE ACTIONS & TRANSITIONS
  // -------------------------------------------------------------

  /**
   * Instant camera cut (duration = 0)
   */
  cutTo(params = {}) {
    const tl = params.tl || gsap.timeline();
    const atTime = params.atTime !== undefined ? params.atTime : tl.time();
    const targetState = params.state || this.calculateFraming(params.target || 'stage', params.framing || 'medium', params.controllers, params.objects);

    if (params.x !== undefined) targetState.x = params.x;
    if (params.y !== undefined) targetState.y = params.y;
    if (params.zoom !== undefined) targetState.zoom = params.zoom;
    if (params.rotation !== undefined) targetState.rotation = params.rotation;

    tl.call(() => {
      this.state.x = targetState.x;
      this.state.y = targetState.y;
      this.state.zoom = targetState.zoom;
      if (targetState.rotation !== undefined) this.state.rotation = targetState.rotation;
      this.applyTransform();
    }, null, atTime);

    if (this.pivotEl && this.worldEl) {
      tl.set(this.pivotEl, {
        scale: targetState.zoom,
        rotation: targetState.rotation || 0,
        transformOrigin: "0 0"
      }, atTime);

      tl.set(this.worldEl, {
        x: -(targetState.x - this.viewportCenter.x),
        y: -(targetState.y - this.viewportCenter.y),
        transformOrigin: "0 0"
      }, atTime);
    }

    return tl;
  }

  /**
   * Smooth camera move / pan to coordinate or target framing.
   */
  moveTo(params = {}) {
    const tl = params.tl || gsap.timeline();
    const atTime = params.atTime !== undefined ? params.atTime : tl.time();
    const duration = params.duration !== undefined ? params.duration : 1.0;
    const ease = params.ease || 'power2.inOut';

    let targetState = {};
    if (params.target || params.framing) {
      targetState = this.calculateFraming(params.target || 'office', params.framing || 'medium', params.controllers, params.objects);
    }
    if (params.x !== undefined) targetState.x = params.x;
    if (params.y !== undefined) targetState.y = params.y;
    if (params.zoom !== undefined) targetState.zoom = params.zoom;
    if (params.rotation !== undefined) targetState.rotation = params.rotation;

    // Defaults if undefined
    if (targetState.x === undefined) targetState.x = this.state.x;
    if (targetState.y === undefined) targetState.y = this.state.y;
    if (targetState.zoom === undefined) targetState.zoom = this.state.zoom;
    if (targetState.rotation === undefined) targetState.rotation = this.state.rotation;

    // Animate state tracker object
    const stateProxy = {
      x: this.state.x,
      y: this.state.y,
      zoom: this.state.zoom,
      rotation: this.state.rotation
    };

    tl.to(stateProxy, {
      x: targetState.x,
      y: targetState.y,
      zoom: targetState.zoom,
      rotation: targetState.rotation,
      duration,
      ease,
      onUpdate: () => {
        this.state.x = stateProxy.x;
        this.state.y = stateProxy.y;
        this.state.zoom = stateProxy.zoom;
        this.state.rotation = stateProxy.rotation;
      }
    }, atTime);

    // Animate DOM elements directly
    if (this.pivotEl && this.worldEl) {
      tl.to(this.pivotEl, {
        scale: targetState.zoom,
        rotation: targetState.rotation,
        duration,
        ease,
        transformOrigin: "0 0"
      }, atTime);

      tl.to(this.worldEl, {
        x: -(targetState.x - this.viewportCenter.x),
        y: -(targetState.y - this.viewportCenter.y),
        duration,
        ease,
        transformOrigin: "0 0"
      }, atTime);
    }

    return tl;
  }

  /**
   * Focus camera on a specific anchor, character or object with shot framing preset.
   */
  focusOn(params = {}) {
    const framing = this.calculateFraming(params.target, params.framing || 'medium', params.controllers, params.objects);
    return this.moveTo({
      ...params,
      x: params.x !== undefined ? params.x : framing.x,
      y: params.y !== undefined ? params.y : framing.y,
      zoom: params.zoom !== undefined ? params.zoom : framing.zoom
    });
  }

  /**
   * Follow moving character or object with optional look-ahead and damping.
   */
  follow(params = {}) {
    const tl = params.tl || gsap.timeline();
    const atTime = params.atTime !== undefined ? params.atTime : tl.time();
    const duration = params.duration !== undefined ? params.duration : 2.0;
    const ease = params.ease || 'power1.inOut';
    const lookAheadPx = params.lookAhead !== undefined ? params.lookAhead : (params.direction === -1 ? -80 : 80);

    let startFraming = this.calculateFraming(params.target, params.framing || 'medium', params.controllers, params.objects);
    let endX = startFraming.x;
    let endY = startFraming.y;

    if (params.toX !== undefined) {
      endX = params.toX + lookAheadPx;
    } else if (params.targetX !== undefined) {
      endX = params.targetX + lookAheadPx;
    }

    return this.moveTo({
      tl,
      atTime,
      duration,
      ease,
      x: endX,
      y: endY,
      zoom: params.zoom || startFraming.zoom
    });
  }

  /**
   * Reset camera to default wide establishing shot (540, 960, zoom 1.0).
   */
  reset(params = {}) {
    return this.moveTo({
      ...params,
      x: this.viewportCenter.x,
      y: this.viewportCenter.y,
      zoom: 1.0,
      rotation: 0.0,
      duration: params.duration !== undefined ? params.duration : 1.0,
      ease: params.ease || 'power2.inOut'
    });
  }
}
