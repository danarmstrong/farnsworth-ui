import type { GithubPullRequestState } from '@/features/jack-henry/repositories/types/GithubPullRequest';

export interface StaffMemberJiraIssueSlim {
    id: string;
    jiraProjectId?: string | null;
    key: string;
    summary: string;
}

export interface StaffMemberGithubPullRequestSlim {
    id: string;
    externalId: string;
    number: number;
    title: string;
    state: GithubPullRequestState;
    url: string;
}

export interface StaffMemberWriteModel {
    jobTitleId: string;
    costCenterId: string;
    managerId: string | null;
    firstName: string;
    lastName: string;
    aliases: string[];
    employeeNumber: string | null;
    email: string;
    phoneNumber: string | null;
    companyProfileUrl: string | null;
    jiraUserId: string | null;
    githubUserId: string | null;
    slackUserId: string | null;
    teamsUserId: string | null;
    birthDate: string | null;
    startDate: string;
    endDate: string | null;
    salary: number | null;
}

export interface StaffMember extends StaffMemberWriteModel {
    id: string;
    assignedIssues: StaffMemberJiraIssueSlim[];
    createdIssues: StaffMemberJiraIssueSlim[];
    reporterIssues: StaffMemberJiraIssueSlim[];
    authoredPullRequests: StaffMemberGithubPullRequestSlim[];
    reviewCompletedPullRequests: StaffMemberGithubPullRequestSlim[];
    reviewRequestedPullRequests: StaffMemberGithubPullRequestSlim[];
}

export type CreateStaffMemberDto = StaffMemberWriteModel;
export type UpdateStaffMemberDto = StaffMemberWriteModel;
