<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { PencilIcon, TrashIcon } from 'vue-tabler-icons';
import { useTeamStore } from '@/features/jack-henry/teams/stores/teamStore';
import TeamForm from '@/features/jack-henry/teams/components/TeamForm.vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { TeamDto } from '@/features/jack-henry/teams/types/Team';
import { useConfirm } from '@/utils/helpers/useConfirm';
import type { TeamMemberDto } from '@/features/jack-henry/teams/types/TeamMember';

type TeamFormSubmitPayload = {
    id?: string;
    name: string;
    staffMemberIds: string[];
    githubRepoIds: string[];
    jiraProjectIds: string[];
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

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    return store.teams.filter((team: TeamDto) => {
        if (!normalizedSearch) {
            return true;
        }

        if (team.name.toLowerCase().includes(normalizedSearch)) {
            return true;
        }

        return String(team.activeMemberCount).includes(normalizedSearch);
    });
});

function toActiveStaffMemberIds(teamMembers: TeamMemberDto[]): string[] {
    return [...new Set(teamMembers.filter((member) => member.isActive).map((member) => member.staffMember?.id).filter((id): id is string => Boolean(id)))];
}

async function editItem(item: TeamDto) {
    if (isBusy.value || !item.id) {
        return;
    }

    const teamMembers = await store.getTeamMembers(item.id);
    if (store.error) {
        return;
    }

    teamFormRef.value?.openEdit(item, teamMembers ? toActiveStaffMemberIds(teamMembers) : []);
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
                staffMemberIds: payload.staffMemberIds.length ? payload.staffMemberIds : undefined,
                githubRepoIds: payload.githubRepoIds.length ? payload.githubRepoIds : undefined,
                jiraProjectIds: payload.jiraProjectIds.length ? payload.jiraProjectIds : undefined
            });
        } else {
            await store.createTeam({
                name: payload.name,
                staffMemberIds: payload.staffMemberIds.length ? payload.staffMemberIds : undefined,
                githubRepoIds: payload.githubRepoIds.length ? payload.githubRepoIds : undefined,
                jiraProjectIds: payload.jiraProjectIds.length ? payload.jiraProjectIds : undefined
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
                        <th class="text-subtitle-1 font-weight-semibold col-staff">Members</th>
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
                        <td class="text-subtitle-1 col-name">
                            <RouterLink
                                v-if="row.id"
                                :to="{ name: 'Team Detail', params: { teamId: row.id } }"
                                class="text-primary text-decoration-none font-weight-medium"
                            >
                                {{ row.name }}
                            </RouterLink>
                            <template v-else>{{ row.name }}</template>
                        </td>
                        <td class="text-subtitle-1 col-staff">
                            <div class="text-caption text-medium-emphasis mb-1">{{ row.activeMemberCount }} active</div>
                            <div class="text-medium-emphasis">{{ row.teamMembers.length }} total assignments</div>
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
        width: 32%;
        min-width: 240px;
        white-space: normal;
        word-break: break-word;
        vertical-align: top;
    }

    .col-staff {
        width: 68%;
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







