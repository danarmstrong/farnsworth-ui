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
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const githubReposPath = '/github-repos';
export const GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE = 50;

type FetchRepositoryPullRequestsOptions = {
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

    function applyPullRequestPage(data: GithubPullRequestPageResponse): void {
        pullRequests.value = data.items;
        pullRequestsPage.value = data.page;
        pullRequestsPageSize.value = data.pageSize;
        pullRequestsTotalCount.value = data.totalCount;
        pullRequestsTotalPages.value = data.totalPages;
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
        clearError,
        clearPullRequestsError,
        clearSelectedPullRequestError,
        clearSelectedPullRequest
    };
});

