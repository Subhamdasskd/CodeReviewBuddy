import type { DiffLine } from "./diff";
import type { Finding, FindingCategory, Severity } from "./types";

type Rule = {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  confidence: number;
  /** Return true when the added line breaks this rule. */
  test: (line: string) => boolean;
  /** Restrict to file extensions, e.g. [".ts", ".tsx"]. */
  extensions?: string[];
};

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const SECRET_KEYWORDS = /(api[_-]?key|secret|passwd|password|token|credential)/i;

export const RULES: Rule[] = [
  {
    id: "security/aws-access-key",
    category: "security",
    severity: "critical",
    title: "Hardcoded AWS access key",
    description:
      "An AWS access key id appears in the diff. Committed credentials stay in git history even after removal.",
    suggestion:
      "Revoke the key in AWS IAM, then load it from an environment variable or secret manager.",
    confidence: 0.95,
    test: (line) => /AKIA[0-9A-Z]{16}/.test(line),
  },
  {
    id: "security/private-key",
    category: "security",
    severity: "critical",
    title: "Private key committed",
    description:
      "A PEM private key block was added to the repository.",
    suggestion:
      "Remove the key, rotate it, and store secrets outside the repository.",
    confidence: 0.98,
    test: (line) => /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/.test(line),
  },
  {
    id: "security/hardcoded-secret",
    category: "security",
    severity: "high",
    title: "Possible hardcoded secret",
    description:
      "A secret-looking value is assigned a long string literal. Hardcoded credentials leak through git history and client bundles.",
    suggestion:
      "Move the value into an environment variable and rotate the credential.",
    confidence: 0.7,
    test: (line) =>
      SECRET_KEYWORDS.test(line) &&
      /[:=]\s*["'`][^"'`]{12,}["'`]/.test(line) &&
      !/process\.env|import\.meta\.env/.test(line),
  },
  {
    id: "security/eval",
    category: "security",
    severity: "high",
    title: "Use of eval()",
    description:
      "eval() executes arbitrary code and is a common injection vector.",
    suggestion: "Replace eval() with an explicit parser or a lookup table.",
    confidence: 0.85,
    test: (line) => /\beval\s*\(/.test(line),
  },
  {
    id: "security/new-function",
    category: "security",
    severity: "high",
    title: "Dynamic code construction",
    description:
      "new Function() behaves like eval() and can execute injected strings.",
    suggestion: "Avoid dynamic function bodies; use a safe dispatch mechanism.",
    confidence: 0.85,
    test: (line) => /new\s+Function\s*\(/.test(line),
  },
  {
    id: "security/dangerous-html",
    category: "security",
    severity: "high",
    title: "Unsafe HTML injection",
    description:
      "dangerouslySetInnerHTML bypasses React's escaping and can introduce XSS.",
    suggestion:
      "Render text normally, or sanitise the HTML with a library such as DOMPurify.",
    confidence: 0.9,
    test: (line) => /dangerouslySetInnerHTML/.test(line),
  },
  {
    id: "security/innerhtml",
    category: "security",
    severity: "high",
    title: "Direct innerHTML assignment",
    description:
      "Assigning to innerHTML with untrusted data can execute injected markup.",
    suggestion: "Use textContent, or sanitise the value before inserting it.",
    confidence: 0.8,
    test: (line) => /\.innerHTML\s*=/.test(line),
  },
  {
    id: "security/sql-concatenation",
    category: "security",
    severity: "high",
    title: "Possible SQL injection",
    description:
      "A query is built by string concatenation or interpolation, so user input can change the statement.",
    suggestion:
      "Use parameterised queries or the ORM's query builder instead of string building.",
    confidence: 0.75,
    test: (line) =>
      /\b(query|execute|raw)\s*\(\s*[`"'][^`"']*(\$\{|\+\s*)/.test(line) ||
      /\b(SELECT|INSERT|UPDATE|DELETE)\b[^;]*\+\s*\w/.test(line),
  },
  {
    id: "bug/child-process",
    category: "security",
    severity: "medium",
    title: "Shell command execution",
    description:
      "Spawning a shell command can lead to command injection when arguments are dynamic.",
    suggestion:
      "Prefer execFile/spawn with an argument array, and validate any user input.",
    confidence: 0.6,
    test: (line) => /\b(exec|execSync)\s*\(/.test(line),
  },
  {
    id: "bug/debugger",
    category: "bug",
    severity: "medium",
    title: "Debugger statement",
    description: "A debugger statement would halt execution in a browser session.",
    suggestion: "Remove the debugger statement before merging.",
    confidence: 0.95,
    test: (line) => /^\s*debugger\s*;?\s*$/.test(line),
  },
  {
    id: "style/console-log",
    category: "style",
    severity: "info",
    title: "Console logging left in code",
    description: "console.log calls add noise to production output.",
    suggestion: "Remove the call or route it through the project's logger.",
    confidence: 0.9,
    test: (line) => /console\.(log|debug)\s*\(/.test(line),
    extensions: CODE_EXTENSIONS,
  },
  {
    id: "style/todo-comment",
    category: "docs",
    severity: "info",
    title: "Unresolved TODO",
    description: "A TODO/FIXME marker was added without a linked issue.",
    suggestion: "Resolve it, or reference an issue so it can be tracked.",
    confidence: 0.9,
    test: (line) => /\b(TODO|FIXME|HACK)\b/.test(line),
  },
  {
    id: "style/any-type",
    category: "style",
    severity: "low",
    title: "Explicit any",
    description:
      "The any type disables type checking for the value it describes.",
    suggestion: "Use a precise type, unknown, or a generic instead.",
    confidence: 0.8,
    test: (line) => /:\s*any\b/.test(line),
    extensions: [".ts", ".tsx"],
  },
  {
    id: "style/loose-equality",
    category: "bug",
    severity: "low",
    title: "Loose equality",
    description:
      "== performs type coercion and can produce surprising results.",
    suggestion: "Use === (or !==) unless coercion is intentional.",
    confidence: 0.85,
    test: (line) => /[^=!<>]==[^=]/.test(line) && !/=>/.test(line),
    extensions: CODE_EXTENSIONS,
  },
  {
    id: "security/insecure-random",
    category: "security",
    severity: "low",
    title: "Math.random() used for a sensitive value",
    description:
      "Math.random() is not cryptographically secure and is predictable.",
    suggestion: "Use crypto.randomUUID() or crypto.getRandomValues().",
    confidence: 0.7,
    test: (line) =>
      /Math\.random\(\)/.test(line) &&
      /(token|secret|password|nonce|salt|key)/i.test(line),
  },
  {
    id: "security/insecure-url",
    category: "security",
    severity: "low",
    title: "Plain HTTP URL",
    description: "Traffic to this URL is not encrypted.",
    suggestion: "Use https:// for anything outside localhost.",
    confidence: 0.6,
    test: (line) =>
      /http:\/\//.test(line) && !/http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(line),
  },
  {
    id: "style/target-blank",
    category: "security",
    severity: "low",
    title: "target=_blank without rel=noopener",
    description:
      "The opened page can access window.opener unless the relationship is severed.",
    suggestion: 'Add rel="noopener noreferrer" to the link.',
    confidence: 0.8,
    test: (line) =>
      /target=["']_blank["']/.test(line) && !/noopener/.test(line),
  },
];

function matchesExtension(rule: Rule, file: string): boolean {
  if (!rule.extensions) return true;
  const lower = file.toLowerCase();
  return rule.extensions.some((extension) => lower.endsWith(extension));
}

/**
 * Runs the deterministic rule set over added diff lines.
 *
 * Findings are deduplicated per rule + file + line so that a repeated pattern
 * inside one line cannot inflate the report.
 */
export function runRules(lines: DiffLine[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    for (const rule of RULES) {
      if (!matchesExtension(rule, line.file)) continue;
      if (!rule.test(line.content)) continue;

      const key = `${rule.id}:${line.file}:${line.line}`;
      if (seen.has(key)) continue;
      seen.add(key);

      findings.push({
        rule: rule.id,
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        suggestion: rule.suggestion,
        filePath: line.file,
        lineStart: line.line,
        lineEnd: line.line,
        confidence: rule.confidence,
      });
    }
  }

  return findings;
}
