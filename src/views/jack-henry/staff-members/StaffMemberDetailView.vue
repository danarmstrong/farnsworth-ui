<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import StaffMemberProfileLayout from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberProfileLayout.vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import { useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import { useCostCenterStore } from '@/features/jack-henry/cost-centers/stores/costCenterStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

const route = useRoute();
const store = useStaffMemberStore();
const jobTitleStore = useJobTitleStore();
const costCenterStore = useCostCenterStore();

const member = ref<StaffMember | null>(null);
const loadError = ref(false);

const memberId = computed(() => {
    const raw = route.params.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
});

const pageTitle = computed(() => {
    if (!member.value) {
        return 'Staff member';
    }
    const name = `${member.value.firstName} ${member.value.lastName}`.trim();
    return name || member.value.email;
});

const breadcrumbs = computed(() => [
    { text: 'Staff Members', disabled: false, to: '/staff-members' },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

const jobTitleLabelById = computed(() => {
    return new Map(jobTitleStore.jobTitles.map((jt) => [jt.id, jt.title]));
});

const costCenterLabelById = computed(() => {
    return new Map(costCenterStore.costCenters.map((cc) => [cc.id, `${cc.departmentNumber} — ${cc.name}`]));
});

const staffNameById = computed(() => {
    return new Map(store.staffMembers.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim() || m.email]));
});

const jobTitleLabel = computed(() => {
    if (!member.value) {
        return '';
    }
    return jobTitleLabelById.value.get(member.value.jobTitleId) || member.value.jobTitleId;
});

const costCenterLabel = computed(() => {
    if (!member.value) {
        return '';
    }
    return costCenterLabelById.value.get(member.value.costCenterId) || member.value.costCenterId;
});

const managerLabel = computed(() => {
    if (!member.value?.managerId) {
        return '—';
    }
    return staffNameById.value.get(member.value.managerId) || member.value.managerId;
});

async function loadMember(id: string) {
    loadError.value = false;
    member.value = null;
    store.clearError();

    if (!id) {
        loadError.value = true;
        return;
    }

    if (!jobTitleStore.jobTitles.length) {
        void jobTitleStore.fetchJobTitles();
    }
    if (!costCenterStore.costCenters.length) {
        void costCenterStore.fetchCostCenters();
    }

    const result = await store.getStaffMember(id);
    if (result) {
        member.value = result;
    } else {
        loadError.value = true;
    }
}

watch(
    memberId,
    (id) => {
        void loadMember(id);
    },
    { immediate: true }
);
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || store.error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            store.clearError();
            loadError = false;
        "
    >
        {{ store.error || 'Staff member could not be loaded.' }}
    </v-alert>

    <div v-else-if="store.loading && !member" class="text-subtitle-1 py-8 text-center">Loading…</div>

    <StaffMemberProfileLayout
        v-else-if="member"
        :member="member"
        :job-title-label="jobTitleLabel"
        :cost-center-label="costCenterLabel"
        :manager-label="managerLabel"
    />
</template>
