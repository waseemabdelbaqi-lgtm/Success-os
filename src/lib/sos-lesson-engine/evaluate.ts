import type { InteractiveQuestion } from "@/src/lib/sos-lesson-engine/schema/types";

export type EvalResult = {
  correct: boolean;
  feedbackAr: string;
  hintLevelUsed: 0 | 1 | 2;
};

function normalize(s: string): string {
  return s
    .trim()
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .replace(/\s+/g, " ")
    .replace(/[،,]/g, " ");
}

export function evaluateAnswer(
  question: InteractiveQuestion,
  rawAnswer: string,
  hintLevel: 0 | 1 | 2 = 0,
): EvalResult {
  const answer = normalize(rawAnswer);

  let correct = false;
  if (question.kind === "mcq" || question.kind === "true_false" || question.kind === "poll") {
    const idx = Number(answer);
    correct = idx === question.correctIndex;
  } else if (question.kind === "multi_response") {
    const selected = answer.split("|").map(Number).sort().join(",");
    const expected = (question.correctIndices || []).slice().sort().join(",");
    correct = selected === expected;
  } else if (question.kind === "ordering") {
    const got = answer.split("|").map(normalize);
    const exp = (question.correctOrder || []).map(normalize);
    correct = got.length === exp.length && got.every((v, i) => v === exp[i]);
  } else if (question.kind === "matching") {
    // format: left=right;left=right
    const pairs = question.pairs || [];
    const got = Object.fromEntries(
      answer.split(";").map((p) => {
        const [l, r] = p.split("=");
        return [normalize(l || ""), normalize(r || "")];
      }),
    );
    correct = pairs.every((p) => got[normalize(p.left)] === normalize(p.right));
  } else if (question.kind === "drag_drop") {
    correct = normalize(answer) === normalize(question.correctAnswer || "");
  } else if (question.kind === "number_line" || question.kind === "fill_blank" || question.kind === "write") {
    const accepted = [question.correctAnswer || "", ...(question.acceptedAnswers || [])].map(normalize);
    correct = accepted.includes(answer);
  } else {
    const accepted = [question.correctAnswer || "", ...(question.acceptedAnswers || [])].map(normalize);
    correct = accepted.includes(answer) || Number(answer) === question.correctIndex;
  }

  if (correct) {
    return { correct: true, feedbackAr: question.explanationAr, hintLevelUsed: hintLevel };
  }

  if (hintLevel < 1) {
    return {
      correct: false,
      feedbackAr: question.hint1Ar || "حاول مرة أخرى.",
      hintLevelUsed: 1,
    };
  }
  if (hintLevel < 2) {
    return {
      correct: false,
      feedbackAr: question.hint2Ar || question.commonErrorFeedbackAr || "راجع المثال المحلول ثم أعد المحاولة.",
      hintLevelUsed: 2,
    };
  }
  return {
    correct: false,
    feedbackAr:
      (question.commonErrorFeedbackAr ? question.commonErrorFeedbackAr + " " : "") + question.explanationAr,
    hintLevelUsed: 2,
  };
}

export function scorePercent(results: Array<{ correct: boolean; weight: number }>): number {
  const total = results.reduce((n, r) => n + r.weight, 0) || 1;
  const earned = results.reduce((n, r) => n + (r.correct ? r.weight : 0), 0);
  return Math.round((earned / total) * 100);
}

export function masteryLevel(percent: number): string {
  if (percent >= 90) return "متقن";
  if (percent >= 75) return "متمكن";
  if (percent >= 50) return "نامٍ";
  return "يحتاج دعم";
}
