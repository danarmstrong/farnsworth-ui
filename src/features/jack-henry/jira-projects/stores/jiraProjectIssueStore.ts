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

function normalizeRequiredId(value: string): string {
    return value.trim();
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
    const activeProjectId = ref<string>('');

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

    function resetIssueListing(): void {
        issues.value = [];
        totalCount.value = 0;
        totalPages.value = 0;
        statusCategoryCounts.value = { ...DEFAULT_STATUS_CATEGORY_COUNTS };
    }

    async function fetchIssuesForPath(path: string, projectId: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        loading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
            const requestStatusCategory = options.statusCategory;
            const { data } = await axios.get<JiraIssuePageResponse>(path, {
                params: {
                    page: requestPage,
                    pageSize: requestPageSize,
                    ...(requestStatusCategory ? { statusCategory: requestStatusCategory } : {})
                }
            });

            activeProjectId.value = projectId;
            applyPage(data);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira issues');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchProjectIssues(projectId: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        error.value = null;

        const normalizedProjectId = normalizeRequiredId(projectId);
        if (!normalizedProjectId) {
            resetIssueListing();
            return null;
        }

        return fetchIssuesForPath(`${jiraProjectIssuesPath}/${encodeURIComponent(normalizedProjectId)}/issues`, normalizedProjectId, options);
    }

    async function fetchSprintIssues(projectId: string, sprintId: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        error.value = null;

        const normalizedProjectId = normalizeRequiredId(projectId);
        const normalizedSprintId = normalizeRequiredId(sprintId);
        if (!normalizedProjectId || !normalizedSprintId) {
            resetIssueListing();
            return null;
        }

        const path = `${jiraProjectIssuesPath}/${encodeURIComponent(normalizedProjectId)}/sprints/${encodeURIComponent(normalizedSprintId)}/issues`;
        return fetchIssuesForPath(path, normalizedProjectId, options);
    }

    async function fetchBoardIssues(projectId: string, boardId: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        error.value = null;

        const normalizedProjectId = normalizeRequiredId(projectId);
        const normalizedBoardId = normalizeRequiredId(boardId);
        if (!normalizedProjectId || !normalizedBoardId) {
            resetIssueListing();
            return null;
        }

        const path = `${jiraProjectIssuesPath}/${encodeURIComponent(normalizedProjectId)}/boards/${encodeURIComponent(normalizedBoardId)}/issues`;
        return fetchIssuesForPath(path, normalizedProjectId, options);
    }

    async function getProjectIssue(projectId: string, issueId: string): Promise<JiraIssue | null> {
        selectedIssueError.value = null;

        const normalizedProjectId = projectId.trim();
        const normalizedIssueId = issueId.trim();

        if (!normalizedProjectId || !normalizedIssueId) {
            selectedIssue.value = null;
            return null;
        }

        if (selectedIssue.value?.id === normalizedIssueId && activeProjectId.value === normalizedProjectId) {
            return selectedIssue.value;
        }

        selectedIssue.value = null;
        selectedIssueLoading.value = true;
        try {
            const { data } = await axios.get<JiraIssue>(
                `${jiraProjectIssuesPath}/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(normalizedIssueId)}`
            );

            activeProjectId.value = normalizedProjectId;
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
        activeProjectId,
        fetchProjectIssues,
        fetchSprintIssues,
        fetchBoardIssues,
        getProjectIssue,
        clearError,
        clearSelectedIssueError,
        clearSelectedIssue
    };
});


