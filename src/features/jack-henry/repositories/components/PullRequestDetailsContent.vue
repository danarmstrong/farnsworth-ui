<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { useGithubRepoStore } from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type {
    GithubPullRequest,
    GithubPullRequestJiraIssueSlimReference,
    GithubPullRequestStaffMemberSlimReference
} from '@/features/jack-henry/repositories/types/GithubPullRequest';
import type { GithubRepository } from '@/features/jack-henry/repositories/types/GithubRepository';
import { formatUtcLocal } from '@/utils/helpers/dateTime';
import { pullRequestStateLabel, pullRequestStateTone } from '@/features/jack-henry/repositories/utils/repositoryStatusPresentation';
import RepositoryStatusChip from '@/features/jack-henry/repositories/components/RepositoryStatusChip.vue';

interface PullRequestReviewerDisplay {
    key: string;
    label: string;
    staffMemberId: string | null;
}

const route = useRoute();
const store = useGithubRepoStore();
const repository = ref<GithubRepository | null>(null);
const loadError = ref(false);

const repositoryId = computed(() => {
    const raw = route.params.id;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const pullRequestId = computed(() => {
    const raw = route.params.pullRequestId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const pullRequest = computed(() => store.selectedPullRequest);
const requestedReviewerList = computed(() => (pullRequest.value ? requestedReviewers(pullRequest.value) : []));
const completedReviewerList = computed(() => (pullRequest.value ? completedReviewers(pullRequest.value) : []));

const pageTitle = computed(() => {
    if (pullRequest.value?.number) {
        return `PR #${pullRequest.value.number}`;
    }

    if (pullRequestId.value) {
        return `Pull Request ${pullRequestId.value}`;
    }

    return 'Pull Request';
});

const breadcrumbs = computed(() => [
    { text: 'Repositories', disabled: false, to: '/repositories' },
    {
        text: repository.value?.name || 'Repository',
        disabled: false,
        to: repositoryId.value ? `/repositories/${encodeURIComponent(repositoryId.value)}` : '/repositories'
    },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

watch(
    [repositoryId, pullRequestId],
    async ([nextRepositoryId, nextPullRequestId]) => {
        loadError.value = false;
        repository.value = null;
        store.clearSelectedPullRequestError();
        store.clearError();

        if (!nextRepositoryId || !nextPullRequestId) {
            store.clearSelectedPullRequest();
            loadError.value = true;
            return;
        }

        repository.value = await store.getGithubRepo(nextRepositoryId);
        const result = await store.getRepositoryPullRequest(nextRepositoryId, nextPullRequestId);
        loadError.value = !result;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    store.clearSelectedPullRequest();
});

function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return formatUtcLocal(value) || value;
}

function reviewerLabel(
    staffMember: GithubPullRequestStaffMemberSlimReference | null | undefined,
    fallback: string | null | undefined
): string {
    return staffMember?.displayName?.trim() || fallback?.trim() || '—';
}

function staffMemberRouteById(staffMemberId: string | null | undefined) {
    const normalizedStaffMemberId = staffMemberId?.trim();

    if (!normalizedStaffMemberId) {
        return null;
    }

    return {
        name: 'Staff Member Detail',
        params: {
            id: normalizedStaffMemberId
        }
    };
}

function staffMemberRoute(staffMember: GithubPullRequestStaffMemberSlimReference | null | undefined) {
    return staffMemberRouteById(staffMember?.id);
}

function authorLabel(value: GithubPullRequest): string {
    return reviewerLabel(value.authorStaffMember, value.author);
}

function reviewerRoute(reviewer: PullRequestReviewerDisplay) {
    return staffMemberRouteById(reviewer.staffMemberId);
}

function buildReviewerDisplay(
    reviewers: string[],
    staffMembers: GithubPullRequestStaffMemberSlimReference[]
): PullRequestReviewerDisplay[] {
    const items: PullRequestReviewerDisplay[] = [];
    const seen = new Set<string>();
    const normalizedReviewers = reviewers.map((reviewer) => reviewer.trim()).filter(Boolean);

    normalizedReviewers.forEach((reviewer, index) => {
        const staffMember = staffMembers[index];
        const label = reviewerLabel(staffMember, reviewer);
        const staffMemberId = staffMember?.id?.trim() || null;
        const dedupeKey = `${staffMemberId ?? ''}|${reviewer.toLowerCase()}`;

        if (seen.has(dedupeKey)) {
            return;
        }

        seen.add(dedupeKey);
        items.push({
            key: staffMemberId ?? `reviewer-${reviewer.toLowerCase().replace(/\s+/g, '-')}-${index}`,
            label,
            staffMemberId
        });
    });

    staffMembers.slice(normalizedReviewers.length).forEach((staffMember) => {
        const label = reviewerLabel(staffMember, null);
        const staffMemberId = staffMember.id?.trim() || null;
        const dedupeKey = `${staffMemberId ?? ''}|${label.toLowerCase()}`;

        if (seen.has(dedupeKey)) {
            return;
        }

        seen.add(dedupeKey);

        items.push({
            key: staffMemberId ?? `reviewer-${items.length}`,
            label,
            staffMemberId
        });
    });

    if (items.length) {
        return items;
    }

    reviewers.forEach((reviewer) => {
        const label = reviewer.trim();
        if (!label) {
            return;
        }

        const dedupeKey = `|${label.toLowerCase()}`;
        if (seen.has(dedupeKey)) {
            return;
        }

        seen.add(dedupeKey);
        items.push({
            key: `reviewer-${label.toLowerCase().replace(/\s+/g, '-')}-${items.length}`,
            label,
            staffMemberId: null
        });
    });

    return items;
}

function requestedReviewers(value: GithubPullRequest): PullRequestReviewerDisplay[] {
    return buildReviewerDisplay(value.requestedReviewers, value.requestedReviewerStaffMembers);
}

function completedReviewers(value: GithubPullRequest): PullRequestReviewerDisplay[] {
    return buildReviewerDisplay(value.completedReviewers, value.completedReviewerStaffMembers);
}

function jiraIssueKey(issue: GithubPullRequestJiraIssueSlimReference): string {
    return issue.id || issue.key;
}

function jiraIssueRoute(issue: GithubPullRequestJiraIssueSlimReference) {
    const [projectKey] = issue.key.split('-');
    const normalizedProjectKey = projectKey?.trim() || '';

    if (!normalizedProjectKey || !issue.id) {
        return null;
    }

    return {
        name: 'Jira Issue Details',
        params: {
            projectKey: normalizedProjectKey,
            issueId: issue.id
        }
    };
}
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || store.selectedPullRequestError"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            store.clearSelectedPullRequestError();
            loadError = false;
        "
    >
        {{ store.selectedPullRequestError || 'Pull request could not be loaded.' }}
    </v-alert>

    <div v-else-if="store.selectedPullRequestLoading && !pullRequest" class="text-subtitle-1 py-8 text-center">Loading pull request...</div>

    <template v-else-if="pullRequest">
        <v-row>
            <v-col cols="12">
                <v-card elevation="10" class="mb-6">
                    <v-card-text class="pa-6 pa-sm-8">
                        <div class="d-flex flex-column flex-lg-row justify-space-between align-start gap-4 mb-5">
                            <div class="pr-header-copy">
                                <div class="d-flex flex-wrap align-center gap-2 mb-3">
                                    <RepositoryStatusChip :label="`#${pullRequest.number}`" color="primary" />
                                    <RepositoryStatusChip :label="pullRequestStateLabel(pullRequest.state)" :tone="pullRequestStateTone(pullRequest.state)" />
                                </div>

                                <h1 class="text-h4 font-weight-bold mb-2 pr-title">{{ pullRequest.title || 'Untitled pull request' }}</h1>
                                <p class="text-body-1 text-medium-emphasis mb-0">
                                    {{ pullRequest.repositoryOwner }}/{{ pullRequest.repositoryName }}
                                </p>
                            </div>

                            <div class="d-flex flex-wrap gap-3 justify-start justify-lg-end">
                                <v-btn
                                    :to="{ name: 'Repository Detail', params: { id: repositoryId }, query: { tab: 'pull-requests' } }"
                                    variant="outlined"
                                    color="primary"
                                >
                                    Back to pull requests
                                </v-btn>
                                <v-btn :href="pullRequest.url" target="_blank" rel="noopener noreferrer" color="primary">Open on GitHub</v-btn>
                            </div>
                        </div>

                        <v-divider class="mb-5"></v-divider>

                        <v-row>
                            <v-col cols="12" md="8">
                                <section class="mb-6">
                                    <h2 class="text-h6 font-weight-semibold mb-3">Description</h2>
                                    <div class="pr-description">
                                        {{ pullRequest.description?.trim() ? pullRequest.description : 'No description provided.' }}
                                    </div>
                                </section>

                                <section>
                                    <div class="d-flex align-center justify-space-between mb-3 gap-3 flex-wrap">
                                        <h2 class="text-h6 font-weight-semibold mb-0">Linked Jira Tickets</h2>
                                        <span class="text-caption text-medium-emphasis">{{ pullRequest.jiraIssues.length }} linked</span>
                                    </div>

                                    <v-card variant="outlined">
                                        <v-list v-if="pullRequest.jiraIssues.length" lines="two" class="py-0">
                                            <v-list-item v-for="issue in pullRequest.jiraIssues" :key="jiraIssueKey(issue)">
                                                <template #title>
                                                    <div class="d-flex align-center gap-2 flex-wrap">
                                                        <RouterLink
                                                            v-if="jiraIssueRoute(issue)"
                                                            :to="jiraIssueRoute(issue)!"
                                                            class="text-primary text-decoration-none font-weight-medium"
                                                        >
                                                            {{ issue.key }}
                                                        </RouterLink>
                                                        <span v-else class="font-weight-medium">{{ issue.key }}</span>
                                                    </div>
                                                </template>
                                                <template #subtitle>
                                                    <span class="pr-jira-summary">{{ issue.summary || 'No summary provided.' }}</span>
                                                </template>
                                            </v-list-item>
                                        </v-list>
                                        <v-card-text v-else class="text-body-2 text-medium-emphasis">
                                            No Jira tickets are linked to this pull request.
                                        </v-card-text>
                                    </v-card>
                                </section>
                            </v-col>

                            <v-col cols="12" md="4">
                                <v-card variant="outlined" class="mb-4">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Details</h2>
                                        <dl class="pr-detail-list">
                                            <div>
                                                <dt>Status</dt>
                                                <dd>
                                                    <RepositoryStatusChip
                                                        :label="pullRequestStateLabel(pullRequest.state)"
                                                        :tone="pullRequestStateTone(pullRequest.state)"
                                                    />
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Author</dt>
                                                <dd>
                                                    <RouterLink
                                                        v-if="staffMemberRoute(pullRequest.authorStaffMember)"
                                                        :to="staffMemberRoute(pullRequest.authorStaffMember)!"
                                                        class="text-primary text-decoration-none font-weight-medium"
                                                    >
                                                        {{ authorLabel(pullRequest) }}
                                                    </RouterLink>
                                                    <span v-else>{{ authorLabel(pullRequest) }}</span>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Reviewers</dt>
                                                <dd>
                                                    <div class="pr-reviewer-groups">
                                                        <section class="pr-reviewer-group">
                                                            <div class="d-flex align-center justify-space-between gap-2 mb-2 flex-wrap">
                                                                <span class="font-weight-medium">Requested</span>
                                                                <span class="text-caption text-medium-emphasis">
                                                                    {{ requestedReviewerList.length }}
                                                                </span>
                                                            </div>

                                                            <ul v-if="requestedReviewerList.length" class="pr-reviewer-list">
                                                                <li v-for="reviewer in requestedReviewerList" :key="reviewer.key">
                                                                    <RouterLink
                                                                        v-if="reviewerRoute(reviewer)"
                                                                        :to="reviewerRoute(reviewer)!"
                                                                        class="text-primary text-decoration-none font-weight-medium"
                                                                    >
                                                                        {{ reviewer.label }}
                                                                    </RouterLink>
                                                                    <span v-else>{{ reviewer.label }}</span>
                                                                </li>
                                                            </ul>
                                                            <p v-else class="text-body-2 text-medium-emphasis mb-0">No requested reviewers.</p>
                                                        </section>

                                                        <section class="pr-reviewer-group">
                                                            <div class="d-flex align-center justify-space-between gap-2 mb-2 flex-wrap">
                                                                <span class="font-weight-medium">Completed</span>
                                                                <span class="text-caption text-medium-emphasis">
                                                                    {{ completedReviewerList.length }}
                                                                </span>
                                                            </div>

                                                            <ul v-if="completedReviewerList.length" class="pr-reviewer-list">
                                                                <li v-for="reviewer in completedReviewerList" :key="reviewer.key">
                                                                    <RouterLink
                                                                        v-if="reviewerRoute(reviewer)"
                                                                        :to="reviewerRoute(reviewer)!"
                                                                        class="text-primary text-decoration-none font-weight-medium"
                                                                    >
                                                                        {{ reviewer.label }}
                                                                    </RouterLink>
                                                                    <span v-else>{{ reviewer.label }}</span>
                                                                </li>
                                                            </ul>
                                                            <p v-else class="text-body-2 text-medium-emphasis mb-0">No completed reviews.</p>
                                                        </section>
                                                    </div>
                                                </dd>
                                            </div>
                                            <div>
                                                <dt>Created</dt>
                                                <dd>{{ formatDate(pullRequest.createdAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Updated</dt>
                                                <dd>{{ formatDate(pullRequest.updatedAtUtc || pullRequest.createdAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Closed</dt>
                                                <dd>{{ formatDate(pullRequest.closedAtUtc) }}</dd>
                                            </div>
                                            <div>
                                                <dt>Merged</dt>
                                                <dd>{{ formatDate(pullRequest.mergedAtUtc) }}</dd>
                                            </div>
                                        </dl>
                                    </v-card-text>
                                </v-card>

                                <v-card variant="outlined">
                                    <v-card-text>
                                        <h2 class="text-h6 font-weight-semibold mb-4">Identifiers</h2>
                                        <dl class="pr-detail-list pr-detail-list--compact">
                                            <div>
                                                <dt>Internal ID</dt>
                                                <dd>{{ pullRequest.id }}</dd>
                                            </div>
                                            <div>
                                                <dt>External ID</dt>
                                                <dd>{{ pullRequest.externalId }}</dd>
                                            </div>
                                            <div>
                                                <dt>Repository ID</dt>
                                                <dd>{{ repositoryId || '—' }}</dd>
                                            </div>
                                            <div>
                                                <dt>Synced</dt>
                                                <dd>{{ formatDate(pullRequest.syncedAtUtc) }}</dd>
                                            </div>
                                        </dl>
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
.pr-header-copy {
    min-width: 0;
}

.pr-title,
.pr-jira-summary,
.pr-description {
    word-break: break-word;
}

.pr-description {
    white-space: pre-wrap;
    padding: 1rem 1.125rem;
    border: 1px solid rgb(var(--v-theme-borderColor));
    border-radius: 12px;
    background: rgba(var(--v-theme-surface), 0.5);
    line-height: 1.7;
}

.pr-detail-list {
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

.pr-detail-list--compact {
    gap: 0.9rem;
}

.pr-reviewer-groups {
    display: grid;
    gap: 0.75rem;
}

.pr-reviewer-group {
    padding: 0.875rem 1rem;
    border: 1px solid rgb(var(--v-theme-borderColor));
    border-radius: 12px;
    background: rgba(var(--v-theme-surface), 0.45);
}

.pr-reviewer-list {
    margin: 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.35rem;
}

.pr-reviewer-list li {
    line-height: 1.5;
}
</style>


