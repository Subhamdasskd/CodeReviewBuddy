export type DiffLine = {
  /** File path relative to the repository root. */
  file: string;
  /** 1-based line number in the new version of the file. */
  line: number;
  /** Content of the added line, without the leading "+". */
  content: string;
};

export type FilePatch = {
  filename: string;
  patch?: string | null;
};

const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * Extracts the added lines from a set of GitHub file patches.
 *
 * Removed lines and hunk headers are skipped, and line numbers are tracked
 * against the new file so findings can point at the right place.
 */
export function extractAddedLines(files: FilePatch[]): DiffLine[] {
  const lines: DiffLine[] = [];

  for (const file of files) {
    if (!file.patch) continue;

    let newLine = 0;

    for (const raw of file.patch.split("\n")) {
      if (raw.startsWith("\\")) continue;

      const hunk = HUNK_HEADER.exec(raw);
      if (hunk) {
        newLine = Number(hunk[1]);
        continue;
      }

      if (raw.startsWith("+++") || raw.startsWith("---")) continue;

      if (raw.startsWith("+")) {
        lines.push({ file: file.filename, line: newLine, content: raw.slice(1) });
        newLine += 1;
        continue;
      }

      if (raw.startsWith("-")) continue;

      newLine += 1;
    }
  }

  return lines;
}

/** Renders added lines as a compact, readable diff for an AI prompt. */
export function formatDiffForPrompt(lines: DiffLine[], limit = 400): string {
  return lines
    .slice(0, limit)
    .map((line) => `${line.file}:${line.line}: +${line.content}`)
    .join("\n");
}
