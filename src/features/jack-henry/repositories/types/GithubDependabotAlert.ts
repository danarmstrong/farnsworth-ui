export interface GithubRepoSlimDto {
    id: string;
    name: string;
    url: string;
}

export interface GithubAlertGithubPullRequestReferenceDto {
    id: string;
    externalId: string;
    number: number;
    title: string;
    state: string;
    url: string;
}

export interface GithubDependabotAlert {
    id: string;
    githubRepo: GithubRepoSlimDto;
    githubRepoId?: string;
    externalId: string;
    repositoryOwner: string;
    repositoryName: string;
    state: string;
    dependencyScope: string | null;
    packageEcosystem: string | null;
    packageName: string | null;
    vulnerableVersionRange: string | null;
    firstPatchedVersion: string | null;
    advisoryGhsaId: string | null;
    summary: string;
    description: string;
    severity: string;
    advisoryUrl: string | null;
    manifestPath: string | null;
    dismissReason: string | null;
    dismissComment: string | null;
    dismisser: string | null;
    createdAtUtc: string | null;
    dismissedAtUtc: string | null;
    fixedAtUtc: string | null;
    githubPullRequests: GithubAlertGithubPullRequestReferenceDto[];
    syncedAtUtc: string;
}

export interface GithubDependabotAlertPageResponse {
    items: GithubDependabotAlert[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

