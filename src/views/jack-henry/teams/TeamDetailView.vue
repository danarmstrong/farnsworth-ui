<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import TeamMembersTable from '@/features/jack-henry/teams/components/TeamMembersTable.vue';
import { useTeamStore } from '@/features/jack-henry/teams/stores/teamStore';
import type { TeamDto } from '@/features/jack-henry/teams/types/Team';

const route = useRoute();
const teamStore = useTeamStore();

const team = ref<TeamDto | null>(null);
const loadError = ref(false);

const teamId = computed(() => {
    const raw = route.params.teamId;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
});

const pageTitle = computed(() => {
    if (!team.value) {
        return 'Team Details';
    }

    return team.value.name || 'Team Details';
});

const breadcrumbs = computed(() => [
    { text: 'Teams', disabled: false, to: '/configuration/teams' },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

const pageSubtitle = computed(() => {
    if (!team.value) {
        return 'Open a team to view its members.';
    }

    const memberCount = team.value.staffMemberIds.length;
    const noun = memberCount === 1 ? 'member' : 'members';
    return `${memberCount} ${noun}`;
});

async function loadTeam(id: string) {
    loadError.value = false;
    team.value = null;
    teamStore.clearError();

    if (!id) {
        loadError.value = true;
        return;
    }

    const result = await teamStore.getTeam(id);
    if (result) {
        team.value = result;
    } else {
        loadError.value = true;
    }
}

watch(
    teamId,
    (id) => {
        void loadTeam(id);
    },
    { immediate: true }
);
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || teamStore.error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            teamStore.clearError();
            loadError = false;
        "
    >
        {{ teamStore.error || 'Team could not be loaded.' }}
    </v-alert>

    <div v-else-if="teamStore.loading && !team" class="text-subtitle-1 py-8 text-center">Loading team...</div>

    <v-card v-else-if="team" elevation="10">
        <v-card-text>
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <div>
                    <h5 class="text-h5 font-weight-semibold mb-1">Team Members</h5>
                    <p class="text-body-1 text-medium-emphasis mb-0">{{ pageSubtitle }}</p>
                </div>
            </div>

            <TeamMembersTable :staff-member-ids="team.staffMemberIds" />
        </v-card-text>
    </v-card>
</template>

