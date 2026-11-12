import { createHmac, timingSafeEqual } from "node:crypto";

const REVIEWABLE_ACTIONS = new Set(["opened", "reopened", "synchronize", "ready_for_review"]);

/** Verifies GitHub's `X-Hub-Signature-256` header against the raw body. */
export function verifySignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !signature.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  const provided = signature.slice("sha256=".length);

  if (!/^[0-9a-f]+$/i.test(provided) || provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided, "hex"),
  );
}

export type PullRequestEvent = {
  action: string;
  repositoryGithubId: string;
  repositoryFullName: string;
  number: number;
  title: string;
};

/**
 * Extracts the fields the webhook needs from a GitHub `pull_request` payload.
 *
 * Returns null for actions that should not trigger a review (closed, labeled,
 * edited, ...) and for payloads that do not have the expected shape.
 */
export function parsePullRequestEvent(payload: unknown): PullRequestEvent | null {
  if (typeof payload !== "object" || payload === null) return null;

  const event = payload as {
    action?: unknown;
    number?: unknown;
    pull_request?: { title?: unknown };
    repository?: { id?: unknown; full_name?: unknown };
  };

  if (typeof event.action !== "string" || !REVIEWABLE_ACTIONS.has(event.action)) {
    return null;
  }

  const repositoryId = event.repository?.id;
  const fullName = event.repository?.full_name;

  if (
    (typeof repositoryId !== "number" && typeof repositoryId !== "string") ||
    typeof fullName !== "string" ||
    typeof event.number !== "number"
  ) {
    return null;
  }

  return {
    action: event.action,
    repositoryGithubId: String(repositoryId),
    repositoryFullName: fullName,
    number: event.number,
    title: typeof event.pull_request?.title === "string" ? event.pull_request.title : "",
  };
}
