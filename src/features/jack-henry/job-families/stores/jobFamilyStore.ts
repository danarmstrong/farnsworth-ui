import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateJobFamilyDto, JobFamily, UpdateJobFamilyDto } from '@/features/jack-henry/job-families/types/JobFamily';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const jobFamiliesPath = '/job-families';

export const useJobFamilyStore = defineStore('jobFamilies', () => {
    const jobFamilies = ref<JobFamily[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchJobFamilies(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<JobFamily[]>(jobFamiliesPath);
            jobFamilies.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch job families');
        } finally {
            loading.value = false;
        }
    }

    async function getJobFamily(id: string): Promise<JobFamily | null> {
        error.value = null;

        const jobFamily = jobFamilies.value.find((sp) => sp.id === id);
        if (jobFamily) {
            return jobFamily;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<JobFamily>(`${jobFamiliesPath}/${id}`);
            const exists = jobFamilies.value.some((sp) => sp.id === data.id);
            if (!exists) {
                jobFamilies.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get job family');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createJobFamily(newJobFamily: CreateJobFamilyDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<JobFamily>(jobFamiliesPath, newJobFamily);
            jobFamilies.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create job family');
        } finally {
            loading.value = false;
        }
    }

    async function updateJobFamily(id: string, jobFamily: UpdateJobFamilyDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<JobFamily>(`${jobFamiliesPath}/${id}`, jobFamily);
            const index = jobFamilies.value.findIndex((sp) => sp.id === id);
            if (index !== -1) {
                jobFamilies.value[index] = data;
            } else {
                jobFamilies.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update job family');
        } finally {
            loading.value = false;
        }
    }

    async function deleteJobFamily(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete<JobFamily>(`${jobFamiliesPath}/${id}`);
            jobFamilies.value = jobFamilies.value.filter((sp) => sp.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete job family');
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
        jobFamilies,
        loading,
        error,
        fetchJobFamilies,
        getJobFamily,
        createJobFamily,
        updateJobFamily,
        deleteJobFamily,
        clearError
    };
});
