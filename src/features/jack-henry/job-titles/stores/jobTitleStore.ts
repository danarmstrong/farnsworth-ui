import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateJobTitleDto, JobTitle, JobTitlePageResponse, UpdateJobTitleDto } from '@/features/jack-henry/job-titles/types/JobTitle';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jobTitlesPath = '/job-titles';
export const JOB_TITLES_DEFAULT_PAGE_SIZE = 10;
const JOB_TITLES_LOOKUP_PAGE_SIZE = 1000;

type FetchJobTitlesOptions = {
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

export const useJobTitleStore = defineStore('jobTitles', () => {
    const jobTitles = ref<JobTitle[]>([]);
    const pagedJobTitles = ref<JobTitle[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(1);
    const pageSize = ref(JOB_TITLES_DEFAULT_PAGE_SIZE);
    const totalCount = ref(0);
    const totalPages = ref(0);
    const hasLoadedAllJobTitles = ref(false);

    async function requestJobTitlesPage(requestPage: number, requestPageSize: number): Promise<JobTitlePageResponse> {
        const { data } = await axios.get<JobTitlePageResponse>(jobTitlesPath, {
            params: {
                page: requestPage,
                pageSize: requestPageSize
            }
        });

        return data;
    }

    function applyJobTitlesPage(data: JobTitlePageResponse): void {
        pagedJobTitles.value = data.items;
        page.value = data.page;
        pageSize.value = data.pageSize;
        totalCount.value = data.totalCount;
        totalPages.value = data.totalPages;
    }

    async function fetchJobTitles(options: FetchJobTitlesOptions = {}): Promise<JobTitlePageResponse | null> {
        error.value = null;
        loading.value = true;
        try {
            const data = await requestJobTitlesPage(
                normalizePositiveInteger(options.page, 1),
                normalizePositiveInteger(options.pageSize, JOB_TITLES_DEFAULT_PAGE_SIZE)
            );

            applyJobTitlesPage(data);
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch job titles');
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function fetchAllJobTitles(): Promise<JobTitle[]> {
        error.value = null;
        loading.value = true;
        try {
            const firstPage = await requestJobTitlesPage(1, JOB_TITLES_LOOKUP_PAGE_SIZE);
            const allJobTitles = [...firstPage.items];

            for (let currentPage = 2; currentPage <= Math.max(firstPage.totalPages, 1); currentPage += 1) {
                const pageResponse = await requestJobTitlesPage(currentPage, firstPage.pageSize);
                allJobTitles.push(...pageResponse.items);
            }

            jobTitles.value = allJobTitles;
            pagedJobTitles.value = allJobTitles;
            page.value = 1;
            pageSize.value = firstPage.pageSize;
            totalCount.value = allJobTitles.length;
            totalPages.value = allJobTitles.length > 0 ? 1 : 0;
            hasLoadedAllJobTitles.value = true;

            return allJobTitles;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch job titles');
            return [];
        } finally {
            loading.value = false;
        }
    }

    async function createJobTitle(newJobTitle: CreateJobTitleDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<JobTitle>(jobTitlesPath, newJobTitle);
            const index = jobTitles.value.findIndex((sp) => sp.id === data.id);
            if (index !== -1) {
                jobTitles.value[index] = data;
            } else {
                jobTitles.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create job title');
        } finally {
            loading.value = false;
        }
    }

    async function updateJobTitle(id: string, jobTitle: UpdateJobTitleDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<JobTitle>(`${jobTitlesPath}/${id}`, jobTitle);
            const index = jobTitles.value.findIndex((sp) => sp.id === id);
            if (index !== -1) {
                jobTitles.value[index] = data;
            } else {
                jobTitles.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update job title');
        } finally {
            loading.value = false;
        }
    }

    async function deleteJobTitle(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete<JobTitle>(`${jobTitlesPath}/${id}`);
            jobTitles.value = jobTitles.value.filter((sp) => sp.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete job title');
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
        jobTitles,
        pagedJobTitles,
        loading,
        error,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasLoadedAllJobTitles,
        fetchJobTitles,
        fetchAllJobTitles,
        createJobTitle,
        updateJobTitle,
        deleteJobTitle,
        clearError
    };
});
