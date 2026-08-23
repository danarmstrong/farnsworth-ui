<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
    GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE,
    useGithubRepoStore
} from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type { GithubCodeScanningAlert } from '@/features/jack-henry/repositories/types/GithubCodeScanningAlert';
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
const pageSize = ref(GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE);
const pageSizeOptions = [25, 50, 100];
const search = ref('');

const hasPagination = computed(() => store.codeScanningAlertsTotalPages > 1);
const isBusy = computed(() => store.codeScanningAlertsLoading);

watch(
    () => props.repositoryId,
    (nextRepositoryId) => {
        search.value = '';
        page.value = 1;
        pageSize.value = GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE;
        void loadPage(nextRepositoryId, 1);
    },
    { immediate: true }
);

const filteredAlerts = computed(() => {
    const normalizedSearch = search.value.trim().toLowerCase();

    return store.codeScanningAlerts.filter((alert) => {
        if (!normalizedSearch) {
            return true;
        }

        const haystack = [
            alert.ruleId ?? '',
            alert.ruleName ?? '',
            alert.ruleDescription,
            alert.ruleSeverity ?? '',
            alert.securitySeverityLevel ?? '',
            alert.state,
            alert.toolName ?? '',
            alert.mostRecentInstancePath ?? ''
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(normalizedSearch);
    });
});

const pageSummary = computed(() => {
    if (!store.codeScanningAlertsTotalCount) {
        return 'No code scanning alerts found.';
    }

    if (search.value.trim()) {
        const count = filteredAlerts.value.length;
        return count === 1 ? 'Showing 1 matching code scanning alert on this page' : `Showing ${count} matching code scanning alerts on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.codeScanningAlertsTotalCount);
    return `Showing ${start} to ${end} of ${store.codeScanningAlertsTotalCount} code scanning alerts`;
});

function normalizePositiveInteger(value: number | string | null | undefined, fallback: number): number {
    const normalized = typeof value === 'string' ? Number(value) : value;
    if (typeof normalized !== 'number' || !Number.isFinite(normalized)) {
        return fallback;
    }

    const floored = Math.floor(normalized);
    return floored > 0 ? floored : fallback;
}

function alertKey(alert: GithubCodeScanningAlert): string {
    return alert.id || alert.externalId;
}

function alertRoute(alert: GithubCodeScanningAlert) {
    if (!alert.id) {
        return null;
    }

    return {
        name: 'Repository Code Scanning Alert Detail',
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
    await store.fetchRepositoryCodeScanningAlerts(repositoryId, {
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
    pageSize.value = normalizePositiveInteger(nextPageSize, GITHUB_REPO_CODE_SCANNING_ALERTS_DEFAULT_PAGE_SIZE);
    await loadPage(props.repositoryId, 1);
}

async function refreshAlerts(): Promise<void> {
    await loadPage(props.repositoryId, page.value);
}

function clearStoreError(): void {
    store.clearCodeScanningAlertsError();
}
</script>

<template>
    <v-alert v-if="store.codeScanningAlertsError" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.codeScanningAlertsError }}
    </v-alert>

    <div class="d-sm-flex justify-space-between align-center my-5 gap-3">
        <v-btn color="primary" class="rounded-pill" :loading="isBusy" :disabled="isBusy" @click="refreshAlerts">Refresh Alerts</v-btn>
        <v-sheet width="320" class="mt-lg-0 mt-3">
            <v-text-field
                v-model="search"
                label="Search code scanning alerts"
                variant="outlined"
                hide-details
                class="w-100"
                density="compact"
            ></v-text-field>
        </v-sheet>
    </div>

    <div class="border-table">
        <v-table class="repository-code-scanning-alert-table">
            <thead>
                <tr>
                    <th class="text-subtitle-1 font-weight-semibold col-rule">Rule</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-severity">Severity</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-state">State</th>
                    <th class="text-subtitle-1 font-weight-semibold col-location">Location</th>
                    <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-updated">Updated</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="store.codeScanningAlertsLoading && !store.codeScanningAlerts.length">
                    <td colspan="5" class="text-subtitle-1 text-center py-6">Loading code scanning alerts...</td>
                </tr>
                <tr v-else-if="!filteredAlerts.length">
                    <td colspan="5" class="text-subtitle-1 text-center py-6">No code scanning alerts found.</td>
                </tr>
                <tr v-else v-for="alert in filteredAlerts" :key="alertKey(alert)">
                    <td class="text-subtitle-1 col-rule">
                        <RouterLink
                            v-if="alertRoute(alert)"
                            :to="alertRoute(alert)!"
                            class="text-primary text-decoration-none font-weight-medium"
                        >
                            {{ alert.ruleName || alert.ruleId || 'Unnamed rule' }}
                        </RouterLink>
                        <template v-else>{{ alert.ruleName || alert.ruleId || 'Unnamed rule' }}</template>
                        <div class="text-caption text-medium-emphasis mt-1">{{ alert.toolName || 'Unknown tool' }}</div>
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-severity">
                        <RepositoryStatusChip
                            :label="alertSeverityLabel(alert.securitySeverityLevel || alert.ruleSeverity)"
                            :tone="alertSeverityTone(alert.securitySeverityLevel || alert.ruleSeverity)"
                        />
                    </td>
                    <td class="text-subtitle-1 text-no-wrap col-state">
                        <RepositoryStatusChip :label="securityAlertStateLabel(alert.state)" :tone="securityAlertStateTone(alert.state)" />
                    </td>
                    <td class="text-subtitle-1 col-location">
                        {{ alert.mostRecentInstancePath || '-' }}
                        <div class="text-caption text-medium-emphasis mt-1">
                            {{ alert.mostRecentInstanceStartLine ? `Line ${alert.mostRecentInstanceStartLine}` : 'No line details' }}
                        </div>
                    </td>
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
                class="repository-code-scanning-alert-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            ></v-select>

            <v-pagination
                v-if="hasPagination"
                :model-value="page"
                :length="store.codeScanningAlertsTotalPages"
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
.repository-code-scanning-alert-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-severity,
    .col-state,
    .col-updated {
        width: 1%;
        white-space: nowrap;
    }

    .col-rule,
    .col-location {
        word-break: break-word;
    }
}

.repository-code-scanning-alert-page-size {
    max-width: 160px;
}
</style>

