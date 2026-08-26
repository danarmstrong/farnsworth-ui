import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    JiraProjectBoardListResponse,
    CreateJiraProjectDto,
    JiraProject,
    JiraProjectPageResponse,
    JiraProjectSprintListResponse,
    JiraProjectSyncQueueResponse,
    UpdateJiraProjectDto
} from '@/features/jack-henry/jira-projects/types/JiraProject';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jiraProjectsPath = '/config/jira/projects';
export const JIRA_PROJECTS_DEFAULT_PAGE_SIZE = 10;
const JIRA_PROJECTS_ALL_PAGE_SIZE = 1000;

type FetchJiraProjectsOptions = {
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

function isJiraProjectPageResponse(data: unknown): data is JiraProjectPageResponse {
    if (typeof data !== 'object' || data === null) {
        return false;
    }

    const candidate = data as Partial<JiraProjectPageResponse>;
    return (
        Array.isArray(candidate.items) &&
        typeof candidate.page === 'number' &&
        typeof candidate.pageSize === 'number' &&
        typeof candidate.totalCount === 'number' &&
        typeof candidate.totalPages === 'number'
    );
}

export const useJiraProjectStore = defineStore('jiraProjects', () => {
    const jiraProjects = ref<JiraProject[]>([]);
    const pagedJiraProjects = ref<JiraProject[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(1);
    const pageSize = ref(JIRA_PROJECTS_DEFAULT_PAGE_SIZE);
    const totalCount = ref(0);
    const totalPages = ref(0);

    function applyJiraProjectsPage(data: JiraProjectPageResponse): void {
        pagedJiraProjects.value = data.items;
        page.value = data.page;
        pageSize.value = data.pageSize;
        totalCount.value = data.totalCount;
        totalPages.value = data.totalPages;

        const byId = new Map(jiraProjects.value.map((project) => [project.id, project]));
        for (const project of data.items) {
            byId.set(project.id, project);
        }
        jiraProjects.value = [...byId.values()];
    }

    async function fetchJiraProjects(options: FetchJiraProjectsOptions = {}): Promise<JiraProjectPageResponse | null> {
        error.value = null;
        loading.value = true;
        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, JIRA_PROJECTS_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<JiraProjectPageResponse | JiraProject[]>(jiraProjectsPath, {
                params: {
                    page: requestPage,
                    pageSize: requestPageSize
                }
            });

            const normalized = Array.isArray(data)
                ? {
                      items: data,
                      page: requestPage,
                      pageSize: requestPageSize,
                      totalCount: data.length,
                      totalPages: data.length > 0 ? 1 : 0
                  }
                : data;

            if (!isJiraProjectPageResponse(normalized)) {
                throw new Error('Unexpected Jira projects response shape.');
            }

            applyJiraProjectsPage(normalized);
            return normalized;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira projects');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchAllJiraProjects(): Promise<JiraProject[] | null> {
        const result = await fetchJiraProjects({ page: 1, pageSize: JIRA_PROJECTS_ALL_PAGE_SIZE });
        if (!result) {
            return null;
        }

        return result.items;
    }

    async function getJiraProject(id: string): Promise<JiraProject | null> {
        error.value = null;

        const existing = jiraProjects.value.find((p) => p.id === id);
        if (existing) {
            return existing;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<JiraProject>(`${jiraProjectsPath}/${id}`);
            const exists = jiraProjects.value.some((p) => p.id === data.id);
            if (!exists) {
                jiraProjects.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get Jira project');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createJiraProject(dto: CreateJiraProjectDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<JiraProject>(jiraProjectsPath, dto);
            jiraProjects.value = [data, ...jiraProjects.value.filter((p) => p.id !== data.id)];
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create Jira project');
        } finally {
            loading.value = false;
        }
    }

    async function updateJiraProject(id: string, dto: UpdateJiraProjectDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<JiraProject>(`${jiraProjectsPath}/${id}`, dto);
            const index = jiraProjects.value.findIndex((p) => p.id === id);
            if (index !== -1) {
                jiraProjects.value[index] = data;
            } else {
                jiraProjects.value.push(data);
            }

            const pagedIndex = pagedJiraProjects.value.findIndex((p) => p.id === id);
            if (pagedIndex !== -1) {
                pagedJiraProjects.value[pagedIndex] = data;
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update Jira project');
        } finally {
            loading.value = false;
        }
    }

    async function deleteJiraProject(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${jiraProjectsPath}/${id}`);
            jiraProjects.value = jiraProjects.value.filter((p) => p.id !== id);
            pagedJiraProjects.value = pagedJiraProjects.value.filter((p) => p.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete Jira project');
        } finally {
            loading.value = false;
        }
    }

    async function queueSyncJiraProject(id: string): Promise<JiraProjectSyncQueueResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.post<JiraProjectSyncQueueResponse>(`${jiraProjectsPath}/${id}/sync`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to queue Jira project sync');
            return null;
        }
    }

    async function getJiraProjectSprints(id: string): Promise<JiraProjectSprintListResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.get<JiraProjectSprintListResponse>(`${jiraProjectsPath}/${id}/sprints`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira project sprints');
            return null;
        }
    }

    async function getJiraProjectBoards(id: string): Promise<JiraProjectBoardListResponse | null> {
        error.value = null;
        try {
            const { data } = await axios.get<JiraProjectBoardListResponse>(`${jiraProjectsPath}/${id}/boards`);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira project boards');
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
        jiraProjects,
        pagedJiraProjects,
        loading,
        error,
        page,
        pageSize,
        totalCount,
        totalPages,
        fetchJiraProjects,
        fetchAllJiraProjects,
        getJiraProject,
        createJiraProject,
        updateJiraProject,
        deleteJiraProject,
        queueSyncJiraProject,
        getJiraProjectSprints,
        getJiraProjectBoards,
        clearError
    };
});
