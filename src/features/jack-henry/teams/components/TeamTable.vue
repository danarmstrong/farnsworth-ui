<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { PencilIcon, TrashIcon } from 'vue-tabler-icons';
import { useTeamStore } from '@/features/jack-henry/teams/stores/teamStore';
import TeamForm from '@/features/jack-henry/teams/components/TeamForm.vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import type { TeamDto } from '@/features/jack-henry/teams/types/Team';
import { useConfirm } from '@/utils/helpers/useConfirm';

type TeamFormSubmitPayload = {
    id?: string;
    name: string;
    staffMemberIds: string[];
};

const store = useTeamStore();
const staffMemberStore = useStaffMemberStore();
const confirm = useConfirm();

onMounted(() => {
    void store.fetchTeams();
    if (!staffMemberStore.staffMembers.length) {
        void staffMemberStore.fetchStaffMembers();
    }
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const teamFormRef = ref<InstanceType<typeof TeamForm> | null>(null);

const isBusy = computed(() => saving.value || deleting.value || store.loading || staffMemberStore.loading);

const staffLabelById = computed(() => {
    return new Map(staffMemberStore.staffMembers.map((m) => [m.id, formatStaffMember(m)]));
});

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    return store.teams.filter((team: TeamDto) => {
        if (!normalizedSearch) {
            return true;
        }

        if (team.name.toLowerCase().includes(normalizedSearch)) {
            return true;
        }

        return team.staffMemberIds.some((id) => getStaffLabel(id).toLowerCase().includes(normalizedSearch));
    });
});

function formatStaffMember(m: StaffMember): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') + (m.employeeNumber ? ` (${m.employeeNumber})` : '');
}

function getStaffLabel(staffMemberId: string): string {
    return staffLabelById.value.get(staffMemberId) || staffMemberId;
}

function editItem(item: TeamDto) {
    teamFormRef.value?.openEdit(item);
}

async function deleteItem(item: TeamDto) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this team?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteTeam(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: TeamFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateTeam(payload.id, {
                name: payload.name,
                staffMemberIds: payload.staffMemberIds.length ? payload.staffMemberIds : undefined
            });
        } else {
            await store.createTeam({
                name: payload.name,
                staffMemberIds: payload.staffMemberIds.length ? payload.staffMemberIds : undefined
            });
        }

        if (!store.error) {
            teamFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search teams" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <TeamForm ref="teamFormRef" :saving="saving" :submit-disabled="isBusy" :error="store.error" @submit="save" @cancel="clearStoreError" />
        </v-col>
    </v-row>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 team-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold col-name">Name</th>
                        <th class="text-subtitle-1 font-weight-semibold col-staff">Staff members</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.teams.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">Loading teams...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">No teams found.</td>
                    </tr>
                    <tr v-else v-for="row in filteredList" :key="row.id">
                        <td class="text-subtitle-1 col-name">{{ row.name }}</td>
                        <td class="text-subtitle-1 col-staff">
                            <div v-if="!row.staffMemberIds.length" class="text-medium-emphasis">None</div>
                            <div v-else class="d-flex flex-wrap ga-1">
                                <v-chip v-for="sid in row.staffMemberIds" :key="sid" size="small" variant="tonal" color="primary">
                                    {{ getStaffLabel(sid) }}
                                </v-chip>
                            </div>
                        </td>
                        <td class="text-right text-no-wrap col-actions">
                            <div class="d-flex align-center justify-end">
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
.team-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-name {
        width: auto;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }

    .col-staff {
        width: auto;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }

    .col-actions {
        width: 1%;
        white-space: nowrap;
        vertical-align: top;
    }
}
</style>


