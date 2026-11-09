/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Action Registry & Subsystem Definitions (v2.1.0)
 * 
 * Defines all declarative action capabilities supported by the animation system,
 * their parameter schemas, default behaviors, and subsystem resource locks.
 * 
 * Subsystem Locking Model:
 * Actions lock one or more character or object subsystems. Two actions requesting
 * the same subsystem on the same entity at overlapping time intervals trigger
 * a concurrency conflict during validation. Non-overlapping subsystems
 * (e.g., locomotion + gaze + speech, or character movement + independent object animation)
 * run concurrently without collision.
 */

export const SUBSYSTEMS = {
  // Character Subsystems
  LOCOMOTION: 'locomotion',       // Root translation, hips, legs, feet
  ARM_NEAR: 'arm-near',           // Foreground arm, forearm, hand
  ARM_FAR: 'arm-far',             // Background arm, forearm, hand
  HEAD: 'head',                   // Head tilt and turn
  GAZE: 'gaze',                   // Eye pupil direction
  EXPRESSION: 'expression',       // Eyebrows and base facial emotion
  SPEECH: 'speech',               // Mouth viseme track and speech head cadence
  BREATHING: 'breathing',         // Secondary biological chest bounce
  BLINKING: 'blinking',           // Eyelid blink track

  // Object & Prop Subsystems
  PROP_STATE: 'prop-state',       // Environmental object state
  OBJECT_TRANSFORM: 'object-transform',   // Translation, rotation, scale, path
  OBJECT_ATTACHMENT: 'object-attachment', // Holding / parent attachment state
  OBJECT_VISIBILITY: 'object-visibility', // Opacity fade in/out
  
  // Scene Subsystems
  CAPTION: 'caption'              // Scene overlay dialogue bubble
};

export const ACTION_REGISTRY = {
  version: "2.1.0",

  actions: {
    // -------------------------------------------------------------
    // 1. CHARACTER CORE ACTIONS
    // -------------------------------------------------------------

    // Idle biological activity
    idle: {
      name: "idle",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.BREATHING, SUBSYSTEMS.BLINKING],
      description: "Natural biological breathing and periodic blinking.",
      defaultParams: {
        duration: 4.0,
        breathing: true,
        blinking: true
      },
      validateParams(params) {
        if (params.duration !== undefined && (typeof params.duration !== 'number' || params.duration <= 0)) {
          return "duration must be a positive number";
        }
        return null;
      }
    },

    // Grounded locomotion
    walk: {
      name: "walk",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Bipedal walk to an anchor or coordinate.",
      defaultParams: {
        to: null,
        mode: "foot-locked",
        duration: null,
        speed: 135
      },
      validateParams(params) {
        if (!params.to && params.targetX === undefined) {
          return "walk requires 'to' (anchor name, coordinate, or number)";
        }
        if (params.mode && !['basic', 'foot-locked'].includes(params.mode)) {
          return "walk mode must be 'basic' or 'foot-locked'";
        }
        return null;
      }
    },

    // Facing orientation
    turn: {
      name: "turn",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Turn character to face left or right.",
      defaultParams: {
        direction: "left",
        duration: 0.3
      },
      validateParams(params) {
        if (!params.direction) return "turn requires 'direction'";
        return null;
      }
    },

    // Pointing gesture
    pointAt: {
      name: "pointAt",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR],
      description: "Orient index finger along line of sight towards target using pointing ray solver.",
      defaultParams: {
        target: null,
        arm: "near",
        duration: 0.55,
        holdDuration: 1.0,
        bendDirection: "down"
      },
      validateParams(params) {
        if (!params.target) return "pointAt requires 'target' (anchor name or coordinate)";
        return null;
      }
    },

    // Reaching contact
    reach: {
      name: "reach",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR],
      description: "Attempt physical contact with target object using 2-bone IK (arm limit: 240px).",
      defaultParams: {
        target: null,
        arm: "near",
        duration: 0.6,
        holdDuration: 0.5,
        effector: "tip"
      },
      validateParams(params) {
        if (!params.target) return "reach requires 'target' (anchor name or coordinate)";
        return null;
      }
    },

    // Gaze orientation
    lookAt: {
      name: "lookAt",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.GAZE, SUBSYSTEMS.HEAD],
      description: "Direct character gaze and subtle head tilt towards target.",
      defaultParams: {
        target: null,
        duration: 0.35,
        headFollow: true
      },
      validateParams(params) {
        if (!params.target) return "lookAt requires 'target' (actor ID, anchor name, or coordinate)";
        return null;
      }
    },

    // Facial expression
    express: {
      name: "express",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.EXPRESSION],
      description: "Switch facial emotion and eyebrow posture.",
      defaultParams: {
        emotion: "neutral",
        duration: 0.3
      },
      validateParams(params) {
        const allowed = ['neutral', 'worried', 'happy', 'curious', 'confident', 'frustrated', 'surprised'];
        if (!params.emotion || !allowed.includes(params.emotion)) {
          return `express emotion must be one of: [${allowed.join(', ')}]`;
        }
        return null;
      }
    },

    // Speech performance
    speak: {
      name: "speak",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.SPEECH, SUBSYSTEMS.HEAD],
      description: "Dialogue delivery with synchronized mouth visemes and head cadence nods.",
      defaultParams: {
        text: "",
        duration: 2.0,
        gesture: null
      },
      validateParams(params) {
        if (!params.text && typeof params.text !== 'string') return "speak requires 'text'";
        if (params.duration !== undefined && params.duration <= 0) return "speak duration must be positive";
        return null;
      }
    },

    // Active listening
    listenTo: {
      name: "listenTo",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.GAZE, SUBSYSTEMS.HEAD, SUBSYSTEMS.EXPRESSION],
      description: "Attentive posture, gaze tracking speaker, and comprehension nods.",
      defaultParams: {
        speaker: null,
        duration: 2.0,
        responsiveNods: true
      },
      validateParams(params) {
        if (!params.speaker) return "listenTo requires 'speaker' (actor ID)";
        return null;
      }
    },

    // Named gesture
    gesture: {
      name: "gesture",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR, SUBSYSTEMS.ARM_FAR],
      description: "Perform iconic stylized body gesture.",
      defaultParams: {
        name: "explain",
        duration: 1.0
      },
      validateParams(params) {
        const allowed = ['explain', 'wave', 'handToForehead', 'typing', 'shrug', 'welcome'];
        if (!params.name || !allowed.includes(params.name)) {
          return `gesture name must be one of: [${allowed.join(', ')}]`;
        }
        return null;
      }
    },

    // Typing at desk
    type: {
      name: "type",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR, SUBSYSTEMS.ARM_FAR],
      description: "Hands micro-typing over keyboard anchor.",
      defaultParams: {
        target: "laptop.keyboard",
        duration: 1.2
      },
      validateParams(params) {
        return null;
      }
    },

    // Frustration sequence
    frustrationSequence: {
      name: "frustrationSequence",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR, SUBSYSTEMS.ARM_FAR, SUBSYSTEMS.HEAD, SUBSYSTEMS.EXPRESSION],
      description: "6-beat emotional progression: typing -> worry -> pause -> hand to temple -> slump.",
      defaultParams: {
        duration: 2.8
      },
      validateParams(params) {
        return null;
      }
    },

    // Seating actions
    sitDown: {
      name: "sitDown",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Transition character into seated pose at chair anchor.",
      defaultParams: {
        chair: "chair.seat",
        duration: 0.8
      },
      validateParams(params) {
        return null;
      }
    },

    standUp: {
      name: "standUp",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Transition character from seated to standing pose.",
      defaultParams: {
        duration: 0.8
      },
      validateParams(params) {
        return null;
      }
    },

    // -------------------------------------------------------------
    // 2. OBJECT MANIPULATION & INTERACTION ACTIONS (MILESTONE 3)
    // -------------------------------------------------------------

    // Object translation
    moveTo: {
      name: "moveTo",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Translate object to a target anchor or coordinate.",
      defaultParams: {
        target: null,
        duration: 0.8,
        ease: "power2.inOut"
      },
      validateParams(params) {
        if (!params.target && params.x === undefined && params.y === undefined) {
          return "moveTo requires 'target' (anchor name) or 'x' and 'y'";
        }
        return null;
      }
    },

    // Object rotation
    rotateTo: {
      name: "rotateTo",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Rotate object around its pivot.",
      defaultParams: {
        rotation: 0,
        duration: 0.5,
        ease: "power2.out",
        transformOrigin: "50% 50%"
      },
      validateParams(params) {
        if (params.rotation === undefined) return "rotateTo requires 'rotation' in degrees";
        return null;
      }
    },

    // Object scaling
    scaleTo: {
      name: "scaleTo",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Scale object size along X and Y axes.",
      defaultParams: {
        scaleX: 1.0,
        scaleY: null,
        duration: 0.5,
        ease: "power2.out"
      },
      validateParams(params) {
        if (params.scaleX === undefined && params.scale === undefined) return "scaleTo requires 'scaleX' or 'scale'";
        return null;
      }
    },

    // Object curved path trajectory
    followPath: {
      name: "followPath",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Move object along a sequence of 2D waypoints or curved path.",
      defaultParams: {
        path: [],
        duration: 1.2,
        ease: "power1.inOut"
      },
      validateParams(params) {
        if (!Array.isArray(params.path) || params.path.length < 2) {
          return "followPath requires 'path' array with at least 2 points";
        }
        return null;
      }
    },

    // Instant transform pose
    setTransform: {
      name: "setTransform",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Instantaneously set object position, rotation or scale.",
      defaultParams: {},
      validateParams(params) {
        return null;
      }
    },

    // Visibility actions
    fadeIn: {
      name: "fadeIn",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_VISIBILITY],
      description: "Fade in object opacity to 1.",
      defaultParams: { duration: 0.4 },
      validateParams() { return null; }
    },

    fadeOut: {
      name: "fadeOut",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_VISIBILITY],
      description: "Fade out object opacity to 0.",
      defaultParams: { duration: 0.4 },
      validateParams() { return null; }
    },

    // Object State Actions
    changeState: {
      name: "changeState",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_STATE],
      description: "Change visual state of an object (e.g. pivot-table, error-highlight).",
      defaultParams: {
        state: "default",
        duration: 0.3
      },
      validateParams(params) {
        if (!params.state) return "changeState requires 'state'";
        return null;
      }
    },

    open: {
      name: "open",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM, SUBSYSTEMS.OBJECT_STATE],
      description: "Open an object (e.g. laptop lid, folder).",
      defaultParams: { duration: 0.5 },
      validateParams() { return null; }
    },

    close: {
      name: "close",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_TRANSFORM, SUBSYSTEMS.OBJECT_STATE],
      description: "Close an object (e.g. laptop lid, folder).",
      defaultParams: { duration: 0.5 },
      validateParams() { return null; }
    },

    // Coordinated Character-Object Pick-Up Interaction
    pickUp: {
      name: "pickUp",
      targetType: "interaction",
      actorSubsystems: [SUBSYSTEMS.ARM_NEAR, SUBSYSTEMS.GAZE],
      objectSubsystems: [SUBSYSTEMS.OBJECT_ATTACHMENT, SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Coordinated interaction: Character looks at object, reaches via 2-bone IK, contacts socket, attaches object, and lifts.",
      defaultParams: {
        actor: null,
        object: null,
        socket: "handle",
        liftDelta: { x: 0, y: -45 },
        duration: 1.4
      },
      validateParams(params) {
        if (!params.actor) return "pickUp requires 'actor'";
        if (!params.object) return "pickUp requires 'object'";
        return null;
      }
    },

    // Coordinated Character-Object Place Interaction
    placeObject: {
      name: "placeObject",
      targetType: "interaction",
      actorSubsystems: [SUBSYSTEMS.ARM_NEAR],
      objectSubsystems: [SUBSYSTEMS.OBJECT_ATTACHMENT, SUBSYSTEMS.OBJECT_TRANSFORM],
      description: "Coordinated interaction: Character lowers held object, places it stably on destination surface, detaches, and arm rests.",
      defaultParams: {
        actor: null,
        object: null,
        placeAt: "desk.surface",
        duration: 1.2
      },
      validateParams(params) {
        if (!params.actor) return "placeObject requires 'actor'";
        if (!params.object) return "placeObject requires 'object'";
        return null;
      }
    },

    // Low-level attachment
    attachTo: {
      name: "attachTo",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_ATTACHMENT],
      description: "Attach object to an actor socket with relative transform lock.",
      defaultParams: {
        actor: null,
        socket: "palm",
        duration: 0.4
      },
      validateParams(params) {
        if (!params.actor && !params.target) return "attachTo requires 'actor' or 'target'";
        return null;
      }
    },

    detachFrom: {
      name: "detachFrom",
      targetType: "object",
      subsystems: [SUBSYSTEMS.OBJECT_ATTACHMENT],
      description: "Detach object from current holder, preserving world position or placing at anchor.",
      defaultParams: {
        placeAt: null,
        duration: 0.4
      },
      validateParams() { return null; }
    },

    // Environmental prop actions (Legacy compatibility)
    propAction: {
      name: "propAction",
      targetType: "prop",
      subsystems: [SUBSYSTEMS.PROP_STATE],
      description: "Trigger prop state changes or procedural animations.",
      defaultParams: {
        propId: null,
        action: "setState",
        state: null,
        duration: 1.0,
        value: null
      },
      validateParams(params) {
        if (!params.propId && !params.prop) return "propAction requires 'propId'";
        if (!params.action) return "propAction requires 'action'";
        return null;
      }
    },

    // Subtitle caption overlay
    caption: {
      name: "caption",
      targetType: "scene",
      subsystems: [SUBSYSTEMS.CAPTION],
      description: "Display speech subtitle bubble with character tag.",
      defaultParams: {
        speaker: null,
        text: "",
        duration: 2.5
      },
      validateParams(params) {
        if (!params.text) return "caption requires 'text'";
        return null;
      }
    }
  }
};
