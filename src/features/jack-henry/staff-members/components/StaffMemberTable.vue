<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import StaffMemberForm, { type StaffMemberFormSubmitPayload } from '@/features/jack-henry/staff-members/components/StaffMemberForm.vue';
import { useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import { useCostCenterStore } from '@/features/jack-henry/cost-centers/stores/costCenterStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { PencilIcon, TrashIcon } from 'vue-tabler-icons';

const PerfectScrollbarTag = 'perfect-scrollbar';

interface Props {
    staffMemberIds?: string[];
    showCreateButton?: boolean;
    searchLabel?: string;
    loadingText?: string;
    emptyStateText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    staffMemberIds: undefined,
    showCreateButton: true,
    searchLabel: 'Search staff',
    loadingText: 'Loading staff members...',
    emptyStateText: 'No staff members found.'
});

const store = useStaffMemberStore();
const jobTitleStore = useJobTitleStore();
const costCenterStore = useCostCenterStore();
const confirm = useConfirm();

onMounted(() => {
    void store.fetchStaffMembers();
    if (!jobTitleStore.hasLoadedAllJobTitles) {
        void jobTitleStore.fetchAllJobTitles();
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

const filteredStaffMemberIds = computed(() => {
    if (!props.staffMemberIds) {
        return null;
    }

    return new Set(props.staffMemberIds);
});

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    const visibleStaffMembers = filteredStaffMemberIds.value
        ? store.staffMembers.filter((member) => filteredStaffMemberIds.value?.has(member.id))
        : store.staffMembers;

    const filtered = visibleStaffMembers.filter((m: StaffMember) => {
        const hay = [m.firstName, m.lastName, m.email, m.employeeNumber ?? '', `${m.firstName} ${m.lastName}`, ...(m.aliases ?? [])]
            .join(' ')
            .toLowerCase();
        return hay.includes(normalizedSearch);
    });
    const byName = (a: StaffMember, b: StaffMember) => {
        const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: 'base' });
        if (last !== 0) {
            return last;
        }
        return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: 'base' });
    };
    return [...filtered].sort(byName);
});

const jobTitleLabelById = computed(() => {
    return new Map(jobTitleStore.jobTitles.map((jt) => [jt.id, jt.title]));
});

const staffNameById = computed(() => {
    return new Map(store.staffMembers.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim() || m.email]));
});

function getJobTitleLabel(jobTitleId: string): string {
    return jobTitleLabelById.value.get(jobTitleId) || jobTitleId;
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
    void _id;
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
        <v-col cols="12" :lg="props.showCreateButton ? 4 : 12" :md="props.showCreateButton ? 6 : 12">
            <v-text-field density="compact" v-model="search" :label="props.searchLabel" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col
            cols="12"
            lg="8"
            md="6"
            class="text-right"
            :class="{ 'd-none': !props.showCreateButton }"
        >
            <StaffMemberForm
                ref="staffMemberFormRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                :show-activator="props.showCreateButton"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <component :is="PerfectScrollbarTag" class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 staff-member-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-name">Name</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Job Title</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-note">Phone Number</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-manager">Manager</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-date">Start</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.staffMembers.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">{{ props.loadingText }}</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">{{ props.emptyStateText }}</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-name">
                            <div>
                                <h4 class="text-subtitle-1 font-weight-semibold text-no-wrap">
                                    <RouterLink
                                        v-if="item.id"
                                        :to="{ name: 'Staff Member Detail', params: { id: item.id } }"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        {{ item.firstName }} {{ item.lastName }}
                                    </RouterLink>
                                    <template v-else>{{ item.firstName }} {{ item.lastName }}</template>
                                </h4>
                                <span class="text-subtitle-1 d-block mt-1 textSecondary">
                                    {{ item.email }}
                                </span>
                            </div>
                        </td>
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ getJobTitleLabel(item.jobTitleId) }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-note">{{ item.phoneNumber }}</td>
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
    </component>
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
