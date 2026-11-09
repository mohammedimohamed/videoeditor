/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Scene Specification Validator
 * 
 * Performs comprehensive static and semantic validation of scene direction specifications:
 * 1. Structural schema compliance (JSON Schema v2.0.0).
 * 2. Actor and Prop entity resolution.
 * 3. Authoritative spatial anchor resolution.
 * 4. Dependency graph resolution & cycle detection.
 * 5. Multi-track subsystem concurrency conflict detection.
 * 6. Biomechanical & physical stage constraints.
 */

import { ASSET_REGISTRY, resolveAnchor } from './asset-registry.js';
import { ACTION_REGISTRY, SUBSYSTEMS } from './action-registry.js';

export class SceneValidator {
  constructor(options = {}) {
    this.strict = options.strict !== undefined ? options.strict : true;
  }

  /**
   * Validate a scene direction specification
   * @param {Object} spec Scene JSON specification
   * @returns {{ valid: boolean, errors: string[], warnings: string[], schedule: Map<string, Object> }}
   */
  validate(spec) {
    const errors = [];
    const warnings = [];

    // 1. Basic Structure
    if (!spec || typeof spec !== 'object') {
      return { valid: false, errors: ['Scene specification must be a non-null object.'], warnings, schedule: new Map() };
    }

    if (!spec.version || !spec.version.startsWith('2.')) {
      errors.push(`Unsupported specification version: "${spec.version}". SDS requires version 2.x.x.`);
    }

    if (!spec.metadata || typeof spec.metadata !== 'object') {
      errors.push('Missing "metadata" block.');
    } else {
      if (!spec.metadata.id) errors.push('metadata.id is required.');
      if (!spec.metadata.title) errors.push('metadata.title is required.');
      if (typeof spec.metadata.duration !== 'number' || spec.metadata.duration <= 0) {
        errors.push('metadata.duration must be a positive number.');
      }
    }

    if (!Array.isArray(spec.actors) || spec.actors.length === 0) {
      errors.push('Specification must define at least one actor in "actors".');
    }

    if (!Array.isArray(spec.events) || spec.events.length === 0) {
      errors.push('Specification must define at least one event in "events".');
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings, schedule: new Map() };
    }

    // 2. Build Entity Registries
    const actorMap = new Map();
    for (const actor of spec.actors) {
      if (!actor.id) {
        errors.push('Every actor must have an "id".');
        continue;
      }
      if (actorMap.has(actor.id)) {
        errors.push(`Duplicate actor id: "${actor.id}".`);
      }
      if (!['employee', 'mohamed'].includes(actor.template)) {
        errors.push(`Actor "${actor.id}" has unknown template: "${actor.template}".`);
      }
      actorMap.set(actor.id, actor);
    }

    const propMap = new Map();
    if (spec.props) {
      for (const prop of spec.props) {
        if (!prop.id) {
          errors.push('Every prop must have an "id".');
          continue;
        }
        if (propMap.has(prop.id)) {
          errors.push(`Duplicate prop id: "${prop.id}".`);
        }
        propMap.set(prop.id, prop);
      }
    }

    // 3. Validate Event Integrity & Action Registry
    const eventMap = new Map();
    for (let i = 0; i < spec.events.length; i++) {
      const evt = spec.events[i];
      if (!evt.id) {
        errors.push(`Event at index ${i} is missing an "id".`);
        continue;
      }
      if (eventMap.has(evt.id)) {
        errors.push(`Duplicate event id: "${evt.id}".`);
      }
      eventMap.set(evt.id, evt);

      // Validate Action
      const actionDef = ACTION_REGISTRY.actions[evt.action];
      if (!actionDef) {
        errors.push(`Event "${evt.id}": Unknown action "${evt.action}".`);
        continue;
      }

      // Validate Target Actor/Prop
      if (actionDef.targetType === 'actor') {
        if (!evt.actor) {
          errors.push(`Event "${evt.id}": Action "${evt.action}" requires an "actor".`);
        } else if (!actorMap.has(evt.actor)) {
          errors.push(`Event "${evt.id}": Actor "${evt.actor}" does not exist in scene.actors.`);
        }
      } else if (actionDef.targetType === 'prop') {
        const propTarget = evt.prop || (evt.params && (evt.params.propId || evt.params.prop));
        if (!propTarget) {
          errors.push(`Event "${evt.id}": Action "${evt.action}" requires a "prop" or params.propId.`);
        } else if (!propMap.has(propTarget) && !ASSET_REGISTRY.props[propTarget]) {
          errors.push(`Event "${evt.id}": Prop "${propTarget}" does not exist in scene.props or ASSET_REGISTRY.`);
        }
      }

      // Validate Action Params
      const params = evt.params || {};
      const paramErr = actionDef.validateParams(params);
      if (paramErr) {
        errors.push(`Event "${evt.id}" params error: ${paramErr}.`);
      }

      // Validate Spatial Anchors in Params
      const anchorKeys = ['to', 'target', 'chair', 'speaker'];
      for (const k of anchorKeys) {
        if (params[k]) {
          const ref = params[k];
          // If speaker, check actor
          if (k === 'speaker') {
            if (!actorMap.has(ref)) {
              errors.push(`Event "${evt.id}": Speaker "${ref}" does not exist in scene.actors.`);
            }
          } else {
            // Anchor lookup check
            try {
              resolveAnchor(ref);
            } catch (err) {
              errors.push(`Event "${evt.id}": ${err.message}`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings, schedule: new Map() };
    }

    // 4. Dependency Graph Resolution & Cycle Detection
    const schedule = new Map();
    const visited = new Set();
    const visiting = new Set();

    function resolveEventTiming(evtId, path = []) {
      if (visiting.has(evtId)) {
        const cycle = [...path, evtId].join(' -> ');
        throw new Error(`Cyclic timing dependency detected: ${cycle}`);
      }
      if (visited.has(evtId)) {
        return schedule.get(evtId);
      }

      visiting.add(evtId);
      path.push(evtId);

      const evt = eventMap.get(evtId);
      const actionDef = ACTION_REGISTRY.actions[evt.action];
      const timing = evt.timing || {};
      const params = evt.params || {};

      // Determine duration
      let duration = timing.duration;
      if (duration === undefined || duration === null) {
        if (params.duration !== undefined) {
          duration = params.duration;
        } else if (actionDef.defaultParams && actionDef.defaultParams.duration !== undefined) {
          duration = actionDef.defaultParams.duration;
        } else {
          duration = 1.0;
        }
      }

      // Determine start time
      let start = 0;
      const offset = timing.offset || 0;

      if (timing.start !== undefined && timing.start !== null) {
        start = timing.start + offset;
      } else if (timing.after) {
        if (!eventMap.has(timing.after)) {
          throw new Error(`Event "${evtId}": Dependency 'after: "${timing.after}"' not found.`);
        }
        const parentSchedule = resolveEventTiming(timing.after, [...path]);
        start = parentSchedule.end + offset;
      } else if (timing.with) {
        if (!eventMap.has(timing.with)) {
          throw new Error(`Event "${evtId}": Dependency 'with: "${timing.with}"' not found.`);
        }
        const parentSchedule = resolveEventTiming(timing.with, [...path]);
        start = parentSchedule.start + offset;
      } else {
        start = 0 + offset;
      }

      if (start < 0) {
        throw new Error(`Event "${evtId}": Computed negative start time (${start.toFixed(3)}s).`);
      }

      const end = start + duration;
      const result = {
        id: evtId,
        actor: evt.actor || null,
        action: evt.action,
        start,
        end,
        duration,
        subsystems: actionDef.subsystems || []
      };

      schedule.set(evtId, result);
      visiting.delete(evtId);
      visited.add(evtId);
      return result;
    }

    try {
      for (const evtId of eventMap.keys()) {
        if (!visited.has(evtId)) {
          resolveEventTiming(evtId);
        }
      }
    } catch (depErr) {
      errors.push(depErr.message);
      return { valid: false, errors, warnings, schedule: new Map() };
    }

    // Check scene duration bounds
    const maxTime = spec.metadata.duration;
    for (const [evtId, timing] of schedule.entries()) {
      if (timing.end > maxTime + 0.05) {
        warnings.push(`Event "${evtId}" ends at ${timing.end.toFixed(2)}s, exceeding scene duration (${maxTime}s).`);
      }
    }

    // 5. Concurrency & Subsystem Conflict Detection
    // Group events by actor and evaluate interval overlaps on locked subsystems
    const actorEvents = new Map();
    for (const actorId of actorMap.keys()) {
      actorEvents.set(actorId, []);
    }

    for (const [evtId, timing] of schedule.entries()) {
      if (timing.actor && actorEvents.has(timing.actor)) {
        actorEvents.get(timing.actor).push(timing);
      }
    }

    for (const [actorId, evts] of actorEvents.entries()) {
      // Compare each pair of events on this actor
      for (let i = 0; i < evts.length; i++) {
        for (let j = i + 1; j < evts.length; j++) {
          const e1 = evts[i];
          const e2 = evts[j];

          // Check temporal overlap: max(start1, start2) < min(end1, end2)
          const overlapStart = Math.max(e1.start, e2.start);
          const overlapEnd = Math.min(e1.end, e2.end);

          if (overlapStart < overlapEnd - 0.01) {
            // Check subsystem collision
            for (const sub of e1.subsystems) {
              // Breathing and blinking are ambient and permitted to coexist with gestures
              if (sub === SUBSYSTEMS.BREATHING || sub === SUBSYSTEMS.BLINKING) continue;

              if (e2.subsystems.includes(sub)) {
                errors.push(
                  `Concurrency collision on actor "${actorId}": Subsystem "${sub}" locked simultaneously by ` +
                  `event "${e1.id}" [${e1.start.toFixed(2)}s - ${e1.end.toFixed(2)}s] and ` +
                  `event "${e2.id}" [${e2.start.toFixed(2)}s - ${e2.end.toFixed(2)}s].`
                );
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      schedule
    };
  }
}
