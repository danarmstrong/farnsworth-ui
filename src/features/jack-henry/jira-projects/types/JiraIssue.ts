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

export interface JiraIssue {
    id: string;
    parentId?: string | null;
    parentExternalId?: string | null;
    parentKey?: string | null;
    jiraBoardId?: string | null;
    jiraStatusId: string;
    jiraStatusName: string;
    status?: JiraIssueStatusReference | null;
    jiraIssueTypeId: string;
    jiraIssueTypeName: string;
    type?: JiraIssueTypeReference | null;
    jiraSprintId?: string | null;
    assignee?: string | null;
    assigneeStaffMember?: JiraIssueStaffReference | null;
    reporter?: string | null;
    reporterStaffMember?: JiraIssueStaffReference | null;
    creator?: string | null;
    creatorStaffMember?: JiraIssueStaffReference | null;
    externalId: string;
    projectKey: string;
    lastProjectSyncRunId?: string | null;
    key: string;
    jiraLink: string;
    summary: string;
    description: string;
    createdAtUtc?: string | null;
    updatedAtUtc?: string | null;
    priority: JiraIssuePriority;
    storyPoints?: number | null;
    notes: string[];
    githubPullRequestIds: string[];
    githubPullRequests: JiraIssueGithubPullRequestReference[];
}

export type JiraIssuePageResponse = PagedResponse<JiraIssue>;
