import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreatePayGradeDto, PayGrade, UpdatePayGradeDto } from '@/features/jack-henry/pay-grades/types/PayGrade';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const payGradesPath = '/pay-grades';

export const usePayGradeStore = defineStore('payGrades', () => {
    const payGrades = ref<PayGrade[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPayGrades(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<PayGrade[]>(payGradesPath);
            payGrades.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch pay grades');
        } finally {
            loading.value = false;
        }
    }

    async function getPayGrade(id: string): Promise<PayGrade | null> {
        error.value = null;

        const payGrade = payGrades.value.find((sp) => sp.id === id);
        if (payGrade) {
            return payGrade;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<PayGrade>(`${payGradesPath}/${id}`);
            const exists = payGrades.value.some((sp) => sp.id === data.id);
            if (!exists) {
                payGrades.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get pay grade');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createPayGrade(newPayGrade: CreatePayGradeDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<PayGrade>(payGradesPath, newPayGrade);
            payGrades.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create pay grade');
        } finally {
            loading.value = false;
        }
    }

    async function updatePayGrade(id: string, payGrade: UpdatePayGradeDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<PayGrade>(`${payGradesPath}/${id}`, payGrade);
            const index = payGrades.value.findIndex((sp) => sp.id === id);
            if (index !== -1) {
                payGrades.value[index] = data;
            } else {
                payGrades.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update pay grade');
        } finally {
            loading.value = false;
        }
    }

    async function deletePayGrade(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete<PayGrade>(`${payGradesPath}/${id}`);
            payGrades.value = payGrades.value.filter((sp) => sp.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete pay grade');
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
        payGrades,
        loading,
        error,
        fetchPayGrades,
        getPayGrade,
        createPayGrade,
        updatePayGrade,
        deletePayGrade,
        clearError
    };
});
