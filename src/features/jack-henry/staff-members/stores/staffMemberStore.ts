import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateStaffMemberDto, StaffMember, UpdateStaffMemberDto } from '@/features/jack-henry/staff-members/types/StaffMember';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const staffMembersPath = '/staff-members';

export const useStaffMemberStore = defineStore('staffMembers', () => {
    const staffMembers = ref<StaffMember[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchStaffMembers(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<StaffMember[]>(staffMembersPath);
            staffMembers.value = data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch staff members');
        } finally {
            loading.value = false;
        }
    }

    async function getStaffMember(id: string): Promise<StaffMember | null> {
        error.value = null;

        const existing = staffMembers.value.find((m) => m.id === id);
        if (existing) {
            return existing;
        }

        loading.value = true;
        try {
            const { data } = await axios.get<StaffMember>(`${staffMembersPath}/${id}`);
            const exists = staffMembers.value.some((m) => m.id === data.id);
            if (!exists) {
                staffMembers.value.push(data);
            }
            return data;
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get staff member');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createStaffMember(dto: CreateStaffMemberDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<StaffMember>(staffMembersPath, dto);
            staffMembers.value.push(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create staff member');
        } finally {
            loading.value = false;
        }
    }

    async function updateStaffMember(id: string, dto: UpdateStaffMemberDto): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<StaffMember>(`${staffMembersPath}/${id}`, dto);
            const index = staffMembers.value.findIndex((m) => m.id === id);
            if (index !== -1) {
                staffMembers.value[index] = data;
            } else {
                staffMembers.value.push(data);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update staff member');
        } finally {
            loading.value = false;
        }
    }

    async function deleteStaffMember(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${staffMembersPath}/${id}`);
            staffMembers.value = staffMembers.value.filter((m) => m.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete staff member');
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
        staffMembers,
        loading,
        error,
        fetchStaffMembers,
        getStaffMember,
        createStaffMember,
        updateStaffMember,
        deleteStaffMember,
        clearError
    };
});
