import type { NotificationCategory, NotificationDto } from '@/features/notifications/types/Notification';

type HrefBuilder = (dto: NotificationDto) => string | null;

const hrefByCategory: Record<NotificationCategory, HrefBuilder> = {
    Chat: (dto) => {
        const id = dto.resourceId?.trim();
        if (!id) {
            return null;
        }
        return `/chat/${encodeURIComponent(id)}`;
    },
    GitRepository: () => '/configuration/repositories',
    Other: () => null,
    JobJiraProjectSyncStarted: () => '/configuration/jira-projects',
    JobJiraProjectSyncCompleted: () => '/configuration/jira-projects',
    JobJiraProjectSyncFailed: () => '/configuration/jira-projects',
    JobJiraIssueReviewStarted: () => '/configuration/jira-projects',
    JobJiraIssueReviewCompleted: () => '/configuration/jira-projects',
    JobJiraIssueReviewFailed: () => '/configuration/jira-projects',
    JobGithubRepoSyncStarted: () => '/configuration/repositories',
    JobGithubRepoSyncCompleted: () => '/configuration/repositories',
    JobGithubRepoSyncFailed: () => '/configuration/repositories',
    JobGithubSecurityReviewStarted: () => '/configuration/repositories',
    JobGithubSecurityReviewCompleted: () => '/configuration/repositories',
    JobGithubSecurityReviewFailed: () => '/configuration/repositories',
    JobGitRepositoryCloneStarted: () => '/configuration/repositories',
    JobGitRepositoryCloneCompleted: () => '/configuration/repositories',
    JobGitRepositoryCloneFailed: () => '/configuration/repositories',
    JobGitRepositoryFetchStarted: () => '/configuration/repositories',
    JobGitRepositoryFetchCompleted: () => '/configuration/repositories',
    JobGitRepositoryFetchFailed: () => '/configuration/repositories',
    JobGitRepositoryPullStarted: () => '/configuration/repositories',
    JobGitRepositoryPullCompleted: () => '/configuration/repositories',
    JobGitRepositoryPullFailed: () => '/configuration/repositories'
};

/** Resolve in-app path for a notification row (e.g. deep link into chat). Unknown categories return null. */
export function getNotificationHref(dto: NotificationDto): string | null {
    const cat = dto.category;
    if (!cat || !(cat in hrefByCategory)) {
        return null;
    }
    return hrefByCategory[cat as NotificationCategory](dto);
}
