import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { CreateStaffMemberDto, StaffMember, UpdateStaffMemberDto } from '@/features/jack-henry/staff-members/types/StaffMember';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const staffMembersPath = '/staff-members';

function normalizeStaffMember(m: StaffMember): StaffMember {
    return {
        ...m,
        aliases: Array.isArray(m.aliases) ? m.aliases : [],
        birthDate: m.birthDate ?? null,
        assignedIssues: Array.isArray(m.assignedIssues) ? m.assignedIssues : [],
        createdIssues: Array.isArray(m.createdIssues) ? m.createdIssues : [],
        reporterIssues: Array.isArray(m.reporterIssues) ? m.reporterIssues : [],
        authoredPullRequests: Array.isArray(m.authoredPullRequests) ? m.authoredPullRequests : [],
        reviewCompletedPullRequests: Array.isArray(m.reviewCompletedPullRequests) ? m.reviewCompletedPullRequests : [],
        reviewRequestedPullRequests: Array.isArray(m.reviewRequestedPullRequests) ? m.reviewRequestedPullRequests : []
    };
}

export const useStaffMemberStore = defineStore('staffMembers', () => {
    const staffMembers = ref<StaffMember[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchStaffMembers(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<StaffMember[]>(staffMembersPath);
            staffMembers.value = data.map(normalizeStaffMember);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch staff members');
        } finally {
            loading.value = false;
        }
    }

    async function getStaffMember(id: string): Promise<StaffMember | null> {
        error.value = null;

        loading.value = true;
        try {
            const { data } = await axios.get<StaffMember>(`${staffMembersPath}/${id}`);
            const normalized = normalizeStaffMember(data);
            const index = staffMembers.value.findIndex((m) => m.id === normalized.id);
            if (index === -1) {
                staffMembers.value.push(normalized);
            } else {
                staffMembers.value[index] = normalized;
            }
            return normalized;
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
            staffMembers.value.push(normalizeStaffMember(data));
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
            const normalized = normalizeStaffMember(data);
            const index = staffMembers.value.findIndex((m) => m.id === id);
            if (index !== -1) {
                staffMembers.value[index] = normalized;
            } else {
                staffMembers.value.push(normalized);
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
