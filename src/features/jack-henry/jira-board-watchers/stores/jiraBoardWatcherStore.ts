import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type {
    CreateJiraBoardWatcherDto,
    JiraBoardWatcher,
    UpdateJiraBoardWatcherDto
} from '@/features/jack-henry/jira-board-watchers/types/JiraBoardWatcher';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jiraBoardWatchersPath = '/config/jira/watchers/board';

export const useJiraBoardWatcherStore = defineStore('jiraBoardWatchers', () => {
    const items = ref<JiraBoardWatcher[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchJiraBoardWatchers(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<JiraBoardWatcher[]>(jiraBoardWatchersPath);
            items.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Jira board watchers');
        } finally {
            loading.value = false;
        }
    }

    async function getJiraBoardWatcher(id: string): Promise<JiraBoardWatcher | null> {
        error.value = null;

        const existing = items.value.find((w) => w.id === id);
        if (existing) {
            return existing;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<JiraBoardWatcher>(`${jiraBoardWatchersPath}/${id}`);
            const exists = items.value.some((w) => w.id === data.id);
            if (!exists) {
                items.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get Jira board watcher');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createJiraBoardWatcher(dto: CreateJiraBoardWatcherDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<JiraBoardWatcher>(jiraBoardWatchersPath, dto);
            items.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create Jira board watcher');
        } finally {
            loading.value = false;
        }
    }

    async function updateJiraBoardWatcher(id: string, dto: UpdateJiraBoardWatcherDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<JiraBoardWatcher>(`${jiraBoardWatchersPath}/${id}`, dto);
            const index = items.value.findIndex((w) => w.id === id);
            if (index !== -1) {
                items.value[index] = data;
            } else {
                items.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update Jira board watcher');
        } finally {
            loading.value = false;
        }
    }

    async function deleteJiraBoardWatcher(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${jiraBoardWatchersPath}/${id}`);
            items.value = items.value.filter((w) => w.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete Jira board watcher');
        } finally {
            loading.value = false;
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
        items,
        loading,
        error,
        fetchJiraBoardWatchers,
        getJiraBoardWatcher,
        createJiraBoardWatcher,
        updateJiraBoardWatcher,
        deleteJiraBoardWatcher,
        clearError
    };
});
