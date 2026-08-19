import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import type { Team, TeamCreateRequest, TeamDto, TeamUpsertRequest } from '@/features/jack-henry/teams/types/Team';
import { ref } from 'vue';
import { isAxiosError } from 'axios';

const teamsPath = '/teams';

function normalizeTeam(raw: TeamDto): TeamDto {
    return {
        ...raw,
        name: raw.name ?? '',
        staffMemberIds: raw.staffMemberIds ?? []
    };
}

export const useTeamStore = defineStore('teams', () => {
    const teams = ref<Team[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    function mergeTeamIntoList(team: TeamDto): void {
        const normalized = normalizeTeam(team);
        const index = teams.value.findIndex((t) => t.id === normalized.id);
        if (index !== -1) {
            teams.value[index] = normalized;
        } else {
            teams.value.push(normalized);
        }
    }

    async function fetchTeams(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<TeamDto[]>(teamsPath);
            teams.value = data.map(normalizeTeam);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch teams');
        } finally {
            loading.value = false;
        }
    }

    async function getTeam(id: string): Promise<TeamDto | null> {
        error.value = null;

        const existing = teams.value.find((team) => team.id === id);
        if (existing) {
            return normalizeTeam(existing);
        }

        loading.value = true;
        try {
            const { data } = await axios.get<TeamDto>(`${teamsPath}/${id}`);
            mergeTeamIntoList(data);
            return normalizeTeam(data);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to get team');
        } finally {
            loading.value = false;
        }

        return null;
    }

    async function createTeam(request: TeamCreateRequest): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.post<TeamDto>(teamsPath, request);
            if (data?.id) {
                mergeTeamIntoList(data);
            } else {
                await fetchTeams();
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to create team');
        } finally {
            loading.value = false;
        }
    }

    async function updateTeam(id: string, request: TeamUpsertRequest): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.put<TeamDto>(`${teamsPath}/${id}`, request);
            if (data?.id) {
                mergeTeamIntoList(data);
            } else {
                await getTeam(id);
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to update team');
        } finally {
            loading.value = false;
        }
    }

    async function deleteTeam(id: string): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            await axios.delete(`${teamsPath}/${id}`);
            teams.value = teams.value.filter((team) => team.id !== id);
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete team');
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
        teams,
        loading,
        error,
        fetchTeams,
        getTeam,
        createTeam,
        updateTeam,
        deleteTeam,
        clearError
    };
});

