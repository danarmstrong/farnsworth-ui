<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
    JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE,
    useJiraProjectIssueStore
} from '@/features/jack-henry/jira-projects/stores/jiraProjectIssueStore';
import type {
    JiraIssueListItem,
    JiraIssueReviewMetadata,
    JiraIssueStatusCategoryFilter,
    JiraIssueUserIdentity
} from '@/features/jack-henry/jira-projects/types/JiraIssue';
import { formatUtcLocal } from '@/utils/helpers/dateTime';

const DEFAULT_IDENTITY = {
    assigneeAccountId: null,
    assigneeDisplayName: null,
    reporterAccountId: null,
    reporterDisplayName: null,
    creatorAccountId: null,
    creatorDisplayName: null
};

interface Props {
    projectId: string;
    sprintId?: string;
    boardId?: string;
}

const props = defineProps<Props>();

const store = useJiraProjectIssueStore();
const page = ref(1);
const pageSize = ref(JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE);
const pageSizeOptions = [10, 25, 50];
const search = ref('');
type JiraIssueStatusFilter = 'open-default' | JiraIssueStatusCategoryFilter;
const statusFilter = ref<JiraIssueStatusFilter>('open-default');

const hasPagination = computed(() => store.totalPages > 1);
const isBusy = computed(() => store.loading);

watch(
    () => [props.projectId, props.sprintId, props.boardId],
    ([projectId]) => {
        const normalizedProjectId = projectId?.trim() || '';
        search.value = '';
        statusFilter.value = 'open-default';
        page.value = 1;
        pageSize.value = JIRA_PROJECT_ISSUES_DEFAULT_PAGE_SIZE;
        if (normalizedProjectId) {
            void loadPage(normalizedProjectId, 1);
        }
    },
    { immediate: true }
);

const statusCategoryCounts = computed(() => store.statusCategoryCounts);

const projectIssueCount = computed(() => {
    const counts = statusCategoryCounts.value;
    return counts.ToDo + counts.InProgress + counts.Done + counts.Uncategorized;
});

const scopedIssueCount = computed(() => store.totalCount);
const isSprintScoped = computed(() => Boolean(props.sprintId?.trim()));
const isBoardScoped = computed(() => Boolean(props.boardId?.trim()));
const scopeLabel = computed(() => {
    if (isSprintScoped.value) {
        return 'sprint';
    }

    if (isBoardScoped.value) {
        return 'board';
    }

    return 'project';
});

const openTicketCount = computed(() => {
    const counts = statusCategoryCounts.value;
    return counts.ToDo + counts.InProgress + counts.Uncategorized;
});

const inProgressTicketCount = computed(() => {
    return statusCategoryCounts.value.InProgress;
});

const doneTicketCount = computed(() => {
    return statusCategoryCounts.value.Done;
});

const uncategorizedTicketCount = computed(() => {
    return statusCategoryCounts.value.Uncategorized;
});

const activeFilterLabel = computed(() => {
    switch (statusFilter.value) {
        case 'ToDo':
            return 'To Do issues';
        case 'InProgress':
            return 'In Progress issues';
        case 'Done':
            return 'Done issues';
        case 'Uncategorized':
            return 'Uncategorized issues';
        default:
            return 'open issues';
    }
});

const scopeSummaryPrefix = computed(() => {
    if (isSprintScoped.value) {
        return `Viewing ${scopedIssueCount.value} ${activeFilterLabel.value} in this sprint.`;
    }

    if (isBoardScoped.value) {
        return `Viewing ${scopedIssueCount.value} ${activeFilterLabel.value} in this board.`;
    }

    return `Viewing ${scopedIssueCount.value} ${activeFilterLabel.value} from ${projectIssueCount.value} total project issues.`;
});

const filteredIssues = computed(() => {
    const normalizedSearch = search.value.trim().toLowerCase();

    return store.issues.filter((issue) => {
        if (!normalizedSearch) {
            return true;
        }

        const haystack = [
            issueKey(issue),
            issueSummary(issue),
            issueStatus(issue),
            issueStatusCategory(issue),
            issueAssignee(issue),
            issueReporter(issue),
            issuePriority(issue),
            issueType(issue),
            issueReviewed(issue),
            issueReviewScore(issue),
            issueIdentity(issue).assigneeDisplayName || '',
            issueIdentity(issue).reporterDisplayName || '',
            issueIdentity(issue).creatorDisplayName || ''
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedSearch);
    });
});

const pageSummary = computed(() => {
    if (!store.totalCount) {
        return 'No Jira issues found.';
    }

    if (search.value.trim()) {
        const count = filteredIssues.value.length;
        return count === 1 ? 'Showing 1 matching issue on this page' : `Showing ${count} matching issues on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.totalCount);
    return `Showing ${start} to ${end} of ${store.totalCount} ${activeFilterLabel.value}`;
});

function statusCategoryForFilter(filter: JiraIssueStatusFilter): JiraIssueStatusCategoryFilter | undefined {
    return filter === 'open-default' ? undefined : filter;
}

async function applyStatusFilter(nextFilter: JiraIssueStatusFilter): Promise<void> {
    if (statusFilter.value === nextFilter) {
        return;
    }

    statusFilter.value = nextFilter;
    await loadPage(props.projectId, 1);
}

function issueKey(issue: JiraIssueListItem): string {
    return issue.key || issue.id || '—';
}

function issueSummary(issue: JiraIssueListItem): string {
    return issue.summary || '—';
}

function issueStatus(issue: JiraIssueListItem): string {
    return issue.status?.name || issue.jiraStatusName || 'Unknown';
}

function issueStatusCategory(issue: JiraIssueListItem): string {
    return issue.jiraStatusCategoryName || '—';
}

function issueAssignee(issue: JiraIssueListItem): string {
    return issue.assigneeStaffMember?.displayName || issue.assignee || 'Unassigned';
}

function issueReporter(issue: JiraIssueListItem): string {
    return issue.reporterStaffMember?.displayName || issue.reporter || '—';
}

function staffMemberRoute(staffMember: JiraIssueListItem['assigneeStaffMember'] | JiraIssueListItem['reporterStaffMember']) {
    if (!staffMember?.id) {
        return null;
    }

    return {
        name: 'Staff Member Detail',
        params: {
            id: staffMember.id
        }
    };
}

function issuePriority(issue: JiraIssueListItem): string {
    if (issue.priority === null || issue.priority === undefined) {
        return '—';
    }

    return String(issue.priority);
}

function issueIdentity(issue: JiraIssueListItem): JiraIssueUserIdentity {
    return issue.jiraIdentity || DEFAULT_IDENTITY;
}

function issueReviewMetadata(issue: JiraIssueListItem): JiraIssueReviewMetadata | null {
    return issue.reviewMetadata || null;
}

function issueReviewed(issue: JiraIssueListItem): string {
    const metadata = issueReviewMetadata(issue);
    if (!metadata) {
        return '—';
    }

    return metadata.isReviewed ? 'Reviewed' : 'Not reviewed';
}

function issueReviewedTone(issue: JiraIssueListItem): 'success' | 'default' {
    return issueReviewMetadata(issue)?.isReviewed ? 'success' : 'default';
}

function issueReviewScore(issue: JiraIssueListItem): string {
    const score = issueReviewMetadata(issue)?.score;
    if (score === null || score === undefined) {
        return '—';
    }

    return String(score);
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

function issueType(issue: JiraIssueListItem): string {
    return issue.type?.name || issue.jiraIssueTypeName || '—';
}

function issueCreated(issue: JiraIssueListItem): string {
    return issue.createdAtUtc || '';
}

function issueUpdated(issue: JiraIssueListItem): string {
    return issue.updatedAtUtc || issue.createdAtUtc || '';
}

function formatDate(value: string): string {
    return formatUtcLocal(value) || value;
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

async function loadPage(projectId: string, targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);
    const normalizedSprintId = props.sprintId?.trim() || '';
    const normalizedBoardId = props.boardId?.trim() || '';

    if (normalizedSprintId) {
        await store.fetchSprintIssues(projectId, normalizedSprintId, {
            page: page.value,
            pageSize: pageSize.value,
            statusCategory: statusCategoryForFilter(statusFilter.value)
        });
        return;
    }

    if (normalizedBoardId) {
        await store.fetchBoardIssues(projectId, normalizedBoardId, {
            page: page.value,
            pageSize: pageSize.value,
            statusCategory: statusCategoryForFilter(statusFilter.value)
        });
        return;
    }

    await store.fetchProjectIssues(projectId, {
        page: page.value,
        pageSize: pageSize.value,
        statusCategory: statusCategoryForFilter(statusFilter.value)
    });
}

async function changePage(nextPage: number): Promise<void> {
    if (nextPage === page.value) {
        return;
    }

    await loadPage(props.projectId, nextPage);
}

async function changePageSize(nextPageSize: number): Promise<void> {
    pageSize.value = nextPageSize;
    await loadPage(props.projectId, 1);
}

async function refreshIssues(): Promise<void> {
    await loadPage(props.projectId, page.value);
}

function clearStoreError(): void {
    store.clearError();
}
</script>

<template>
    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.error }}
    </v-alert>

    <v-row class="d-flex flex-nowrap mb-2 overflow-x-auto">
        <v-col cols="10" md="3" sm="6">
            <div class="bg-lightprimary pa-5 text-center cursor-pointer rounded-md" @click="applyStatusFilter('open-default')">
                <h2 class="text-primary text-24">{{ openTicketCount }}</h2>
                <h6 class="text-primary text-h6">Open Issues</h6>
            </div>
        </v-col>
        <v-col cols="10" md="3" sm="6">
            <div class="bg-lighterror pa-5 text-center cursor-pointer rounded-md" @click="applyStatusFilter('ToDo')">
                <h2 class="text-error text-24">{{ statusCategoryCounts.ToDo }}</h2>
                <h6 class="text-error text-h6">To Do</h6>
            </div>
        </v-col>
        <v-col cols="10" md="3" sm="6">
            <div class="bg-lightwarning pa-5 text-center cursor-pointer rounded-md" @click="applyStatusFilter('InProgress')">
                <h2 class="text-warning text-24">{{ inProgressTicketCount }}</h2>
                <h6 class="text-warning text-h6">In Progress</h6>
            </div>
        </v-col>
        <v-col cols="10" md="3" sm="6">
            <div class="bg-lightsuccess pa-5 text-center cursor-pointer rounded-md" @click="applyStatusFilter('Done')">
                <h2 class="text-success text-24">{{ doneTicketCount }}</h2>
                <h6 class="text-success text-h6">Done Issues</h6>
            </div>
        </v-col>
        <v-col cols="10" md="3" sm="6">
            <div class="bg-lightsecondary pa-5 text-center cursor-pointer rounded-md" @click="applyStatusFilter('Uncategorized')">
                <h2 class="text-secondary text-24">{{ uncategorizedTicketCount }}</h2>
                <h6 class="text-secondary text-h6">Uncategorized</h6>
            </div>
        </v-col>
    </v-row>

    <p class="text-body-2 text-medium-emphasis mb-4">{{ scopeSummaryPrefix }}</p>

    <div class="d-sm-flex justify-space-between align-center my-5 gap-3">
        <v-btn color="primary" class="rounded-pill" :loading="isBusy" :disabled="isBusy" @click="refreshIssues">Refresh Issues</v-btn>
        <v-sheet width="320" class="mt-lg-0 mt-3">
            <v-text-field
                v-model="search"
                label="Search issues"
                variant="outlined"
                hide-details
                class="w-100"
                density="compact"
            ></v-text-field>
        </v-sheet>
    </div>

    <div class="border-table">
        <v-table class="jira-project-issues-table">
            <thead>
                <tr>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-key">Key</th>
                    <th class="text-subtitle-1 font-weight-semibold col-summary">Summary</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-type">Type</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-status">Status</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-status-category">Status Category</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-assignee">Assignee</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-reporter">Reporter</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-priority">Priority</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-reviewed">Reviewed</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-review-score">Review Score</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-created">Created</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-updated">Updated</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="store.loading && !store.issues.length">
                    <td colspan="12" class="text-subtitle-1 text-center py-6">Loading Jira {{ scopeLabel }} issues...</td>
                </tr>
                <tr v-else-if="!filteredIssues.length">
                    <td colspan="12" class="text-subtitle-1 text-center py-6">No Jira issues found.</td>
                </tr>
                <tr v-else v-for="issue in filteredIssues" :key="issueKey(issue)">
                    <td class="text-subtitle-1 text-no-wrap col-key">
                        <RouterLink
                            :to="{ name: 'Jira Issue Details', params: { projectId: props.projectId, issueId: issue.id } }"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ issueKey(issue) }}
                        </RouterLink>
                    </td>
                    <td class="text-subtitle-1 col-summary">{{ issueSummary(issue) }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-type">{{ issueType(issue) }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-status">
                        <v-chip size="small" :color="statusTone(issueStatus(issue))" variant="tonal">
                            {{ issueStatus(issue) }}
                        </v-chip>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-status-category">{{ issueStatusCategory(issue) }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-assignee">
                        <RouterLink
                            v-if="staffMemberRoute(issue.assigneeStaffMember)"
                            :to="staffMemberRoute(issue.assigneeStaffMember)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ issueAssignee(issue) }}
                        </RouterLink>
                        <template v-else>{{ issueAssignee(issue) }}</template>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-reporter">
                        <RouterLink
                            v-if="staffMemberRoute(issue.reporterStaffMember)"
                            :to="staffMemberRoute(issue.reporterStaffMember)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ issueReporter(issue) }}
                        </RouterLink>
                        <template v-else>{{ issueReporter(issue) }}</template>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-priority">
                        <v-chip size="small" :color="priorityTone(issuePriority(issue))" variant="tonal">
                            {{ issuePriority(issue) }}
                        </v-chip>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-reviewed">
                        <v-chip size="small" :color="issueReviewedTone(issue)" variant="tonal">
                            {{ issueReviewed(issue) }}
                        </v-chip>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-review-score">
                        {{ issueReviewScore(issue) }}
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-created">
                        {{ issueCreated(issue) ? formatDate(issueCreated(issue)) : '—' }}
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-updated">
                        {{ issueUpdated(issue) ? formatDate(issueUpdated(issue)) : '—' }}
                    </td>
                </tr>
            </tbody>
        </v-table>
    </div>

    <v-divider class="my-4"></v-divider>

    <div class="d-sm-flex justify-space-between align-center gap-4">
        <div class="text-subtitle-1 text-grey100">{{ pageSummary }}</div>

        <div class="d-flex align-center flex-wrap justify-end gap-3">
            <v-select
                :model-value="pageSize"
                :items="pageSizeOptions"
                label="Rows per page"
                density="compact"
                hide-details
                variant="outlined"
                class="jira-project-issues-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            ></v-select>

            <v-pagination
                v-if="hasPagination"
                :model-value="page"
                :length="store.totalPages"
                :total-visible="7"
                rounded="circle"
                density="compact"
                class="text-subtitle-1 text-grey100"
                :disabled="isBusy"
                @update:modelValue="changePage"
            ></v-pagination>
        </div>
    </div>
</template>

<style lang="scss">
.jira-project-issues-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-key,
    .col-type,
    .col-status,
    .col-status-category,
    .col-assignee,
    .col-reporter,
    .col-priority,
    .col-reviewed,
    .col-review-score,
    .col-created,
    .col-updated {
        width: 1%;
        white-space: nowrap;
    }

    .col-summary {
        width: 45%;
        min-width: 360px;
        white-space: normal;
        word-break: break-word;
    }
}

.jira-project-issues-page-size {
    max-width: 160px;
}
</style>








