<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import JiraProjectIssuesTable from '@/features/jack-henry/jira-projects/components/JiraProjectIssuesTable.vue';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import type {
    JiraProjectBoard,
    JiraProjectBoardListResponse,
    JiraProjectSprintListResponse,
    JiraProjectSprint
} from '@/features/jack-henry/jira-projects/types/JiraProject';
import { formatUtcLocal } from '@/utils/helpers/dateTime';

const route = useRoute();
const projectStore = useJiraProjectStore();

const sprintList = ref<JiraProjectSprintListResponse | null>(null);
const sprintListLoading = ref(false);
const sprintListError = ref<string | null>(null);
const boardList = ref<JiraProjectBoardListResponse | null>(null);
const boardListLoading = ref(false);
const boardListError = ref<string | null>(null);

const projectId = computed(() => {
    const raw = route.params.projectId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const sprintId = computed(() => {
    const raw = route.params.sprintId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const project = computed(() =>
    projectId.value ? projectStore.jiraProjects.find((item) => item.id === projectId.value) || null : null
);

const projectDisplayName = computed(() => {
    if (project.value?.name?.trim()) {
        return project.value.name.trim();
    }

    return projectId.value;
});

const sprint = computed<JiraProjectSprint | null>(() => {
    if (!sprintList.value?.items?.length || !sprintId.value) {
        return null;
    }

    return sprintList.value.items.find((item) => item.id === sprintId.value) || null;
});

const sprintDisplayName = computed(() => {
    if (sprint.value?.name?.trim()) {
        return sprint.value.name.trim();
    }

    return sprintId.value;
});

const linkedBoard = computed<JiraProjectBoard | null>(() => {
    if (!sprint.value?.boardId || !boardList.value?.items?.length) {
        return null;
    }

    return boardList.value.items.find((item) => item.id === sprint.value?.boardId) || null;
});

const linkedBoardLabel = computed(() => {
    if (linkedBoard.value?.name?.trim()) {
        return linkedBoard.value.name.trim();
    }

    return sprint.value?.boardId || sprint.value?.originBoardId || '—';
});

function formatDate(value: string | null | undefined): string {
    return formatUtcLocal(value) || '—';
}

async function loadSprints(nextProjectId: string): Promise<void> {
    sprintListError.value = null;
    sprintListLoading.value = true;

    try {
        const result = await projectStore.getJiraProjectSprints(nextProjectId);
        if (!result) {
            sprintList.value = null;
            sprintListError.value = projectStore.error || 'Unable to load Jira sprints for this project.';
            return;
        }

        sprintList.value = result;
    } finally {
        sprintListLoading.value = false;
    }
}

async function loadBoards(nextProjectId: string): Promise<void> {
    boardListError.value = null;
    boardListLoading.value = true;

    try {
        const result = await projectStore.getJiraProjectBoards(nextProjectId);
        if (!result) {
            boardList.value = null;
            boardListError.value = projectStore.error || 'Unable to load Jira boards for this project.';
            return;
        }

        boardList.value = result;
    } finally {
        boardListLoading.value = false;
    }
}

watch(
    [projectId, sprintId],
    async ([nextProjectId, nextSprintId]) => {
        if (!nextProjectId || !nextSprintId) {
            sprintList.value = null;
            sprintListError.value = null;
            boardList.value = null;
            boardListError.value = null;
            return;
        }

        await projectStore.getJiraProject(nextProjectId);
        await Promise.all([loadSprints(nextProjectId), loadBoards(nextProjectId)]);
    },
    { immediate: true }
);
</script>

<template>
    <JackHenryPageCard title="Jira Sprint Issues">
        <template #header v-if="projectId && sprintId">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <div>
                    <h5 class="text-h5 font-weight-semibold mb-1">Jira Sprint Issues</h5>
                    <p class="text-body-1 text-medium-emphasis mb-0">Project: {{ projectDisplayName }}</p>
                    <p class="text-body-1 text-medium-emphasis mb-0">Sprint: {{ sprintDisplayName }}</p>
                    <div v-if="sprint" class="d-flex flex-wrap gap-2 mt-2">
                        <v-chip size="small" variant="tonal">State: {{ sprint.state || '—' }}</v-chip>
                        <v-chip size="small" variant="tonal">Start: {{ formatDate(sprint.startDateUtc) }}</v-chip>
                        <v-chip size="small" variant="tonal">End: {{ formatDate(sprint.endDateUtc) }}</v-chip>
                        <v-chip size="small" variant="tonal">
                            Board:
                            <RouterLink
                                v-if="sprint.boardId"
                                :to="{ name: 'Jira Board Details', params: { projectId, boardId: sprint.boardId } }"
                                class="text-primary text-decoration-none font-weight-medium ml-1"
                            >
                                {{ linkedBoardLabel }}
                            </RouterLink>
                            <template v-else>
                                <span class="ml-1">{{ linkedBoardLabel }}</span>
                            </template>
                        </v-chip>
                    </div>
                </div>
                <v-btn
                    variant="outlined"
                    color="primary"
                    :to="{ name: 'Jira Project Details', params: { projectId } }"
                >
                    Back to project
                </v-btn>
            </div>
        </template>

        <template v-if="projectId && sprintId">
            <v-alert v-if="sprintListError" type="warning" variant="tonal" class="mb-4">{{ sprintListError }}</v-alert>
            <v-alert v-if="boardListError" type="warning" variant="tonal" class="mb-4">{{ boardListError }}</v-alert>
            <v-alert v-else-if="!sprintListLoading && !sprint" type="warning" variant="tonal" class="mb-4">
                Sprint not found for this project.
            </v-alert>

            <v-card v-if="sprint" variant="outlined" class="mb-4">
                <v-card-text class="d-flex flex-wrap align-center gap-3">
                    <span class="text-subtitle-2">Linked board</span>
                    <RouterLink
                        v-if="sprint.boardId"
                        :to="{ name: 'Jira Board Details', params: { projectId, boardId: sprint.boardId } }"
                        class="text-primary text-decoration-none font-weight-medium"
                    >
                        {{ linkedBoardLabel }}
                    </RouterLink>
                    <span v-else class="text-body-2 text-medium-emphasis">{{ linkedBoardLabel }}</span>
                    <span v-if="boardListLoading" class="text-body-2 text-medium-emphasis">Loading board details…</span>
                </v-card-text>
            </v-card>

            <JiraProjectIssuesTable :project-id="projectId" :sprint-id="sprintId" />
        </template>

        <template v-else>
            <h5 class="text-h5 font-weight-semibold mb-2">Jira Sprint Issues</h5>
            <p class="text-body-1 text-medium-emphasis mb-0">Select a Jira sprint from a project to view details.</p>
        </template>
    </JackHenryPageCard>
</template>


