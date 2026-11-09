/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Scene Compiler & Timeline Generator
 * 
 * Compiles validated declarative scene direction specifications (JSON)
 * into deterministic, executable GSAP master timelines using the existing
 * CharacterController, CharacterRig, EnvironmentTemplates, and IK solver.
 * 
 * Guarantees:
 * 1. Zero scene-specific JavaScript written by the director.
 * 2. Automated actor, prop, and layer mounting.
 * 3. Dynamic and static anchor resolution.
 * 4. Multi-track concurrency without conflicting transform overwrites.
 * 5. Full execution tracing and reporting.
 */

import { CharacterRig } from '../rigging/character-rig.js';
import { CharacterController } from '../rigging/character-controller.js';
import { getEmployeeSVG, getMohamedSVG } from '../rigging/character-templates.js';
import { getOfficeEnvironmentSVG } from '../rigging/environment-templates.js';
import { setupSittingPose, animateFrustrationSequence } from '../rigging/behavior-library.js';
import { ASSET_REGISTRY, resolveAnchor } from './asset-registry.js';
import { SceneValidator } from './scene-validator.js';
import { ExecutionTracer } from './execution-tracer.js';

export class SceneCompiler {
  constructor(options = {}) {
    this.options = options;
    this.validator = new SceneValidator(options);
  }

  /**
   * Compile a declarative scene JSON specification into an executable GSAP timeline.
   * @param {Object} spec Scene specification
   * @param {Element|string} container Target DOM root element
   * @returns {{ timeline: gsap.core.Timeline, tracer: ExecutionTracer, controllers: Map<string, CharacterController>, validation: Object }}
   */
  compile(spec, container) {
    const rootEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (!rootEl) {
      throw new Error(`[SceneCompiler] Root container element not found: "${container}".`);
    }

    // 1. Validate Specification
    const validation = this.validator.validate(spec);
    if (!validation.valid && this.options.strict !== false) {
      const errList = validation.errors.map(e => ` - ${e}`).join('\n');
      throw new Error(`[SceneCompiler] Specification validation failed with ${validation.errors.length} error(s):\n${errList}`);
    }

    const tracer = new ExecutionTracer(spec);

    // 2. Clear & Prepare DOM Hierarchy
    rootEl.innerHTML = '';
    rootEl.style.position = 'relative';
    rootEl.style.width = `${spec.metadata.resolution?.width || 1080}px`;
    rootEl.style.height = `${spec.metadata.resolution?.height || 1920}px`;
    rootEl.style.overflow = 'hidden';

    // Environment Layer (z-index 1)
    const envLayer = document.createElement('div');
    envLayer.id = 'env-layer';
    envLayer.style.position = 'absolute';
    envLayer.style.inset = '0';
    envLayer.style.zIndex = '1';
    envLayer.innerHTML = getOfficeEnvironmentSVG();
    rootEl.appendChild(envLayer);

    // Desk Layer (z-index 3) - Split desk from env so characters can sit behind it
    const deskLayer = document.createElement('div');
    deskLayer.id = 'desk-layer';
    deskLayer.style.position = 'absolute';
    deskLayer.style.inset = '0';
    deskLayer.style.pointerEvents = 'none';
    deskLayer.style.zIndex = '3';
    rootEl.appendChild(deskLayer);

    const deskGroup = envLayer.querySelector('#office-desk');
    if (deskGroup) {
      const deskSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      deskSvg.setAttribute("viewBox", "0 0 1080 1920");
      deskSvg.setAttribute("width", "1080");
      deskSvg.setAttribute("height", "1920");
      deskSvg.appendChild(deskGroup);
      deskLayer.appendChild(deskSvg);
    }

    // 3. Mount Actors & Instantiate CharacterControllers
    const controllers = new Map();
    for (const actorDef of spec.actors) {
      const actorContainer = document.createElement('div');
      actorContainer.id = `actor-container-${actorDef.id}`;
      actorContainer.style.position = 'absolute';
      actorContainer.style.inset = '0';
      actorContainer.style.pointerEvents = 'none';

      // Layering: seated employees behind desk (z=2), standing visitors in front (z=4)
      const isSeated = actorDef.initialState?.pose === 'seated';
      actorContainer.style.zIndex = isSeated ? '2' : '4';
      rootEl.appendChild(actorContainer);

      // Render Template SVG
      const domId = `rig-${actorDef.id}`;
      if (actorDef.template === 'employee') {
        actorContainer.innerHTML = getEmployeeSVG(domId, { pose: actorDef.initialState?.pose || 'standing' });
      } else if (actorDef.template === 'mohamed') {
        const facing = actorDef.initialState?.facing || '3/4-left';
        actorContainer.innerHTML = getMohamedSVG(domId, { facing });
      } else {
        throw new Error(`[SceneCompiler] Unsupported actor template: "${actorDef.template}".`);
      }

      // Initialize CharacterController
      const ctrl = new CharacterController(`#${domId}`, {
        id: actorDef.id,
        name: actorDef.name || actorDef.id,
        type: actorDef.template,
        pose: actorDef.initialState?.pose || (isSeated ? 'seated' : 'standing'),
        nativeFacing: actorDef.template === 'mohamed' ? -1 : 1
      });

      // Apply Initial State
      const init = actorDef.initialState || {};
      if (init.pose === 'seated') {
        setupSittingPose(ctrl.rig, { x: 320, y: 1120 });
      } else {
        // Position
        let initX = 855;
        let initY = 1104;
        if (init.position) {
          if (typeof init.position === 'object') {
            initX = init.position.x;
            initY = init.position.y !== undefined ? init.position.y : 1104;
          } else if (typeof init.position === 'string') {
            const anchor = resolveAnchor(init.position, controllers);
            initX = anchor.x;
            initY = anchor.y;
          }
        }
        gsap.set(ctrl.rig.parts.characterGroup, {
          x: initX,
          y: initY,
          transformOrigin: "0 0"
        });
        ctrl.state.x = initX;
        ctrl.state.y = initY;
      }

      // Facing orientation
      if (init.facing !== undefined) {
        let dir = 1;
        if (init.facing === -1 || init.facing === 'left' || init.facing === '3/4-left') dir = -1;
        ctrl.turnTo(dir, { duration: 0 });
      }

      // Initial facial expression
      if (init.expression) {
        ctrl.express(init.expression, { duration: 0 });
      }

      controllers.set(actorDef.id, ctrl);
    }

    // 4. Captions Overlay Container (z-index 10)
    const captionsContainer = document.createElement('div');
    captionsContainer.id = 'captions-container';
    captionsContainer.style.position = 'absolute';
    captionsContainer.style.bottom = '80px';
    captionsContainer.style.left = '60px';
    captionsContainer.style.right = '60px';
    captionsContainer.style.zIndex = '10';
    captionsContainer.style.display = 'flex';
    captionsContainer.style.flexDirection = 'column';
    captionsContainer.style.alignItems = 'center';
    captionsContainer.style.gap = '16px';
    captionsContainer.style.pointerEvents = 'none';
    rootEl.appendChild(captionsContainer);

    // 5. Construct Master GSAP Timeline
    const masterTimeline = gsap.timeline({ paused: true });

    // Sort events by resolved start time
    const sortedEvents = [...spec.events].sort((a, b) => {
      const tA = validation.schedule.get(a.id)?.start || 0;
      const tB = validation.schedule.get(b.id)?.start || 0;
      return tA - tB;
    });

    // 6. Translate Instructions to GSAP
    for (const evt of sortedEvents) {
      const timing = validation.schedule.get(evt.id);
      if (!timing) continue;

      const atTime = timing.start;
      const duration = timing.duration;
      const params = evt.params || {};

      const ctrl = evt.actor ? controllers.get(evt.actor) : null;
      let tweenCount = 1;

      switch (evt.action) {
        case 'idle': {
          ctrl.idle({
            tl: masterTimeline,
            atTime,
            duration,
            breathing: params.breathing !== false,
            blinking: params.blinking !== false
          });
          break;
        }

        case 'walk': {
          let targetX = 855;
          const targetRef = params.to !== undefined ? params.to : params.targetX;
          if (typeof targetRef === 'number') {
            targetX = targetRef;
          } else {
            const resolved = resolveAnchor(targetRef, controllers);
            targetX = resolved.x;
            tracer.logAnchorResolution(targetRef, resolved);
          }

          ctrl.walkTo({
            tl: masterTimeline,
            atTime,
            targetX,
            startX: params.startX !== undefined ? params.startX : null,
            duration,
            mode: params.mode || 'foot-locked'
          });
          break;
        }

        case 'turn': {
          let dir = 1;
          if (params.direction === -1 || params.direction === 'left') dir = -1;
          ctrl.turnTo(dir, { tl: masterTimeline, atTime, duration });
          break;
        }

        case 'pointAt': {
          let targetCoord = { x: 525, y: 985 };
          if (params.target) {
            targetCoord = resolveAnchor(params.target, controllers);
            tracer.logAnchorResolution(params.target, targetCoord);
          }

          ctrl.pointAt(targetCoord, {
            tl: masterTimeline,
            atTime,
            duration: params.duration || 0.55,
            bendDirection: params.bendDirection || 'down'
          });
          break;
        }

        case 'reach': {
          let targetCoord = { x: 640, y: 1055 };
          if (params.target) {
            targetCoord = resolveAnchor(params.target, controllers);
            tracer.logAnchorResolution(params.target, targetCoord);
          }

          ctrl.reachTo(targetCoord, {
            tl: masterTimeline,
            atTime,
            duration: params.duration || 0.6,
            effector: params.effector || 'tip'
          });
          break;
        }

        case 'lookAt': {
          let targetEntity = { x: 540, y: 960 };
          if (params.target) {
            if (controllers.has(params.target)) {
              targetEntity = controllers.get(params.target);
            } else {
              targetEntity = resolveAnchor(params.target, controllers);
              tracer.logAnchorResolution(params.target, targetEntity);
            }
          }

          ctrl.lookAt(targetEntity, {
            tl: masterTimeline,
            atTime,
            duration: params.duration || 0.35,
            headFollow: params.headFollow !== false
          });
          break;
        }

        case 'express': {
          ctrl.express(params.emotion || 'neutral', {
            tl: masterTimeline,
            atTime,
            duration: params.duration || 0.3
          });
          break;
        }

        case 'speak': {
          ctrl.speak(params.text || '', {
            tl: masterTimeline,
            atTime,
            duration,
            gesture: params.gesture || null
          });
          break;
        }

        case 'listenTo': {
          const speakerCtrl = controllers.get(params.speaker);
          if (speakerCtrl) {
            ctrl.listenTo(speakerCtrl, {
              tl: masterTimeline,
              atTime,
              duration,
              responsiveNods: params.responsiveNods !== false
            });
          }
          break;
        }

        case 'gesture': {
          ctrl.gesture(params.name || 'explain', {
            tl: masterTimeline,
            atTime,
            duration
          });
          break;
        }

        case 'type': {
          ctrl.gesture('typing', {
            tl: masterTimeline,
            atTime,
            duration
          });
          break;
        }

        case 'frustrationSequence': {
          animateFrustrationSequence(masterTimeline, ctrl.rig, atTime);
          break;
        }

        case 'sitDown': {
          let chairPos = { x: 320, y: 1120 };
          if (params.chair) {
            chairPos = resolveAnchor(params.chair, controllers);
          }
          ctrl.sitDown({
            chairX: chairPos.x,
            chairY: chairPos.y,
            duration,
            tl: masterTimeline,
            atTime
          });
          break;
        }

        case 'standUp': {
          ctrl.standUp({
            duration,
            tl: masterTimeline,
            atTime
          });
          break;
        }

        case 'propAction': {
          const propId = evt.prop || params.propId || params.prop;
          const propAction = params.action || 'setState';

          if (propId === 'clock' && propAction === 'tick') {
            const secondHand = document.querySelector('#clock-second-hand');
            if (secondHand) {
              const ticks = Math.floor(duration);
              for (let s = 0; s < ticks; s++) {
                masterTimeline.to(secondHand, {
                  rotation: s * 18,
                  transformOrigin: "0 0",
                  duration: 0.1,
                  ease: "back.out(2)"
                }, atTime + s);
              }
            }
          } else if (propId === 'laptop') {
            if (propAction === 'scroll') {
              const rows = document.querySelector('#laptop-scrolling-rows');
              if (rows) {
                masterTimeline.to(rows, {
                  y: -24,
                  duration,
                  ease: "power1.inOut"
                }, atTime);
              }
            } else if (propAction === 'setState' && params.state === 'pivot-table') {
              // Transition laptop screen to Pivot Table solution
              const screenGroup = document.querySelector('#office-laptop');
              if (screenGroup) {
                // Subtle screen illumination pulse
                masterTimeline.to(screenGroup, {
                  filter: "drop-shadow(0 0 16px rgba(16, 124, 65, 0.45))",
                  duration: 0.4,
                  ease: "power2.out"
                }, atTime);
              }
            }
          }
          break;
        }

        case 'caption': {
          const captionDiv = document.createElement('div');
          captionDiv.id = `caption-${evt.id}`;
          captionDiv.className = 'dialogue-bubble';
          captionDiv.style.background = 'rgba(15, 23, 42, 0.92)';
          captionDiv.style.border = '2px solid #334155';
          captionDiv.style.backdropFilter = 'blur(8px)';
          captionDiv.style.padding = '18px 28px';
          captionDiv.style.borderRadius = '20px';
          captionDiv.style.color = '#FFFFFF';
          captionDiv.style.fontSize = '24px';
          captionDiv.style.fontWeight = '700';
          captionDiv.style.textAlign = 'center';
          captionDiv.style.boxShadow = '0 16px 36px rgba(0,0,0,0.35)';
          captionDiv.style.maxWidth = '900px';
          captionDiv.style.opacity = '0';
          captionDiv.style.transform = 'translateY(16px)';
          captionDiv.style.position = 'absolute';

          const speakerColor = (evt.actor === 'mohamed') ? '#34D399' : '#60A5FA';
          const speakerName = (evt.actor === 'mohamed') ? 'Mohamed' : 'Karim';

          captionDiv.innerHTML = `
            <span style="font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; color: ${speakerColor}">
              ${speakerName}
            </span>
            « ${params.text || ''} »
          `;

          captionsContainer.appendChild(captionDiv);

          // Animate caption in
          masterTimeline.to(captionDiv, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out"
          }, atTime);

          // Animate caption out at end of interval
          masterTimeline.to(captionDiv, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: "power2.in"
          }, atTime + duration - 0.3);
          break;
        }

        default:
          console.warn(`[SceneCompiler] Unhandled action: "${evt.action}".`);
      }

      tracer.logEventCompiled(evt, timing, tweenCount);
      if (evt.actor) {
        tracer.logConcurrencyAllocation(evt.actor, timing, timing.subsystems);
      }
    }

    // End-of-scene settle
    masterTimeline.to(rootEl, { duration: 0.05 }, spec.metadata.duration);

    // Register with HyperFrames and global namespaces
    window.__timelines = window.__timelines || {};
    window.__timelines[spec.metadata.id] = masterTimeline;
    window.__timelines['scene-player'] = masterTimeline;
    window.__sceneExecutionTracer = tracer;

    return {
      timeline: masterTimeline,
      tracer,
      controllers,
      validation
    };
  }
}
