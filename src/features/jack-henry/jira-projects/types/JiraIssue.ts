import type { PagedResponse } from '@/features/jack-henry/jira-projects/types/JiraProject';

export interface JiraIssueStatusReference {
    id: string;
    externalId: string;
    name: string;
}

export interface JiraIssueTypeReference {
    id: string;
    name: string;
}

export interface JiraIssueStaffReference {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
}

export interface JiraIssueUserIdentity {
    assigneeAccountId?: string | null;
    assigneeDisplayName?: string | null;
    reporterAccountId?: string | null;
    reporterDisplayName?: string | null;
    creatorAccountId?: string | null;
    creatorDisplayName?: string | null;
}

export interface JiraIssueReviewMetadata {
    isReviewed: boolean;
    score?: number | null;
    reason?: string | null;
    reviewedAtUtc?: string | null;
    lastAttemptedAtUtc?: string | null;
    model?: string | null;
    lastError?: string | null;
}

export interface JiraIssueStatusCategoryCounts {
    ToDo: number;
    InProgress: number;
    Done: number;
    Uncategorized: number;
}

export type JiraIssueStatusCategoryFilter = 'ToDo' | 'InProgress' | 'Done' | 'Uncategorized';

export type GithubPullRequestState = string | number;

export interface JiraIssueGithubPullRequestReference {
    id: string;
    externalId: string;
    number: number;
    title: string;
    state: GithubPullRequestState;
    url: string;
}

export type JiraIssuePriority = string | number;

export interface JiraIssueListItem {
    id: string;
    parentId?: string | null;
    parentExternalId?: string | null;
    parentKey?: string | null;
    jiraBoardId?: string | null;
    jiraBoardIds: string[];
    jiraStatusId: string;
    jiraStatusName: string;
    status?: JiraIssueStatusReference | null;
    jiraIssueTypeId: string;
    jiraIssueTypeName: string;
    type?: JiraIssueTypeReference | null;
    jiraSprintIds: string[];
    assignee?: string | null;
    assigneeStaffMember?: JiraIssueStaffReference | null;
    reporter?: string | null;
    reporterStaffMember?: JiraIssueStaffReference | null;
    creator?: string | null;
    creatorStaffMember?: JiraIssueStaffReference | null;
    externalId: string;
    projectKey: string;
    key: string;
    jiraLink: string;
    summary: string;
    description: string;
    labels?: string[];
    priority: JiraIssuePriority;
    notes: string[];
    githubPullRequestIds: string[];
    // Optional fields are emitted by older list payloads and by detail endpoints.
    jiraStatusCategoryName?: string | null;
    createdAtUtc?: string | null;
    updatedAtUtc?: string | null;
    jiraIdentity?: JiraIssueUserIdentity | null;
    reviewMetadata?: JiraIssueReviewMetadata | null;
    githubPullRequests?: JiraIssueGithubPullRequestReference[];
}

export interface JiraIssue extends JiraIssueListItem {
    jiraSprintId?: string | null;
    lastProjectSyncRunId?: string | null;
    storyPoints?: number | null;
    labels: string[];
    jiraIdentity: JiraIssueUserIdentity;
    reviewMetadata: JiraIssueReviewMetadata;
    githubPullRequests: JiraIssueGithubPullRequestReference[];
}

export interface JiraIssuePageResponse extends PagedResponse<JiraIssueListItem> {
    statusCategoryCounts?: Partial<JiraIssueStatusCategoryCounts>;
}
