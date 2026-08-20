import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import type { JiraIssuePageResponse } from '@/features/jack-henry/jira-projects/types/JiraIssue';

const jiraProjectIssuesPath = '/config/jira/projects';
export const JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE = 10;

type FetchJiraProjectIssuesOptions = {
    page?: number;
    pageSize?: number;
};

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    const normalized = Math.floor(value);
    return normalized > 0 ? normalized : fallback;
}

export const useJiraProjectIssueStore = defineStore('jiraProjectIssues', () => {
    const issues = ref<JiraIssuePageResponse['items']>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(1);
    const pageSize = ref(JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
    const totalCount = ref(0);
    const totalPages = ref(0);
    const activeProjectKey = ref<string>('');

    function applyPage(data: JiraIssuePageResponse): void {
        issues.value = data.items;
        page.value = data.page;
        pageSize.value = data.pageSize;
        totalCount.value = data.totalCount;
        totalPages.value = data.totalPages;
    }

    async function fetchProjectIssues(projectKey: string, options: FetchJiraProjectIssuesOptions = {}): Promise<JiraIssuePageResponse | null> {
        error.value = null;

        const normalizedKey = projectKey.trim();
        if (!normalizedKey) {
            issues.value = [];
            totalCount.value = 0;
            totalPages.value = 0;
            return null;
        }

        loading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<JiraIssuePageResponse>(`${jiraProjectIssuesPath}/${encodeURIComponent(normalizedKey)}/issues`, {
                params: {
                    page: requestPage,
                    pageSize: requestPageSize
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

    function clearError(): void {
        error.value = null;
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
        page,
        pageSize,
        totalCount,
        totalPages,
        activeProjectKey,
        fetchProjectIssues,
        clearError
    };
});


