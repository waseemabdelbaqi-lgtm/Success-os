/**
 * Tavily Search API — live web gathering for admission requirements.
 * Docs: https://docs.tavily.com/
 */

export type TavilyResult = {
  title: string;
  url: string;
  content: string;
};

export type TavilySearchResponse = {
  answer?: string;
  results: TavilyResult[];
};

export function isTavilyConfigured(): boolean {
  return Boolean(process.env.TAVILY_API_KEY?.trim());
}

export async function searchTavily(query: string): Promise<TavilySearchResponse | null> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) return null;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_answer: true,
      max_results: 6,
      include_domains: [],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Tavily search failed:", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  return {
    answer: data.answer,
    results: (data.results || []).map((r) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
    })),
  };
}
