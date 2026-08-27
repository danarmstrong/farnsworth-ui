export type BackgroundJobStatus = 'Queued' | 'Running' | 'Completed' | 'Failed';

export const BACKGROUND_JOB_STATUSES: BackgroundJobStatus[] = ['Queued', 'Running', 'Completed', 'Failed'];

export type BackgroundJobType =
    | 'JiraProjectSync'
    | 'JiraIssueReview'
    | 'GithubRepoSync'
    | 'GithubSecurityReview'
    | 'GitRepositoryClone'
    | 'GitRepositoryFetch'
    | 'GitRepositoryPull';

export const BACKGROUND_JOB_TYPES: BackgroundJobType[] = [
    'JiraProjectSync',
    'JiraIssueReview',
    'GithubRepoSync',
    'GithubSecurityReview',
    'GitRepositoryClone',
    'GitRepositoryFetch',
    'GitRepositoryPull'
];

export interface BackgroundJobDto {
    id: string;
    jobType: BackgroundJobType | string;
    status: BackgroundJobStatus | string;
    resourceKey: string;
    isActive: boolean;
    displayName: string;
    source: string;
    metadata: Record<string, string>;
    startedAtUtc: string | null;
    completedAtUtc: string | null;
    errorMessage: string | null;
    createdAtUtc: string;
    updatedAtUtc: string;
}

export interface BackgroundJobPageDto {
    items: BackgroundJobDto[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

