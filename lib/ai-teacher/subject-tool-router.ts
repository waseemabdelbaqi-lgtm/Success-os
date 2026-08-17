/**
 * subject-tool-router.ts
 *
 * One universal interface between the AI Teacher runtime and every
 * subject-specific engine. Sara and Ali are never coupled directly to
 * Physics (or any other subject) — they only know how to ask the router
 * for a tool by subject name and call an action on it.
 */

export interface SubjectToolResult {
  action: string;
  /** Structured, verified data returned by the underlying subject engine. */
  data: unknown;
  /** Free-form evidence trail (equation ids, assumptions, etc.) for the teacher to cite — never raw source/page references. */
  evidence: string[];
}

export interface SubjectTool {
  subject: string;
  /** Actions this tool supports, for introspection/validation. */
  actions: string[];
  call(action: string, params: Record<string, unknown>): SubjectToolResult;
}

const registry = new Map<string, SubjectTool>();

export function registerSubjectTool(tool: SubjectTool): void {
  registry.set(tool.subject, tool);
}

export function isSubjectRegistered(subject: string): boolean {
  return registry.has(subject);
}

/**
 * Returns the tool for a subject, or throws "NOT FOUND IN VERIFIED CONTENT"
 * — the same phrase the AI Teacher is instructed to say to a student when
 * it has no verified tool/evidence to draw on, so the failure mode is
 * consistent top to bottom rather than a generic 404.
 */
export function getSubjectTool(subject: string): SubjectTool {
  const tool = registry.get(subject);
  if (!tool) {
    throw new Error("NOT FOUND IN VERIFIED CONTENT");
  }
  return tool;
}

export function callSubjectTool(subject: string, action: string, params: Record<string, unknown>): SubjectToolResult {
  const tool = getSubjectTool(subject);
  if (!tool.actions.includes(action)) {
    throw new Error(`Subject tool router error: "${subject}" tool does not support action "${action}". Supported actions: [${tool.actions.join(", ")}].`);
  }
  return tool.call(action, params);
}

/** Test-only helper to reset the registry between test files. */
export function _clearRegistryForTests(): void {
  registry.clear();
}
