import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateJobTitleDto, JobTitle, UpdateJobTitleDto } from '@/features/jack-henry/job-titles/types/JobTitle';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jobTitlesPath = '/job-titles';

export const useJobTitleStore = defineStore('jobTitles', () => {
    const jobTitles = ref<JobTitle[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchJobTitles(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<JobTitle[]>(jobTitlesPath);
            jobTitles.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch job titles');
        } finally {
            loading.value = false;
        }
    }

    async function getJobTitle(id: string): Promise<JobTitle | null> {
        error.value = null;

        const jobTitle = jobTitles.value.find((sp) => sp.id === id);
        if (jobTitle) {
            return jobTitle;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<JobTitle>(`${jobTitlesPath}/${id}`);
            const exists = jobTitles.value.some((sp) => sp.id === data.id);
            if (!exists) {
                jobTitles.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get job title');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createJobTitle(newJobTitle: CreateJobTitleDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<JobTitle>(jobTitlesPath, newJobTitle);
            jobTitles.value.push(data);
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
        loading,
        error,
        fetchJobTitles,
        getJobTitle,
        createJobTitle,
        updateJobTitle,
        deleteJobTitle,
        clearError
    };
});
