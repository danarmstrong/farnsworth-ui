import { defineStore } from 'pinia';
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import axios from '@/utils/axios';
import type { BackgroundJobDto, BackgroundJobPageDto, BackgroundJobStatus, BackgroundJobType } from '@/features/jack-henry/background-jobs/types/BackgroundJob';

const backgroundJobsPath = '/background-jobs';
export const BACKGROUND_JOBS_DEFAULT_PAGE_SIZE = 50;

export type FetchBackgroundJobsOptions = {
    status?: BackgroundJobStatus | string | null;
    jobType?: BackgroundJobType | string | null;
    activeOnly?: boolean;
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

export const useBackgroundJobStore = defineStore('backgroundJobs', () => {
    const items = ref<BackgroundJobDto[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(1);
    const pageSize = ref(BACKGROUND_JOBS_DEFAULT_PAGE_SIZE);
    const totalCount = ref(0);
    const totalPages = ref(0);

    async function fetchBackgroundJobs(options: FetchBackgroundJobsOptions = {}): Promise<BackgroundJobPageDto | null> {
        error.value = null;
        loading.value = true;

        try {
            const requestPage = normalizePositiveInteger(options.page, 1);
            const requestPageSize = normalizePositiveInteger(options.pageSize, BACKGROUND_JOBS_DEFAULT_PAGE_SIZE);
            const { data } = await axios.get<BackgroundJobPageDto>(backgroundJobsPath, {
                params: {
                    status: options.status ?? undefined,
                    jobType: options.jobType ?? undefined,
                    activeOnly: options.activeOnly ?? false,
                    page: requestPage,
                    pageSize: requestPageSize
                }
            });

            items.value = data.items ?? [];
            page.value = data.page;
            pageSize.value = data.pageSize;
            totalCount.value = data.totalCount;
            totalPages.value = data.totalPages;

            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch background jobs');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function getBackgroundJobById(id: string): Promise<BackgroundJobDto | null> {
        if (!id?.trim()) {
            return null;
        }

        error.value = null;
        try {
            const { data } = await axios.get<BackgroundJobDto>(`${backgroundJobsPath}/${id}`);
            upsertBackgroundJob(data);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to load background job details');
            return null;
        }
    }

    function upsertBackgroundJob(job: BackgroundJobDto): void {
        const index = items.value.findIndex((existing) => existing.id === job.id);
        if (index >= 0) {
            items.value[index] = job;
            return;
        }

        items.value.unshift(job);
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
        page,
        pageSize,
        totalCount,
        totalPages,
        fetchBackgroundJobs,
        getBackgroundJobById,
        upsertBackgroundJob,
        clearError
    };
});

