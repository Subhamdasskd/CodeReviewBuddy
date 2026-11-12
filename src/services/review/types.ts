export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "security"
  | "bug"
  | "performance"
  | "style"
  | "test"
  | "docs";

export type Finding = {
  rule: string | null;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  confidence: number | null;
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function severityWeight(severity: string): number {
  return SEVERITY_ORDER[severity as Severity] ?? SEVERITY_ORDER.info;
}
