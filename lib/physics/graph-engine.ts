/**
 * graph-engine.ts
 *
 * Produces physics-aware graph descriptors (not generic charting data).
 * Every graph knows what its slope and area mean physically, and rejects
 * series data that is missing labels/units or has an invalid domain.
 */

export interface GraphSeriesPoint {
  x: number;
  y: number;
}

export interface GraphAxis {
  variableName: string;
  unit: string;
  label: string;
}

export type SlopeMeaning = "velocity" | "acceleration" | "none";
export type AreaMeaning = "displacement" | "work" | "energy" | "charge" | "none";

export interface PhysicsGraphDescriptor {
  id: string;
  title: string;
  xAxis: GraphAxis;
  yAxis: GraphAxis;
  data: GraphSeriesPoint[];
  slopeMeaning: SlopeMeaning;
  areaMeaning: AreaMeaning;
  domain: [number, number];
  range: [number, number];
  dataSource: string;
}

export interface BuildGraphInput {
  id: string;
  title: string;
  xAxis: GraphAxis;
  yAxis: GraphAxis;
  data: GraphSeriesPoint[];
  slopeMeaning: SlopeMeaning;
  areaMeaning: AreaMeaning;
  dataSource: string;
}

/**
 * Known physical slope/area relationships, used to auto-populate
 * slopeMeaning/areaMeaning for standard kinematics graphs and to catch a
 * mismatched label (e.g. calling a velocity-time slope "displacement").
 */
export const KNOWN_GRAPH_RELATIONSHIPS: Record<string, { slope: SlopeMeaning; area: AreaMeaning }> = {
  "position-time": { slope: "velocity", area: "none" },
  "velocity-time": { slope: "acceleration", area: "displacement" },
  "force-displacement": { slope: "none", area: "work" },
  "power-time": { slope: "none", area: "energy" },
  "current-time": { slope: "none", area: "charge" },
};

export function buildGraph(input: BuildGraphInput): PhysicsGraphDescriptor {
  if (!input.xAxis.label || !input.xAxis.unit) {
    throw new Error(`Graph engine error: graph "${input.id}" is missing an x-axis label or unit.`);
  }
  if (!input.yAxis.label || !input.yAxis.unit) {
    throw new Error(`Graph engine error: graph "${input.id}" is missing a y-axis label or unit.`);
  }
  if (!input.data.length) {
    throw new Error(`Graph engine error: graph "${input.id}" has no data points.`);
  }
  const xs = input.data.map((p) => p.x);
  const ys = input.data.map((p) => p.y);
  const domain: [number, number] = [Math.min(...xs), Math.max(...xs)];
  const range: [number, number] = [Math.min(...ys), Math.max(...ys)];
  if (domain[0] === domain[1]) {
    throw new Error(`Graph engine error: graph "${input.id}" has a degenerate (zero-width) domain.`);
  }
  return {
    id: input.id,
    title: input.title,
    xAxis: input.xAxis,
    yAxis: input.yAxis,
    data: input.data,
    slopeMeaning: input.slopeMeaning,
    areaMeaning: input.areaMeaning,
    domain,
    range,
    dataSource: input.dataSource,
  };
}

/** Numerical slope between two adjacent samples — used for on-graph readouts, not decoration. */
export function localSlope(a: GraphSeriesPoint, b: GraphSeriesPoint): number {
  if (a.x === b.x) throw new Error("Graph engine error: cannot compute slope between two points with identical x values.");
  return (b.y - a.y) / (b.x - a.x);
}

/** Trapezoidal-rule area under a series — used for "area = displacement/work/energy" readouts. */
export function areaUnderCurve(data: GraphSeriesPoint[]): number {
  if (data.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < data.length; i++) {
    // Safe: loop bound (1 <= i < data.length) guarantees both indices exist.
    const current = data[i]!;
    const previous = data[i - 1]!;
    const dx = current.x - previous.x;
    total += ((current.y + previous.y) / 2) * dx;
  }
  return total;
}
