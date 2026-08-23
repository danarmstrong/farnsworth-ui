import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    CreateGithubRepositoryDto,
    GithubRepoQueryFilters,
    GithubRepository,
    GithubRepoSyncQueueResponse,
    UpdateGithubRepositoryDto
} from '@/features/jack-henry/repositories/types/GithubRepository';
import type { GithubPullRequest, GithubPullRequestPageResponse } from '@/features/jack-henry/repositories/types/GithubPullRequest';
import type { GithubDependabotAlert, GithubDependabotAlertPageResponse } from '@/features/jack-henry/repositories/types/GithubDependabotAlert';
import type {
    GithubCodeScanningAlert,
    GithubCodeScanningAlertPageResponse
} from '@/features/jack-henry/repositories/types/GithubCodeScanningAlert';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const githubReposPath = '/github-repos';
export const GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE = 50;
export const GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE = 50;
export const GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE = 50;

type FetchRepositoryPullRequestsOptions = {
    page?: number;
    pageSize?: number;
};

type FetchRepositoryDependabotAlertsOptions = {
    page?: number;
    pageSize?: number;
};

type FetchRepositoryCodeScanningAlertsOptions = {
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

function toQueryParams(filters?: GithubRepoQueryFilters): Record<string, string> | undefined {
    if (!filters) {
        return undefined;
    }

    const params: Record<string, string> = {};
    if (typeof filters.isWatched === 'boolean') {
        params.isWatched = String(filters.isWatched);
    }
    if (typeof filters.isPersonal === 'boolean') {
        params.isPersonal = String(filters.isPersonal);
    }

    return Object.keys(params).length ? params : undefined;
}

export const useGithubRepoStore = defineStore('githubRepos', () => {
    const githubRepos = ref<GithubRepository[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const pullRequests = ref<GithubPullRequest[]>([]);
    const pullRequestsLoading = ref(false);
    const pullRequestsError = ref<string | null>(null);
    const pullRequestsPage = ref(1);
    const pullRequestsPageSize = ref(GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE);
    const pullRequestsTotalCount = ref(0);
    const pullRequestsTotalPages = ref(0);
    const activePullRequestRepositoryId = ref('');
    const selectedPullRequest = ref<GithubPullRequest | null>(null);
    const selectedPullRequestLoading = ref(false);
    const selectedPullRequestError = ref<string | null>(null);
    const dependabotAlerts = ref<GithubDependabotAlert[]>([]);
    const dependabotAlertsLoading = ref(false);
    const dependabotAlertsError = ref<string | null>(null);
    const dependabotAlertsPage = ref(1);
    const dependabotAlertsPageSize = ref(GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE);
    const dependabotAlertsTotalCount = ref(0);
    const dependabotAlertsTotalPages = ref(0);
    const activeDependabotAlertsRepositoryId = ref('');
    const selectedDependabotAlert = ref<GithubDependabotAlert | null>(null);
    const selectedDependabotAlertLoading = ref(false);
    const selectedDependabotAlertError = ref<string | null>(null);
    const codeScanningAlerts = ref<GithubCodeScanningAlert[]>([]);
    const codeScanningAlertsLoading = ref(false);
    const codeScanningAlertsError = ref<string | null>(null);
    const codeScanningAlertsPage = ref(1);
    const codeScanningAlertsPageSize = ref(GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE);
    const codeScanningAlertsTotalCount = ref(0);
    const codeScanningAlertsTotalPages = ref(0);
    const activeCodeScanningAlertsRepositoryId = ref('');
    const selectedCodeScanningAlert = ref<GithubCodeScanningAlert | null>(null);
    const selectedCodeScanningAlertLoading = ref(false);
    const selectedCodeScanningAlertError = ref<string | null>(null);

    function applyPullRequestPage(data: GithubPullRequestPageResponse): void {
        pullRequests.value = data.items;
        pullRequestsPage.value = data.page;
        pullRequestsPageSize.value = data.pageSize;
        pullRequestsTotalCount.value = data.totalCount;
        pullRequestsTotalPages.value = data.totalPages;
    }

    function applyDependabotAlertPage(data: GithubDependabotAlertPageResponse): void {
        dependabotAlerts.value = data.items;
        dependabotAlertsPage.value = data.page;
        dependabotAlertsPageSize.value = data.pageSize;
        dependabotAlertsTotalCount.value = data.totalCount;
        dependabotAlertsTotalPages.value = data.totalPages;
    }

    function applyCodeScanningAlertPage(data: GithubCodeScanningAlertPageResponse): void {
        codeScanningAlerts.value = data.items;
        codeScanningAlertsPage.value = data.page;
        codeScanningAlertsPageSize.value = data.pageSize;
        codeScanningAlertsTotalCount.value = data.totalCount;
        codeScanningAlertsTotalPages.value = data.totalPages;
    }

    async function fetchGithubRepos(filters?: GithubRepoQueryFilters): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<GithubRepository[]>(githubReposPath, {
                params: toQueryParams(filters)
            });
            githubRepos.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch repositories');
        } finally {
            loading.value = false;
        }
    }

    async function getGithubRepo(id: string): Promise<GithubRepository | null> {
        error.value = null;

        const existing = githubRepos.value.find((repo) => repo.id === id);
        if (existing) {
            return existing;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<GithubRepository>(`${githubReposPath}/${id}`);
            const exists = githubRepos.value.some((repo) => repo.id === data.id);
            if (!exists) {
                githubRepos.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get repository');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createGithubRepo(dto: CreateGithubRepositoryDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<GithubRepository>(githubReposPath, dto);
            githubRepos.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create repository');
        } finally {
            loading.value = false;
        }
    }

    async function updateGithubRepo(id: string, dto: UpdateGithubRepositoryDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<GithubRepository>(`${githubReposPath}/${id}`, dto);
            const index = githubRepos.value.findIndex((repo) => repo.id === id);
            if (index !== -1) {
                githubRepos.value[index] = data;
            } else {
                githubRepos.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update repository');
        } finally {
            loading.value = false;
        }
    }

    async function deleteGithubRepo(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${githubReposPath}/${id}`);
            githubRepos.value = githubRepos.value.filter((repo) => repo.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete repository');
        } finally {
            loading.value = false;
        }
    }

    async function queueSyncGithubRepo(id: string): Promise<GithubRepoSyncQueueResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.post<GithubRepoSyncQueueResponse>(`${githubReposPath}/${id}/sync`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to queue repository sync');
            return null;
        }
    }

    async function queueCloneGithubRepo(id: string): Promise<GithubRepoSyncQueueResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.post<GithubRepoSyncQueueResponse>(`${githubReposPath}/${id}/clone`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to queue repository clone');
            return null;
        }
    }

    async function queuePullGithubRepo(id: string): Promise<GithubRepoSyncQueueResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.post<GithubRepoSyncQueueResponse>(`${githubReposPath}/${id}/pull`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to queue repository pull');
            return null;
        }
    }

    async function queueSyncAllGithubRepos(): Promise<GithubRepoSyncQueueResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.post<GithubRepoSyncQueueResponse>(`${githubReposPath}/sync`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to queue all repository syncs');
            return null;
        }
    }

    async function fetchRepositoryPullRequests(
        repositoryId: string,
        options: FetchRepositoryPullRequestsOptions = {}
    ): Promise<GithubPullRequestPageResponse | null> {
        pullRequestsError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        if (!normalizedRepositoryId) {
            activePullRequestRepositoryId.value = '';
            pullRequests.value = [];
            pullRequestsPage.value = 1;
            pullRequestsPageSize.value = GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE;
            pullRequestsTotalCount.value = 0;
            pullRequestsTotalPages.value = 0;
            return null;
        }

        pullRequestsLoading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<GithubPullRequestPageResponse>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/pull-requests`,
                {
                    params: {
                        page: requestPage,
                        pageSize: requestPageSize
                    }
                }
            );

            activePullRequestRepositoryId.value = normalizedRepositoryId;
            applyPullRequestPage(data);
            return data;
        } catch (err) {
            pullRequestsError.value = setErrorMessage(err, 'Failed to fetch repository pull requests');
            return null;
        } finally {
            pullRequestsLoading.value = false;
        }
    }

    async function fetchRepositoryDependabotAlerts(
        repositoryId: string,
        options: FetchRepositoryDependabotAlertsOptions = {}
    ): Promise<GithubDependabotAlertPageResponse | null> {
        dependabotAlertsError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        if (!normalizedRepositoryId) {
            activeDependabotAlertsRepositoryId.value = '';
            dependabotAlerts.value = [];
            dependabotAlertsPage.value = 1;
            dependabotAlertsPageSize.value = GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE;
            dependabotAlertsTotalCount.value = 0;
            dependabotAlertsTotalPages.value = 0;
            return null;
        }

        dependabotAlertsLoading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<GithubDependabotAlertPageResponse>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/dependabot-alerts`,
                {
                    params: {
                        page: requestPage,
                        pageSize: requestPageSize
                    }
                }
            );

            activeDependabotAlertsRepositoryId.value = normalizedRepositoryId;
            applyDependabotAlertPage(data);
            return data;
        } catch (err) {
            dependabotAlertsError.value = setErrorMessage(err, 'Failed to fetch repository dependabot alerts');
            return null;
        } finally {
            dependabotAlertsLoading.value = false;
        }
    }

    async function getRepositoryDependabotAlert(repositoryId: string, alertId: string): Promise<GithubDependabotAlert | null> {
        selectedDependabotAlertError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        const normalizedAlertId = alertId.trim();

        if (!normalizedRepositoryId || !normalizedAlertId) {
            selectedDependabotAlert.value = null;
            return null;
        }

        const existingFromPage = dependabotAlerts.value.find((alert) => alert.id === normalizedAlertId);
        if (existingFromPage) {
            selectedDependabotAlert.value = existingFromPage;
            return existingFromPage;
        }

        selectedDependabotAlert.value = null;
        selectedDependabotAlertLoading.value = true;

        try {
            const { data } = await axios.get<GithubDependabotAlert>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/dependabot-alerts/${encodeURIComponent(normalizedAlertId)}`
            );

            selectedDependabotAlert.value = data;
            return data;
        } catch (err) {
            selectedDependabotAlertError.value = setErrorMessage(err, 'Failed to fetch dependabot alert');
            selectedDependabotAlert.value = null;
            return null;
        } finally {
            selectedDependabotAlertLoading.value = false;
        }
    }

    async function fetchRepositoryCodeScanningAlerts(
        repositoryId: string,
        options: FetchRepositoryCodeScanningAlertsOptions = {}
    ): Promise<GithubCodeScanningAlertPageResponse | null> {
        codeScanningAlertsError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        if (!normalizedRepositoryId) {
            activeCodeScanningAlertsRepositoryId.value = '';
            codeScanningAlerts.value = [];
            codeScanningAlertsPage.value = 1;
            codeScanningAlertsPageSize.value = GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE;
            codeScanningAlertsTotalCount.value = 0;
            codeScanningAlertsTotalPages.value = 0;
            return null;
        }

        codeScanningAlertsLoading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<GithubCodeScanningAlertPageResponse>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/code-scanning-alerts`,
                {
                    params: {
                        page: requestPage,
                        pageSize: requestPageSize
                    }
                }
            );

            activeCodeScanningAlertsRepositoryId.value = normalizedRepositoryId;
            applyCodeScanningAlertPage(data);
            return data;
        } catch (err) {
            codeScanningAlertsError.value = setErrorMessage(err, 'Failed to fetch repository code scanning alerts');
            return null;
        } finally {
            codeScanningAlertsLoading.value = false;
        }
    }

    async function getRepositoryCodeScanningAlert(repositoryId: string, alertId: string): Promise<GithubCodeScanningAlert | null> {
        selectedCodeScanningAlertError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        const normalizedAlertId = alertId.trim();

        if (!normalizedRepositoryId || !normalizedAlertId) {
            selectedCodeScanningAlert.value = null;
            return null;
        }

        const existingFromPage = codeScanningAlerts.value.find((alert) => alert.id === normalizedAlertId);
        if (existingFromPage) {
            selectedCodeScanningAlert.value = existingFromPage;
            return existingFromPage;
        }

        selectedCodeScanningAlert.value = null;
        selectedCodeScanningAlertLoading.value = true;

        try {
            const { data } = await axios.get<GithubCodeScanningAlert>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/code-scanning-alerts/${encodeURIComponent(normalizedAlertId)}`
            );

            selectedCodeScanningAlert.value = data;
            return data;
        } catch (err) {
            selectedCodeScanningAlertError.value = setErrorMessage(err, 'Failed to fetch code scanning alert');
            selectedCodeScanningAlert.value = null;
            return null;
        } finally {
            selectedCodeScanningAlertLoading.value = false;
        }
    }

    async function getRepositoryPullRequest(repositoryId: string, pullRequestId: string): Promise<GithubPullRequest | null> {
        selectedPullRequestError.value = null;

        const normalizedRepositoryId = repositoryId.trim();
        const normalizedPullRequestId = pullRequestId.trim();

        if (!normalizedRepositoryId || !normalizedPullRequestId) {
            selectedPullRequest.value = null;
            return null;
        }

        const existingFromPage = pullRequests.value.find((pullRequest) => pullRequest.id === normalizedPullRequestId);
        if (existingFromPage) {
            selectedPullRequest.value = existingFromPage;
            return existingFromPage;
        }

        selectedPullRequest.value = null;
        selectedPullRequestLoading.value = true;

        try {
            const { data } = await axios.get<GithubPullRequest>(
                `${githubReposPath}/${encodeURIComponent(normalizedRepositoryId)}/pull-requests/${encodeURIComponent(normalizedPullRequestId)}`
            );

            selectedPullRequest.value = data;
            return data;
        } catch (err) {
            selectedPullRequestError.value = setErrorMessage(err, 'Failed to fetch pull request');
            selectedPullRequest.value = null;
            return null;
        } finally {
            selectedPullRequestLoading.value = false;
        }
    }

    function clearError() {
        error.value = null;
    }

    function clearPullRequestsError(): void {
        pullRequestsError.value = null;
    }

    function clearSelectedPullRequestError(): void {
        selectedPullRequestError.value = null;
    }

    function clearSelectedPullRequest(): void {
        selectedPullRequest.value = null;
        selectedPullRequestError.value = null;
    }

    function clearDependabotAlertsError(): void {
        dependabotAlertsError.value = null;
    }

    function clearSelectedDependabotAlertError(): void {
        selectedDependabotAlertError.value = null;
    }

    function clearSelectedDependabotAlert(): void {
        selectedDependabotAlert.value = null;
        selectedDependabotAlertError.value = null;
    }

    function clearCodeScanningAlertsError(): void {
        codeScanningAlertsError.value = null;
    }

    function clearSelectedCodeScanningAlertError(): void {
        selectedCodeScanningAlertError.value = null;
    }

    function clearSelectedCodeScanningAlert(): void {
        selectedCodeScanningAlert.value = null;
        selectedCodeScanningAlertError.value = null;
    }

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }
        return fallback;
    }

    return {
        githubRepos,
        loading,
        error,
        pullRequests,
        pullRequestsLoading,
        pullRequestsError,
        pullRequestsPage,
        pullRequestsPageSize,
        pullRequestsTotalCount,
        pullRequestsTotalPages,
        activePullRequestRepositoryId,
        selectedPullRequest,
        selectedPullRequestLoading,
        selectedPullRequestError,
        dependabotAlerts,
        dependabotAlertsLoading,
        dependabotAlertsError,
        dependabotAlertsPage,
        dependabotAlertsPageSize,
        dependabotAlertsTotalCount,
        dependabotAlertsTotalPages,
        activeDependabotAlertsRepositoryId,
        selectedDependabotAlert,
        selectedDependabotAlertLoading,
        selectedDependabotAlertError,
        codeScanningAlerts,
        codeScanningAlertsLoading,
        codeScanningAlertsError,
        codeScanningAlertsPage,
        codeScanningAlertsPageSize,
        codeScanningAlertsTotalCount,
        codeScanningAlertsTotalPages,
        activeCodeScanningAlertsRepositoryId,
        selectedCodeScanningAlert,
        selectedCodeScanningAlertLoading,
        selectedCodeScanningAlertError,
        fetchGithubRepos,
        getGithubRepo,
        createGithubRepo,
        updateGithubRepo,
        deleteGithubRepo,
        queueSyncGithubRepo,
        queueCloneGithubRepo,
        queuePullGithubRepo,
        queueSyncAllGithubRepos,
        fetchRepositoryPullRequests,
        getRepositoryPullRequest,
        fetchRepositoryDependabotAlerts,
        getRepositoryDependabotAlert,
        fetchRepositoryCodeScanningAlerts,
        getRepositoryCodeScanningAlert,
        clearError,
        clearPullRequestsError,
        clearSelectedPullRequestError,
        clearSelectedPullRequest,
        clearDependabotAlertsError,
        clearSelectedDependabotAlertError,
        clearSelectedDependabotAlert,
        clearCodeScanningAlertsError,
        clearSelectedCodeScanningAlertError,
        clearSelectedCodeScanningAlert
    };
});


