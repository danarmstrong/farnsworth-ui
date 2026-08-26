<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import JiraProjectIssuesTable from '@/features/jack-henry/jira-projects/components/JiraProjectIssuesTable.vue';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import type { JiraProjectBoardListResponse, JiraProjectSprintListResponse } from '@/features/jack-henry/jira-projects/types/JiraProject';
import { formatUtcLocal } from '@/utils/helpers/dateTime';

const route = useRoute();
const store = useJiraProjectStore();
const sprintList = ref<JiraProjectSprintListResponse | null>(null);
const sprintListLoading = ref(false);
const sprintListError = ref<string | null>(null);
const boardList = ref<JiraProjectBoardListResponse | null>(null);
const boardListLoading = ref(false);
const boardListError = ref<string | null>(null);

const projectId = computed(() => {
    const raw = route.params.projectId;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }

    return '';
});

const project = computed(() => (projectId.value ? store.jiraProjects.find((item) => item.id === projectId.value) || null : null));

const projectDisplayName = computed(() => {
    if (project.value?.name?.trim()) {
        return project.value.name.trim();
    }

    return projectId.value;
});

const boardById = computed(() => {
    return new Map((boardList.value?.items || []).map((board) => [board.id, board]));
});

function formatDate(value: string | null | undefined): string {
    return formatUtcLocal(value) || '—';
}

function sprintBoard(boardId: string | null | undefined) {
    if (!boardId) {
        return null;
    }

    return boardById.value.get(boardId) || null;
}

function sprintBoardLabel(boardId: string | null | undefined, originBoardId: string | null | undefined): string {
    const linkedBoard = sprintBoard(boardId);
    if (linkedBoard?.name?.trim()) {
        return linkedBoard.name.trim();
    }

    return boardId || originBoardId || '—';
}

async function loadSprints(nextProjectId: string): Promise<void> {
    sprintListError.value = null;
    sprintListLoading.value = true;

    try {
        const result = await store.getJiraProjectSprints(nextProjectId);
        if (!result) {
            sprintList.value = null;
            sprintListError.value = store.error || 'Unable to load Jira sprints for this project.';
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
        const result = await store.getJiraProjectBoards(nextProjectId);
        if (!result) {
            boardList.value = null;
            boardListError.value = store.error || 'Unable to load Jira boards for this project.';
            return;
        }

        boardList.value = result;
    } finally {
        boardListLoading.value = false;
    }
}

watch(
    projectId,
    async (nextProjectId) => {
        if (!nextProjectId) {
            sprintList.value = null;
            sprintListError.value = null;
            boardList.value = null;
            boardListError.value = null;
            return;
        }

        await store.getJiraProject(nextProjectId);
        await Promise.all([loadSprints(nextProjectId), loadBoards(nextProjectId)]);
    },
    { immediate: true }
);

</script>

<template>
    <JackHenryPageCard title="Jira Project Issues">
        <template #header v-if="projectId">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <div>
                    <h5 class="text-h5 font-weight-semibold mb-1">Jira Project Issues</h5>
                    <p class="text-body-1 text-medium-emphasis mb-0">Project: {{ projectDisplayName }}</p>
                    <div v-if="project" class="d-flex flex-wrap gap-2 mt-2">
                        <v-chip size="small" :color="project.isEnabled ? 'success' : 'default'" variant="tonal">
                            {{ project.isEnabled ? 'Enabled' : 'Disabled' }}
                        </v-chip>
                        <v-chip size="small" :color="project.isScrumProject ? 'success' : 'default'" variant="tonal">
                            {{ project.isScrumProject ? 'Scrum project' : 'Not scrum' }}
                        </v-chip>
                        <v-chip size="small" :color="project.isScrumProjectVerified ? 'success' : 'warning'" variant="tonal">
                            {{ project.isScrumProjectVerified ? 'Scrum verified' : 'Scrum unverified' }}
                        </v-chip>
                    </div>
                </div>
                <v-btn variant="outlined" color="primary" :to="{ name: 'Jira Projects' }">Back to Jira projects</v-btn>
            </div>
        </template>

        <template v-if="projectId">
            <v-alert v-if="sprintListError" type="warning" variant="tonal" class="mb-4">{{ sprintListError }}</v-alert>
            <v-alert v-if="boardListError" type="warning" variant="tonal" class="mb-4">{{ boardListError }}</v-alert>
            <v-card variant="outlined" class="mb-4">
                <v-card-text>
                    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-3">
                        <h6 class="text-h6 mb-0">Boards</h6>
                        <span class="text-body-2 text-medium-emphasis">
                            {{ boardList?.items.length ?? 0 }} synced
                        </span>
                    </div>

                    <div v-if="boardListLoading" class="text-body-2 text-medium-emphasis">Loading boards...</div>
                    <div v-else-if="!(boardList?.items.length)">
                        <span class="text-body-2 text-medium-emphasis">No boards are synced for this project.</span>
                    </div>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th class="text-left">Board</th>
                                <th class="text-left">Key</th>
                                <th class="text-left">Type</th>
                                <th class="text-left">Jira Board ID</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="board in boardList?.items" :key="board.id">
                                <td>
                                    <RouterLink
                                        :to="{ name: 'Jira Board Details', params: { projectId, boardId: board.id } }"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        {{ board.name }}
                                    </RouterLink>
                                </td>
                                <td>{{ board.key }}</td>
                                <td>{{ board.boardType || '—' }}</td>
                                <td>{{ board.jiraBoardId }}</td>
                                <td class="text-right text-no-wrap">
                                    <v-btn
                                        variant="text"
                                        color="primary"
                                        size="small"
                                        :to="{ name: 'Jira Board Details', params: { projectId, boardId: board.id } }"
                                    >
                                        View issues
                                    </v-btn>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
                <v-card-text>
                    <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-3">
                        <h6 class="text-h6 mb-0">Sprints</h6>
                        <span class="text-body-2 text-medium-emphasis">
                            {{ sprintList?.items.length ?? 0 }} synced
                        </span>
                    </div>

                    <div v-if="sprintListLoading" class="text-body-2 text-medium-emphasis">Loading sprints...</div>
                    <div v-else-if="!(sprintList?.items.length)">
                        <span class="text-body-2 text-medium-emphasis">No sprints are synced for this project.</span>
                    </div>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th class="text-left">Sprint</th>
                                <th class="text-left">State</th>
                                <th class="text-left">Start</th>
                                <th class="text-left">End</th>
                                <th class="text-left">Board</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="sprint in sprintList?.items" :key="sprint.id">
                                <td>
                                    <RouterLink
                                        :to="{ name: 'Jira Sprint Details', params: { projectId, sprintId: sprint.id } }"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        {{ sprint.name }}
                                    </RouterLink>
                                </td>
                                <td>{{ sprint.state || '—' }}</td>
                                <td>{{ formatDate(sprint.startDateUtc) }}</td>
                                <td>{{ formatDate(sprint.endDateUtc) }}</td>
                                <td>
                                    <RouterLink
                                        v-if="sprint.boardId"
                                        :to="{ name: 'Jira Board Details', params: { projectId, boardId: sprint.boardId } }"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        {{ sprintBoardLabel(sprint.boardId, sprint.originBoardId) }}
                                    </RouterLink>
                                    <template v-else>{{ sprintBoardLabel(sprint.boardId, sprint.originBoardId) }}</template>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>

            <JiraProjectIssuesTable :project-id="projectId" />
        </template>

        <template v-else>
            <h5 class="text-h5 font-weight-semibold mb-2">Jira Project Issues</h5>
            <p class="text-body-1 text-medium-emphasis mb-0">Select a Jira project from the table to view details.</p>
        </template>
    </JackHenryPageCard>
</template>

