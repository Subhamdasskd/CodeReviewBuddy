import { prisma } from "@/lib/prisma";
import { listPullRequestFiles } from "../github/pull-requests";
import { reviewPullRequest, type ReviewResult } from "./engine";

/**
 * Runs the review pipeline for a stored pull request and replaces its findings.
 *
 * The PR is marked "analyzing" while it runs so the UI can show progress, and
 * "failed" if the pipeline throws, so it can be retried.
 */
export async function reviewStoredPullRequest(
  pullRequestId: string,
  accessToken: string,
): Promise<ReviewResult> {
  const pullRequest = await prisma.pullRequest.findUnique({
    where: { id: pullRequestId },
    include: { repository: { select: { fullName: true } } },
  });

  if (!pullRequest) {
    throw new Error("Pull request not found");
  }

  await prisma.pullRequest.update({
    where: { id: pullRequestId },
    data: { reviewStatus: "analyzing" },
  });

  try {
    const files = await listPullRequestFiles(
      accessToken,
      pullRequest.repository.fullName,
      pullRequest.githubPrNumber,
    );

    const result = await reviewPullRequest({
      title: pullRequest.title,
      description: pullRequest.body,
      files,
    });

    // GitHub's pull-request list endpoint omits these counters, so they are
    // derived from the file patches that were actually reviewed.
    const filesChanged = files.length;
    const linesAdded = files.reduce((sum, file) => sum + file.additions, 0);
    const linesRemoved = files.reduce((sum, file) => sum + file.deletions, 0);

    const findings = result.findings.map((finding) => ({
      rule: finding.rule,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      suggestion: finding.suggestion,
      filePath: finding.filePath,
      lineStart: finding.lineStart,
      lineEnd: finding.lineEnd,
      confidence: finding.confidence,
      pullRequestId,
    }));

    await prisma.$transaction([
      prisma.reviewFinding.deleteMany({ where: { pullRequestId } }),
      ...findings.map((finding) => prisma.reviewFinding.create({ data: finding })),
      prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: {
          reviewStatus: "completed",
          filesChanged,
          linesAdded,
          linesRemoved,
        },
      }),
    ]);

    return result;
  } catch (error) {
    await prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: { reviewStatus: "failed" },
    });

    throw error;
  }
}
