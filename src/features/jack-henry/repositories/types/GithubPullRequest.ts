export type GithubPullRequestState = string | number;

export interface GithubPullRequestStaffMemberSlimReference {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
}

export interface GithubPullRequestJiraIssueSlimReference {
    id: string;
    jiraProjectId?: string | null;
    key: string;
    summary: string;
}

export interface GithubPullRequest {
    id: string;
    externalId: string;
    repositoryOwner: string;
    repositoryName: string;
    number: number;
    title: string;
    state: GithubPullRequestState;
    author: string | null;
    authorStaffMember: GithubPullRequestStaffMemberSlimReference | null;
    url: string;
    description: string;
    createdAtUtc: string | null;
    updatedAtUtc: string | null;
    closedAtUtc: string | null;
    mergedAtUtc: string | null;
    requestedReviewers: string[];
    requestedReviewerStaffMembers: GithubPullRequestStaffMemberSlimReference[];
    completedReviewers: string[];
    completedReviewerStaffMembers: GithubPullRequestStaffMemberSlimReference[];
    jiraIssueIds: string[];
    jiraIssues: GithubPullRequestJiraIssueSlimReference[];
    syncedAtUtc: string;
}

export interface GithubPullRequestPageResponse {
    items: GithubPullRequest[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

