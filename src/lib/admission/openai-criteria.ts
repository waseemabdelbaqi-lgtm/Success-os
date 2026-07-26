/**
 * OpenAI gpt-4o-mini — extract min GPA + Arabic requirements summary.
 */

export type ExtractedCriteria = {
  min_gpa: number;
  requirements_text: string;
};

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function summarizeAdmissionCriteria(input: {
  universityName: string;
  nationality: string;
  searchQuery: string;
  snippets: string;
}): Promise<ExtractedCriteria | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const system = `أنت مساعد قبول جامعي. استخرج من نتائج البحث الحد الأدنى للمعدل (GPA على مقياس 4.0)
ومتطلبات القبول لجنسية محددة. أعد JSON فقط بالشكل:
{"min_gpa": number, "requirements_text": "نص عربي منسّق بنقاط واضحة"}
إذا لم يظهر معدل صريح، قدّر بحذر بين 2.5 و 3.2 حسب سياق الجامعة.
requirements_text يجب أن يكون بالعربية الفصحى الواضحة، محترماً، ومفيداً للطالب الدولي.`;

  const user = `الجامعة: ${input.universityName}
الجنسية: ${input.nationality}
استعلام البحث: ${input.searchQuery}

مقتطفات البحث:
${input.snippets.slice(0, 12000)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ADMISSION_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("OpenAI criteria extract failed:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { min_gpa?: number; requirements_text?: string };
    const min = Number(parsed.min_gpa);
    const text = String(parsed.requirements_text || "").trim();
    if (!Number.isFinite(min) || !text) return null;
    return {
      min_gpa: Math.min(4, Math.max(0, Math.round(min * 100) / 100)),
      requirements_text: text,
    };
  } catch {
    return null;
  }
}
