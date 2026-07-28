/** Cinematic 45–60s Approach C proof timeline (seconds). */

export type CinemaShotId =
  | "enter"
  | "talk"
  | "point"
  | "objects3"
  | "objects5"
  | "numberline"
  | "equation"
  | "question";

export type CinemaShot = {
  id: CinemaShotId;
  start: number;
  end: number;
  captionAr: string;
  camera: { position: [number, number, number]; lookAt: [number, number, number]; fov: number };
  teacher: {
    mouth: boolean;
    pointBoard: boolean;
    walkIn: boolean;
    lookAt: "camera" | "board";
  };
  board: {
    objects: number;
    showLine: boolean;
    jumps: number;
    equation: string;
    writingProgress: number;
  };
};

export const CINEMA_PROOF = {
  id: "g1-math-cinema-proof-3d",
  preparedBy: "Prepared by Mr Waseem Allabadi",
  teacherName: "أ. لاما النوري",
  teacherTitle: "معلّمة مساعدة",
  approach: "C" as const,
  durationSec: 45.4,
  audioAr: "/interactive-lessons/g1-math/cinema/ar/proof-main.mp3",
  ambience: "/interactive-lessons/g1-math/cinema/sfx/classroom-ambience.mp3",
  feedbackAudio: {
    hint: "/interactive-lessons/g1-math/cinema/ar/hint.mp3",
    reexplain: "/interactive-lessons/g1-math/cinema/ar/reexplain.mp3",
    correct: "/interactive-lessons/g1-math/cinema/ar/correct.mp3",
  },
  question: {
    ar: "٣ + ٢ = ؟",
    en: "3 + 2 = ?",
    options: ["4", "5", "6"],
    correctIndex: 1,
    firstHintAr: "ابدأ من 3، ثم اقفز قفزتين لليمين.",
    secondExplanationAr: "من 3 إلى 4 ثم إلى 5. الناتج 5.",
    correctFeedbackAr: "أحسنت! الناتج 5.",
  },
  shots: [
    {
      id: "enter",
      start: 0,
      end: 7.0,
      captionAr: "مرحبا يا بطل الصف الأول · أنا لاما",
      camera: { position: [2.4, 1.55, 4.2], lookAt: [0.2, 1.2, 0], fov: 42 },
      teacher: { mouth: true, pointBoard: false, walkIn: true, lookAt: "camera" },
      board: { objects: 0, showLine: false, jumps: 0, equation: "", writingProgress: 0 },
    },
    {
      id: "talk",
      start: 7.0,
      end: 11.1,
      captionAr: "اليوم نتعلم الجمع بلعبة ممتعة",
      camera: { position: [0.35, 1.45, 2.35], lookAt: [0.15, 1.35, 0], fov: 36 },
      teacher: { mouth: true, pointBoard: false, walkIn: false, lookAt: "camera" },
      board: { objects: 0, showLine: false, jumps: 0, equation: "", writingProgress: 0 },
    },
    {
      id: "point",
      start: 11.1,
      end: 14.7,
      captionAr: "انظر إلى السبورة الذكية معي",
      camera: { position: [1.9, 1.5, 3.6], lookAt: [-0.6, 1.35, -1.2], fov: 40 },
      teacher: { mouth: true, pointBoard: true, walkIn: false, lookAt: "board" },
      board: { objects: 0, showLine: false, jumps: 0, equation: "", writingProgress: 0 },
    },
    {
      id: "objects3",
      start: 14.7,
      end: 19.8,
      captionAr: "واحد · اثنان · ثلاثة",
      camera: { position: [-0.1, 1.55, 3.1], lookAt: [-1.1, 1.45, -1.4], fov: 38 },
      teacher: { mouth: true, pointBoard: true, walkIn: false, lookAt: "board" },
      board: { objects: 3, showLine: false, jumps: 0, equation: "", writingProgress: 0 },
    },
    {
      id: "objects5",
      start: 19.8,
      end: 26.2,
      captionAr: "واثنان معهما · صاروا خمسة",
      camera: { position: [-0.25, 1.6, 2.9], lookAt: [-1.1, 1.5, -1.4], fov: 36 },
      teacher: { mouth: true, pointBoard: true, walkIn: false, lookAt: "board" },
      board: { objects: 5, showLine: false, jumps: 0, equation: "", writingProgress: 0 },
    },
    {
      id: "numberline",
      start: 26.2,
      end: 34.2,
      captionAr: "3 ← قفزة ← 4 ← قفزة ← 5",
      camera: { position: [0.1, 1.55, 3.0], lookAt: [-1.05, 1.35, -1.4], fov: 37 },
      teacher: { mouth: true, pointBoard: true, walkIn: false, lookAt: "board" },
      board: { objects: 0, showLine: true, jumps: 2, equation: "3 + 2 = ?", writingProgress: 0.4 },
    },
    {
      id: "equation",
      start: 34.2,
      end: 45.4,
      captionAr: "٣ + ٢ = ٥ · دورك الآن",
      camera: { position: [0.0, 1.5, 2.7], lookAt: [-1.05, 1.4, -1.4], fov: 34 },
      teacher: { mouth: true, pointBoard: false, walkIn: false, lookAt: "board" },
      board: { objects: 0, showLine: true, jumps: 2, equation: "3 + 2 = 5", writingProgress: 1 },
    },
  ] satisfies CinemaShot[],
};

export function shotAt(timeSec: number): CinemaShot {
  const shots = CINEMA_PROOF.shots;
  for (let i = shots.length - 1; i >= 0; i -= 1) {
    const s = shots[i]!;
    if (timeSec >= s.start) return s;
  }
  return shots[0]!;
}
