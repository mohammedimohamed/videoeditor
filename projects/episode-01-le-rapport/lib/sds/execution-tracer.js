/**
 * Mohamed Excel — Scene Direction System (SDS)
 * Execution Tracer & Reporting
 * 
 * Records compile-time translation decisions and runtime execution telemetry,
 * connecting every declarative scene instruction in JSON to its compiled GSAP
 * timeline slice, affected DOM elements, and execution status.
 */

export class ExecutionTracer {
  constructor(sceneSpec) {
    this.spec = sceneSpec;
    this.startTime = Date.now();
    this.entries = [];
    this.anchorResolutions = [];
    this.concurrencyAllocations = [];
    this.status = 'INITIALIZED';
  }

  logAnchorResolution(ref, resolved) {
    this.anchorResolutions.push({
      ref,
      resolved: { x: resolved.x, y: resolved.y },
      type: resolved.type,
      timestamp: Date.now() - this.startTime
    });
  }

  logEventCompiled(event, timing, tweenCount = 1) {
    this.entries.push({
      id: event.id,
      actor: event.actor || null,
      prop: event.prop || null,
      action: event.action,
      scheduled: {
        start: Number(timing.start.toFixed(3)),
        end: Number(timing.end.toFixed(3)),
        duration: Number(timing.duration.toFixed(3))
      },
      subsystems: timing.subsystems || [],
      params: event.params || {},
      status: 'COMPILED',
      tweenCount
    });
  }

  logConcurrencyAllocation(actorId, interval, subsystems) {
    this.concurrencyAllocations.push({
      actor: actorId,
      interval: [Number(interval.start.toFixed(2)), Number(interval.end.toFixed(2))],
      subsystems
    });
  }

  generateReport(validationResult, extraMetadata = {}) {
    return {
      version: "2.0.0",
      sceneId: this.spec.metadata.id,
      sceneTitle: this.spec.metadata.title,
      generatedAt: new Date().toISOString(),
      compilationTimeMs: Date.now() - this.startTime,
      summary: {
        totalEvents: this.spec.events.length,
        compiledEvents: this.entries.length,
        validationStatus: validationResult.valid ? "PASSED" : "FAILED",
        errorsCount: validationResult.errors.length,
        warningsCount: validationResult.warnings.length
      },
      validation: {
        valid: validationResult.valid,
        errors: validationResult.errors,
        warnings: validationResult.warnings
      },
      instructionsExecutionMap: this.entries,
      anchorResolutions: this.anchorResolutions,
      concurrencyAllocations: this.concurrencyAllocations,
      ...extraMetadata
    };
  }
}
