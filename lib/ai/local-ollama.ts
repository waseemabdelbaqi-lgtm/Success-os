import "server-only";

/**
 * Server-only local curriculum AI client.
 * Talks exclusively to Ollama on loopback — never exposed publicly.
 */

export const OLLAMA_LOOPBACK_BASE =
  process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";

export const LOCAL_AI_ARABIC_PROBE =
  "اشرح مفهوم الجمع لطالب في الصف الأول بجملتين، ثم أعط مثالاً واحداً وسؤال اختيار من متعدد مع الإجابة.";

const DEFAULT_MODEL = process.env.OLLAMA_MODEL?.trim() || "qwen3:8b";

export type LocalAiGenerateOptions = {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  /** Qwen3 thinking mode — keep false for curriculum latency. */
  think?: boolean;
};

export type LocalAiGenerateResult = {
  text: string;
  model: string;
  latencyMs: number;
  provider: "ollama-local";
};

export type LocalAiHealthResult = {
  connected: boolean;
  provider: "ollama-local";
  baseUrl: string;
  model: string | null;
  response: string | null;
  latencyMs: number;
  arabicQuality: "pass" | "fail" | "skipped";
  jsonCapability: "pass" | "fail" | "skipped";
  curriculumProcessingAllowed: false;
  error?: { code: string; message: string };
};

function assertLoopbackOnly(baseUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("OLLAMA_BASE_URL_INVALID");
  }
  const host = parsed.hostname;
  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
    throw new Error("OLLAMA_MUST_STAY_ON_LOOPBACK");
  }
}

export function getLocalOllamaConfig(): { baseUrl: string; model: string } {
  const baseUrl = OLLAMA_LOOPBACK_BASE;
  assertLoopbackOnly(baseUrl);
  return { baseUrl, model: DEFAULT_MODEL };
}

export async function isOllamaReachable(
  baseUrl = OLLAMA_LOOPBACK_BASE,
): Promise<boolean> {
  assertLoopbackOnly(baseUrl);
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listLocalModels(
  baseUrl = OLLAMA_LOOPBACK_BASE,
): Promise<string[]> {
  assertLoopbackOnly(baseUrl);
  const res = await fetch(`${baseUrl}/api/tags`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`OLLAMA_TAGS_${res.status}`);
  const data = (await res.json()) as { models?: Array<{ name?: string }> };
  return (data.models || []).map((m) => m.name || "").filter(Boolean);
}

export async function generateLocalText(
  options: LocalAiGenerateOptions,
): Promise<LocalAiGenerateResult> {
  const { baseUrl, model: defaultModel } = getLocalOllamaConfig();
  const model = options.model?.trim() || defaultModel;
  const started = Date.now();

  const body: Record<string, unknown> = {
    model,
    stream: false,
    think: options.think ?? false,
    messages: [
      ...(options.system
        ? [{ role: "system", content: options.system }]
        : [
            {
              role: "system",
              content:
                "أنت مساعد تعليمي محلي لمنصة Success OS. أجب بالعربية الفصحى المبسطة عندما يكون السؤال بالعربية.",
            },
          ]),
      { role: "user", content: options.prompt },
    ],
    options: {
      temperature: options.temperature ?? 0.2,
      num_predict: options.maxTokens ?? 1200,
    },
  };
  if (options.json) body.format = "json";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(300_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OLLAMA_${res.status}:${detail.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    message?: { content?: string };
    response?: string;
  };
  const text = (data.message?.content || data.response || "").trim();
  if (!text) throw new Error("OLLAMA_EMPTY_RESPONSE");

  return {
    text,
    model,
    latencyMs: Date.now() - started,
    provider: "ollama-local",
  };
}

export async function generateLocalJSON<T = unknown>(
  options: Omit<LocalAiGenerateOptions, "json">,
): Promise<LocalAiGenerateResult & { data: T }> {
  const result = await generateLocalText({ ...options, json: true });
  const clean = result.text
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return { ...result, data: JSON.parse(clean) as T };
  } catch {
    throw new Error("OLLAMA_INVALID_JSON");
  }
}

function scoreArabicQuality(text: string): "pass" | "fail" {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).join("").length;
  const hasExample = /\d\s*\+\s*\d|مثال/.test(text);
  const hasQuiz = /اختيار|أ\)|ب\)|ج\)|الإجابة|السؤال/.test(text);
  return arabic >= 40 && hasExample && hasQuiz ? "pass" : "fail";
}

/**
 * Real Arabic educational probe + JSON capability check.
 * Does not start curriculum book processing.
 */
export async function verifyLocalCurriculumAi(): Promise<LocalAiHealthResult> {
  const { baseUrl, model } = getLocalOllamaConfig();
  const started = Date.now();

  try {
    if (!(await isOllamaReachable(baseUrl))) {
      return {
        connected: false,
        provider: "ollama-local",
        baseUrl,
        model: null,
        response: null,
        latencyMs: Date.now() - started,
        arabicQuality: "skipped",
        jsonCapability: "skipped",
        curriculumProcessingAllowed: false,
        error: {
          code: "OLLAMA_UNREACHABLE",
          message: "Ollama is not reachable on 127.0.0.1:11434.",
        },
      };
    }

    const models = await listLocalModels(baseUrl);
    if (!models.some((name) => name === model || name.startsWith(`${model}:`))) {
      return {
        connected: false,
        provider: "ollama-local",
        baseUrl,
        model,
        response: null,
        latencyMs: Date.now() - started,
        arabicQuality: "skipped",
        jsonCapability: "skipped",
        curriculumProcessingAllowed: false,
        error: {
          code: "MODEL_MISSING",
          message: `Configured model ${model} is not installed locally.`,
        },
      };
    }

    const arabic = await generateLocalText({
      prompt: LOCAL_AI_ARABIC_PROBE,
      system:
        "أنت معلم ابتدائي. أجب بالعربية الفصحى المبسطة فقط. استخدم جملتين ثم مثالاً ثم سؤال اختيار من متعدد مع الإجابة.",
      model,
      temperature: 0.2,
      maxTokens: 500,
      think: false,
    });

    const arabicQuality = scoreArabicQuality(arabic.text);

    let jsonCapability: "pass" | "fail" = "fail";
    try {
      await generateLocalJSON({
        prompt:
          'أرجع فقط JSON صالحاً بهذا الشكل: {"concept":"الجمع","example":"2+3=5","quiz":{"question":"كم يساوي 1+1؟","choices":["1","2","3"],"answer":"2"}}',
        model,
        temperature: 0,
        maxTokens: 256,
        think: false,
      });
      jsonCapability = "pass";
    } catch {
      jsonCapability = "fail";
    }

    const connected = arabicQuality === "pass" && jsonCapability === "pass";

    return {
      connected,
      provider: "ollama-local",
      baseUrl,
      model: arabic.model,
      response: arabic.text,
      latencyMs: arabic.latencyMs,
      arabicQuality,
      jsonCapability,
      curriculumProcessingAllowed: false,
      ...(connected
        ? {}
        : {
            error: {
              code: "QUALITY_GATE_FAILED",
              message: "Arabic quality or JSON capability check failed.",
            },
          }),
    };
  } catch (err) {
    return {
      connected: false,
      provider: "ollama-local",
      baseUrl,
      model,
      response: null,
      latencyMs: Date.now() - started,
      arabicQuality: "fail",
      jsonCapability: "fail",
      curriculumProcessingAllowed: false,
      error: {
        code: "UNEXPECTED",
        message: String(err instanceof Error ? err.message : err).slice(0, 200),
      },
    };
  }
}
