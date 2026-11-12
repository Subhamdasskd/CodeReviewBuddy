import { extractAddedLines, type FilePatch } from "./diff";
import { isLlmConfigured, reviewWithLlm } from "./llm";
import { runRules } from "./rules";
import { severityWeight, type Finding, type Severity } from "./types";

export type ReviewSummary = {
  total: number;
  bySeverity: Record<Severity, number>;
  linesReviewed: number;
  aiUsed: boolean;
  aiError: string | null;
};

export type ReviewResult = {
  findings: Finding[];
  summary: ReviewSummary;
};

const MAX_FINDINGS = 100;

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const unique: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.filePath ?? ""}|${finding.lineStart ?? 0}|${finding.title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(finding);
  }

  return unique;
}

function summarise(findings: Finding[], linesReviewed: number, aiUsed: boolean, aiError: string | null): ReviewSummary {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  return { total: findings.length, bySeverity, linesReviewed, aiUsed, aiError };
}

/**
 * Reviews the added lines of a pull request.
 *
 * The deterministic rules always run; the AI pass is additive and only used
 * when a provider key is configured. An AI failure never fails the review.
 */
export async function reviewPullRequest(input: {
  title: string;
  description: string | null;
  files: FilePatch[];
}): Promise<ReviewResult> {
  const lines = extractAddedLines(input.files);
  const ruleFindings = runRules(lines);

  let aiFindings: Finding[] = [];
  let aiUsed = false;
  let aiError: string | null = null;

  if (isLlmConfigured() && lines.length > 0) {
    try {
      aiFindings = await reviewWithLlm(lines, input.title, input.description);
      aiUsed = true;
    } catch (error) {
      aiError = error instanceof Error ? error.message : "AI review failed";
    }
  }

  const findings = dedupe([...ruleFindings, ...aiFindings])
    .sort(
      (a, b) =>
        severityWeight(a.severity) - severityWeight(b.severity) ||
        (a.filePath ?? "").localeCompare(b.filePath ?? "") ||
        (a.lineStart ?? 0) - (b.lineStart ?? 0),
    )
    .slice(0, MAX_FINDINGS);

  return {
    findings,
    summary: summarise(findings, lines.length, aiUsed, aiError),
  };
}

/** Pure helper used by tests. */
export function reviewFilesWithRules(files: FilePatch[]): Finding[] {
  return runRules(extractAddedLines(files));
}
