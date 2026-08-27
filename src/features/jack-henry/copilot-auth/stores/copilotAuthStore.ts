import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import type {
    CopilotCompleteLinkRequest,
    CopilotDeviceStartResponse,
    CopilotLinkStatusDto,
    CopilotProbeResultDto
} from '@/features/jack-henry/copilot-auth/types/CopilotAuth';

const copilotAuthPath = '/config/copilot-auth';

export const useCopilotAuthStore = defineStore('copilotAuth', () => {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const deviceStart = ref<CopilotDeviceStartResponse | null>(null);
    const status = ref<CopilotLinkStatusDto | null>(null);
    const probeResult = ref<CopilotProbeResultDto | null>(null);

    async function startLink(): Promise<CopilotDeviceStartResponse | null> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<CopilotDeviceStartResponse>(`${copilotAuthPath}/start-link`);
            deviceStart.value = data;
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to start Copilot linking flow');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function completeLink(deviceCode: string): Promise<CopilotLinkStatusDto | null> {
        error.value = null;
        loading.value = true;
        try {
            const payload: CopilotCompleteLinkRequest = { deviceCode };
            const { data } = await axios.post<CopilotLinkStatusDto>(`${copilotAuthPath}/complete-link`, payload);
            status.value = data;
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to complete Copilot linking flow');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchStatus(): Promise<CopilotLinkStatusDto | null> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<CopilotLinkStatusDto>(`${copilotAuthPath}/status`);
            status.value = data;
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch Copilot link status');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function probe(): Promise<CopilotProbeResultDto | null> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<CopilotProbeResultDto>(`${copilotAuthPath}/probe`);
            probeResult.value = data;
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to probe Copilot readiness');
            return null;
        } finally {
            loading.value = false;
        }
    }

    function clearError(): void {
        error.value = null;
    }

    function clearDeviceStart(): void {
        deviceStart.value = null;
    }

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }

        return fallback;
    }

    return {
        loading,
        error,
        deviceStart,
        status,
        probeResult,
        startLink,
        completeLink,
        fetchStatus,
        probe,
        clearError,
        clearDeviceStart
    };
});

