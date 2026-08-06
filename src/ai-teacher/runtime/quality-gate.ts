/* ===========================================================
   SUCCESS OS
   HUMAN TEACHER QUALITY GATE
   Sara & Ali ONLY
=========================================================== */

export enum QualityResult {
  PASS = "PASS",
  FAIL = "FAIL",
}

export interface HumanTeacherMetrics {
  teacher: "sara" | "ali";

  realismScore: number;
  lipSyncScore: number;
  eyeContactScore: number;
  faceExpressionScore: number;
  bodyMovementScore: number;
  gestureScore: number;
  voiceNaturalnessScore: number;
  teachingScore: number;
  adaptationScore: number;
  studioScore: number;

  repeatedAnimations: number;
  repeatedSentences: number;
  roboticMovements: number;
}

const MIN = {
  realism: 96,
  lipSync: 97,
  eyes: 95,
  face: 95,
  body: 95,
  gesture: 95,
  voice: 97,
  teaching: 98,
  adaptation: 96,
  studio: 95,
};

export function validateHumanTeacher(m: HumanTeacherMetrics): QualityResult {
  if (m.realismScore < MIN.realism) return QualityResult.FAIL;

  if (m.lipSyncScore < MIN.lipSync) return QualityResult.FAIL;

  if (m.eyeContactScore < MIN.eyes) return QualityResult.FAIL;

  if (m.faceExpressionScore < MIN.face) return QualityResult.FAIL;

  if (m.bodyMovementScore < MIN.body) return QualityResult.FAIL;

  if (m.gestureScore < MIN.gesture) return QualityResult.FAIL;

  if (m.voiceNaturalnessScore < MIN.voice) return QualityResult.FAIL;

  if (m.teachingScore < MIN.teaching) return QualityResult.FAIL;

  if (m.adaptationScore < MIN.adaptation) return QualityResult.FAIL;

  if (m.studioScore < MIN.studio) return QualityResult.FAIL;

  if (m.repeatedAnimations > 0) return QualityResult.FAIL;

  if (m.repeatedSentences > 0) return QualityResult.FAIL;

  if (m.roboticMovements > 0) return QualityResult.FAIL;

  return QualityResult.PASS;
}

export function assertTeacherQuality(metrics: HumanTeacherMetrics) {
  const result = validateHumanTeacher(metrics);

  if (result === QualityResult.FAIL) {
    throw new Error(`
====================================================
 HUMAN TEACHER QUALITY GATE FAILED

 Teacher: ${metrics.teacher}

 Sara & Ali are NOT allowed to ship.

 Continue improving until they behave like
 professional human teachers.

 Build FAILED.
====================================================
`);
  }
}

/** Thresholds — diagnostics only. */
export const HUMAN_TEACHER_QUALITY_MIN = { ...MIN };

export function diagnoseTeacherQuality(m: HumanTeacherMetrics): {
  result: QualityResult;
  failures: string[];
} {
  const failures: string[] = [];
  if (m.realismScore < MIN.realism) {
    failures.push(`realismScore ${m.realismScore} < ${MIN.realism}`);
  }
  if (m.lipSyncScore < MIN.lipSync) {
    failures.push(`lipSyncScore ${m.lipSyncScore} < ${MIN.lipSync}`);
  }
  if (m.eyeContactScore < MIN.eyes) {
    failures.push(`eyeContactScore ${m.eyeContactScore} < ${MIN.eyes}`);
  }
  if (m.faceExpressionScore < MIN.face) {
    failures.push(`faceExpressionScore ${m.faceExpressionScore} < ${MIN.face}`);
  }
  if (m.bodyMovementScore < MIN.body) {
    failures.push(`bodyMovementScore ${m.bodyMovementScore} < ${MIN.body}`);
  }
  if (m.gestureScore < MIN.gesture) {
    failures.push(`gestureScore ${m.gestureScore} < ${MIN.gesture}`);
  }
  if (m.voiceNaturalnessScore < MIN.voice) {
    failures.push(`voiceNaturalnessScore ${m.voiceNaturalnessScore} < ${MIN.voice}`);
  }
  if (m.teachingScore < MIN.teaching) {
    failures.push(`teachingScore ${m.teachingScore} < ${MIN.teaching}`);
  }
  if (m.adaptationScore < MIN.adaptation) {
    failures.push(`adaptationScore ${m.adaptationScore} < ${MIN.adaptation}`);
  }
  if (m.studioScore < MIN.studio) {
    failures.push(`studioScore ${m.studioScore} < ${MIN.studio}`);
  }
  if (m.repeatedAnimations > 0) {
    failures.push(`repeatedAnimations ${m.repeatedAnimations} > 0`);
  }
  if (m.repeatedSentences > 0) {
    failures.push(`repeatedSentences ${m.repeatedSentences} > 0`);
  }
  if (m.roboticMovements > 0) {
    failures.push(`roboticMovements ${m.roboticMovements} > 0`);
  }
  return {
    result: failures.length ? QualityResult.FAIL : QualityResult.PASS,
    failures,
  };
}
