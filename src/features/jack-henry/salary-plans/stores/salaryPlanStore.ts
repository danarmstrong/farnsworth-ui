import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateSalaryPlanDto, SalaryPlan, UpdateSalaryPlanDto } from '@/features/jack-henry/salary-plans/types/SalaryPlan';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

export const useSalaryPlanStore = defineStore('salaryPlans', () => {
    const salaryPlans = ref<SalaryPlan[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchSalaryPlans() : Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<SalaryPlan[]>('/api/salary-plans');
            salaryPlans.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch salary plans');
        } finally {
            loading.value = false;
        }
    }

    async function getSalaryPlan(id: string) : Promise<SalaryPlan | null> {
        error.value = null;

        const salaryPlan = salaryPlans.value.find(sp => sp.id === id);
        if (salaryPlan) {
            return salaryPlan;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<SalaryPlan>(`/api/salary-plans/${id}`);
            const exists = salaryPlans.value.some((sp) => sp.id === data.id);
            if (!exists) {
                salaryPlans.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get salary plan');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createSalaryPlan(newSalaryPlan: CreateSalaryPlanDto) : Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<SalaryPlan>('/api/salary-plans', newSalaryPlan);
            salaryPlans.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create salary plan');
        } finally {
            loading.value = false;
        }
    }

    async function updateSalaryPlan(id: string, salaryPlan: UpdateSalaryPlanDto) : Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<SalaryPlan>(`/api/salary-plans/${id}`, salaryPlan);
            const index = salaryPlans.value.findIndex((sp) => sp.id === id);
            if (index !== -1) {
                salaryPlans.value[index] = data;
            } else {
                salaryPlans.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update salary plan');
        } finally {
            loading.value = false;
        }
    }

    async function deleteSalaryPlan(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete<SalaryPlan>(`/api/salary-plans/${id}`);
            salaryPlans.value = salaryPlans.value.filter(sp => sp.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete salary plan');
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
        salaryPlans, loading, error,
        fetchSalaryPlans, getSalaryPlan, createSalaryPlan, updateSalaryPlan, deleteSalaryPlan, clearError,
    };
});
