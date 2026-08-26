<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import JiraProjectIssuesTable from '@/features/jack-henry/jira-projects/components/JiraProjectIssuesTable.vue';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import type {
    JiraProjectBoard,
    JiraProjectBoardListResponse,
    JiraProjectSprint,
    JiraProjectSprintListResponse
} from '@/features/jack-henry/jira-projects/types/JiraProject';

const route = useRoute();
const projectStore = useJiraProjectStore();

const boardList = ref<JiraProjectBoardListResponse | null>(null);
const boardListLoading = ref(false);
const boardListError = ref<string | null>(null);
const sprintList = ref<JiraProjectSprintListResponse | null>(null);
const sprintListLoading = ref(false);
const sprintListError = ref<string | null>(null);

const projectId = computed(() => {
    const raw = route.params.projectId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const boardId = computed(() => {
    const raw = route.params.boardId;
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

const board = computed<JiraProjectBoard | null>(() => {
    if (!boardList.value?.items?.length || !boardId.value) {
        return null;
    }

    return boardList.value.items.find((item) => item.id === boardId.value) || null;
});

const boardDisplayName = computed(() => {
    if (board.value?.name?.trim()) {
        return board.value.name.trim();
    }

    return boardId.value;
});

const linkedSprints = computed<JiraProjectSprint[]>(() => {
    if (!boardId.value || !sprintList.value?.items?.length) {
        return [];
    }

    return sprintList.value.items.filter((item) => item.boardId === boardId.value);
});

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

watch(
    [projectId, boardId],
    async ([nextProjectId, nextBoardId]) => {
        if (!nextProjectId || !nextBoardId) {
            boardList.value = null;
            boardListError.value = null;
            sprintList.value = null;
            sprintListError.value = null;
            return;
        }

        await projectStore.getJiraProject(nextProjectId);
        await Promise.all([loadBoards(nextProjectId), loadSprints(nextProjectId)]);
    },
    { immediate: true }
);
</script>

<template>
    <JackHenryPageCard title="Jira Board Issues">
        <template #header v-if="projectId && boardId">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <div>
                    <h5 class="text-h5 font-weight-semibold mb-1">Jira Board Issues</h5>
                    <p class="text-body-1 text-medium-emphasis mb-0">Project: {{ projectDisplayName }}</p>
                    <p class="text-body-1 text-medium-emphasis mb-0">Board: {{ boardDisplayName }}</p>
                    <div v-if="board" class="d-flex flex-wrap gap-2 mt-2">
                        <v-chip size="small" variant="tonal">Type: {{ board.boardType || '—' }}</v-chip>
                        <v-chip size="small" variant="tonal">Key: {{ board.key || '—' }}</v-chip>
                        <v-chip size="small" variant="tonal">Jira Board ID: {{ board.jiraBoardId || '—' }}</v-chip>
                        <v-chip size="small" variant="tonal">Linked Sprints: {{ linkedSprints.length }}</v-chip>
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

        <template v-if="projectId && boardId">
            <v-alert v-if="boardListError" type="warning" variant="tonal" class="mb-4">{{ boardListError }}</v-alert>
            <v-alert v-if="sprintListError" type="warning" variant="tonal" class="mb-4">{{ sprintListError }}</v-alert>
            <v-alert v-else-if="!boardListLoading && !board" type="warning" variant="tonal" class="mb-4">
                Board not found for this project.
            </v-alert>

            <v-card v-if="board" variant="outlined" class="mb-4">
                <v-card-text>
                    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-3">
                        <h6 class="text-h6 mb-0">Linked Sprints</h6>
                        <span class="text-body-2 text-medium-emphasis">
                            <template v-if="sprintListLoading">Loading…</template>
                            <template v-else>{{ linkedSprints.length }} linked</template>
                        </span>
                    </div>

                    <div v-if="sprintListLoading" class="text-body-2 text-medium-emphasis">Loading linked sprints...</div>
                    <div v-else-if="!linkedSprints.length" class="text-body-2 text-medium-emphasis">
                        No synced sprints are linked to this board.
                    </div>
                    <div v-else class="d-flex flex-wrap gap-2">
                        <RouterLink
                            v-for="sprint in linkedSprints"
                            :key="sprint.id"
                            :to="{ name: 'Jira Sprint Details', params: { projectId, sprintId: sprint.id } }"
                            class="text-decoration-none"
                        >
                            <v-chip size="small" color="primary" variant="tonal">
                                {{ sprint.name || sprint.id }}
                            </v-chip>
                        </RouterLink>
                    </div>
                </v-card-text>
            </v-card>

            <JiraProjectIssuesTable :project-id="projectId" :board-id="boardId" />
        </template>

        <template v-else>
            <h5 class="text-h5 font-weight-semibold mb-2">Jira Board Issues</h5>
            <p class="text-body-1 text-medium-emphasis mb-0">Select a Jira board from a project to view details.</p>
        </template>
    </JackHenryPageCard>
</template>


