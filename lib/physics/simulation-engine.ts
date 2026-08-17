/**
 * simulation-engine.ts
 *
 * A minimal, generic simulation state machine. Every simulation (starting
 * with projectile motion) shares one play/pause/reset/step contract and
 * pulls its calculations from the scientific core — never a separate
 * hardcoded animation loop.
 */

import { type ProjectileParams, type ProjectileState, type ProjectileSummary, stateAtTime, summarize, timeOfFlight } from "./projectile-motion.ts";

export interface SimulationController<TParams, TState> {
  getParams: () => TParams;
  setParams: (next: Partial<TParams>) => void;
  reset: () => void;
  /** Advances simulated time by dtSeconds (real time, not accelerated). */
  step: (dtSeconds: number) => TState;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  getState: () => TState;
  getElapsedTime: () => number;
  getDuration: () => number;
}

export interface ProjectileSimulationState extends ProjectileState {
  summary: ProjectileSummary;
  isComplete: boolean;
}

/**
 * Creates a controllable projectile-motion simulation. `onUpdate` is
 * invoked with the freshly computed state after every step/reset/param
 * change, so a UI layer can subscribe without duplicating any physics.
 */
export function createProjectileSimulation(
  initialParams: ProjectileParams,
  onUpdate?: (state: ProjectileSimulationState) => void
): SimulationController<ProjectileParams, ProjectileSimulationState> {
  let params: ProjectileParams = { ...initialParams };
  let elapsed = 0;
  let playing = false;
  let duration = timeOfFlight(params);

  function computeState(): ProjectileSimulationState {
    const clampedT = Math.min(elapsed, duration);
    const kinematic = stateAtTime(params, clampedT);
    const summary = summarize(params);
    const state: ProjectileSimulationState = { ...kinematic, summary, isComplete: clampedT >= duration };
    onUpdate?.(state);
    return state;
  }

  let current = computeState();

  return {
    getParams: () => ({ ...params }),
    setParams: (next) => {
      params = { ...params, ...next };
      duration = timeOfFlight(params);
      elapsed = Math.min(elapsed, duration);
      current = computeState();
    },
    reset: () => {
      elapsed = 0;
      playing = false;
      current = computeState();
    },
    step: (dtSeconds: number) => {
      if (dtSeconds < 0) throw new Error("Simulation engine error: time step cannot be negative.");
      elapsed = Math.min(elapsed + dtSeconds, duration);
      if (elapsed >= duration) playing = false;
      current = computeState();
      return current;
    },
    play: () => {
      playing = true;
    },
    pause: () => {
      playing = false;
    },
    isPlaying: () => playing,
    getState: () => current,
    getElapsedTime: () => elapsed,
    getDuration: () => duration,
  };
}
