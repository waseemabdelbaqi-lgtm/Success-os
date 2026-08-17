/**
 * numbers-demo-script.ts
 *
 * A fixed, hardcoded sequence used ONLY to prove the digital human layer
 * (LiveAvatar + ElevenLabs) actually works end to end. This is deliberately
 * NOT a subject/curriculum system — no subject tool, no question bank, no
 * lesson-authoring infrastructure. It exists only as a demo fixture for the
 * "teach numbers 1-5 to a 5-year-old" acceptance demo.
 */

export interface DemoStep {
  id: string;
  spokenTextAr: string;
  spokenTextEn: string;
  boardAction?: { type: "WRITE_NUMBER"; value: string } | { type: "POINT"; value: string } | { type: "ERASE" };
  question?: { prompt: string; choices: string[]; correctIndex: number };
}

export function buildNumbersDemoScript(teacherNameAr: string, teacherNameEn: string): DemoStep[] {
  return [
    { id: "greet", spokenTextAr: `مرحباً! أنا ${teacherNameAr}. اليوم سنتعلم الأعداد.`, spokenTextEn: `Hello! I'm ${teacherNameEn}. Today we'll learn numbers.` },
    { id: "write-1", spokenTextAr: "هذا الرقم واحد.", spokenTextEn: "This is the number one.", boardAction: { type: "WRITE_NUMBER", value: "1" } },
    { id: "write-2", spokenTextAr: "وهذا الرقم اثنان.", spokenTextEn: "And this is the number two.", boardAction: { type: "WRITE_NUMBER", value: "2" } },
    { id: "write-3", spokenTextAr: "وهذا الرقم ثلاثة.", spokenTextEn: "And this is the number three.", boardAction: { type: "WRITE_NUMBER", value: "3" } },
    { id: "write-4", spokenTextAr: "وهذا الرقم أربعة.", spokenTextEn: "And this is the number four.", boardAction: { type: "WRITE_NUMBER", value: "4" } },
    { id: "write-5", spokenTextAr: "وهذا الرقم خمسة.", spokenTextEn: "And this is the number five.", boardAction: { type: "WRITE_NUMBER", value: "5" } },
    {
      id: "ask",
      spokenTextAr: "أين الرقم ثلاثة؟",
      spokenTextEn: "Where is the number three?",
      boardAction: { type: "POINT", value: "board" },
      question: { prompt: "أين الرقم ثلاثة؟ (Where is the number three?)", choices: ["1", "2", "3", "4", "5"], correctIndex: 2 },
    },
  ];
}

export const PRAISE_AR = "أحسنت! هذا صحيح.";
export const PRAISE_EN = "Well done! That's correct.";
export const RETRY_AR = "لا بأس، حاول مرة أخرى. أشر إلى الرقم ثلاثة.";
export const RETRY_EN = "That's okay, let's try again. Point to the number three.";
