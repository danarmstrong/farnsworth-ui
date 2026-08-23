<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
    GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE,
    useGithubRepoStore
} from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type { GithubDependabotAlert } from '@/features/jack-henry/repositories/types/GithubDependabotAlert';
import { formatUtcLocal } from '@/utils/helpers/dateTime';
import {
    alertSeverityLabel,
    alertSeverityTone,
    securityAlertStateLabel,
    securityAlertStateTone
} from '@/features/jack-henry/repositories/utils/repositoryStatusPresentation';
import RepositoryStatusChip from '@/features/jack-henry/repositories/components/RepositoryStatusChip.vue';

interface Props {
    repositoryId: string;
}

const props = defineProps<Props>();

const store = useGithubRepoStore();
const page = ref(1);
const pageSize = ref(GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE);
const pageSizeOptions = [25, 50, 100];
const search = ref('');

const hasPagination = computed(() => store.dependabotAlertsTotalPages > 1);
const isBusy = computed(() => store.dependabotAlertsLoading);

watch(
    () => props.repositoryId,
    (nextRepositoryId) => {
        search.value = '';
        page.value = 1;
        pageSize.value = GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE;
        void loadPage(nextRepositoryId, 1);
    },
    { immediate: true }
);

const filteredAlerts = computed(() => {
    const normalizedSearch = search.value.trim().toLowerCase();

    return store.dependabotAlerts.filter((alert) => {
        if (!normalizedSearch) {
            return true;
        }

        const haystack = [
            alert.packageName ?? '',
            alert.packageEcosystem ?? '',
            alert.summary,
            alert.severity,
            alert.state,
            alert.manifestPath ?? '',
            alert.advisoryGhsaId ?? ''
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedSearch);
    });
});

const pageSummary = computed(() => {
    if (!store.dependabotAlertsTotalCount) {
        return 'No dependabot alerts found.';
    }

    if (search.value.trim()) {
        const count = filteredAlerts.value.length;
        return count === 1 ? 'Showing 1 matching dependabot alert on this page' : `Showing ${count} matching dependabot alerts on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.dependabotAlertsTotalCount);
    return `Showing ${start} to ${end} of ${store.dependabotAlertsTotalCount} dependabot alerts`;
});

function normalizePositiveInteger(value: number | string | null | undefined, fallback: number): number {
    const normalized = typeof value === 'string' ? Number(value) : value;
    if (typeof normalized !== 'number' || !Number.isFinite(normalized)) {
        return fallback;
    }

    const floored = Math.floor(normalized);
    return floored > 0 ? floored : fallback;
}

function alertKey(alert: GithubDependabotAlert): string {
    return alert.id || alert.externalId;
}

function alertRoute(alert: GithubDependabotAlert) {
    if (!alert.id) {
        return null;
    }

    return {
        name: 'Repository Dependabot Alert Detail',
        params: {
            id: props.repositoryId,
            alertId: alert.id
        }
    };
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return formatUtcLocal(value) || value;
}

async function loadPage(repositoryId: string, targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);
    await store.fetchRepositoryDependabotAlerts(repositoryId, {
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
    pageSize.value = normalizePositiveInteger(nextPageSize, GITHUB_REPO_DEPENDABOT_ALERTS_DEFAULT_PAGE_SIZE);
    await loadPage(props.repositoryId, 1);
}

async function refreshAlerts(): Promise<void> {
    await loadPage(props.repositoryId, page.value);
}

function clearStoreError(): void {
    store.clearDependabotAlertsError();
}
</script>

<template>
    <v-alert v-if="store.dependabotAlertsError" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.dependabotAlertsError }}
    </v-alert>

    <div class="d-sm-flex justify-space-between align-center my-5 gap-3">
        <v-btn color="primary" class="rounded-pill" :loading="isBusy" :disabled="isBusy" @click="refreshAlerts">Refresh Alerts</v-btn>
        <v-sheet width="320" class="mt-lg-0 mt-3">
            <v-text-field
                v-model="search"
                label="Search dependabot alerts"
                variant="outlined"
                hide-details
                class="w-100"
                density="compact"
            ></v-text-field>
        </v-sheet>
    </div>

    <div class="border-table">
        <v-table class="repository-dependabot-alert-table">
            <thead>
                <tr>
                    <th class="text-subtitle-1 font-weight-semibold col-package">Package</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-severity">Severity</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-state">State</th>
                    <th class="text-subtitle-1 font-weight-semibold col-summary">Summary</th>
                    <th class="text-subtitle-1 font-weight-semibold col-manifest">Manifest</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-updated">Updated</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="store.dependabotAlertsLoading && !store.dependabotAlerts.length">
                    <td colspan="6" class="text-subtitle-1 text-center py-6">Loading dependabot alerts...</td>
                </tr>
                <tr v-else-if="!filteredAlerts.length">
                    <td colspan="6" class="text-subtitle-1 text-center py-6">No dependabot alerts found.</td>
                </tr>
                <tr v-else v-for="alert in filteredAlerts" :key="alertKey(alert)">
                    <td class="text-subtitle-1 col-package">
                        <RouterLink
                            v-if="alertRoute(alert)"
                            :to="alertRoute(alert)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ alert.packageName || '-' }}
                        </RouterLink>
                        <template v-else>{{ alert.packageName || '-' }}</template>
                        <div class="text-caption text-medium-emphasis mt-1">{{ alert.packageEcosystem || 'Unknown ecosystem' }}</div>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-severity">
                        <RepositoryStatusChip :label="alertSeverityLabel(alert.severity)" :tone="alertSeverityTone(alert.severity)" />
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-state">
                        <RepositoryStatusChip :label="securityAlertStateLabel(alert.state)" :tone="securityAlertStateTone(alert.state)" />
                    </td>
                    <td class="text-subtitle-1 col-summary">{{ alert.summary || '-' }}</td>
                    <td class="text-subtitle-1 col-manifest">{{ alert.manifestPath || '-' }}</td>
                    <td class="text-subtitle-1 text-no-wrap col-updated">
                        {{ formatDate(alert.fixedAtUtc || alert.dismissedAtUtc || alert.createdAtUtc) }}
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
                class="repository-dependabot-alert-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            ></v-select>

            <v-pagination
                v-if="hasPagination"
                :model-value="page"
                :length="store.dependabotAlertsTotalPages"
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
.repository-dependabot-alert-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-severity,
    .col-state,
    .col-updated {
        width: 1%;
        white-space: nowrap;
    }

    .col-package,
    .col-summary,
    .col-manifest {
        word-break: break-word;
    }
}

.repository-dependabot-alert-page-size {
    max-width: 160px;
}
</style>

