import { describe, expect, it } from "vitest";

import type { DiffLine } from "./diff";
import { runRules } from "./rules";

function review(content: string, file = "src/app.ts"): DiffLine[] {
  return [{ file, line: 1, content }];
}

describe("runRules", () => {
  it("flags an AWS access key as critical", () => {
    const [finding] = runRules(review('const key = "AKIAIOSFODNN7EXAMPLE";'));

    expect(finding.severity).toBe("critical");
    expect(finding.rule).toBe("security/aws-access-key");
    expect(finding.filePath).toBe("src/app.ts");
    expect(finding.lineStart).toBe(1);
  });

  it("flags a private key block", () => {
    const findings = runRules(review("-----BEGIN RSA PRIVATE KEY-----"));
    expect(findings.some((finding) => finding.severity === "critical")).toBe(true);
  });

  it("flags a hardcoded secret assignment", () => {
    const findings = runRules(review('const apiKey = "sk_live_abcdef123456";'));
    expect(findings.some((finding) => finding.rule === "security/hardcoded-secret")).toBe(true);
  });

  it("does not flag a secret read from the environment", () => {
    const findings = runRules(
      review('const apiKey = process.env.API_KEY ?? "sk_live_abcdef123456";'),
    );
    expect(findings.some((finding) => finding.rule === "security/hardcoded-secret")).toBe(false);
  });

  it("flags eval and dynamic function construction", () => {
    expect(runRules(review("eval(userInput);")).length).toBeGreaterThan(0);
    expect(runRules(review("const f = new Function('return 1');")).length).toBeGreaterThan(0);
  });

  it("flags unsafe HTML sinks", () => {
    expect(runRules(review("<div dangerouslySetInnerHTML={{ __html: x }} />")).length).toBeGreaterThan(0);
    expect(runRules(review("el.innerHTML = payload;")).length).toBeGreaterThan(0);
  });

  it("flags string-built SQL", () => {
    const findings = runRules(review("db.query(`SELECT * FROM users WHERE id = ${id}`);"));
    expect(findings.some((finding) => finding.category === "security")).toBe(true);
  });

  it("treats console.log as informational and only for code files", () => {
    const ts = runRules(review("console.log('debug');"));
    expect(ts.some((finding) => finding.severity === "info")).toBe(true);

    const md = runRules(review("console.log('debug');", "docs/readme.md"));
    expect(md.some((finding) => finding.rule === "style/console-log")).toBe(false);
  });

  it("flags any only in TypeScript files", () => {
    expect(runRules(review("const x: any = 1;", "a.ts")).some((f) => f.rule === "style/any-type")).toBe(true);
    expect(runRules(review("const x: any = 1;", "a.py")).some((f) => f.rule === "style/any-type")).toBe(false);
  });

  it("flags loose equality but not arrow functions", () => {
    expect(runRules(review("if (a == b) {}")).some((f) => f.rule === "style/loose-equality")).toBe(true);
    expect(runRules(review("const f = (a) => a;")).some((f) => f.rule === "style/loose-equality")).toBe(false);
  });

  it("returns nothing for clean code", () => {
    const findings = runRules(
      review("const total = items.reduce((sum, item) => sum + item.price, 0);"),
    );
    expect(findings).toEqual([]);
  });

  it("deduplicates a rule per file and line", () => {
    const lines: DiffLine[] = [
      { file: "a.ts", line: 4, content: "console.log('x');" },
      { file: "a.ts", line: 4, content: "console.log('x');" },
    ];

    const findings = runRules(lines).filter((f) => f.rule === "style/console-log");
    expect(findings).toHaveLength(1);
  });
});
