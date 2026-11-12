import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { reviewFilesWithRules, reviewPullRequest } from "./engine";

const ENV_KEYS = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

const patch = [
  "@@ -1,1 +1,4 @@",
  " const existing = true;",
  "+eval(userInput);",
  "+console.log('debug');",
  "+const safe = 1;",
].join("\n");

describe("reviewPullRequest", () => {
  it("collects rule findings, sorts by severity and summarises", async () => {
    const result = await reviewPullRequest({
      title: "Test PR",
      description: null,
      files: [{ filename: "src/app.ts", patch }],
    });

    expect(result.summary.linesReviewed).toBe(3);
    expect(result.summary.total).toBe(2);
    expect(result.summary.bySeverity.high).toBe(1);
    expect(result.summary.bySeverity.info).toBe(1);
    expect(result.findings[0].severity).toBe("high");
    expect(result.summary.aiUsed).toBe(false);
    expect(result.summary.aiError).toBeNull();
  });

  it("returns an empty review when nothing was added", async () => {
    const result = await reviewPullRequest({
      title: "Empty",
      description: null,
      files: [{ filename: "src/app.ts", patch: "@@ -1 +1 @@\n unchanged" }],
    });

    expect(result.findings).toEqual([]);
    expect(result.summary.total).toBe(0);
    expect(result.summary.linesReviewed).toBe(0);
  });

  it("handles files without patches", async () => {
    const result = await reviewPullRequest({
      title: "Binary",
      description: null,
      files: [{ filename: "logo.png" }],
    });

    expect(result.findings).toEqual([]);
  });
});

describe("reviewFilesWithRules", () => {
  it("returns rule findings only", () => {
    const findings = reviewFilesWithRules([{ filename: "a.ts", patch }]);
    expect(findings.every((finding) => finding.rule?.startsWith("ai/") !== true)).toBe(true);
    expect(findings).toHaveLength(2);
  });
});
