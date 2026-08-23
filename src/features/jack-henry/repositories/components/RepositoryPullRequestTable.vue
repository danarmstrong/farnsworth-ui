<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE, useGithubRepoStore } from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type { GithubPullRequest } from '@/features/jack-henry/repositories/types/GithubPullRequest';
import { formatUtcLocal } from '@/utils/helpers/dateTime';
import { pullRequestStateLabel, pullRequestStateTone } from '@/features/jack-henry/repositories/utils/repositoryStatusPresentation';
import RepositoryStatusChip from '@/features/jack-henry/repositories/components/RepositoryStatusChip.vue';

interface Props {
    repositoryId: string;
}

const props = defineProps<Props>();

const store = useGithubRepoStore();
const page = ref(1);
const pageSize = ref(GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE);
const pageSizeOptions = [25, 50, 100];
const search = ref('');

const hasPagination = computed(() => store.pullRequestsTotalPages > 1);
const isBusy = computed(() => store.pullRequestsLoading);

watch(
    () => props.repositoryId,
    (nextRepositoryId) => {
        search.value = '';
        page.value = 1;
        pageSize.value = GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE;
        void loadPage(nextRepositoryId, 1);
    },
    { immediate: true }
);

const filteredPullRequests = computed(() => {
    const normalizedSearch = search.value.trim().toLowerCase();

    return store.pullRequests.filter((pullRequest) => {
        if (!normalizedSearch) {
            return true;
        }

        const haystack = [
            String(pullRequest.number ?? ''),
            pullRequest.title,
            pullRequest.author ?? '',
            pullRequest.repositoryOwner,
            pullRequest.repositoryName,
            pullRequestStateLabel(pullRequest.state)
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedSearch);
    });
});

const pageSummary = computed(() => {
    if (!store.pullRequestsTotalCount) {
        return 'No pull requests found.';
    }

    if (search.value.trim()) {
        const count = filteredPullRequests.value.length;
        return count === 1 ? 'Showing 1 matching pull request on this page' : `Showing ${count} matching pull requests on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.pullRequestsTotalCount);
    return `Showing ${start} to ${end} of ${store.pullRequestsTotalCount} pull requests`;
});

function normalizePositiveInteger(value: number | string | null | undefined, fallback: number): number {
    const normalized = typeof value === 'string' ? Number(value) : value;
    if (typeof normalized !== 'number' || !Number.isFinite(normalized)) {
        return fallback;
    }

    const floored = Math.floor(normalized);
    return floored > 0 ? floored : fallback;
}

function pullRequestKey(pullRequest: GithubPullRequest): string {
    return pullRequest.id || pullRequest.externalId || String(pullRequest.number);
}

function pullRequestRoute(pullRequest: GithubPullRequest) {
    if (!pullRequest.id) {
        return null;
    }

    return {
        name: 'Repository Pull Request Detail',
        params: {
            id: props.repositoryId,
            pullRequestId: pullRequest.id
        }
    };
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return formatUtcLocal(value) || value;
}

function reviewerSummary(pullRequest: GithubPullRequest): string {
    if (!pullRequest.requestedReviewers.length && !pullRequest.completedReviewers.length) {
        return '-';
    }

    const requested = pullRequest.requestedReviewers.length;
    const completed = pullRequest.completedReviewers.length;
    return `${completed} completed / ${requested} requested`;
}

async function loadPage(repositoryId: string, targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);
    await store.fetchRepositoryPullRequests(repositoryId, {
        page: page.value,
        pageSize: pageSize.value
    });
}

async function changePage(nextPage: number): Promise<void> {
    if (nextPage === page.value) {
        return;
    }

    await loadPage(props.repositoryId, nextPage);
}

async function changePageSize(nextPageSize: number | string | null): Promise<void> {
    pageSize.value = normalizePositiveInteger(nextPageSize, GITHUB_REPO_PULL_REQUESTS_DEFAULT_PAGE_SIZE);
    await loadPage(props.repositoryId, 1);
}

async function refreshPullRequests(): Promise<void> {
    await loadPage(props.repositoryId, page.value);
}

function clearStoreError(): void {
    store.clearPullRequestsError();
}
</script>

<template>
    <v-alert v-if="store.pullRequestsError" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.pullRequestsError }}
    </v-alert>

    <div class="d-sm-flex justify-space-between align-center my-5 gap-3">
        <v-btn color="primary" class="rounded-pill" :loading="isBusy" :disabled="isBusy" @click="refreshPullRequests"
            >Refresh Pull Requests</v-btn
        >
        <v-sheet width="320" class="mt-lg-0 mt-3">
            <v-text-field
                v-model="search"
                label="Search pull requests"
                variant="outlined"
                hide-details
                class="w-100"
                density="compact"
            ></v-text-field>
        </v-sheet>
    </div>

    <div class="border-table">
        <v-table class="repository-pull-request-table">
            <thead>
                <tr>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-number">PR</th>
                    <th class="text-subtitle-1 font-weight-semibold col-title">Title</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-state">State</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-author">Author</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-reviewers">Reviewers</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-updated">Updated</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-link">Link</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="store.pullRequestsLoading && !store.pullRequests.length">
                    <td colspan="7" class="text-subtitle-1 text-center py-6">Loading pull requests...</td>
                </tr>
                <tr v-else-if="!filteredPullRequests.length">
                    <td colspan="7" class="text-subtitle-1 text-center py-6">No pull requests found.</td>
                </tr>
                <tr v-else v-for="pullRequest in filteredPullRequests" :key="pullRequestKey(pullRequest)">
                    <td class="text-subtitle-1 text-no-wrap col-number">
                        <RouterLink
                            v-if="pullRequestRoute(pullRequest)"
                            :to="pullRequestRoute(pullRequest)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            #{{ pullRequest.number }}
                        </RouterLink>
                        <template v-else>#{{ pullRequest.number }}</template>
                    </td>
                    <td class="text-subtitle-1 col-title">
                        <RouterLink
                            v-if="pullRequestRoute(pullRequest)"
                            :to="pullRequestRoute(pullRequest)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ pullRequest.title || '-' }}
                        </RouterLink>
                        <template v-else>{{ pullRequest.title || '-' }}</template>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-state">
                        <RepositoryStatusChip :label="pullRequestStateLabel(pullRequest.state)" :tone="pullRequestStateTone(pullRequest.state)" />
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-author">{{ pullRequest.author || '-' }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-reviewers">{{ reviewerSummary(pullRequest) }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-updated">
                        {{ formatDate(pullRequest.updatedAtUtc || pullRequest.createdAtUtc) }}
                    </td>
                    <td class="text-right text-no-wrap col-link">
                        <a
                            :href="pullRequest.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            Open
                        </a>
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
                class="repository-pull-request-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            ></v-select>

            <v-pagination
                v-if="hasPagination"
                :model-value="page"
                :length="store.pullRequestsTotalPages"
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
.repository-pull-request-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-number,
    .col-state,
    .col-author,
    .col-reviewers,
    .col-updated,
    .col-link {
        width: 1%;
        white-space: nowrap;
    }

    .col-title {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}

.repository-pull-request-page-size {
    max-width: 160px;
}
</style>

