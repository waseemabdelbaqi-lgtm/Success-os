import { resolveChat, parseJsonLoose } from "./base.js";

export const CLAUDE_CURRICULUM_AGENT = {
  id: "claude-curriculum",
  label: "Claude Curriculum Agent",
  responsibilities: [
    "Books",
    "Lessons",
    "Educational content",
    "Assessments",
    "Question banks",
    "Learning objectives",
  ],
};

export async function runClaudeCurriculumAgent(task) {
  const started = Date.now();
  const system = `You are the Success OS Claude Curriculum Agent.
Return JSON only: {"summary":"","learningObjectives":[],"lessonOutline":[],"assessmentIdeas":[],"rightsNotes":[],"nextSteps":[]}.
Never copy copyrighted textbook prose. Prefer original Success OS educational content aligned to official outcomes.`;
  const user = JSON.stringify({
    taskId: task.id,
    title: task.title,
    goal: task.goal,
    curriculumContext: task.context || {},
  });
  const chat = await resolveChat(["anthropic", "ollama-local"], { system, user });
  const data = parseJsonLoose(chat.text) || {
    summary: chat.text.slice(0, 800),
    learningObjectives: [],
    lessonOutline: [],
    assessmentIdeas: [],
    rightsNotes: ["Do not republish protected NCCD/MoE textbook content"],
    nextSteps: ["Add ANTHROPIC_API_KEY to activate Claude Curriculum Agent"],
  };
  return {
    agent: CLAUDE_CURRICULUM_AGENT.id,
    provider: chat.provider,
    model: chat.model,
    durationMs: Date.now() - started,
    stub: Boolean(chat.stub),
    output: data,
    tried: chat.tried,
  };
}
