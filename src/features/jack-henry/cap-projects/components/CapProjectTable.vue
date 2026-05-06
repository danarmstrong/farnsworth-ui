<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCapProjectStore } from '@/features/jack-henry/cap-projects/stores/capProjectStore';
import CapProjectForm from '@/features/jack-henry/cap-projects/components/CapProjectForm.vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { CapProject } from '@/features/jack-henry/cap-projects/types/CapProject';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { isStaffEligibleForCapProject } from '@/features/jack-henry/cap-projects/utils/capProjectStaffEligibility';

type CapProjectFormSubmitPayload = {
    id?: string;
    title: string;
    projectName: string;
    capPercentage: number;
    staffMemberIds: string[];
};

const store = useCapProjectStore();
const staffMemberStore = useStaffMemberStore();
const confirm = useConfirm();

onMounted(() => {
    void store.fetchCapProjects();
    if (!staffMemberStore.staffMembers.length) {
        void staffMemberStore.fetchStaffMembers();
    }
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const staffActionBusy = ref(false);
const addStaffSaving = ref(false);
const capProjectFormRef = ref<InstanceType<typeof CapProjectForm> | null>(null);

const addStaffDialog = ref(false);
const addStaffProject = ref<CapProject | null>(null);
const addStaffSelection = ref<string[]>([]);

const isBusy = computed(() => saving.value || deleting.value || staffActionBusy.value || addStaffSaving.value || store.loading);

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    return store.capProjects.filter((project: CapProject) => {
        if (!normalizedSearch) {
            return true;
        }
        if (project.title.toLowerCase().includes(normalizedSearch)) {
            return true;
        }
        if (project.projectName.toLowerCase().includes(normalizedSearch)) {
            return true;
        }
        return project.staffMemberIds.some((id) => getStaffLabel(id).toLowerCase().includes(normalizedSearch));
    });
});

const staffLabelById = computed(() => {
    return new Map(staffMemberStore.staffMembers.map((m) => [m.id, formatStaffMember(m)]));
});

function formatStaffMember(m: { firstName: string; lastName: string; employeeNumber: string | null }): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') + (m.employeeNumber ? ` (${m.employeeNumber})` : '');
}

function getStaffLabel(staffMemberId: string): string {
    return staffLabelById.value.get(staffMemberId) || staffMemberId;
}

const addStaffOptions = computed(() => {
    const project = addStaffProject.value;
    if (!project) {
        return [];
    }
    const existing = new Set(project.staffMemberIds);
    return staffMemberStore.staffMembers
        .filter((m) => !existing.has(m.id) && isStaffEligibleForCapProject(m))
        .map((m) => ({
            label: formatStaffMember(m),
            value: m.id
        }));
});

function editItem(item: CapProject) {
    capProjectFormRef.value?.openEdit(item);
}

function openAddStaff(project: CapProject) {
    addStaffProject.value = project;
    addStaffSelection.value = [];
    addStaffDialog.value = true;
}

function closeAddStaffDialog() {
    addStaffDialog.value = false;
    addStaffProject.value = null;
    addStaffSelection.value = [];
    store.clearError();
}

async function submitAddStaff() {
    const project = addStaffProject.value;
    if (!project?.id || !addStaffSelection.value.length) {
        return;
    }
    addStaffSaving.value = true;
    try {
        await store.addStaffMembers(project.id, { staffMemberIds: [...addStaffSelection.value] });
        if (!store.error) {
            closeAddStaffDialog();
        }
    } finally {
        addStaffSaving.value = false;
    }
}

async function deleteItem(item: CapProject) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteCapProject(item.id);
    } finally {
        deleting.value = false;
    }
}

async function removeStaffChip(project: CapProject, staffMemberId: string) {
    if (isBusy.value || !project.id) {
        return;
    }
    const isConfirmed = await confirm('Remove this staff member from the CAP project?');
    if (!isConfirmed) {
        return;
    }
    staffActionBusy.value = true;
    try {
        await store.removeStaffMemberFromCapProject(project.id, staffMemberId);
    } finally {
        staffActionBusy.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: CapProjectFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateCapProject(payload.id, {
                title: payload.title,
                projectName: payload.projectName,
                capPercentage: payload.capPercentage,
                staffMemberIds: payload.staffMemberIds
            });
        } else {
            await store.createCapProject({
                title: payload.title,
                projectName: payload.projectName,
                capPercentage: payload.capPercentage,
                staffMemberIds: payload.staffMemberIds.length ? payload.staffMemberIds : undefined
            });
        }

        if (!store.error) {
            capProjectFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search CAP projects" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <CapProjectForm
                ref="capProjectFormRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <v-dialog v-model="addStaffDialog" max-width="520">
        <v-card>
            <v-card-title class="px-4 pt-6 justify-space-between d-flex align-center">
                <span class="text-h5">Add staff members</span>
                <v-btn @click="closeAddStaffDialog" :disabled="addStaffSaving" :ripple="false" density="compact" icon="mdi-close"></v-btn>
            </v-card-title>
            <v-card-text class="px-4">
                <v-alert v-if="store.error" type="error" variant="tonal" density="compact" class="mb-4">{{ store.error }}</v-alert>
                <p v-if="addStaffProject" class="text-body-2 text-medium-emphasis mb-4">
                    {{ addStaffProject.title }} — {{ addStaffProject.projectName }}
                </p>
                <v-autocomplete
                    v-model="addStaffSelection"
                    :items="addStaffOptions"
                    item-title="label"
                    item-value="value"
                    variant="outlined"
                    hide-details="auto"
                    label="Staff to add"
                    multiple
                    chips
                    closable-chips
                />
            </v-card-text>
            <div class="pa-4 d-flex justify-end gap-2">
                <v-btn @click="closeAddStaffDialog" :disabled="addStaffSaving" class="bg-error px-3 rounded-pill">Cancel</v-btn>
                <v-btn
                    color="primary"
                    class="px-3 rounded-pill"
                    :loading="addStaffSaving"
                    :disabled="!addStaffSelection.length"
                    @click="submitAddStaff"
                >
                    Add
                </v-btn>
            </div>
        </v-card>
    </v-dialog>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 cap-project-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold col-title">Title</th>
                        <th class="text-subtitle-1 font-weight-semibold col-project-name">Project name</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-cap-pct">CAP %</th>
                        <th class="text-subtitle-1 font-weight-semibold col-staff">Staff</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.capProjects.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">Loading CAP projects...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">No CAP projects found.</td>
                    </tr>
                    <tr v-else v-for="row in filteredList" :key="row.id">
                        <td class="text-subtitle-1 col-title">{{ row.title }}</td>
                        <td class="text-subtitle-1 col-project-name">{{ row.projectName }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-cap-pct">{{ row.capPercentage }}%</td>
                        <td class="text-subtitle-1 col-staff">
                            <div v-if="!row.staffMemberIds.length" class="text-medium-emphasis">None</div>
                            <div v-else class="d-flex flex-wrap ga-1">
                                <v-chip
                                    v-for="sid in row.staffMemberIds"
                                    :key="sid"
                                    size="small"
                                    closable
                                    :disabled="isBusy"
                                    @click:close="removeStaffChip(row, sid)"
                                >
                                    {{ getStaffLabel(sid) }}
                                </v-chip>
                            </div>
                        </td>
                        <td class="text-right text-no-wrap col-actions">
                            <div class="d-flex align-center justify-end">
                                <v-tooltip text="Add staff">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="openAddStaff(row)" v-bind="props">
                                            <UserPlusIcon stroke-width="1.5" size="20" class="text-success" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Edit">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="editItem(row)" v-bind="props">
                                            <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="deleteItem(row)" v-bind="props">
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
.cap-project-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-title {
        width: auto;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }

    .col-project-name {
        width: auto;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }

    .col-cap-pct {
        width: 1%;
        white-space: nowrap;
        vertical-align: top;
    }

    .col-actions {
        width: 1%;
        white-space: nowrap;
        vertical-align: top;
    }

    .col-staff {
        width: auto;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }
}
</style>
