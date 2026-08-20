<script setup lang="ts">
import StaffMemberTable from '@/features/jack-henry/staff-members/components/StaffMemberTable.vue';

defineProps<{
    staffMemberIds: string[];
}>();
</script>

<template>
    <StaffMemberTable
        :staff-member-ids="staffMemberIds"
        :show-create-button="false"
        search-label="Search team members"
        loading-text="Loading team members..."
        empty-state-text="No team members found."
    />
</template>

