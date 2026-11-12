import { describe, expect, it } from "vitest";

import { extractAddedLines, formatDiffForPrompt } from "./diff";

describe("extractAddedLines", () => {
  it("tracks new-file line numbers across hunks", () => {
    const lines = extractAddedLines([
      {
        filename: "src/a.ts",
        patch: [
          "@@ -1,3 +1,4 @@",
          " const a = 1;",
          "+const injected = eval(input);",
          " const b = 2;",
          "@@ -10,2 +11,3 @@",
          " function f() {",
          "+  console.log('hi');",
          " }",
        ].join("\n"),
      },
    ]);

    expect(lines).toEqual([
      { file: "src/a.ts", line: 2, content: "const injected = eval(input);" },
      { file: "src/a.ts", line: 12, content: "  console.log('hi');" },
    ]);
  });

  it("ignores removed lines and does not advance the new line counter for them", () => {
    const lines = extractAddedLines([
      {
        filename: "b.ts",
        patch: ["@@ -5,3 +5,3 @@", "-old", "+new", " context"].join("\n"),
      },
    ]);

    expect(lines).toEqual([{ file: "b.ts", line: 5, content: "new" }]);
  });

  it("skips files without a patch (binary or too large)", () => {
    const lines = extractAddedLines([
      { filename: "image.png", patch: undefined },
      { filename: "c.ts", patch: "@@ -1 +1 @@\n+x" },
    ]);

    expect(lines).toEqual([{ file: "c.ts", line: 1, content: "x" }]);
  });

  it("handles the no-newline marker", () => {
    const lines = extractAddedLines([
      { filename: "d.ts", patch: "@@ -1 +1 @@\n+last\n\\ No newline at end of file" },
    ]);

    expect(lines).toEqual([{ file: "d.ts", line: 1, content: "last" }]);
  });

  it("collects lines from multiple files", () => {
    const lines = extractAddedLines([
      { filename: "a.ts", patch: "@@ -1 +1 @@\n+a" },
      { filename: "b.ts", patch: "@@ -1 +1 @@\n+b" },
    ]);

    expect(lines.map((line) => line.file)).toEqual(["a.ts", "b.ts"]);
  });
});

describe("formatDiffForPrompt", () => {
  it("renders file:line: content and respects the limit", () => {
    const text = formatDiffForPrompt(
      [
        { file: "a.ts", line: 1, content: "x" },
        { file: "a.ts", line: 2, content: "y" },
      ],
      1,
    );

    expect(text).toBe("a.ts:1: +x");
  });
});
