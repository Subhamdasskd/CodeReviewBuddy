import { formatDiffForPrompt, type DiffLine } from "./diff";
import type { Finding, Severity } from "./types";

const VALID_SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];

const RESPONSE_SHAPE = `Return JSON of the form:
{"findings":[{"file":"path/to/file","line":42,"severity":"critical|high|medium|low|info","category":"security|bug|performance|style|test|docs","title":"short title","description":"why this matters","suggestion":"concrete fix","confidence":0.0-1.0}]}
Rules:
- Only report issues on the added lines shown.
- Use the exact file path and line number from each line.
- Report at most 20 findings, most important first.
- If there is nothing to report, return {"findings":[]}.
- Return JSON only, no markdown.`;

function buildPrompt(lines: DiffLine[], title: string, description: string | null): string {
  return `You are a senior engineer reviewing a pull request.

PR title: ${title}
PR description: ${description ?? "(none)"}

Added lines (file:line: content):
${formatDiffForPrompt(lines)}

Review for security vulnerabilities, logic bugs, performance problems and missing tests.
${RESPONSE_SHAPE}`;
}

function coerceSeverity(value: unknown): Severity {
  return VALID_SEVERITIES.includes(value as Severity) ? (value as Severity) : "medium";
}

function parseFindings(raw: string): Finding[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const list =
    Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null && Array.isArray((parsed as { findings?: unknown }).findings)
        ? (parsed as { findings: unknown[] }).findings
        : [];

  return list
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      rule: "ai/llm",
      category: typeof item.category === "string" ? item.category : "bug",
      severity: coerceSeverity(item.severity),
      title: typeof item.title === "string" ? item.title : "AI finding",
      description: typeof item.description === "string" ? item.description : "",
      suggestion: typeof item.suggestion === "string" ? item.suggestion : null,
      filePath: typeof item.file === "string" ? item.file : null,
      lineStart: typeof item.line === "number" ? item.line : null,
      lineEnd: typeof item.line === "number" ? item.line : null,
      confidence: typeof item.confidence === "number" ? Math.min(1, Math.max(0, item.confidence)) : 0.6,
    }))
    .filter((finding) => finding.description.length > 0);
}

function geminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
}

function openAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}

export function llmProvider(): "gemini" | "openai" | null {
  if (geminiKey()) return "gemini";
  if (openAiKey()) return "openai";
  return null;
}

export function isLlmConfigured(): boolean {
  return llmProvider() !== null;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

async function callOpenAi(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Optional AI review pass.
 *
 * Returns an empty list when no provider is configured, so the deterministic
 * rule engine remains the source of truth for offline and CI runs.
 */
export async function reviewWithLlm(
  lines: DiffLine[],
  title: string,
  description: string | null,
): Promise<Finding[]> {
  const provider = llmProvider();
  if (!provider || lines.length === 0) return [];

  const prompt = buildPrompt(lines, title, description);

  const raw =
    provider === "gemini"
      ? await callGemini(prompt, geminiKey() as string)
      : await callOpenAi(prompt, openAiKey() as string);

  return parseFindings(raw);
}
