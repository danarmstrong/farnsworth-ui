import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import type {
    ApplicationSetting,
    ApplicationSettingUpsertItemRequest,
    ApplicationSettingsResponse,
    ApplicationSettingsUpsertRequest
} from '@/features/jack-henry/application-settings/types/ApplicationSetting';

const applicationSettingsPath = '/config/application-settings';

export const useApplicationSettingStore = defineStore('applicationSettings', () => {
    const items = ref<ApplicationSetting[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchApplicationSettings(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<ApplicationSettingsResponse>(applicationSettingsPath);
            items.value = data.items ?? [];
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch application settings');
        } finally {
            loading.value = false;
        }
    }

    async function replaceApplicationSettings(nextItems: ApplicationSettingUpsertItemRequest[]): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const payload: ApplicationSettingsUpsertRequest = {
                items: nextItems
            };
            const { data } = await axios.put<ApplicationSettingsResponse>(applicationSettingsPath, payload);
            items.value = data.items ?? [];
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to save application settings');
        } finally {
            loading.value = false;
        }
    }

    async function createApplicationSettings(nextItems: ApplicationSettingUpsertItemRequest[]): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const payload: ApplicationSettingsUpsertRequest = {
                items: nextItems
            };
            const { data } = await axios.post<ApplicationSettingsResponse>(applicationSettingsPath, payload);
            items.value = data.items ?? [];
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create application settings');
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
        items,
        loading,
        error,
        fetchApplicationSettings,
        createApplicationSettings,
        replaceApplicationSettings,
        clearError
    };
});


