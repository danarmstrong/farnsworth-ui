<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import StaffMemberForm, { type StaffMemberFormSubmitPayload } from '@/features/jack-henry/staff-members/components/StaffMemberForm.vue';
import { useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import { useCostCenterStore } from '@/features/jack-henry/cost-centers/stores/costCenterStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import { useConfirm } from '@/utils/helpers/useConfirm';

const store = useStaffMemberStore();
const jobTitleStore = useJobTitleStore();
const costCenterStore = useCostCenterStore();
const confirm = useConfirm();

onMounted(() => {
    void store.fetchStaffMembers();
    if (!jobTitleStore.jobTitles.length) {
        void jobTitleStore.fetchJobTitles();
    }
    if (!costCenterStore.costCenters.length) {
        void costCenterStore.fetchCostCenters();
    }
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const staffMemberFormRef = ref<InstanceType<typeof StaffMemberForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase();
    return store.staffMembers.filter((m: StaffMember) => {
        const hay = [
            m.firstName,
            m.lastName,
            m.email,
            m.employeeNumber ?? '',
            `${m.firstName} ${m.lastName}`
        ]
            .join(' ')
            .toLowerCase();
        return hay.includes(normalizedSearch);
    });
});

const jobTitleLabelById = computed(() => {
    return new Map(jobTitleStore.jobTitles.map((jt) => [jt.id, `${jt.title} (${jt.jobCode})`]));
});

const costCenterLabelById = computed(() => {
    return new Map(costCenterStore.costCenters.map((cc) => [cc.id, `${cc.departmentNumber} — ${cc.name}`]));
});

const staffNameById = computed(() => {
    return new Map(
        store.staffMembers.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim() || m.email])
    );
});

function getJobTitleLabel(jobTitleId: string): string {
    return jobTitleLabelById.value.get(jobTitleId) || jobTitleId;
}

function getCostCenterLabel(costCenterId: string): string {
    return costCenterLabelById.value.get(costCenterId) || costCenterId;
}

function getManagerLabel(managerId: string | null): string {
    if (!managerId) {
        return '—';
    }
    return staffNameById.value.get(managerId) || managerId;
}

function editItem(item: StaffMember) {
    staffMemberFormRef.value?.openEdit(item);
}

async function deleteItem(item: StaffMember) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteStaffMember(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

function toDto(payload: StaffMemberFormSubmitPayload) {
    const { id: _id, ...rest } = payload;
    return rest;
}

async function save(payload: StaffMemberFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateStaffMember(payload.id, toDto(payload));
        } else {
            await store.createStaffMember(toDto(payload));
        }

        if (!store.error) {
            staffMemberFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search staff" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <StaffMemberForm
                ref="staffMemberFormRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 staff-member-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-name">Name</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-email">Email</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Job title</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-note">Cost center</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-manager">Manager</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-date">Start</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.staffMembers.length">
                        <td colspan="7" class="text-subtitle-1 text-center py-6">Loading staff members...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="7" class="text-subtitle-1 text-center py-6">No staff members found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-name">{{ item.firstName }} {{ item.lastName }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-email">{{ item.email }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ getJobTitleLabel(item.jobTitleId) }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-note">{{ getCostCenterLabel(item.costCenterId) }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-manager">{{ getManagerLabel(item.managerId) }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-date">{{ item.startDate }}</td>
                        <td class="text-right text-no-wrap col-actions">
                            <div class="d-flex align-center justify-end">
                                <v-tooltip text="Edit">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="editItem(item)" v-bind="props">
                                            <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="deleteItem(item)" v-bind="props">
                                            <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </perfect-scrollbar>
</template>

<style lang="scss">
.staff-member-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-actions {
        width: 1%;
        white-space: nowrap;
    }

    .col-name,
    .col-email,
    .col-code,
    .col-manager,
    .col-date {
        width: 1%;
        white-space: nowrap;
    }

    .col-note {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}
</style>
