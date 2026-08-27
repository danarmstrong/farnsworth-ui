/** Mirrors FarnsworthAPI `NotificationCategory` (ASP.NET JSON: PascalCase names). */
export type NotificationCategory =
    | 'Chat'
    | 'GitRepository'
    | 'Other'
    | 'JobJiraProjectSyncStarted'
    | 'JobJiraProjectSyncCompleted'
    | 'JobJiraProjectSyncFailed'
    | 'JobJiraIssueReviewStarted'
    | 'JobJiraIssueReviewCompleted'
    | 'JobJiraIssueReviewFailed'
    | 'JobGithubRepoSyncStarted'
    | 'JobGithubRepoSyncCompleted'
    | 'JobGithubRepoSyncFailed'
    | 'JobGithubSecurityReviewStarted'
    | 'JobGithubSecurityReviewCompleted'
    | 'JobGithubSecurityReviewFailed'
    | 'JobGitRepositoryCloneStarted'
    | 'JobGitRepositoryCloneCompleted'
    | 'JobGitRepositoryCloneFailed'
    | 'JobGitRepositoryFetchStarted'
    | 'JobGitRepositoryFetchCompleted'
    | 'JobGitRepositoryFetchFailed'
    | 'JobGitRepositoryPullStarted'
    | 'JobGitRepositoryPullCompleted'
    | 'JobGitRepositoryPullFailed';

export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    category: NotificationCategory | string | null;
    resourceId?: string | null;
    isUnread: boolean;
    isDismissed: boolean;
    createdAtUtc: string;
    readAtUtc: string | null;
    dismissedAtUtc: string | null;
}

export interface NotificationUnreadCountDto {
    unreadCount: number;
}
