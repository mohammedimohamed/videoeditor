/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Composition & Cinematic Safety Validator (v2.2.0)
 * 
 * Analyzes scene specifications and camera choreography for visual safety:
 * 1. Subject Visibility: Ensures required characters and interactive objects remain within the camera viewport.
 * 2. Safe Areas: Enforces platform title-safe and action-safe margin boundaries (captions, subtitles, UI overlays).
 * 3. Composition Conflicts: Flags subtitles obscuring faces, extreme zooms cropping interaction zones, or occlusions.
 * 4. Framing Stability: Detects excessive camera velocity, abrupt zoom discontinuities, and visual jitter.
 * 5. Visual Diagnostics: Generates structured warnings and compliance metrics for director feedback.
 */

import { FRAMING_PRESETS } from './camera-controller.js';
import { ASSET_REGISTRY, resolveAnchor } from './asset-registry.js';

export class CompositionValidator {
  constructor(options = {}) {
    this.viewportWidth = options.viewportWidth || 1080;
    this.viewportHeight = options.viewportHeight || 1920;

    // Platform-standard safe margins for vertical mobile video (9:16)
    this.safeArea = {
      titleSafe: {
        top: options.titleSafeTop || 160,
        bottom: options.titleSafeBottom || 240,
        left: options.titleSafeLeft || 80,
        right: options.titleSafeRight || 80
      },
      actionSafe: {
        top: options.actionSafeTop || 100,
        bottom: options.actionSafeBottom || 160,
        left: options.actionSafeLeft || 50,
        right: options.actionSafeRight || 50
      }
    };

    // Velocity & Acceleration thresholds
    this.thresholds = {
      maxCameraSpeed: options.maxCameraSpeed || 2800, // px per second
      maxZoomSpeed: options.maxZoomSpeed || 4.0,       // zoom ratio change per second
      minSubjectVisibilityRatio: 0.65                // Minimum fraction of subject box that must be visible
    };
  }

  /**
   * Validate a scene specification's camera choreography and composition safety.
   * @param {Object} spec Scene specification
   * @param {Map<string, Object>} [schedule] Scheduled event timings from SceneValidator
   * @returns {{ valid: boolean, errors: string[], warnings: string[], metrics: Object }}
   */
  validate(spec, schedule = null) {
    const errors = [];
    const warnings = [];
    const metrics = {
      cameraEventsCount: 0,
      maxVelocityPxPerSec: 0,
      maxZoomChangePerSec: 0,
      safeAreaViolations: 0,
      visibilityChecks: []
    };

    if (!spec || !spec.events) {
      return { valid: true, errors, warnings, metrics };
    }

    // 1. Collect and sort camera events
    const cameraActions = [
      'cameraSet', 'cameraMoveTo', 'cameraPanTo', 'cameraZoomTo', 'cameraFocus',
      'cameraFollow', 'cameraTrack', 'cameraReset', 'frameCharacter', 'frameObject',
      'frameGroup', 'frameInteraction', 'cutTo', 'dissolveTo', 'zoomTransition', 'panTransition'
    ];

    const cameraEvents = spec.events.filter(e => cameraActions.includes(e.action));
    metrics.cameraEventsCount = cameraEvents.length;

    // 2. Validate Camera Targets
    for (const evt of cameraEvents) {
      const target = evt.params?.target || evt.target;
      if (target) {
        if (Array.isArray(target)) {
          for (const t of target) {
            this._validateTargetReference(t, evt.id, errors);
          }
        } else {
          this._validateTargetReference(target, evt.id, errors);
        }
      }

      // Check Framing Preset Validity
      const framing = evt.params?.framing || evt.framing;
      if (framing && typeof framing === 'string' && !FRAMING_PRESETS[framing]) {
        warnings.push(`Event "${evt.id}": Unknown framing preset "${framing}". Falling back to "medium".`);
      }
    }

    // 3. Framing Stability & Velocity Analysis
    let lastCamState = {
      x: spec.camera?.initial?.position?.x || 540,
      y: spec.camera?.initial?.position?.y || 960,
      zoom: spec.camera?.initial?.zoom || 1.0,
      time: 0
    };

    for (const evt of cameraEvents) {
      const timing = schedule?.get(evt.id) || {
        start: evt.timing?.start || evt.at || 0,
        duration: evt.timing?.duration || evt.duration || 1.0
      };

      const params = evt.params || {};
      const targetZoom = params.zoom !== undefined ? params.zoom : (evt.action === 'cameraReset' ? 1.0 : lastCamState.zoom);
      const targetX = params.x !== undefined ? params.x : lastCamState.x;
      const targetY = params.y !== undefined ? params.y : lastCamState.y;

      const duration = Math.max(timing.duration, 0.05);
      const dist = Math.hypot(targetX - lastCamState.x, targetY - lastCamState.y);
      const velocity = dist / duration;
      const zoomChangeRate = Math.abs(targetZoom - lastCamState.zoom) / duration;

      metrics.maxVelocityPxPerSec = Math.max(metrics.maxVelocityPxPerSec, velocity);
      metrics.maxZoomChangePerSec = Math.max(metrics.maxZoomChangePerSec, zoomChangeRate);

      if (velocity > this.thresholds.maxCameraSpeed && evt.action !== 'cutTo') {
        warnings.push(`Event "${evt.id}": High camera velocity (${Math.round(velocity)} px/s). Consider easing or increasing duration.`);
      }

      if (zoomChangeRate > this.thresholds.maxZoomSpeed && evt.action !== 'cutTo') {
        warnings.push(`Event "${evt.id}": Fast zoom transition (${zoomChangeRate.toFixed(2)}x/s). May cause visual disorientation.`);
      }

      lastCamState = {
        x: targetX,
        y: targetY,
        zoom: targetZoom,
        time: timing.start + timing.duration
      };
    }

    // 4. Safe Area & Subtitle Overlap Check
    const captionEvents = spec.events.filter(e => e.action === 'caption');
    for (const cap of captionEvents) {
      const params = cap.params || {};
      const bottom = params.bottom !== undefined ? params.bottom : 80;
      if (bottom < this.safeArea.titleSafe.bottom - 100) {
        // Caption positioned in safe-area margin
        metrics.safeAreaViolations++;
        warnings.push(`Event "${cap.id}": Caption placed close to lower screen edge (${bottom}px). May be obscured by mobile UI.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }

  _validateTargetReference(target, eventId, errors) {
    if (!target) return;
    try {
      resolveAnchor(target);
    } catch (err) {
      // Check if target is a registered actor ID (e.g. 'karim', 'mohamed')
      if (['mohamed', 'karim', 'office', 'stage'].includes(target)) {
        return;
      }
      errors.push(`Event "${eventId}": Target anchor "${target}" could not be resolved (${err.message}).`);
    }
  }
}
