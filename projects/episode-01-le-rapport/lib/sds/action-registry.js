/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Action Registry & Subsystem Definitions
 * 
 * Defines all declarative action capabilities supported by the animation system,
 * their parameter schemas, default behaviors, and subsystem resource locks.
 * 
 * Subsystem Locking Model:
 * Actions lock one or more character subsystems. Two actions requesting the
 * same subsystem at overlapping time intervals trigger a concurrency conflict
 * during validation. Non-overlapping subsystems (e.g., locomotion + gaze + speech)
 * run concurrently without collision.
 */

export const SUBSYSTEMS = {
  LOCOMOTION: 'locomotion',       // Root translation, hips, legs, feet
  ARM_NEAR: 'arm-near',           // Foreground arm, forearm, hand
  ARM_FAR: 'arm-far',             // Background arm, forearm, hand
  HEAD: 'head',                   // Head tilt and turn
  GAZE: 'gaze',                   // Eye pupil direction
  EXPRESSION: 'expression',       // Eyebrows and base facial emotion
  SPEECH: 'speech',               // Mouth viseme track and speech head cadence
  BREATHING: 'breathing',         // Secondary biological chest bounce
  BLINKING: 'blinking',           // Eyelid blink track
  PROP_STATE: 'prop-state',       // Environmental object state
  CAPTION: 'caption'              // Scene overlay dialogue bubble
};

export const ACTION_REGISTRY = {
  version: "2.0.0",

  actions: {
    // 1. Idle biological activity
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

    // 2. Grounded locomotion
    walk: {
      name: "walk",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Bipedal walk to an anchor or coordinate.",
      defaultParams: {
        to: null,
        mode: "foot-locked", // 'foot-locked' | 'basic'
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

    // 3. Facing orientation
    turn: {
      name: "turn",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.LOCOMOTION],
      description: "Turn character to face left or right.",
      defaultParams: {
        direction: "left", // 'left' | 'right' | -1 | 1
        duration: 0.3
      },
      validateParams(params) {
        if (!params.direction) return "turn requires 'direction'";
        return null;
      }
    },

    // 4. Pointing gesture (Orientation task)
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

    // 5. Reaching contact (Physical contact task)
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

    // 6. Gaze orientation
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

    // 7. Facial expression
    express: {
      name: "express",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.EXPRESSION],
      description: "Switch facial emotion and eyebrow posture.",
      defaultParams: {
        emotion: "neutral", // 'neutral'|'worried'|'happy'|'curious'|'confident'|'frustrated'|'surprised'
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

    // 8. Speech performance
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

    // 9. Active listening
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

    // 10. Named gesture
    gesture: {
      name: "gesture",
      targetType: "actor",
      subsystems: [SUBSYSTEMS.ARM_NEAR, SUBSYSTEMS.ARM_FAR],
      description: "Perform iconic stylized body gesture.",
      defaultParams: {
        name: "explain", // 'explain'|'wave'|'handToForehead'|'typing'|'shrug'
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

    // 11. Typing at desk
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

    // 12. Frustration sequence
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

    // 13. Seating actions
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

    // 14. Environmental prop actions
    propAction: {
      name: "propAction",
      targetType: "prop",
      subsystems: [SUBSYSTEMS.PROP_STATE],
      description: "Trigger prop state changes or procedural animations.",
      defaultParams: {
        propId: null,
        action: "setState", // 'setState' | 'scroll' | 'tick' | 'show' | 'hide'
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

    // 15. Subtitle caption overlay
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
