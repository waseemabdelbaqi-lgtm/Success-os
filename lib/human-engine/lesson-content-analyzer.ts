/**
 * Pre-lesson content analyzer — understand first, then teach.
 *
 * Deterministic expert reasoner (success-os.teacher-reasoner.v1).
 * Swap llmModel later without rewriting Human Engine.
 */
import type { TeacherID } from "@/types/ai-teacher-profile";
import type {
  LessonTeachingPlan,
  PedagogyStrategy,
  StudentContext,
} from "@/types/lesson-teaching-plan";
import type { InteractiveLessonPackage } from "@/types/interactive-lesson-engine";
import { getCoreTeacherProfile } from "@/lib/ai-teachers/core-profiles";
import { getDefaultTeacherProfile } from "./teacher-profiles-defaults";

function ar(text?: { en?: string; ar?: string } | string | null): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text.ar || text.en || "";
}

function detectPedagogy(subject: string, corpus: string): PedagogyStrategy {
  const s = `${subject} ${corpus}`.toLowerCase();
  if (/math|رياضيات|جبر|هندس|كسور|عدد|معادل|fraction/.test(s)) {
    return "math_step_by_step";
  }
  if (/phys|فيز|قوة|تسارع|نيوتن|محاك/.test(s)) {
    return "physics_diagrams_simulation";
  }
  if (/chem|كيم|جزيء|تفاعل|H₂O|H2O/.test(s)) {
    return "chemistry_lab_molecular";
  }
  if (/bio|أحياء|خلية|تشريح|عضو/.test(s)) {
    return "biology_anatomy_models";
  }
  if (/prog|code|برمجة|loop|حلق|python|javascript|خوارزم/.test(s)) {
    return "programming_code_run_explain";
  }
  if (/arab|عربي|english|لغة|قراءة|نطق|حوار|grammar|languages/.test(s)) {
    return "language_dialogue_pronunciation";
  }
  return "general_explain_check";
}

function unique(items: string[], max = 6): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of items) {
    const t = raw.replace(/\s+/g, " ").trim();
    if (t.length < 4) continue;
    const key = t.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, 160));
    if (out.length >= max) break;
  }
  return out;
}

function collectCorpus(pkg: InteractiveLessonPackage): {
  title: string;
  subject: string;
  objectives: string[];
  concepts: string[];
  lines: string[];
} {
  const title = ar(pkg.title) || pkg.id;
  const subject = pkg.filters?.subject || "general";
  const objectives = unique((pkg.objectives || []).map((o) => ar(o)), 5);
  const concepts = unique((pkg.concepts || []).map((c) => ar(c)), 6);
  const lines: string[] = [];
  for (const slide of pkg.slides || []) {
    const st = ar(slide.title);
    if (st) lines.push(st);
    for (const b of slide.blocks || []) {
      const t = [ar(b.title), ar(b.text), b.formula || "", ar(b.question?.prompt)]
        .filter(Boolean)
        .join(" ");
      if (t.length > 6) lines.push(t);
    }
  }
  for (const section of Object.values(pkg.sections || {})) {
    for (const b of section || []) {
      const t = [ar(b.title), ar(b.text), b.formula || ""].filter(Boolean).join(" ");
      if (t.length > 6) lines.push(t);
    }
  }
  const summary = ar(pkg.summary);
  if (summary) lines.unshift(summary);
  return {
    title,
    subject,
    objectives: objectives.length ? objectives : [`فهم أساسيات ${title}`],
    concepts: concepts.length ? concepts : unique(lines, 4),
    lines: unique(lines, 16),
  };
}

function personaVoice(teacherId: TeacherID, warm: boolean, text: string): string {
  if (teacherId === "sara" || warm) {
    return text
      .replace(/^/, "")
      .replace(/نبدأ\./, "خلينا نبدأ بهدوء.");
  }
  return text;
}

/**
 * Analyze full lesson content, then build a dynamic teaching plan.
 * Does NOT read text aloud — reshapes understanding into pedagogy.
 */
export function analyzeLessonContent(opts: {
  pkg: InteractiveLessonPackage;
  teacherId: TeacherID;
  student?: StudentContext;
}): LessonTeachingPlan {
  const teacherId = opts.teacherId === "ali" ? "ali" : "sara";
  const core = getCoreTeacherProfile(teacherId)!;
  const mind = getDefaultTeacherProfile(teacherId);
  const warm = teacherId === "sara";
  const student: StudentContext = {
    level: opts.student?.level || "on",
    ageBand: opts.student?.ageBand || "teen",
    language: opts.student?.language || mind.identity.locale,
    priorMistakes: opts.student?.priorMistakes || [],
    engagementHint: opts.student?.engagementHint || "unknown",
  };

  const { title, subject, objectives, concepts, lines } = collectCorpus(opts.pkg);
  const corpus = [...objectives, ...concepts, ...lines].join(" ");
  const pedagogy = detectPedagogy(subject, corpus);

  const commonMistakes = unique([
    student.priorMistakes?.[0] || "",
    pedagogy === "math_step_by_step"
      ? "القفز للناتج بدون كتابة الخطوات"
      : pedagogy === "physics_diagrams_simulation"
        ? "خلط الرموز والوحدات في القانون"
        : pedagogy === "chemistry_lab_molecular"
          ? "نسيان نسب الذرات في الجزيء"
          : pedagogy === "biology_anatomy_models"
            ? "خلط وظيفة العضو مع اسمه"
            : pedagogy === "language_dialogue_pronunciation"
              ? "الخلط بين أركان الجملة"
              : pedagogy === "programming_code_run_explain"
                ? "افتراض نتيجة الحلقة دون تتبّع"
                : "حفظ التعريف دون فهم التطبيق",
    "التعجل قبل التأكد من الفهم",
  ]);

  const bestExamples = unique(
    lines.slice(0, 3).map((l, i) => `مثال ${i + 1}: ${l.slice(0, 90)}`),
  );
  const bestAnalogies = unique([
    warm
      ? `تشبيه قريب من حياة الطالب لـ«${concepts[0] || title}»`
      : `تشبيه تحليلي يربط «${concepts[0] || title}» بمسألة عملية`,
    pedagogy === "programming_code_run_explain"
      ? "الحلقة مثل عدّاد يكرر مهمة حتى ينتهي الشرط"
      : pedagogy === "chemistry_lab_molecular"
        ? "الجزيء مثل فريق صغير لكل فرد دور ثابت"
        : "المفهوم مثل خريطة: نعرف الطريق قبل ما نمشي",
  ]);
  const bestQuestions = unique([
    `ما الفكرة الأساسية في «${title}»؟`,
    concepts[0] ? `عرّف «${concepts[0]}» بجملة واحدة ثم أعطِ مثالاً.` : "أعطِ مثالاً من عندك.",
    "أين يمكن أن يخطئ الطالب عادة هنا؟ ولماذا؟",
  ]);
  const bestDrawings = unique([
    pedagogy === "math_step_by_step"
      ? "مخطط خطوات الحل على السبورة"
      : pedagogy === "physics_diagrams_simulation"
        ? "مخطط قوى/متجهات"
        : pedagogy === "biology_anatomy_models"
          ? "مخطط تشريحي مبسّط"
          : pedagogy === "language_dialogue_pronunciation"
            ? "صناديق أركان الجملة"
            : pedagogy === "programming_code_run_explain"
              ? "مخطط تدفق الحلقة"
              : "مخطط مفهومي للعلاقات",
  ]);
  const bestExperiments = unique([
    pedagogy === "physics_diagrams_simulation" || pedagogy === "chemistry_lab_molecular"
      ? "تجربة/محاكاة قصيرة تُظهر التغير أمام الطالب"
      : pedagogy === "programming_code_run_explain"
        ? "تشغيل الكود ومراقبة الناتج حياً"
        : "نشاط تطبيقي قصير للتحقق من الفهم",
  ]);
  const bestModels3d = unique([
    pedagogy === "chemistry_lab_molecular"
      ? "نموذج جزيئي ثلاثي الأبعاد"
      : pedagogy === "biology_anatomy_models"
        ? "نموذج تشريحي/خلوي ثلاثي الأبعاد"
        : pedagogy === "physics_diagrams_simulation"
          ? "نموذج حركة/جسم ثلاثي الأبعاد"
          : pedagogy === "programming_code_run_explain"
            ? "نموذج مسار تنفيذ ثلاثي الأبعاد"
            : "نموذج مفهومي ثلاثي الأبعاد عند الحاجة التعليمية فقط",
  ]);

  const assessmentApproach =
    student.level === "below"
      ? "أسئلة متدرجة + إعادة شرح تلقائية عند التعثر + ملخص وخطة متابعة"
      : student.level === "above"
        ? "سؤال تطبيقي أعمق + تلخيص سريع + تحدٍّ قصير للمتابعة"
        : "تحقق فهم أثناء الشرح + ملخص + اختبار ختامي + خطة متابعة";

  const beats: LessonTeachingPlan["beats"] = [];
  const push = (beat: LessonTeachingPlan["beats"][number]) => {
    beats.push({
      ...beat,
      speak: personaVoice(teacherId, warm, beat.speak),
    });
  };

  push({
    id: "hook",
    purpose: "hook",
    speak: warm
      ? `مرحبا. أنا ${core.fullName}. قبل ما نشرح، حللت محتوى «${title}» بالكامل ورتّبت خطة واضحة لكم.`
      : `أهلاً. أنا ${core.fullName}. حلّلت محتوى «${title}» أولاً. سنمشي بخطة عملية: مفهوم، تطبيق، تحقق.`,
    multimodal: "none",
  });

  push({
    id: "objectives",
    purpose: "objective",
    speak: warm
      ? `أهدافنا اليوم بهدوء: ${objectives.slice(0, 3).join(" · ")}.`
      : `أهداف الدرس بدقة: ${objectives.slice(0, 3).join(" · ")}.`,
    board: objectives.slice(0, 3).join(" | "),
    multimodal: "none",
  });

  concepts.slice(0, 3).forEach((c, i) => {
    push({
      id: `concept_${i}`,
      purpose: "concept",
      speak: warm
        ? `${mind.phrases.explainVerb}: ${c}. نثبّتها قبل الأمثلة.`
        : `تعريف عملي: ${c}. بعدها نطبّق مباشرة.`,
      board: c,
      multimodal: "none",
    });
  });

  // Subject-specific pedagogy beats
  if (pedagogy === "math_step_by_step") {
    push({
      id: "worked",
      purpose: "worked_step",
      speak: warm
        ? `نحل مسألة خطوة بخطوة على السبورة. لا نقفز للناتج.`
        : `حل تحليلي خطوة بخطوة. كل سطر سبب للناتج.`,
      board: bestExamples[0] || "خطوة 1 → خطوة 2 → ناتج",
      multimodal: "diagram",
    });
  } else if (pedagogy === "physics_diagrams_simulation") {
    push({
      id: "diagram",
      purpose: "diagram",
      speak: `أرسم المخطط على السبورة ثم نقرأ العلاقات من الرسم لا من الحفظ.`,
      board: bestDrawings[0],
      multimodal: "diagram",
    });
    push({
      id: "sim",
      purpose: "experiment",
      speak: `نشغّل محاكاة قصيرة ونلاحظ التغير — هذا يثبت القانون عملياً.`,
      multimodal: "experiment",
    });
  } else if (pedagogy === "chemistry_lab_molecular") {
    push({
      id: "mol",
      purpose: "model_3d",
      speak: `هذا نموذج جزيئي ثلاثي الأبعاد. أديره وأكبّره لنشوف الروابط.`,
      multimodal: "model_3d",
    });
    push({
      id: "lab",
      purpose: "experiment",
      speak: `نجرب/نحاكي التغير ونربط الملاحظة بالمعادلة على السبورة.`,
      board: bestExamples[0],
      multimodal: "experiment",
    });
  } else if (pedagogy === "biology_anatomy_models") {
    push({
      id: "anatomy",
      purpose: "model_3d",
      speak: `نموذج تشريحي/خلوي ثلاثي الأبعاد — نحدد الجزء ثم وظيفته.`,
      multimodal: "model_3d",
    });
    push({
      id: "draw_bio",
      purpose: "diagram",
      speak: `أرسم المخطط التشريحي المبسط على السبورة وأسمّي الأجزاء.`,
      board: bestDrawings[0],
      multimodal: "diagram",
    });
  } else if (pedagogy === "language_dialogue_pronunciation") {
    push({
      id: "dialogue",
      purpose: "dialogue",
      speak: warm
        ? `نتمرّن بالحوار: أقول الجملة، تعيدوا وراي، ثم نصحّح النطق بهدوء.`
        : `حوار تطبيقي: جملة، نطق، تصحيح فوري للخطأ.`,
      board: bestExamples[0],
      multimodal: "none",
    });
  } else if (pedagogy === "programming_code_run_explain") {
    push({
      id: "code",
      purpose: "code_run",
      speak: warm
        ? `نكتب الكود على السبورة، نشغّله، ونشرح الناتج سطراً سطراً.`
        : `نكتب الكود، نتتبّع التنفيذ، ثم نفسّر الناتج بدقة.`,
      board: "for i in 1..n: … → output",
      multimodal: "code",
    });
  }

  if (bestAnalogies[0]) {
    push({
      id: "analogy",
      purpose: "example",
      speak: `${bestAnalogies[0]}.`,
      multimodal: "none",
    });
  }

  // Auto-remediate path if prior mistakes or below level (no student request needed)
  if (student.level === "below" || (student.priorMistakes && student.priorMistakes.length)) {
    push({
      id: "auto_remediate",
      purpose: "remediate",
      speak: warm
        ? `${mind.phrases.reexplainOpener}. لاحظت نقطة تحتاج ترتيب: ${commonMistakes[0]}.`
        : `${mind.phrases.reexplainOpener}. الخطأ الشائع هنا: ${commonMistakes[0]}. نصحّحه الآن.`,
      multimodal: pedagogy.includes("model") ? "model_3d" : "diagram",
    });
  }

  if (student.engagementHint === "bored" || student.engagementHint === "distracted") {
    push({
      id: "reengage",
      purpose: "example",
      speak: warm
        ? `خلينا نغيّر الإيقاع بمثال حي قريب منكم حتى نرجع للتركيز.`
        : `نغيّر الزاوية بمسألة عملية سريعة لاستعادة التركيز.`,
      multimodal: "none",
    });
  }

  push({
    id: "check_mid",
    purpose: "check",
    speak: `${mind.phrases.checkPhrase}: ${bestQuestions[0]}`,
    multimodal: "none",
  });

  const summary = warm
    ? `ملخص منظم: ${concepts.slice(0, 2).join("، ") || title}.`
    : `ملخص تحليلي: ${concepts.slice(0, 2).join("، ") || title}.`;
  const quizPrompt = bestQuestions[1] || bestQuestions[0]!;
  const followUpPlan = warm
    ? `خطة متابعة: راجع المثال، حلّ تمريناً واحداً، وارجع بسؤال إن علقت.`
    : `خطة متابعة: طبّق المفهوم على مسألة جديدة، راقب الخطأ الشائع، وثبّت الخطوة التي تعثّرت فيها.`;

  push({
    id: "summary",
    purpose: "summary",
    speak: summary,
    board: concepts.slice(0, 3).join(" · "),
    multimodal: "none",
  });
  push({
    id: "final_check",
    purpose: "check",
    speak: `اختبار سريع: ${quizPrompt}`,
    multimodal: "none",
  });
  push({
    id: "follow_up",
    purpose: "follow_up",
    speak: followUpPlan,
    multimodal: "none",
  });

  return {
    schema: "success-os.lesson-teaching-plan.v1",
    version: "1.0.0",
    teacherId,
    subject,
    lessonTitle: title,
    pedagogy,
    analysis: {
      objectives,
      keyConcepts: concepts,
      commonMistakes,
      bestExamples,
      bestAnalogies,
      bestQuestions,
      bestDrawings,
      bestExperiments,
      bestModels3d,
      assessmentApproach,
    },
    student,
    beats,
    close: { summary, quizPrompt, followUpPlan },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Build a teaching plan from free-form proof/script content (Demo acceptance).
 * Same analyzer — content first, persona delivery second.
 */
export function analyzeScriptedLesson(opts: {
  teacherId: TeacherID;
  subject: string;
  title: string;
  lines: string[];
  student?: StudentContext;
}): LessonTeachingPlan {
  const now = new Date().toISOString();
  const pkg: InteractiveLessonPackage = {
    schema: "success-os.interactive-lesson-engine.v1",
    id: `script_${opts.subject}`.replace(/\s+/g, "_").slice(0, 48),
    version: 1,
    status: "preview",
    title: { en: opts.title, ar: opts.title },
    summary: { en: opts.lines[0] || opts.title, ar: opts.lines[0] || opts.title },
    filters: { subject: opts.subject, grade: "g7" },
    difficulty: "core",
    estimatedMinutes: 8,
    language: "ar",
    source: { kind: "engine-demo", lessonId: opts.subject },
    sections: {},
    slides: [
      {
        id: "s1",
        order: 1,
        title: { en: opts.title, ar: opts.title },
        blocks: opts.lines.map((t, i) => ({
          id: `lb_${i}`,
          type: "rich_text" as const,
          text: { en: t, ar: t },
        })),
      },
    ],
    objectives: opts.lines.slice(0, 3).map((l) => ({ en: l, ar: l })),
    concepts: opts.lines.slice(0, 4).map((l) => ({
      en: l.slice(0, 80),
      ar: l.slice(0, 80),
    })),
    futureCapabilities: [],
    accessibility: {
      captions: true,
      keyboardNav: true,
      readingMode: true,
      highContrast: false,
    },
    performance: { lazyLoad: true, virtualizeSlides: false, offlineReady: false },
    updatedAt: now,
    createdAt: now,
  };
  return analyzeLessonContent({
    pkg,
    teacherId: opts.teacherId,
    student: opts.student,
  });
}

/** Map teaching plan beats → Human Engine block kinds + act cue phrases. */
export function teachingPlanToBlocks(plan: LessonTeachingPlan): Array<{
  id: string;
  kind:
    | "hook"
    | "explain"
    | "example"
    | "practice"
    | "check"
    | "encourage"
    | "close";
  text: string;
}> {
  return plan.beats.map((b) => {
    let kind: "hook" | "explain" | "example" | "practice" | "check" | "encourage" | "close" =
      "explain";
    let text = b.speak;

    if (b.purpose === "hook") kind = "hook";
    else if (b.purpose === "check") kind = "check";
    else if (b.purpose === "summary" || b.purpose === "follow_up") kind = "close";
    else if (b.purpose === "worked_step" || b.purpose === "code_run") kind = "practice";
    else if (
      b.purpose === "diagram" ||
      b.purpose === "experiment" ||
      b.purpose === "model_3d" ||
      b.purpose === "example" ||
      b.purpose === "dialogue"
    ) {
      kind = "example";
    } else if (b.purpose === "remediate") kind = "encourage";

    // Inject HE act cues so semantic director drives board/draw/3D/lab purposefully
    if (b.board && (b.purpose === "objective" || b.purpose === "concept" || b.purpose === "worked_step")) {
      text = `اكتب على السبورة: ${b.board}. ${b.speak}`;
    }
    if (b.multimodal === "diagram") {
      text = `أرسم على السبورة: ${b.board || b.speak}. ${b.speak}`;
    }
    if (b.multimodal === "model_3d") {
      text = `هذا نموذج ثلاثي الأبعاد. أمسكه وأديره ثم أكبّره. ${b.speak}`;
    }
    if (b.multimodal === "experiment") {
      text = `نجرب في المختبر أو المحاكاة ونلاحظ التغير. ${b.speak}`;
    }
    if (b.multimodal === "code") {
      text = `اكتب الكود على السبورة ثم نتتبّع الناتج: ${b.speak}`;
    }

    return { id: b.id, kind, text };
  });
}
