<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
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

const pageSubtitle = computed(() => {
    if (!team.value) {
        return 'Choose a team from the configuration page to view its members.';
    }

    const memberCount = team.value.staffMemberIds.length;
    const noun = memberCount === 1 ? 'member' : 'members';
    return `Team: ${team.value.name} • ${memberCount} ${noun}`;
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
    <JackHenryPageCard title="Team Members">
        <template #header v-if="team">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <div>
                    <h5 class="text-h5 font-weight-semibold mb-1">Team Members</h5>
                    <p class="text-body-1 text-medium-emphasis mb-0">{{ pageSubtitle }}</p>
                </div>
                <v-btn variant="outlined" color="primary" :to="{ name: 'Configuration Teams' }">Back to teams</v-btn>
            </div>
        </template>

        <template v-if="team">
            <TeamMembersTable :staff-member-ids="team.staffMemberIds" />
        </template>

        <template v-else-if="teamStore.loading">
            <h5 class="text-h5 font-weight-semibold mb-2">Team Members</h5>
            <p class="text-body-1 text-medium-emphasis mb-0">Loading team...</p>
        </template>

        <template v-else>
            <h5 class="text-h5 font-weight-semibold mb-2">Team Members</h5>
            <p class="text-body-1 text-error mb-0">
                {{ teamStore.error || (loadError ? 'Team could not be loaded.' : 'Choose a team to view its members.') }}
            </p>
        </template>
    </JackHenryPageCard>
</template>

