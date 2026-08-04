/**
 * Human Teacher Engine
 *
 * World-class interactive teachers — Sara & Ali only.
 * Identity source: src/ai-teacher/teachers/{sara,ali}.ts via config.
 * Motion/speech substrate: lib/human-engine (preserved, elevated).
 */
export { teachHumanLesson, buildSessionBrief } from "./teach";
export { resolveStudioTheme, listStudioThemes } from "./studio-director";
export {
  expandBlocksForEndurance,
  resolveTargetDurationMs,
  segmentCountForDuration,
  enduranceQualityFloor,
  CYCLE_MS,
  CHUNK_MS,
} from "./endurance";
export { rebuildLipPerformance } from "./lip-performance";
export type {
  StudioTheme,
  StudioThemeId,
  HumanTeacherSessionBrief,
  HumanTeacherTeachResult,
  TeachHumanLessonOptions,
} from "./types";
