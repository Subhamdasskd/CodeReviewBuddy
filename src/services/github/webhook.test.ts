import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { parsePullRequestEvent, verifySignature } from "./webhook";

const SECRET = "webhook-test-secret";

function sign(body: string, secret = SECRET): string {
  return `sha256=${createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;
}

describe("verifySignature", () => {
  it("accepts a correct signature", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(verifySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = sign(body);
    expect(verifySignature(`${body} `, signature, SECRET)).toBe(false);
  });

  it("rejects a signature from a different secret", () => {
    const body = "payload";
    expect(verifySignature(body, sign(body, "other-secret"), SECRET)).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    expect(verifySignature("body", null, SECRET)).toBe(false);
    expect(verifySignature("body", "md5=abc", SECRET)).toBe(false);
    expect(verifySignature("body", "sha256=not-hex", SECRET)).toBe(false);
    expect(verifySignature("body", "sha256=abcd", SECRET)).toBe(false);
  });
});

describe("parsePullRequestEvent", () => {
  const base = {
    action: "opened",
    number: 42,
    pull_request: { title: "Add feature" },
    repository: { id: 123456, full_name: "owner/repo" },
  };

  it("parses a reviewable pull_request event", () => {
    expect(parsePullRequestEvent(base)).toEqual({
      action: "opened",
      repositoryGithubId: "123456",
      repositoryFullName: "owner/repo",
      number: 42,
      title: "Add feature",
    });
  });

  it.each(["opened", "reopened", "synchronize", "ready_for_review"])(
    "accepts the %s action",
    (action) => {
      expect(parsePullRequestEvent({ ...base, action })?.action).toBe(action);
    },
  );

  it.each(["closed", "labeled", "edited"])("ignores the %s action", (action) => {
    expect(parsePullRequestEvent({ ...base, action })).toBeNull();
  });

  it("rejects payloads with missing fields", () => {
    expect(parsePullRequestEvent(null)).toBeNull();
    expect(parsePullRequestEvent({})).toBeNull();
    expect(parsePullRequestEvent({ ...base, repository: undefined })).toBeNull();
    expect(parsePullRequestEvent({ ...base, number: undefined })).toBeNull();
  });
});
