import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    CreateJiraProjectDto,
    JiraProject,
    JiraProjectSyncQueueResponse,
    UpdateJiraProjectDto
} from '@/features/jack-henry/jira-projects/types/JiraProject';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jiraProjectsPath = '/config/jira/projects';

export const useJiraProjectStore = defineStore('jiraProjects', () => {
    const jiraProjects = ref<JiraProject[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchJiraProjects(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<JiraProject[]>(jiraProjectsPath);
            jiraProjects.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira projects');
        } finally {
            loading.value = false;
        }
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
            jiraProjects.value.push(data);
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
        loading,
        error,
        fetchJiraProjects,
        getJiraProject,
        createJiraProject,
        updateJiraProject,
        deleteJiraProject,
        queueSyncJiraProject,
        clearError
    };
});
