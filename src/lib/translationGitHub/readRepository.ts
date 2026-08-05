import {
  TRANSLATION_BASE_BRANCH,
  TRANSLATION_REPOSITORY_NAME,
  TRANSLATION_REPOSITORY_OWNER,
} from "./config";
import { githubInstallationRequest } from "./token";

type BranchResponse = {
  name?: string;
  commit?: {
    sha?: string;
  };
  protected?: boolean;
};

type RepositoryResponse = {
  full_name?: string;
  default_branch?: string;
  visibility?: string;
  permissions?: {
    pull?: boolean;
    push?: boolean;
    admin?: boolean;
  };
};

export const readTranslationRepositoryStatus = async () => {
  const repositoryPath = `/repos/${TRANSLATION_REPOSITORY_OWNER}/${TRANSLATION_REPOSITORY_NAME}`;
  const [repositoryResponse, branchResponse] = await Promise.all([
    githubInstallationRequest(repositoryPath),
    githubInstallationRequest(
      `${repositoryPath}/branches/${encodeURIComponent(TRANSLATION_BASE_BRANCH)}`,
    ),
  ]);

  if (!repositoryResponse.ok) {
    throw new Error(`GitHubRepositoryReadFailed:${repositoryResponse.status}`);
  }

  if (!branchResponse.ok) {
    throw new Error(`GitHubBranchReadFailed:${branchResponse.status}`);
  }

  const repository = (await repositoryResponse.json()) as RepositoryResponse;
  const branch = (await branchResponse.json()) as BranchResponse;

  if (
    repository.full_name !==
      `${TRANSLATION_REPOSITORY_OWNER}/${TRANSLATION_REPOSITORY_NAME}` ||
    repository.default_branch !== TRANSLATION_BASE_BRANCH ||
    branch.name !== TRANSLATION_BASE_BRANCH ||
    typeof branch.commit?.sha !== "string"
  ) {
    throw new Error("GitHubRepositoryBoundaryMismatch");
  }

  return {
    repository: repository.full_name,
    visibility: repository.visibility ?? "unknown",
    defaultBranch: repository.default_branch,
    mainSha: branch.commit.sha,
    protected: branch.protected === true,
    installationPermissions: {
      pull: repository.permissions?.pull === true,
      push: repository.permissions?.push === true,
      admin: repository.permissions?.admin === true,
    },
  };
};
