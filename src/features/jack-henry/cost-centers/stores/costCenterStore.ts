import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateCostCenterDto, CostCenter, UpdateCostCenterDto } from '@/features/jack-henry/cost-centers/types/CostCenter';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const costCentersPath = '/cost-centers';

export const useCostCenterStore = defineStore('costCenters', () => {
    const costCenters = ref<CostCenter[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchCostCenters(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<CostCenter[]>(costCentersPath);
            costCenters.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch cost centers');
        } finally {
            loading.value = false;
        }
    }

    async function getCostCenter(id: string): Promise<CostCenter | null> {
        error.value = null;

        const costCenter = costCenters.value.find((sp) => sp.id === id);
        if (costCenter) {
            return costCenter;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<CostCenter>(`${costCentersPath}/${id}`);
            const exists = costCenters.value.some((sp) => sp.id === data.id);
            if (!exists) {
                costCenters.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get cost center');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createCostCenter(newCostCenter: CreateCostCenterDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<CostCenter>(costCentersPath, newCostCenter);
            costCenters.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create cost center');
        } finally {
            loading.value = false;
        }
    }

    async function updateCostCenter(id: string, costCenter: UpdateCostCenterDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<CostCenter>(`${costCentersPath}/${id}`, costCenter);
            const index = costCenters.value.findIndex((sp) => sp.id === id);
            if (index !== -1) {
                costCenters.value[index] = data;
            } else {
                costCenters.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update cost center');
        } finally {
            loading.value = false;
        }
    }

    async function deleteCostCenter(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete<CostCenter>(`${costCentersPath}/${id}`);
            costCenters.value = costCenters.value.filter((sp) => sp.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete cost center');
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
        costCenters,
        loading,
        error,
        fetchCostCenters,
        getCostCenter,
        createCostCenter,
        updateCostCenter,
        deleteCostCenter,
        clearError
    };
});
