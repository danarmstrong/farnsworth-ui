import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import type {
    JiraIssue,
    JiraIssueListItem,
    JiraIssuePageResponse,
    JiraIssueStatusCategoryCounts,
    JiraIssueStatusCategoryFilter
} from '@/features/jack-henry/jira-projects/types/JiraIssue';

const jiraProjectIssuesPath = '/config/jira/projects';
export const JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE = 10;

type FetchJiraProjectIssuesOptions = {
    page?: number;
    pageSize?: number;
    statusCategory?: JiraIssueStatusCategoryFilter;
};

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : fallback;
}

const DEFAULT_STATUS_CATEGORY_COUNTS: JiraIssueStatusCategoryCounts = {
    ToDo: 0,
    InProgress: 0,
    Done: 0,
    Uncategorized: 0
};

function normalizeStatusCategoryCounts(
    counts: JiraIssuePageResponse['statusCategoryCounts']
): JiraIssueStatusCategoryCounts {
    return {
        ToDo: Number(counts?.ToDo ?? 0),
        InProgress: Number(counts?.InProgress ?? 0),
        Done: Number(counts?.Done ?? 0),
        Uncategorized: Number(counts?.Uncategorized ?? 0)
    };
}

export const useJiraProjectIssueStore = defineStore('jiraProjectIssues', () => {
    const issues = ref<JiraIssueListItem[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const selectedIssue = ref<JiraIssue | null>(null);
    const selectedIssueLoading = ref(false);
    const selectedIssueError = ref<string | null>(null);
    const page = ref(1);
    const pageSize = ref(JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
    const totalCount = ref(0);
    const totalPages = ref(0);
    const statusCategoryCounts = ref<JiraIssueStatusCategoryCounts>({ ...DEFAULT_STATUS_CATEGORY_COUNTS });
    const activeProjectKey = ref<string>('');

    function applyPage(data: JiraIssuePageResponse): void {
        issues.value = data.items;
        page.value = data.page;
        pageSize.value = data.pageSize;
        totalCount.value = data.totalCount;
        totalPages.value = data.totalPages;
        statusCategoryCounts.value = normalizeStatusCategoryCounts(data.statusCategoryCounts);
    }

    function upsertIssue(issue: JiraIssue): void {
        const index = issues.value.findIndex((existingIssue) => existingIssue.id === issue.id);
        if (index === -1) {
            issues.value = [issue, ...issues.value];
            return;
        }

        issues.value[index] = issue;
    }

    async function fetchProjectIssues(projectKey: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        error.value = null;

        const normalizedKey = projectKey.trim();
        if (!normalizedKey) {
            issues.value = [];
            totalCount.value = 0;
            totalPages.value = 0;
            statusCategoryCounts.value = { ...DEFAULT_STATUS_CATEGORY_COUNTS };
            return null;
        }

        loading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
            const requestStatusCategory = options.statusCategory;
            const { data } = await axios.get<JiraIssuePageResponse>(`${jiraProjectIssuesPath}/${encodeURIComponent(normalizedKey)}/issues`, {
                params: {
                    page: requestPage,
                    pageSize: requestPageSize,
                    ...(requestStatusCategory ? { statusCategory: requestStatusCategory } : {})
                }
            });

            activeProjectKey.value = normalizedKey;
            applyPage(data);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira project issues');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function getProjectIssue(projectKey: string, issueId: string): Promise<JiraIssue | null> {
        selectedIssueError.value = null;

        const normalizedKey = projectKey.trim();
        const normalizedIssueId = issueId.trim();

        if (!normalizedKey || !normalizedIssueId) {
            selectedIssue.value = null;
            return null;
        }

        if (selectedIssue.value?.id === normalizedIssueId && selectedIssue.value.projectKey === normalizedKey) {
            return selectedIssue.value;
        }

        selectedIssue.value = null;
        selectedIssueLoading.value = true;
        try {
            const { data } = await axios.get<JiraIssue>(
                `${jiraProjectIssuesPath}/${encodeURIComponent(normalizedKey)}/issues/${encodeURIComponent(normalizedIssueId)}`
            );

            activeProjectKey.value = normalizedKey;
            selectedIssue.value = data;
            upsertIssue(data);
            return data;
        } catch (err) {
            selectedIssue.value = null;
            selectedIssueError.value = setErrorMessage(err, 'Failed to fetch Jira issue');
            return null;
        } finally {
            selectedIssueLoading.value = false;
        }
    }

    function clearError(): void {
        error.value = null;
    }

    function clearSelectedIssueError(): void {
        selectedIssueError.value = null;
    }

    function clearSelectedIssue(): void {
        selectedIssue.value = null;
        selectedIssueError.value = null;
    }

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }

        return fallback;
    }

    return {
        issues,
        loading,
        error,
        selectedIssue,
        selectedIssueLoading,
        selectedIssueError,
        page,
        pageSize,
        totalCount,
        totalPages,
        statusCategoryCounts,
        activeProjectKey,
        fetchProjectIssues,
        getProjectIssue,
        clearError,
        clearSelectedIssueError,
        clearSelectedIssue
    };
});


