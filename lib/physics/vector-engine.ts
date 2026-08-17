/**
 * vector-engine.ts
 *
 * A real 2D vector implementation. Any arrow drawn in a diagram or
 * simulation must be generated from a Vector2D produced here — never a
 * decorative SVG arrow with an arbitrary length/angle.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export function vector(x: number, y: number): Vector2D {
  return { x, y };
}

export function fromMagnitudeAngle(magnitude: number, angleRadians: number): Vector2D {
  return { x: magnitude * Math.cos(angleRadians), y: magnitude * Math.sin(angleRadians) };
}

export function magnitude(v: Vector2D): number {
  return Math.hypot(v.x, v.y);
}

/** Direction in radians, measured counter-clockwise from +x axis, range (-π, π]. */
export function direction(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

export function directionDegrees(v: Vector2D): number {
  return (direction(v) * 180) / Math.PI;
}

export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vector2D, k: number): Vector2D {
  return { x: v.x * k, y: v.y * k };
}

export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

/** Scalar magnitude of the 2D "cross product" (z-component in 3D). */
export function cross2D(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

export function unitVector(v: Vector2D): Vector2D {
  const m = magnitude(v);
  if (m === 0) throw new Error("Vector engine error: cannot normalize the zero vector.");
  return { x: v.x / m, y: v.y / m };
}

export function isZeroVector(v: Vector2D, epsilon = 1e-9): boolean {
  return Math.abs(v.x) < epsilon && Math.abs(v.y) < epsilon;
}

export const UNIT_X: Vector2D = { x: 1, y: 0 };
export const UNIT_Y: Vector2D = { x: 0, y: 1 };
