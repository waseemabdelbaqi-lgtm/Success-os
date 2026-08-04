// ======================================================
// Success OS
// AI Teacher Live State
// ======================================================

export enum TeacherState {
  IDLE = "idle",

  GREETING = "greeting",

  THINKING = "thinking",

  LISTENING = "listening",

  TEACHING = "teaching",

  EXPLAINING = "explaining",

  WRITING = "writing",

  DRAWING = "drawing",

  POINTING = "pointing",

  WALKING = "walking",

  OBSERVING = "observing",

  ASKING = "asking",

  WAITING = "waiting",

  ENCOURAGING = "encouraging",

  PRAISING = "praising",

  CORRECTING = "correcting",

  SHOWING_MODEL = "showing_model",

  DEMONSTRATING = "demonstrating",

  SOLVING = "solving",

  REVIEWING = "reviewing",

  SUMMARIZING = "summarizing",

  FINISHED = "finished",
}

export interface LiveTeacherState {
  state: TeacherState;

  lessonId: string;

  currentTopic: string;

  currentSentence: number;

  attention: number;

  emotion: string;

  gesture: string;

  cameraMode: string;

  eyeTarget: string;

  speaking: boolean;

  listening: boolean;

  walking: boolean;

  writing: boolean;

  pointing: boolean;

  waitingForStudent: boolean;
}
