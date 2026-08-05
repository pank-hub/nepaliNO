import { randomBytes } from "node:crypto";
import {
  TRANSLATION_BASE_BRANCH,
  TRANSLATION_BRANCH_PREFIX,
  TRANSLATION_REPOSITORY_NAME,
  TRANSLATION_REPOSITORY_OWNER,
} from "./config";
import { githubInstallationRequest } from "./token";
import { updateTranslationSources } from "./sourceUpdate";
import type {
  TranslationLanguage,
  TranslationModuleId,
} from "../translationBrowser/registry";
import type { ValidatedTranslationChange } from "../translationBrowser/validateProposal";

const repositoryPath =
  `/repos/${TRANSLATION_REPOSITORY_OWNER}/${TRANSLATION_REPOSITORY_NAME}`;

type GitReferenceResponse = {
  object?: { sha?: string };
};

type GitHubContentResponse = {
  type?: string;
  path?: string;
  sha?: string;
  encoding?: string;
  content?: string;
};

type GitHubPullRequestResponse = {
  number?: number;
  html_url?: string;
  head?: { ref?: string };
  base?: { ref?: string };
};

const safeJson = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(`GitHubResponseInvalid:${response.status}`);
  }
};

const requestJson = async <T>(
  path: string,
  init: RequestInit,
  failureCode: string,
): Promise<T> => {
  const response = await githubInstallationRequest(path, {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${failureCode}:${response.status}`);
  }

  return safeJson<T>(response);
};

const generatedBranchName = (
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
) => {
  const timestamp = new Date().toISOString().replaceAll(/[-:.TZ]/gu, "").slice(0, 14);
  const suffix = randomBytes(5).toString("hex");
  const safeModule = moduleId.replaceAll(/[^a-z0-9-]/gu, "-");
  const branch = `${TRANSLATION_BRANCH_PREFIX}${language}-${safeModule}-${timestamp}-${suffix}`;

  if (!branch.startsWith(TRANSLATION_BRANCH_PREFIX) || branch === TRANSLATION_BASE_BRANCH) {
    throw new Error("GeneratedTranslationBranchInvalid");
  }

  return branch;
};

const fetchMainSha = async () => {
  const response = await githubInstallationRequest(
    `${repositoryPath}/git/ref/heads/${TRANSLATION_BASE_BRANCH}`,
  );

  if (!response.ok) {
    throw new Error(`GitHubMainReferenceReadFailed:${response.status}`);
  }

  const body = await safeJson<GitReferenceResponse>(response);
  if (typeof body.object?.sha !== "string") {
    throw new Error("GitHubMainReferenceInvalid");
  }

  return body.object.sha;
};

const fetchTranslationSource = async (filePath: string, mainSha: string) => {
  const response = await githubInstallationRequest(
    `${repositoryPath}/contents/${filePath}?ref=${encodeURIComponent(mainSha)}`,
  );

  if (!response.ok) {
    throw new Error(`GitHubTranslationSourceReadFailed:${response.status}`);
  }

  const body = await safeJson<GitHubContentResponse>(response);
  if (
    body.type !== "file" ||
    body.path !== filePath ||
    typeof body.sha !== "string" ||
    body.encoding !== "base64" ||
    typeof body.content !== "string"
  ) {
    throw new Error("GitHubTranslationSourceInvalid");
  }

  return {
    source: Buffer.from(body.content.replaceAll(/\s/gu, ""), "base64").toString("utf8"),
    blobSha: body.sha,
  };
};

const createBranch = async (branchName: string, mainSha: string) =>
  requestJson(
    `${repositoryPath}/git/refs`,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      }),
    },
    "GitHubTranslationBranchCreateFailed",
  );

const deleteBranch = async (branchName: string) => {
  if (!branchName.startsWith(TRANSLATION_BRANCH_PREFIX)) return;

  try {
    await githubInstallationRequest(
      `${repositoryPath}/git/refs/heads/${branchName}`,
      { method: "DELETE" },
    );
  } catch {
    // Best-effort cleanup. The original controlled failure remains authoritative.
  }
};

const commitTranslationFile = async (
  filePath: string,
  updatedSource: string,
  blobSha: string,
  branchName: string,
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
) =>
  requestJson(
    `${repositoryPath}/contents/${filePath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `update ${language} ${moduleId} translations`,
        content: Buffer.from(updatedSource, "utf8").toString("base64"),
        sha: blobSha,
        branch: branchName,
      }),
    },
    "GitHubTranslationCommitFailed",
  );

const openTranslationPullRequest = async (
  branchName: string,
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
  changedKeys: string[],
) => {
  const title = `Update ${language} ${moduleId} translations`;
  const body = [
    "## Translation Editor proposal",
    "",
    `Language: \`${language}\``,
    `Module: \`${moduleId}\``,
    `Changed strings: ${changedKeys.length}`,
    "",
    "### Changed keys",
    ...changedKeys.map((key) => `- \`${key}\``),
    "",
    "This pull request was generated by the protected nepali.no Translation Editor.",
    "The change requires the protected main-branch checks and manual review before merging.",
  ].join("\n");

  const pullRequest = await requestJson<GitHubPullRequestResponse>(
    `${repositoryPath}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        body,
        head: branchName,
        base: TRANSLATION_BASE_BRANCH,
        maintainer_can_modify: false,
      }),
    },
    "GitHubTranslationPullRequestCreateFailed",
  );

  if (
    typeof pullRequest.number !== "number" ||
    typeof pullRequest.html_url !== "string" ||
    pullRequest.head?.ref !== branchName ||
    pullRequest.base?.ref !== TRANSLATION_BASE_BRANCH
  ) {
    throw new Error("GitHubTranslationPullRequestInvalid");
  }

  return {
    number: pullRequest.number,
    url: pullRequest.html_url,
  };
};

export type CreateTranslationPullRequestInput = {
  language: TranslationLanguage;
  moduleId: TranslationModuleId;
  changes: ValidatedTranslationChange[];
};

export const createTranslationPullRequest = async (
  input: CreateTranslationPullRequestInput,
) => {
  const mainSha = await fetchMainSha();

  const firstKey = input.changes[0]?.key;
  if (!firstKey) throw new Error("NoTranslationChanges");

  const filePath =
    input.moduleId === "event-submission"
      ? `src/i18n/eventSubmission.${input.language}.ts`
      : input.moduleId === "directory-submission"
        ? `src/i18n/directorySubmission.${input.language}.ts`
        : `src/i18n/${input.language}.ts`;
  const { source, blobSha } = await fetchTranslationSource(filePath, mainSha);
  const updated = updateTranslationSources(
    input.language,
    input.moduleId,
    input.changes,
    new Map([[filePath, source]]),
  );

  if (updated.files.length !== 1 || updated.files[0].filePath !== filePath) {
    throw new Error("TranslationUpdatedFileBoundaryMismatch");
  }

  const updatedFile = updated.files[0];
  const branchName = generatedBranchName(input.language, input.moduleId);
  let branchCreated = false;

  try {
    await createBranch(branchName, mainSha);
    branchCreated = true;
    await commitTranslationFile(
      filePath,
      updatedFile.updatedSource,
      blobSha,
      branchName,
      input.language,
      input.moduleId,
    );
    const pullRequest = await openTranslationPullRequest(
      branchName,
      input.language,
      input.moduleId,
      updatedFile.changedKeys,
    );

    return {
      repository: `${TRANSLATION_REPOSITORY_OWNER}/${TRANSLATION_REPOSITORY_NAME}`,
      baseBranch: TRANSLATION_BASE_BRANCH,
      branchName,
      filePath,
      changedKeys: updatedFile.changedKeys,
      pullRequest,
    };
  } catch (error) {
    if (branchCreated) await deleteBranch(branchName);
    throw error;
  }
};
