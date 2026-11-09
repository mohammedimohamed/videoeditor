/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Scene Compiler & Timeline Generator (v2.1.0)
 * 
 * Compiles validated declarative scene direction specifications (JSON)
 * into deterministic, executable GSAP master timelines using CharacterController,
 * CharacterRig, ObjectController, EnvironmentTemplates, and authoritative IK solvers.
 * 
 * Milestone 3 Extensions:
 * 1. ObjectController instantiation for all props & interactive objects.
 * 2. Coordinated character-object interactions (pickUp, placeObject, attachTo, detachFrom).
 * 3. Object-only animation (moveTo, rotateTo, scaleTo, followPath, open, close, changeState).
 * 4. Hierarchical anchor resolution & dynamic socket tracking.
 * 5. Full backward compatibility with Milestone 2 specifications.
 */

import { CharacterRig } from '../rigging/character-rig.js';
import { CharacterController } from '../rigging/character-controller.js';
import { ObjectController } from './object-controller.js';
import { CameraController } from './camera-controller.js';
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
   * @returns {{ timeline: gsap.core.Timeline, tracer: ExecutionTracer, controllers: Map<string, CharacterController>, objects: Map<string, ObjectController>, validation: Object }}
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

    // Camera Rig & World Container Hierarchy (Transformed by CameraController)
    const cameraStage = document.createElement('div');
    cameraStage.id = 'camera-stage';
    cameraStage.style.position = 'absolute';
    cameraStage.style.inset = '0';
    cameraStage.style.overflow = 'hidden';
    cameraStage.style.pointerEvents = 'none';

    const cameraPivot = document.createElement('div');
    cameraPivot.id = 'camera-pivot';
    cameraPivot.style.position = 'absolute';
    cameraPivot.style.left = '540px';
    cameraPivot.style.top = '960px';
    cameraPivot.style.width = '0';
    cameraPivot.style.height = '0';
    cameraPivot.style.transformOrigin = '0 0';

    const cameraWorld = document.createElement('div');
    cameraWorld.id = 'camera-world';
    cameraWorld.style.position = 'absolute';
    cameraWorld.style.left = '-540px';
    cameraWorld.style.top = '-960px';
    cameraWorld.style.width = `${spec.metadata.resolution?.width || 1080}px`;
    cameraWorld.style.height = `${spec.metadata.resolution?.height || 1920}px`;
    cameraWorld.style.pointerEvents = 'auto';

    cameraPivot.appendChild(cameraWorld);
    cameraStage.appendChild(cameraPivot);
    rootEl.appendChild(cameraStage);

    // Screen-Space Overlay Container (Strictly immune to camera transforms)
    const screenOverlayLayer = document.createElement('div');
    screenOverlayLayer.id = 'screen-overlay-layer';
    screenOverlayLayer.style.position = 'absolute';
    screenOverlayLayer.style.inset = '0';
    screenOverlayLayer.style.pointerEvents = 'none';
    screenOverlayLayer.style.zIndex = '100';
    rootEl.appendChild(screenOverlayLayer);

    // Environment Layer (z-index 1 inside cameraWorld)
    const envLayer = document.createElement('div');
    envLayer.id = 'env-layer';
    envLayer.style.position = 'absolute';
    envLayer.style.inset = '0';
    envLayer.style.zIndex = '1';
    envLayer.innerHTML = getOfficeEnvironmentSVG();
    cameraWorld.appendChild(envLayer);

    // Desk Layer (z-index 3 inside cameraWorld) - Split desk from env so characters can sit behind it
    const deskLayer = document.createElement('div');
    deskLayer.id = 'desk-layer';
    deskLayer.style.position = 'absolute';
    deskLayer.style.inset = '0';
    deskLayer.style.pointerEvents = 'none';
    deskLayer.style.zIndex = '3';
    cameraWorld.appendChild(deskLayer);

    let deskSvg = null;
    const deskGroup = envLayer.querySelector('#office-desk');
    if (deskGroup) {
      deskSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      deskSvg.setAttribute("viewBox", "0 0 1080 1920");
      deskSvg.setAttribute("width", "1080");
      deskSvg.setAttribute("height", "1920");
      deskSvg.appendChild(deskGroup);
      deskLayer.appendChild(deskSvg);

      // Inject Document prop if not already in SVG
      if (!deskGroup.querySelector('#desk-document')) {
        const docGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        docGroup.setAttribute("id", "desk-document");
        docGroup.setAttribute("transform", "translate(340, 5)");
        docGroup.innerHTML = `
          <rect width="68" height="46" rx="4" fill="#FEF3C7" stroke="#1E293B" stroke-width="2.5"/>
          <line x1="8" y1="12" x2="60" y2="12" stroke="#D97706" stroke-width="2"/>
          <line x1="8" y1="22" x2="44" y2="22" stroke="#D97706" stroke-width="2"/>
          <line x1="8" y1="32" x2="52" y2="32" stroke="#D97706" stroke-width="2"/>
        `;
        deskGroup.appendChild(docGroup);
      }
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
      cameraWorld.appendChild(actorContainer);

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

      if (init.facing !== undefined) {
        let dir = 1;
        if (init.facing === -1 || init.facing === 'left' || init.facing === '3/4-left') dir = -1;
        ctrl.turnTo(dir, { duration: 0 });
      }

      if (init.expression) {
        ctrl.express(init.expression, { duration: 0 });
      }

      controllers.set(actorDef.id, ctrl);
    }

    // 4. Instantiate ObjectControllers for Props & Environmental Objects
    const objects = new Map();
    const objectSelectors = {
      desk: '#office-desk',
      laptop: '#desk-laptop, #office-laptop',
      mug: '#desk-mug, #office-coffee-mug',
      clock: '#wall-clock, #office-wall-clock',
      chair: '#office-chair',
      document: '#desk-document',
      doc_report: '#desk-document'
    };

    const allProps = [...(spec.props || []), ...(spec.objects || [])];
    for (const p of allProps) {
      const sel = objectSelectors[p.id] || objectSelectors[p.template] || `#${p.id}`;
      const el = rootEl.querySelector(sel);
      const isVisible = p.initialState?.visible !== false;
      const objCtrl = new ObjectController(el, {
        id: p.id,
        name: p.name || p.id,
        type: p.template || 'prop',
        parent: p.parent || null,
        initialState: p.initialState?.state || 'default',
        initialVisible: isVisible
      });

      if (p.initialState?.position) {
        objCtrl.setTransform({
          x: p.initialState.position.x,
          y: p.initialState.position.y,
          isWorld: true
        });
      }
      if (!isVisible) {
        objCtrl.setTransform({ opacity: 0 });
      }

      objects.set(p.id, objCtrl);
    }

    // Also register default environmental objects if not explicitly in props
    for (const [k, sel] of Object.entries(objectSelectors)) {
      if (!objects.has(k)) {
        const el = rootEl.querySelector(sel);
        if (el) {
          objects.set(k, new ObjectController(el, { id: k, name: k }));
        }
      }
    }

    // 5. Captions Overlay Container (z-index 10 inside screenOverlayLayer)
    const captionsContainer = document.createElement('div');
    captionsContainer.id = 'captions-container';
    captionsContainer.style.position = 'absolute';
    captionsContainer.style.bottom = '220px';
    captionsContainer.style.left = '80px';
    captionsContainer.style.right = '80px';
    captionsContainer.style.zIndex = '10';
    captionsContainer.style.display = 'flex';
    captionsContainer.style.flexDirection = 'column';
    captionsContainer.style.alignItems = 'center';
    captionsContainer.style.gap = '16px';
    captionsContainer.style.pointerEvents = 'none';
    screenOverlayLayer.appendChild(captionsContainer);

    // 6. Initialize Camera Controller
    const cameraConfig = spec.camera || {};
    const cameraCtrl = new CameraController(rootEl, {
      viewportWidth: spec.metadata.resolution?.width || 1080,
      viewportHeight: spec.metadata.resolution?.height || 1920,
      x: cameraConfig.initial?.position?.x !== undefined ? cameraConfig.initial.position.x : 540,
      y: cameraConfig.initial?.position?.y !== undefined ? cameraConfig.initial.position.y : 960,
      zoom: cameraConfig.initial?.zoom !== undefined ? cameraConfig.initial.zoom : 1.0,
      rotation: cameraConfig.initial?.rotation !== undefined ? cameraConfig.initial.rotation : 0,
      bounds: cameraConfig.bounds,
      safeArea: cameraConfig.safeArea
    });

    if (cameraConfig.initial?.target || cameraConfig.initial?.framing) {
      const framing = cameraCtrl.calculateFraming(
        cameraConfig.initial.target || 'stage',
        cameraConfig.initial.framing || 'medium',
        controllers,
        objects
      );
      cameraCtrl.state.x = framing.x;
      cameraCtrl.state.y = framing.y;
      cameraCtrl.state.zoom = framing.zoom;
      cameraCtrl.applyTransform();
    }

    // 7. Construct Master GSAP Timeline
    const masterTimeline = gsap.timeline({ paused: true });

    // Sort events by resolved start time
    const sortedEvents = [...spec.events].sort((a, b) => {
      const tA = validation.schedule.get(a.id)?.start || 0;
      const tB = validation.schedule.get(b.id)?.start || 0;
      return tA - tB;
    });

    // 7. Translate Instructions to GSAP
    for (const evt of sortedEvents) {
      const timing = validation.schedule.get(evt.id);
      if (!timing) continue;

      const atTime = timing.start;
      const duration = timing.duration;
      const params = evt.params || {};

      const ctrl = evt.actor ? controllers.get(evt.actor) : null;
      const objTargetId = evt.object || evt.prop || params.objectId || params.propId || params.object;
      const objCtrl = objTargetId ? objects.get(objTargetId) : null;

      let tweenCount = 1;

      switch (evt.action) {
        // --- Character Core Actions ---
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
            const resolved = resolveAnchor(targetRef, controllers, objects);
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
            targetCoord = resolveAnchor(params.target, controllers, objects);
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
            targetCoord = resolveAnchor(params.target, controllers, objects);
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
              targetEntity = resolveAnchor(params.target, controllers, objects);
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
            chairPos = resolveAnchor(params.chair, controllers, objects);
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

        // --- Milestone 3: Object Transform & State Actions ---
        case 'moveTo': {
          if (objCtrl) {
            objCtrl.moveTo({
              tl: masterTimeline,
              atTime,
              target: params.target,
              x: params.x,
              y: params.y,
              duration,
              ease: params.ease || "power2.inOut"
            });
          }
          break;
        }

        case 'rotateTo': {
          if (objCtrl) {
            objCtrl.rotateTo({
              tl: masterTimeline,
              atTime,
              rotation: params.rotation || 0,
              duration,
              ease: params.ease || "power2.out",
              transformOrigin: params.transformOrigin || "50% 50%"
            });
          }
          break;
        }

        case 'scaleTo': {
          if (objCtrl) {
            objCtrl.scaleTo({
              tl: masterTimeline,
              atTime,
              scaleX: params.scaleX !== undefined ? params.scaleX : (params.scale || 1),
              scaleY: params.scaleY !== undefined ? params.scaleY : (params.scale || 1),
              duration,
              ease: params.ease || "power2.out"
            });
          }
          break;
        }

        case 'followPath': {
          if (objCtrl) {
            objCtrl.followPath({
              tl: masterTimeline,
              atTime,
              path: params.path || [],
              duration,
              ease: params.ease || "power1.inOut"
            });
          }
          break;
        }

        case 'fadeIn': {
          if (objCtrl) objCtrl.fadeIn({ tl: masterTimeline, atTime, duration });
          break;
        }

        case 'fadeOut': {
          if (objCtrl) objCtrl.fadeOut({ tl: masterTimeline, atTime, duration });
          break;
        }

        case 'setTransform': {
          if (objCtrl) {
            objCtrl.setTransform({ ...params, tl: masterTimeline, atTime });
          }
          break;
        }

        case 'changeState': {
          if (objCtrl) {
            objCtrl.changeState({
              tl: masterTimeline,
              atTime,
              state: params.state || 'default',
              duration
            });
          }
          break;
        }

        case 'open': {
          if (objCtrl) objCtrl.open({ tl: masterTimeline, atTime, duration });
          break;
        }

        case 'close': {
          if (objCtrl) objCtrl.close({ tl: masterTimeline, atTime, duration });
          break;
        }

        // --- Milestone 3: Character-Object Coordinated Interactions ---
        case 'pickUp': {
          const actCtrl = controllers.get(evt.actor || params.actor);
          const oCtrl = objects.get(evt.object || params.object);

          if (actCtrl && oCtrl) {
            const socketName = `${oCtrl.id}.${params.socket || 'handle'}`;
            const targetPos = resolveAnchor(socketName, controllers, objects);

            // Sub-beat 1: Gaze convergence on object
            actCtrl.lookAt(targetPos, { tl: masterTimeline, atTime, duration: 0.35 });

            // Sub-beat 2: Physical reach to handle via analytical IK
            const reachDur = 0.5;
            actCtrl.reachTo(targetPos, {
              tl: masterTimeline,
              atTime: atTime + 0.1,
              duration: reachDur
            });

            // Sub-beat 3: Object attach & lift synchronously with forearm flexion
            const contactTime = atTime + 0.1 + reachDur;
            const liftDur = duration - (contactTime - atTime);
            oCtrl.attachTo(actCtrl, {
              tl: masterTimeline,
              atTime: contactTime,
              liftDelta: params.liftDelta || { x: -20, y: -65 },
              duration: Math.max(0.4, liftDur)
            });

            // Forearm flexes upward holding cup
            const p = actCtrl.rig.parts;
            masterTimeline.to(p.armL, {
              rotation: 120,
              duration: Math.max(0.4, liftDur),
              ease: "power2.out"
            }, contactTime);
            masterTimeline.to(p.forearmL, {
              rotation: -105,
              duration: Math.max(0.4, liftDur),
              ease: "power2.out"
            }, contactTime);
          }
          break;
        }

        case 'placeObject': {
          const actCtrl = controllers.get(evt.actor || params.actor);
          const oCtrl = objects.get(evt.object || params.object);

          if (actCtrl && oCtrl) {
            const placeTarget = params.placeAt || "desk.surface.rightArea";
            const destPos = resolveAnchor(placeTarget, controllers, objects);

            // Sub-beat 1: Lower arm towards surface
            const lowerDur = duration * 0.55;
            const p = actCtrl.rig.parts;
            masterTimeline.to(p.armL, {
              rotation: -28,
              duration: lowerDur,
              ease: "power2.inOut"
            }, atTime);
            masterTimeline.to(p.forearmL, {
              rotation: -45,
              duration: lowerDur,
              ease: "power2.inOut"
            }, atTime);

            // Sub-beat 2: Object lowers synchronously with arm to destination on desk
            const bottomOffset = oCtrl.definition?.localAnchors?.bottom || { x: 14, y: 34 };
            oCtrl.moveTo({
              tl: masterTimeline,
              atTime,
              x: destPos.x - bottomOffset.x,
              y: destPos.y - bottomOffset.y,
              duration: lowerDur,
              ease: "power2.inOut"
            });

            // Contact and detachment at landing
            const contactTime = atTime + lowerDur;
            oCtrl.detachFrom({
              tl: masterTimeline,
              atTime: contactTime,
              placeAt: placeTarget,
              duration: 0.05
            });

            // Sub-beat 3: Hand returns to natural rest pose
            const restDur = duration - lowerDur - 0.1;
            masterTimeline.to([p.armL, p.forearmL, p.handL], {
              rotation: 0,
              duration: Math.max(0.3, restDur),
              ease: "power2.out"
            }, contactTime + 0.15);
          }
          break;
        }

        case 'attachTo': {
          const actCtrl = controllers.get(params.actor || params.target);
          if (objCtrl && actCtrl) {
            objCtrl.attachTo(actCtrl, {
              tl: masterTimeline,
              atTime,
              socket: params.socket || 'palm',
              duration
            });
          }
          break;
        }

        case 'detachFrom': {
          if (objCtrl) {
            objCtrl.detachFrom({
              tl: masterTimeline,
              atTime,
              placeAt: params.placeAt,
              duration
            });
          }
          break;
        }

        // --- Prop & Scene Actions (Legacy Compatibility) ---
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
              const screenGroup = document.querySelector('#office-laptop');
              if (screenGroup) {
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
          captionDiv.style.maxWidth = '920px';
          captionDiv.style.opacity = '0';
          captionDiv.style.transform = 'translateY(16px)';
          captionDiv.style.position = 'relative';

          const speakerColor = (evt.actor === 'mohamed') ? '#34D399' : '#60A5FA';
          const speakerName = (evt.actor === 'mohamed') ? 'Mohamed' : 'Karim';

          captionDiv.innerHTML = `
            <span style="font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; color: ${speakerColor}">
              ${speakerName}
            </span>
            « ${params.text || ''} »
          `;

          captionsContainer.appendChild(captionDiv);

          masterTimeline.to(captionDiv, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out"
          }, atTime);

          masterTimeline.to(captionDiv, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: "power2.in"
          }, atTime + duration - 0.3);
          break;
        }

        // --- Camera & Cinematic Composition Actions (Milestone 4) ---
        case 'cameraSet': {
          cameraCtrl.cutTo({
            tl: masterTimeline,
            atTime,
            x: params.x,
            y: params.y,
            zoom: params.zoom,
            rotation: params.rotation
          });
          break;
        }

        case 'cameraMoveTo': {
          cameraCtrl.moveTo({
            tl: masterTimeline,
            atTime,
            duration,
            x: params.x,
            y: params.y,
            zoom: params.zoom,
            rotation: params.rotation,
            target: params.target || evt.target,
            framing: params.framing || evt.framing,
            ease: params.ease || evt.ease,
            controllers,
            objects
          });
          break;
        }

        case 'cameraPanTo': {
          cameraCtrl.moveTo({
            tl: masterTimeline,
            atTime,
            duration,
            x: params.x,
            y: params.y,
            target: params.target || evt.target,
            ease: params.ease || evt.ease,
            controllers,
            objects
          });
          break;
        }

        case 'cameraZoomTo': {
          cameraCtrl.moveTo({
            tl: masterTimeline,
            atTime,
            duration,
            zoom: params.zoom,
            target: params.target || evt.target,
            ease: params.ease || evt.ease,
            controllers,
            objects
          });
          break;
        }

        case 'cameraReset': {
          cameraCtrl.reset({
            tl: masterTimeline,
            atTime,
            duration,
            ease: params.ease || evt.ease
          });
          break;
        }

        case 'cameraFocus':
        case 'frameCharacter':
        case 'frameObject':
        case 'frameGroup':
        case 'frameInteraction': {
          const target = params.target || evt.target || params.actor || evt.actor || params.object || evt.object || params.targets || params.group;
          const framing = params.framing || evt.framing || (evt.action === 'frameObject' ? 'object-close-up' : (evt.action === 'frameGroup' ? 'two-shot' : (evt.action === 'frameInteraction' ? 'interaction' : 'medium')));
          cameraCtrl.focusOn({
            tl: masterTimeline,
            atTime,
            duration,
            target,
            framing,
            x: params.x,
            y: params.y,
            zoom: params.zoom,
            rotation: params.rotation,
            ease: params.ease || evt.ease,
            controllers,
            objects
          });
          break;
        }

        case 'cameraFollow':
        case 'cameraTrack': {
          const target = params.target || evt.target || params.actor || evt.actor;
          cameraCtrl.follow({
            tl: masterTimeline,
            atTime,
            duration,
            target,
            framing: params.framing || evt.framing || 'medium',
            toX: params.to !== undefined ? (typeof params.to === 'number' ? params.to : resolveAnchor(params.to, controllers, objects).x) : params.targetX,
            lookAhead: params.lookAhead,
            direction: params.direction,
            zoom: params.zoom,
            ease: params.ease || evt.ease,
            controllers,
            objects
          });
          break;
        }

        case 'cutTo': {
          const target = params.target || evt.target;
          cameraCtrl.cutTo({
            tl: masterTimeline,
            atTime,
            target,
            framing: params.framing || evt.framing,
            x: params.x,
            y: params.y,
            zoom: params.zoom,
            rotation: params.rotation,
            controllers,
            objects
          });
          break;
        }

        case 'dissolveTo':
        case 'zoomTransition':
        case 'panTransition': {
          const target = params.target || evt.target;
          const framing = params.framing || evt.framing || 'medium';
          cameraCtrl.moveTo({
            tl: masterTimeline,
            atTime,
            duration,
            target,
            framing,
            x: params.x,
            y: params.y,
            zoom: params.zoom,
            rotation: params.rotation,
            ease: params.ease || evt.ease || 'power2.inOut',
            controllers,
            objects
          });
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
    window.__compiledScene = {
      spec,
      controllers,
      objects,
      camera: cameraCtrl,
      timeline: masterTimeline,
      validation
    };

    return {
      timeline: masterTimeline,
      tracer,
      controllers,
      objects,
      camera: cameraCtrl,
      validation
    };
  }
}
