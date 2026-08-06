/**
 * Lightweight Behaviour Tree runtime for Teacher Mind.
 * Nodes: selector / sequence / condition / action — no ad-hoc if/else chains in callers.
 */
import type { BtNode, BtStatus, TeacherBlackboard } from "@/types/teacher-mind";

export type BtActionFn = (bb: TeacherBlackboard) => BtStatus;
export type BtConditionFn = (bb: TeacherBlackboard) => boolean;

export type BtRegistry = {
  conditions: Record<string, BtConditionFn>;
  actions: Record<string, BtActionFn>;
};

export function tickBehaviourTree(
  root: BtNode,
  bb: TeacherBlackboard,
  registry: BtRegistry,
): BtStatus {
  return tickNode(root, bb, registry);
}

function tickNode(node: BtNode, bb: TeacherBlackboard, reg: BtRegistry): BtStatus {
  switch (node.type) {
    case "selector": {
      for (const child of node.children || []) {
        const s = tickNode(child, bb, reg);
        if (s === "success" || s === "running") return s;
      }
      return "failure";
    }
    case "sequence": {
      for (const child of node.children || []) {
        const s = tickNode(child, bb, reg);
        if (s !== "success") return s;
      }
      return "success";
    }
    case "condition": {
      const fn = node.op ? reg.conditions[node.op] : undefined;
      if (!fn) return "failure";
      return fn(bb) ? "success" : "failure";
    }
    case "action": {
      const fn = node.op ? reg.actions[node.op] : undefined;
      if (!fn) return "failure";
      return fn(bb);
    }
    default:
      return "failure";
  }
}

/** Standard teacher BT: handle events first, else continue lesson flow. */
export function buildTeacherBehaviourTree(): BtNode {
  return {
    id: "teacher_root",
    type: "selector",
    children: [
      {
        id: "handle_events",
        type: "selector",
        children: [
          {
            id: "on_confused",
            type: "sequence",
            children: [
              { id: "c_confused", type: "condition", op: "hasConfusedEvent" },
              { id: "a_remediate", type: "action", op: "decideRemediate" },
            ],
          },
          {
            id: "on_ask",
            type: "sequence",
            children: [
              { id: "c_ask", type: "condition", op: "hasAskEvent" },
              { id: "a_answer", type: "action", op: "decideAnswerQuestion" },
            ],
          },
          {
            id: "on_wrong",
            type: "sequence",
            children: [
              { id: "c_wrong", type: "condition", op: "hasWrongAnswer" },
              { id: "a_remediate_wrong", type: "action", op: "decideRemediate" },
            ],
          },
          {
            id: "on_correct",
            type: "sequence",
            children: [
              { id: "c_ok", type: "condition", op: "hasCorrectAnswer" },
              { id: "a_encourage", type: "action", op: "decideEncourage" },
            ],
          },
          {
            id: "on_simpler",
            type: "sequence",
            children: [
              { id: "c_simpler", type: "condition", op: "hasSimplerRequest" },
              { id: "a_remediate2", type: "action", op: "decideRemediate" },
            ],
          },
          {
            id: "on_example",
            type: "sequence",
            children: [
              { id: "c_ex", type: "condition", op: "hasExampleRequest" },
              { id: "a_example", type: "action", op: "decideExample" },
            ],
          },
        ],
      },
      {
        id: "lesson_flow",
        type: "selector",
        children: [
          {
            id: "early_hook",
            type: "sequence",
            children: [
              { id: "c_early", type: "condition", op: "isEarlyLesson" },
              { id: "a_hook", type: "action", op: "decideHook" },
            ],
          },
          {
            id: "need_check",
            type: "sequence",
            children: [
              { id: "c_check", type: "condition", op: "shouldCheckUnderstanding" },
              { id: "a_check", type: "action", op: "decideCheck" },
            ],
          },
          {
            id: "closing",
            type: "sequence",
            children: [
              { id: "c_late", type: "condition", op: "isLateLesson" },
              { id: "a_close", type: "action", op: "decideClose" },
            ],
          },
          { id: "a_explain", type: "action", op: "decideExplain" },
        ],
      },
    ],
  };
}
