<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type {
    StaffMember,
    StaffMemberGithubPullRequestSlim,
    StaffMemberJiraIssueSlim
} from '@/features/jack-henry/staff-members/types/StaffMember';
import type { GithubPullRequestState } from '@/features/jack-henry/repositories/types/GithubPullRequest';

interface ActivitySection<TItem> {
    key: string;
    title: string;
    items: TItem[];
    emptyText: string;
}

const props = defineProps<{
    member: StaffMember;
}>();

const jiraSections = computed<ActivitySection<StaffMemberJiraIssueSlim>[]>(() => [
    {
        key: 'assigned',
        title: 'Assigned Jira Issues',
        items: props.member.assignedIssues ?? [],
        emptyText: 'No assigned issues.'
    },
    {
        key: 'created',
        title: 'Created Jira Issues',
        items: props.member.createdIssues ?? [],
        emptyText: 'No created issues.'
    },
    {
        key: 'reported',
        title: 'Reported Jira Issues',
        items: props.member.reporterIssues ?? [],
        emptyText: 'No reported issues.'
    }
]);

const pullRequestSections = computed<ActivitySection<StaffMemberGithubPullRequestSlim>[]>(() => [
    {
        key: 'authored',
        title: 'Authored Pull Requests',
        items: props.member.authoredPullRequests ?? [],
        emptyText: 'No authored pull requests.'
    },
    {
        key: 'review-completed',
        title: 'Review Completed Pull Requests',
        items: props.member.reviewCompletedPullRequests ?? [],
        emptyText: 'No completed pull request reviews.'
    },
    {
        key: 'review-requested',
        title: 'Review Requested Pull Requests',
        items: props.member.reviewRequestedPullRequests ?? [],
        emptyText: 'No pull requests with review requested.'
    }
]);

function jiraIssueRoute(issue: StaffMemberJiraIssueSlim) {
    const normalizedProjectId = issue.jiraProjectId?.trim() || '';

    if (!normalizedProjectId || !issue.id) {
        return null;
    }

    return {
        name: 'Jira Issue Details',
        params: {
            projectId: normalizedProjectId,
            issueId: issue.id
        }
    };
}

function stateLabel(state: GithubPullRequestState): string {
    if (typeof state === 'number') {
        if (state === 0) {
            return 'Open';
        }
        if (state === 1) {
            return 'Closed';
        }
        if (state === 2) {
            return 'Merged';
        }
    }

    const normalized = String(state ?? '').trim();
    if (!normalized) {
        return 'Unknown';
    }

    return normalized.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function stateTone(state: GithubPullRequestState): 'success' | 'warning' | 'info' | 'default' {
    if (typeof state === 'number') {
        if (state === 0) {
            return 'info';
        }
        if (state === 1) {
            return 'warning';
        }
        if (state === 2) {
            return 'success';
        }
    }

    const normalized = String(state ?? '')
        .trim()
        .toLowerCase();

    if (normalized.includes('open')) {
        return 'info';
    }
    if (normalized.includes('closed')) {
        return 'warning';
    }
    if (normalized.includes('merged')) {
        return 'success';
    }

    return 'default';
}

function pullRequestKey(pullRequest: StaffMemberGithubPullRequestSlim): string {
    return pullRequest.id || pullRequest.externalId || String(pullRequest.number);
}

function issueKey(issue: StaffMemberJiraIssueSlim): string {
    return issue.id || issue.key;
}
</script>

<template>
    <v-row class="mb-4">
        <v-col v-for="section in jiraSections" :key="section.key" cols="12" md="12">
            <v-card elevation="10" class="bg-surface h-100 activity-card">
                <v-card-item>
                    <div class="d-flex align-center justify-space-between mb-3 gap-2">
                        <h4 class="text-h6 font-weight-semibold mb-0">{{ section.title }}</h4>
                        <v-chip size="x-small" variant="tonal" color="primary">{{ section.items.length }}</v-chip>
                    </div>

                    <div class="activity-card-content">
                        <v-list v-if="section.items.length" lines="two" density="comfortable" class="py-0">
                            <v-list-item v-for="issue in section.items" :key="issueKey(issue)">
                                <template #title>
                                    <RouterLink
                                        v-if="jiraIssueRoute(issue)"
                                        :to="jiraIssueRoute(issue)!"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        {{ issue.key }}
                                    </RouterLink>
                                    <span v-else class="font-weight-medium">{{ issue.key }}</span>
                                </template>
                                <template #subtitle>
                                    <span class="text-medium-emphasis">{{ issue.summary || 'No summary provided.' }}</span>
                                </template>
                            </v-list-item>
                        </v-list>
                        <p v-else class="text-body-2 text-medium-emphasis mb-0">{{ section.emptyText }}</p>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>

        <v-col v-for="section in pullRequestSections" :key="section.key" cols="12" md="12">
            <v-card elevation="10" class="bg-surface h-100 activity-card">
                <v-card-item>
                    <div class="d-flex align-center justify-space-between mb-3 gap-2">
                        <h4 class="text-h6 font-weight-semibold mb-0">{{ section.title }}</h4>
                        <v-chip size="x-small" variant="tonal" color="primary">{{ section.items.length }}</v-chip>
                    </div>

                    <div class="activity-card-content">
                        <v-list v-if="section.items.length" lines="two" density="comfortable" class="py-0">
                            <v-list-item v-for="pullRequest in section.items" :key="pullRequestKey(pullRequest)">
                                <template #title>
                                    <a
                                        :href="pullRequest.url"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-primary text-decoration-none font-weight-medium"
                                    >
                                        #{{ pullRequest.number }} {{ pullRequest.title || 'Untitled pull request' }}
                                    </a>
                                </template>
                                <template #subtitle>
                                    <div class="d-flex align-center flex-wrap gap-2">
                                        <v-chip size="x-small" variant="tonal" :color="stateTone(pullRequest.state)">
                                            {{ stateLabel(pullRequest.state) }}
                                        </v-chip>
                                        <span class="text-medium-emphasis">{{ pullRequest.externalId || '-' }}</span>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>
                        <p v-else class="text-body-2 text-medium-emphasis mb-0">{{ section.emptyText }}</p>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>

<style lang="scss" scoped>
.activity-card {
    height: 360px;
}

.activity-card-content {
    max-height: 280px;
    overflow-y: auto;
    padding-right: 0.25rem;
}
</style>




