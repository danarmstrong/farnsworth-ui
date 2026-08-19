import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    CreateGithubRepositoryDto,
    GithubRepoQueryFilters,
    GithubRepository,
    GithubRepoSyncQueueResponse,
    UpdateGithubRepositoryDto
} from '@/features/jack-henry/repositories/types/GithubRepository';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const githubReposPath = '/github-repos';

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

    function clearError() {
        error.value = null;
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
        fetchGithubRepos,
        getGithubRepo,
        createGithubRepo,
        updateGithubRepo,
        deleteGithubRepo,
        queueSyncGithubRepo,
        queueCloneGithubRepo,
        queuePullGithubRepo,
        queueSyncAllGithubRepos,
        clearError
    };
});






