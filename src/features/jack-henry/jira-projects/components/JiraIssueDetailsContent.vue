<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import { useJiraProjectIssueStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectIssueStore';
import type {
    JiraProjectBoard,
    JiraProjectBoardListResponse,
    JiraProjectSprint,
    JiraProjectSprintListResponse
} from '@/features/jack-henry/jira-projects/types/JiraProject';
import type {
    GithubPullRequestState,
    JiraIssue,
    JiraIssueGithubPullRequestReference,
    JiraIssueReviewMetadata,
    JiraIssueStaffReference,
    JiraIssueUserIdentity
} from '@/features/jack-henry/jira-projects/types/JiraIssue';
import { formatUtcLocal } from '@/utils/helpers/dateTime';

const DEFAULT_JIRA_IDENTITY: JiraIssueUserIdentity = {
    assigneeAccountId: null,
    assigneeDisplayName: null,
    reporterAccountId: null,
    reporterDisplayName: null,
    creatorAccountId: null,
    creatorDisplayName: null
};

const DEFAULT_REVIEW_METADATA: JiraIssueReviewMetadata = {
    isReviewed: false,
    score: null,
    reason: null,
    reviewedAtUtc: null,
    lastAttemptedAtUtc: null,
    model: null,
    lastError: null
};

const route = useRoute();
const projectStore = useJiraProjectStore();
const store = useJiraProjectIssueStore();
const loadError = ref(false);
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

const issueId = computed(() => {
    const raw = route.params.issueId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const issue = computed(() => store.selectedIssue);

const pageTitle = computed(() => {
    if (issue.value?.key) {
        return issue.value.key;
    }

    if (issueId.value) {
        return `Issue ${issueId.value}`;
    }

    return 'Jira Issue';
});

const breadcrumbProjectLabel = computed(() => {
    if (issue.value?.projectKey?.trim()) {
        return issue.value.projectKey.trim();
    }

    return projectId.value || 'Project';
});

const breadcrumbs = computed(() => [
    { text: 'Jira Projects', disabled: false, to: '/configuration/jira-projects' },
    {
        text: breadcrumbProjectLabel.value,
        disabled: false,
        to: projectId.value ? `/jira-projects/${encodeURIComponent(projectId.value)}` : '/configuration/jira-projects'
    },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

const parentRoute = computed(() => {
    if (!issue.value?.parentId || !projectId.value) {
        return null;
    }

    return {
        name: 'Jira Issue Details',
        params: {
            projectId: projectId.value,
            issueId: issue.value.parentId
        }
    };
});

const boardById = computed(() => new Map((boardList.value?.items || []).map((board) => [board.id, board])));
const sprintById = computed(() => new Map((sprintList.value?.items || []).map((sprint) => [sprint.id, sprint])));

function uniqueNormalizedIds(ids: Array<string | null | undefined>): string[] {
    const normalizedIds = ids
        .map((id) => id?.trim() || '')
        .filter(Boolean);

    return [...new Set(normalizedIds)];
}

const linkedBoardIds = computed(() => {
    if (!issue.value) {
        return [];
    }

    return uniqueNormalizedIds([...(issue.value.jiraBoardIds || []), issue.value.jiraBoardId]);
});

const linkedSprintIds = computed(() => {
    if (!issue.value) {
        return [];
    }

    return uniqueNormalizedIds([...(issue.value.jiraSprintIds || []), issue.value.jiraSprintId]);
});

type IssueLinkedBoard = {
    id: string;
    board: JiraProjectBoard | null;
    label: string;
};

type IssueLinkedSprint = {
    id: string;
    sprint: JiraProjectSprint | null;
    label: string;
};

const linkedBoards = computed<IssueLinkedBoard[]>(() => {
    return linkedBoardIds.value.map((id) => {
        const board = boardById.value.get(id) || null;
        return {
            id,
            board,
            label: board?.name?.trim() || id
        };
    });
});

const linkedSprints = computed<IssueLinkedSprint[]>(() => {
    return linkedSprintIds.value.map((id) => {
        const sprint = sprintById.value.get(id) || null;
        return {
            id,
            sprint,
            label: sprint?.name?.trim() || id
        };
    });
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
    [projectId, issueId],
    async ([nextProjectId, nextIssueId]) => {
        loadError.value = false;
        store.clearSelectedIssueError();

        if (!nextProjectId || !nextIssueId) {
            store.clearSelectedIssue();
            boardList.value = null;
            boardListError.value = null;
            sprintList.value = null;
            sprintListError.value = null;
            loadError.value = true;
            return;
        }

        const [result] = await Promise.all([
            store.getProjectIssue(nextProjectId, nextIssueId),
            loadBoards(nextProjectId),
            loadSprints(nextProjectId)
        ]);
        loadError.value = !result;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    store.clearSelectedIssue();
});

function issueStatus(value: JiraIssue): string {
    return value.status?.name || value.jiraStatusName || 'Unknown';
}

function issueType(value: JiraIssue): string {
    return value.type?.name || value.jiraIssueTypeName || '—';
}

function issuePriority(value: JiraIssue): string {
    if (value.priority === null || value.priority === undefined || value.priority === '') {
        return '—';
    }

    return String(value.priority);
}

function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return formatUtcLocal(value) || value;
}

function displayValue(value: string | null | undefined, empty = '—'): string {
    return value?.trim() || empty;
}

function reviewScore(value: JiraIssue): string {
    const metadata = issueReviewMetadata(value);

    if (metadata.score === null || metadata.score === undefined) {
        return '—';
    }

    return String(metadata.score);
}

function reviewedLabel(value: JiraIssue): string {
    return issueReviewMetadata(value).isReviewed ? 'Yes' : 'No';
}

function hasPullRequestIds(value: JiraIssue): boolean {
    return value.githubPullRequestIds.length > 0;
}

function issueIdentity(value: JiraIssue): JiraIssueUserIdentity {
    return value.jiraIdentity || DEFAULT_JIRA_IDENTITY;
}

function issueReviewMetadata(value: JiraIssue): JiraIssueReviewMetadata {
    return value.reviewMetadata || DEFAULT_REVIEW_METADATA;
}

function hasText(value: string | null | undefined): boolean {
    return Boolean(value?.trim());
}

function hasAssignee(value: JiraIssue): boolean {
    return hasText(value.assigneeStaffMember?.displayName) || hasText(value.assignee);
}

function hasReporter(value: JiraIssue): boolean {
    return hasText(value.reporterStaffMember?.displayName) || hasText(value.reporter);
}

function hasCreator(value: JiraIssue): boolean {
    return hasText(value.creatorStaffMember?.displayName) || hasText(value.creator);
}

function displayStaff(staff: JiraIssueStaffReference | null | undefined, fallback: string | null | undefined, empty = '—'): string {
    return staff?.displayName || fallback || empty;
}

function staffMemberRoute(staff: JiraIssueStaffReference | null | undefined) {
    if (!staff?.id) {
        return null;
    }

    return {
        name: 'Staff Member Detail',
        params: {
            id: staff.id
        }
    };
}

function normalizedPriority(priority: string): string {
    return priority.trim().toLowerCase();
}

function priorityTone(priority: string): 'error' | 'warning' | 'info' | 'success' | 'default' {
    const normalized = normalizedPriority(priority);

    if (normalized === 'highest' || normalized === 'critical' || normalized === 'blocker' || normalized === 'p0') {
        return 'error';
    }

    if (normalized === 'high' || normalized === 'major' || normalized === 'p1') {
        return 'warning';
    }

    if (normalized === 'medium' || normalized === 'normal' || normalized === 'p2') {
        return 'info';
    }

    if (normalized === 'low' || normalized === 'lowest' || normalized === 'minor' || normalized === 'trivial' || normalized === 'p3') {
        return 'success';
    }

    return 'default';
}

function normalizedStatus(status: string): string {
    return status.trim().toLowerCase();
}

function isDoneStatus(status: string): boolean {
    const normalized = normalizedStatus(status);
    return normalized.includes('done') || normalized.includes('closed') || normalized.includes('resolved');
}

function isInProgressStatus(status: string): boolean {
    const normalized = normalizedStatus(status);
    return normalized.includes('progress') || normalized.includes('review') || normalized.includes('qa');
}

function isOpenStatus(status: string): boolean {
    const normalized = normalizedStatus(status);
    return normalized.includes('open') || normalized.includes('todo') || normalized.includes('to do') || normalized.includes('backlog');
}

function statusTone(status: string): 'success' | 'warning' | 'error' | 'default' {
    if (isDoneStatus(status)) {
        return 'success';
    }

    if (isInProgressStatus(status)) {
        return 'warning';
    }

    if (isOpenStatus(status)) {
        return 'error';
    }

    return 'default';
}

function githubPullRequestStateLabel(state: GithubPullRequestState): string {
    return String(state ?? 'Unknown').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function githubPullRequestStateTone(state: GithubPullRequestState): 'success' | 'warning' | 'info' | 'default' {
    const normalized = String(state ?? '').trim().toLowerCase();

    if (normalized.includes('open')) {
        return 'info';
    }

    if (normalized.includes('merged')) {
        return 'success';
    }

    if (normalized.includes('closed')) {
        return 'warning';
    }

    return 'default';
}

function parentLabel(value: JiraIssue): string {
    return value.parentKey || value.parentExternalId || value.parentId || '—';
}

function issueDescription(value: JiraIssue): string {
    return value.description?.trim() ? value.description : 'No description provided.';
}

function issueLabels(value: JiraIssue): string[] {
    return (value.labels || []).filter((label) => Boolean(label?.trim()));
}

function hasLabels(value: JiraIssue): boolean {
    return issueLabels(value).length > 0;
}

function hasNotes(value: JiraIssue): boolean {
    return value.notes.length > 0;
}

function hasGithubPullRequests(value: JiraIssue): boolean {
    return value.githubPullRequests.length > 0;
}

function githubPullRequestKey(pullRequest: JiraIssueGithubPullRequestReference): string {
    return pullRequest.id || pullRequest.externalId || String(pullRequest.number);
}
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || store.selectedIssueError"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            store.clearSelectedIssueError();
            loadError = false;
        "
    >
        {{ store.selectedIssueError || 'Jira issue could not be loaded.' }}
    </v-alert>

    <div v-else-if="store.selectedIssueLoading && !issue" class="text-subtitle-1 py-8 text-center">Loading Jira issue…</div>

    <template v-else-if="issue">
        <v-alert v-if="boardListError" type="warning" variant="tonal" class="mb-4">{{ boardListError }}</v-alert>
        <v-alert v-if="sprintListError" type="warning" variant="tonal" class="mb-4">{{ sprintListError }}</v-alert>

        <v-row>
            <v-col cols="12">
                <v-card elevation="10" class="mb-6">
                    <v-card-text class="pa-6 pa-sm-8">
                        <div class="d-flex flex-column flex-lg-row justify-space-between align-start gap-4 mb-5">
                            <div class="jira-issue-header-copy">
                                <div class="d-flex flex-wrap align-center gap-2 mb-3">
                                    <v-chip size="small" color="primary" variant="tonal">{{ issue.key }}</v-chip>
                                    <v-chip size="small" :color="statusTone(issueStatus(issue))" variant="tonal">
                                        {{ issueStatus(issue) }}
                                    </v-chip>
                                    <v-chip size="small" :color="priorityTone(issuePriority(issue))" variant="tonal">
                                        {{ issuePriority(issue) }}
                                    </v-chip>
                                    <v-chip size="small" variant="outlined">{{ issueType(issue) }}</v-chip>
                                    <v-chip size="small" variant="outlined">
                                        {{ linkedBoards.length }} board{{ linkedBoards.length === 1 ? '' : 's' }}
                                    </v-chip>
                                    <v-chip size="small" variant="outlined">
                                        {{ linkedSprints.length }} sprint{{ linkedSprints.length === 1 ? '' : 's' }}
                                    </v-chip>
                                </div>
                                <h1 class="text-h4 font-weight-bold mb-2 jira-issue-summary">{{ issue.summary }}</h1>
                                <p class="text-body-1 text-medium-emphasis mb-0">
                                    Project {{ issue.projectKey }} · Issue ID {{ issue.id }}
                                </p>
                            </div>

                            <div class="d-flex flex-wrap gap-3 justify-start justify-lg-end">
                                <v-btn
                                    :to="{ name: 'Jira Project Details', params: { projectId } }"
                                    variant="outlined"
                                    color="primary"
                                >
                                    Back to issues
                                </v-btn>
                                <v-btn
                                    :href="issue.jiraLink"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    color="primary"
                                >
                                    Open in Jira
                                </v-btn>
                            </div>
                        </div>

                        <v-divider class="mb-5"></v-divider>

                        <v-row>
                            <v-col cols="12" md="8">
                                <section class="mb-6">
                                    <h2 class="text-h6 font-weight-semibold mb-3">Description</h2>
                                    <div class="jira-issue-description">{{ issueDescription(issue) }}</div>
                                </section>

                                <section class="mb-6">
                                    <div class="d-flex align-center justify-space-between mb-3 gap-3 flex-wrap">
                                        <h2 class="text-h6 font-weight-semibold mb-0">Labels</h2>
                                        <span class="text-caption text-medium-emphasis">{{ issueLabels(issue).length }} total</span>
                                    </div>
                                    <v-card variant="outlined">
                                        <v-card-text v-if="hasLabels(issue)" class="d-flex flex-wrap gap-2">
                                            <v-chip
                                                v-for="(label, index) in issueLabels(issue)"
                                                :key="`${issue.id}-label-${label}-${index}`"
                                                size="small"
                                                variant="tonal"
                                            >
                                                {{ label }}
                                            </v-chip>
                                        </v-card-text>
                                        <v-card-text v-else class="text-body-2 text-medium-emphasis">No labels assigned.</v-card-text>
                                    </v-card>
                                </section>

                                <section class="mb-6">
                                    <div class="d-flex align-center justify-space-between mb-3 gap-3 flex-wrap">
                                        <h2 class="text-h6 font-weight-semibold mb-0">Notes</h2>
                                        <span class="text-caption text-medium-emphasis">{{ issue.notes.length }} total</span>
                                    </div>
                                    <v-card variant="outlined">
                                        <v-list v-if="hasNotes(issue)" lines="three" class="py-0">
                                            <v-list-item v-for="(note, index) in issue.notes" :key="`${issue.id}-note-${index}`">
                                                <template #prepend>
                                                    <span class="text-caption text-medium-emphasis mr-4">{{ index + 1 }}</span>
                                                </template>
                                                <v-list-item-title class="text-body-2 jira-issue-note">{{ note }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                        <v-card-text v-else class="text-body-2 text-medium-emphasis">No notes recorded.</v-card-text>
                                    </v-card>
                                </section>

                                <section>
                                    <div class="d-flex align-center justify-space-between mb-3 gap-3 flex-wrap">
                                        <h2 class="text-h6 font-weight-semibold mb-0">GitHub Pull Requests</h2>
                                        <span class="text-caption text-medium-emphasis">{{ issue.githubPullRequests.length }} linked</span>
                                    </div>
                                    <v-card variant="outlined">
                                        <v-list v-if="hasGithubPullRequests(issue)" lines="two" class="py-0">
                                            <v-list-item
                                                v-for="pullRequest in issue.githubPullRequests"
                                                :key="githubPullRequestKey(pullRequest)"
                                                :href="pullRequest.url"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <template #title>
                                                    <div class="d-flex flex-wrap align-center gap-2">
                                                        <span class="font-weight-medium">#{{ pullRequest.number }}</span>
                                                        <span>{{ pullRequest.title }}</span>
                                                    </div>
                                                </template>
                                                <template #subtitle>
                                                    <div class="d-flex flex-wrap align-center gap-2 mt-1">
                                                        <v-chip
                                                            size="x-small"
                                                            :color="githubPullRequestStateTone(pullRequest.state)"
                                                            variant="tonal"
                                                        >
                                                            {{ githubPullRequestStateLabel(pullRequest.state) }}
                                                        </v-chip>
                                                        <span class="text-caption text-medium-emphasis">
                                                            External ID: {{ pullRequest.externalId }}
                                                        </span>
                                                    </div>
                                                </template>
                                                <template #append>
                                                    <span class="text-primary text-caption">Open</span>
                                                </template>
                                            </v-list-item>
                                        </v-list>
                                        <v-card-text v-else class="text-body-2 text-medium-emphasis">
                                            No GitHub pull requests are linked to this issue.
                                        </v-card-text>
                                    </v-card>
                                </section>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-card variant="outlined" class="mb-4">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Details</h2>
                                        <dl class="jira-issue-detail-list">
                                            <div>
                                                <dt>Status</dt>
                                                <dd>
                                                    <v-chip size="small" :color="statusTone(issueStatus(issue))" variant="tonal">
                                                        {{ issueStatus(issue) }}
                                                    </v-chip>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Status Name</dt>
                                                <dd>{{ displayValue(issue.jiraStatusName) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Status Category</dt>
                                                <dd>{{ displayValue(issue.jiraStatusCategoryName) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Type</dt>
                                                <dd>{{ issueType(issue) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Type Name</dt>
                                                <dd>{{ displayValue(issue.jiraIssueTypeName) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Priority</dt>
                                                <dd>
                                                    <v-chip size="small" :color="priorityTone(issuePriority(issue))" variant="tonal">
                                                        {{ issuePriority(issue) }}
                                                    </v-chip>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Story Points</dt>
                                                <dd>{{ issue.storyPoints ?? '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Linked Boards</dt>
                                                <dd>
                                                    <div v-if="linkedBoards.length" class="jira-issue-linked-items">
                                                        <RouterLink
                                                            v-for="linkedBoard in linkedBoards"
                                                            :key="`${issue.id}-board-${linkedBoard.id}`"
                                                            :to="{ name: 'Jira Board Details', params: { projectId, boardId: linkedBoard.id } }"
                                                            class="text-decoration-none"
                                                        >
                                                            <v-chip size="small" color="primary" variant="tonal">
                                                                {{ linkedBoard.label }}
                                                            </v-chip>
                                                        </RouterLink>
                                                    </div>
                                                    <span
                                                        v-else-if="boardListLoading"
                                                        class="text-caption text-medium-emphasis jira-issue-linked-loading"
                                                    >
                                                        Resolving board links…
                                                    </span>
                                                    <span v-else>—</span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Linked Sprints</dt>
                                                <dd>
                                                    <div v-if="linkedSprints.length" class="jira-issue-linked-items">
                                                        <RouterLink
                                                            v-for="linkedSprint in linkedSprints"
                                                            :key="`${issue.id}-sprint-${linkedSprint.id}`"
                                                            :to="{ name: 'Jira Sprint Details', params: { projectId, sprintId: linkedSprint.id } }"
                                                            class="text-decoration-none"
                                                        >
                                                            <v-chip size="small" color="primary" variant="tonal">
                                                                {{ linkedSprint.label }}
                                                            </v-chip>
                                                        </RouterLink>
                                                    </div>
                                                    <span
                                                        v-else-if="sprintListLoading"
                                                        class="text-caption text-medium-emphasis jira-issue-linked-loading"
                                                    >
                                                        Resolving sprint links…
                                                    </span>
                                                    <span v-else>—</span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Parent</dt>
                                                <dd>
                                                    <RouterLink
                                                        v-if="parentRoute"
                                                        :to="parentRoute"
                                                        class="text-primary text-decoration-none font-weight-medium"
                                                    >
                                                        {{ parentLabel(issue) }}
                                                    </RouterLink>
                                                    <template v-else>{{ parentLabel(issue) }}</template>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Assignee</dt>
                                                <dd>
                                                    <RouterLink
                                                        v-if="staffMemberRoute(issue.assigneeStaffMember)"
                                                        :to="staffMemberRoute(issue.assigneeStaffMember)!"
                                                        class="text-primary text-decoration-none font-weight-medium"
                                                    >
                                                        {{ displayStaff(issue.assigneeStaffMember, issue.assignee, 'Unassigned') }}
                                                    </RouterLink>
                                                    <template v-else>{{ displayStaff(issue.assigneeStaffMember, issue.assignee, 'Unassigned') }}</template>
                                                </dd>
                                            </div>
                                            <div v-if="!hasAssignee(issue)">
                                                <dt>Assignee Identity</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).assigneeDisplayName || issueIdentity(issue).assigneeAccountId, 'Unassigned') }}</dd>
                                            </div>
                                            <div>
                                                <dt>Reporter</dt>
                                                <dd>
                                                    <RouterLink
                                                        v-if="staffMemberRoute(issue.reporterStaffMember)"
                                                        :to="staffMemberRoute(issue.reporterStaffMember)!"
                                                        class="text-primary text-decoration-none font-weight-medium"
                                                    >
                                                        {{ displayStaff(issue.reporterStaffMember, issue.reporter) }}
                                                    </RouterLink>
                                                    <template v-else>{{ displayStaff(issue.reporterStaffMember, issue.reporter) }}</template>
                                                </dd>
                                            </div>
                                            <div v-if="!hasReporter(issue)">
                                                <dt>Reporter Identity</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).reporterDisplayName || issueIdentity(issue).reporterAccountId) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Creator</dt>
                                                <dd>
                                                    <RouterLink
                                                        v-if="staffMemberRoute(issue.creatorStaffMember)"
                                                        :to="staffMemberRoute(issue.creatorStaffMember)!"
                                                        class="text-primary text-decoration-none font-weight-medium"
                                                    >
                                                        {{ displayStaff(issue.creatorStaffMember, issue.creator) }}
                                                    </RouterLink>
                                                    <template v-else>{{ displayStaff(issue.creatorStaffMember, issue.creator) }}</template>
                                                </dd>
                                            </div>
                                            <div v-if="!hasCreator(issue)">
                                                <dt>Creator Identity</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).creatorDisplayName || issueIdentity(issue).creatorAccountId) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Created</dt>
                                                <dd>{{ formatDate(issue.createdAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Updated</dt>
                                                <dd>{{ formatDate(issue.updatedAtUtc || issue.createdAtUtc) }}</dd>
                                            </div>
                                        </dl>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Identifiers</h2>
                                        <dl class="jira-issue-detail-list jira-issue-detail-list--compact">
                                            <div>
                                                <dt>Internal ID</dt>
                                                <dd>{{ issue.id }}</dd>
                                            </div>
                                            <div>
                                                <dt>External ID</dt>
                                                <dd>{{ issue.externalId }}</dd>
                                            </div>
                                            <div>
                                                <dt>Project Key</dt>
                                                <dd>{{ issue.projectKey }}</dd>
                                            </div>
                                            <div>
                                                <dt>Issue Key</dt>
                                                <dd>{{ issue.key }}</dd>
                                            </div>
                                            <div>
                                                <dt>Status ID</dt>
                                                <dd>{{ issue.jiraStatusId }}</dd>
                                            </div>
                                            <div>
                                                <dt>Type ID</dt>
                                                <dd>{{ issue.jiraIssueTypeId }}</dd>
                                            </div>
                                            <div>
                                                <dt>Linked Board IDs</dt>
                                                <dd>{{ linkedBoardIds.join(', ') || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Linked Sprint IDs</dt>
                                                <dd>{{ linkedSprintIds.join(', ') || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Parent ID</dt>
                                                <dd>{{ issue.parentId || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Parent External ID</dt>
                                                <dd>{{ issue.parentExternalId || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Parent Key</dt>
                                                <dd>{{ issue.parentKey || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Last Sync Run</dt>
                                                <dd>{{ issue.lastProjectSyncRunId || '—' }}</dd>
                                            </div>
                                        </dl>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined" class="mt-4">
                                    <v-card-text class="pa-0">
                                        <v-expansion-panels variant="accordion">
                                            <v-expansion-panel>
                                                <v-expansion-panel-title>
                                                    Raw Source Fields
                                                </v-expansion-panel-title>
                                                <v-expansion-panel-text>
                                                    <dl class="jira-issue-detail-list jira-issue-detail-list--compact">
                                                        <div>
                                                            <dt>Assignee Raw</dt>
                                                            <dd>{{ issue.assignee || '—' }}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Reporter Raw</dt>
                                                            <dd>{{ issue.reporter || '—' }}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Creator Raw</dt>
                                                            <dd>{{ issue.creator || '—' }}</dd>
                                                        </div>
                                                    </dl>
                                                </v-expansion-panel-text>
                                            </v-expansion-panel>
                                        </v-expansion-panels>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined" class="mt-4">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Jira Identity</h2>
                                        <dl class="jira-issue-detail-list jira-issue-detail-list--compact">
                                            <div>
                                                <dt>Assignee Account ID</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).assigneeAccountId) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Assignee Display Name</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).assigneeDisplayName, 'Unassigned') }}</dd>
                                            </div>
                                            <div>
                                                <dt>Reporter Account ID</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).reporterAccountId) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Reporter Display Name</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).reporterDisplayName) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Creator Account ID</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).creatorAccountId) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Creator Display Name</dt>
                                                <dd>{{ displayValue(issueIdentity(issue).creatorDisplayName) }}</dd>
                                            </div>
                                        </dl>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined" class="mt-4">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Review Metadata</h2>
                                        <dl class="jira-issue-detail-list jira-issue-detail-list--compact">
                                            <div>
                                                <dt>Reviewed</dt>
                                                <dd>{{ reviewedLabel(issue) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Score</dt>
                                                <dd>{{ reviewScore(issue) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Reason</dt>
                                                <dd>{{ displayValue(issueReviewMetadata(issue).reason) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Reviewed At</dt>
                                                <dd>{{ formatDate(issueReviewMetadata(issue).reviewedAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Last Attempted At</dt>
                                                <dd>{{ formatDate(issueReviewMetadata(issue).lastAttemptedAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Model</dt>
                                                <dd>{{ displayValue(issueReviewMetadata(issue).model) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Last Error</dt>
                                                <dd>{{ displayValue(issueReviewMetadata(issue).lastError) }}</dd>
                                            </div>
                                        </dl>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined" class="mt-4">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">GitHub Pull Request IDs</h2>
                                        <v-list v-if="hasPullRequestIds(issue)" lines="one" class="py-0">
                                            <v-list-item
                                                v-for="pullRequestId in issue.githubPullRequestIds"
                                                :key="`${issue.id}-pr-id-${pullRequestId}`"
                                            >
                                                <v-list-item-title class="text-body-2">{{ pullRequestId }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                        <p v-else class="text-body-2 text-medium-emphasis mb-0">No linked pull request IDs.</p>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </template>
</template>

<style lang="scss">
.jira-issue-header-copy {
    min-width: 0;
}

.jira-issue-summary {
    word-break: break-word;
}

.jira-issue-description,
.jira-issue-note {
    white-space: pre-wrap;
    word-break: break-word;
}

.jira-issue-description {
    padding: 1rem 1.125rem;
    border: 1px solid rgb(var(--v-theme-borderColor));
    border-radius: 12px;
    background: rgba(var(--v-theme-surface), 0.5);
    line-height: 1.7;
}

.jira-issue-detail-list {
    display: grid;
    gap: 1rem;

    div {
        display: grid;
        gap: 0.35rem;
    }

    dt {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(var(--v-theme-on-surface), 0.65);
    }

    dd {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.5;
        word-break: break-word;
    }
}

.jira-issue-detail-list--compact {
    gap: 0.9rem;
}

.jira-issue-linked-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.jira-issue-linked-loading {
    display: inline-block;
    margin-top: 0.5rem;
}
</style>














