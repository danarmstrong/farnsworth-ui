<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { backgroundJobHub } from '@/features/background-jobs/services/backgroundJobHub';
import {
    BACKGROUND_JOBS_DEFAULT_PAGE_SIZE,
    useBackgroundJobStore
} from '@/features/jack-henry/background-jobs/stores/backgroundJobStore';
import {
    BACKGROUND_JOB_STATUSES,
    BACKGROUND_JOB_TYPES,
    type BackgroundJobDto,
    type BackgroundJobStatus,
    type BackgroundJobType
} from '@/features/jack-henry/background-jobs/types/BackgroundJob';

const store = useBackgroundJobStore();
const pageSizeOptions = [25, 50, 100];

const search = ref('');
const statusFilter = ref<BackgroundJobStatus | null>(null);
const jobTypeFilter = ref<BackgroundJobType | null>(null);
const activeOnly = ref(false);
const page = ref(1);
const pageSize = ref(BACKGROUND_JOBS_DEFAULT_PAGE_SIZE);

const detailsDialog = ref(false);
const selectedJob = ref<BackgroundJobDto | null>(null);
const loadingDetails = ref(false);

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeBackgroundUpdates: (() => void) | null = null;

const hasPagination = computed(() => store.totalPages > 1);
const isBusy = computed(() => store.loading || loadingDetails.value);

const filteredItems = computed(() => {
    const normalizedSearch = search.value.trim().toLowerCase();
    if (!normalizedSearch) {
        return store.items;
    }

    return store.items.filter((job) => {
        return (
            job.displayName.toLowerCase().includes(normalizedSearch) ||
            job.id.toLowerCase().includes(normalizedSearch) ||
            job.resourceKey.toLowerCase().includes(normalizedSearch) ||
            job.source.toLowerCase().includes(normalizedSearch)
        );
    });
});

const pageSummary = computed(() => {
    if (!store.totalCount) {
        return 'No background jobs found.';
    }

    if (search.value.trim()) {
        const count = filteredItems.value.length;
        return count === 1 ? 'Showing 1 matching job on this page' : `Showing ${count} matching jobs on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.totalCount);
    return `Showing ${start} to ${end} of ${store.totalCount} jobs`;
});

const statusSummary = computed(() => {
    const summary: Record<string, number> = {
        Queued: 0,
        Running: 0,
        Completed: 0,
        Failed: 0
    };

    for (const job of store.items) {
        const key = String(job.status);
        if (Object.prototype.hasOwnProperty.call(summary, key)) {
            summary[key] += 1;
        }
    }

    return {
        total: store.items.length,
        queued: summary.Queued,
        running: summary.Running,
        completed: summary.Completed,
        failed: summary.Failed
    };
});

const statusOptions = computed(() => [
    { title: 'All statuses', value: null },
    ...BACKGROUND_JOB_STATUSES.map((status) => ({ title: status, value: status }))
]);

const jobTypeOptions = computed(() => [
    { title: 'All job types', value: null },
    ...BACKGROUND_JOB_TYPES.map((jobType) => ({ title: prettifyPascalCase(jobType), value: jobType }))
]);

onMounted(async () => {
    await loadPage(1);

    unsubscribeBackgroundUpdates = backgroundJobHub.onBackgroundJobUpdated((updatedJob) => {
        store.upsertBackgroundJob(updatedJob as BackgroundJobDto);

        if (selectedJob.value?.id === updatedJob.id) {
            selectedJob.value = updatedJob as BackgroundJobDto;
        }

        scheduleRefresh();
    });

    try {
        await backgroundJobHub.connect();
    } catch {
        // The table still works with manual refresh when live updates are unavailable.
    }
});

onUnmounted(() => {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }

    if (unsubscribeBackgroundUpdates) {
        unsubscribeBackgroundUpdates();
        unsubscribeBackgroundUpdates = null;
    }

    void backgroundJobHub.disconnect();
});

function scheduleRefresh(): void {
    if (refreshTimer) {
        return;
    }

    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        void loadPage(page.value);
    }, 750);
}

function statusColor(status: string): string {
    switch (status) {
        case 'Completed':
            return 'success';
        case 'Running':
            return 'info';
        case 'Queued':
            return 'warning';
        case 'Failed':
            return 'error';
        default:
            return 'default';
    }
}

function prettifyPascalCase(value: string): string {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return value;
    }

    return parsedDate.toLocaleString();
}

function metadataKeys(metadata: Record<string, string> | null | undefined): string[] {
    if (!metadata) {
        return [];
    }

    return Object.keys(metadata);
}

async function loadPage(targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);

    const result = await store.fetchBackgroundJobs({
        status: statusFilter.value,
        jobType: jobTypeFilter.value,
        activeOnly: activeOnly.value,
        page: page.value,
        pageSize: pageSize.value
    });

    if (result) {
        page.value = result.page;
        pageSize.value = result.pageSize;
    }
}

async function changePage(nextPage: number): Promise<void> {
    if (nextPage === page.value) {
        return;
    }

    await loadPage(nextPage);
}

async function changePageSize(nextPageSize: number): Promise<void> {
    pageSize.value = nextPageSize;
    await loadPage(1);
}

async function applyFilters(): Promise<void> {
    await loadPage(1);
}

async function resetFilters(): Promise<void> {
    statusFilter.value = null;
    jobTypeFilter.value = null;
    activeOnly.value = false;
    search.value = '';
    await loadPage(1);
}

function clearStoreError(): void {
    store.clearError();
}

async function openDetails(job: BackgroundJobDto): Promise<void> {
    detailsDialog.value = true;
    selectedJob.value = job;

    loadingDetails.value = true;
    try {
        const latest = await store.getBackgroundJobById(job.id);
        if (latest) {
            selectedJob.value = latest;
        }
    } finally {
        loadingDetails.value = false;
    }
}
</script>

<template>
    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.error }}
    </v-alert>

    <v-row>
        <v-col cols="12" md="6" lg="3">
            <v-text-field v-model="search" density="compact" label="Search jobs" hide-details variant="outlined" :disabled="isBusy" />
        </v-col>
        <v-col cols="12" md="6" lg="3">
            <v-select
                v-model="statusFilter"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Status"
                density="compact"
                hide-details
                variant="outlined"
                :disabled="isBusy"
            />
        </v-col>
        <v-col cols="12" md="6" lg="3">
            <v-select
                v-model="jobTypeFilter"
                :items="jobTypeOptions"
                item-title="title"
                item-value="value"
                label="Job Type"
                density="compact"
                hide-details
                variant="outlined"
                :disabled="isBusy"
            />
        </v-col>
        <v-col cols="12" md="6" lg="3" class="d-flex align-center">
            <v-switch v-model="activeOnly" color="primary" label="Active only" hide-details :disabled="isBusy" />
        </v-col>
    </v-row>

    <div class="d-flex flex-wrap justify-end ga-2 mt-2">
        <v-btn color="secondary" variant="outlined" rounded="pill" :disabled="isBusy" @click="resetFilters">Reset</v-btn>
        <v-btn color="primary" rounded="pill" :loading="store.loading" :disabled="isBusy" @click="applyFilters">Apply Filters</v-btn>
    </div>

    <v-row class="mt-1">
        <v-col cols="6" md="4" lg="2">
            <v-card variant="outlined" class="status-summary-card">
                <div class="text-caption text-medium-emphasis">Current Page</div>
                <div class="text-h6 font-weight-bold">{{ statusSummary.total }}</div>
            </v-card>
        </v-col>
        <v-col cols="6" md="4" lg="2">
            <v-card variant="outlined" class="status-summary-card">
                <div class="text-caption text-medium-emphasis">Queued</div>
                <v-chip size="small" color="warning" variant="tonal">{{ statusSummary.queued }}</v-chip>
            </v-card>
        </v-col>
        <v-col cols="6" md="4" lg="2">
            <v-card variant="outlined" class="status-summary-card">
                <div class="text-caption text-medium-emphasis">Running</div>
                <v-chip size="small" color="info" variant="tonal">{{ statusSummary.running }}</v-chip>
            </v-card>
        </v-col>
        <v-col cols="6" md="4" lg="2">
            <v-card variant="outlined" class="status-summary-card">
                <div class="text-caption text-medium-emphasis">Completed</div>
                <v-chip size="small" color="success" variant="tonal">{{ statusSummary.completed }}</v-chip>
            </v-card>
        </v-col>
        <v-col cols="6" md="4" lg="2">
            <v-card variant="outlined" class="status-summary-card">
                <div class="text-caption text-medium-emphasis">Failed</div>
                <v-chip size="small" color="error" variant="tonal">{{ statusSummary.failed }}</v-chip>
            </v-card>
        </v-col>
    </v-row>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 background-job-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Display Name</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Job Type</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Status</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Resource Key</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Source</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Started</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Completed</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Updated</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.items.length">
                        <td colspan="9" class="text-subtitle-1 text-center py-6">Loading background jobs...</td>
                    </tr>
                    <tr v-else-if="!filteredItems.length">
                        <td colspan="9" class="text-subtitle-1 text-center py-6">No background jobs found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredItems" :key="item.id">
                        <td class="text-subtitle-2 text-no-wrap">{{ item.displayName }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ prettifyPascalCase(String(item.jobType)) }}</td>
                        <td class="text-subtitle-2 text-no-wrap">
                            <v-chip size="small" :color="statusColor(String(item.status))" variant="tonal">
                                {{ item.status }}
                            </v-chip>
                        </td>
                        <td class="text-subtitle-2 text-no-wrap">{{ item.resourceKey }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ item.source }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ formatDateTime(item.startedAtUtc) }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ formatDateTime(item.completedAtUtc) }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ formatDateTime(item.updatedAtUtc) }}</td>
                        <td class="text-right text-no-wrap">
                            <v-btn size="small" color="primary" variant="text" :disabled="isBusy" @click="openDetails(item)">Details</v-btn>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </perfect-scrollbar>

    <v-divider class="my-4" />

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
                class="background-job-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            />

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
            />
        </div>
    </div>

    <v-dialog v-model="detailsDialog" max-width="840">
        <v-card>
            <v-card-title class="px-4 pt-6 pb-2 d-flex align-center justify-space-between">
                <span class="text-h5">Background Job Details</span>
                <v-btn icon="mdi-close" density="compact" :disabled="loadingDetails" @click="detailsDialog = false" />
            </v-card-title>
            <v-card-text class="px-4" v-if="selectedJob">
                <v-progress-linear indeterminate color="primary" class="mb-4" v-if="loadingDetails" />
                <v-row>
                    <v-col cols="12" md="6"><strong>ID:</strong> {{ selectedJob.id }}</v-col>
                    <v-col cols="12" md="6"><strong>Type:</strong> {{ prettifyPascalCase(String(selectedJob.jobType)) }}</v-col>
                    <v-col cols="12" md="6"><strong>Status:</strong> {{ selectedJob.status }}</v-col>
                    <v-col cols="12" md="6"><strong>Active:</strong> {{ selectedJob.isActive ? 'Yes' : 'No' }}</v-col>
                    <v-col cols="12" md="6"><strong>Started:</strong> {{ formatDateTime(selectedJob.startedAtUtc) }}</v-col>
                    <v-col cols="12" md="6"><strong>Completed:</strong> {{ formatDateTime(selectedJob.completedAtUtc) }}</v-col>
                    <v-col cols="12" md="6"><strong>Created:</strong> {{ formatDateTime(selectedJob.createdAtUtc) }}</v-col>
                    <v-col cols="12" md="6"><strong>Updated:</strong> {{ formatDateTime(selectedJob.updatedAtUtc) }}</v-col>
                    <v-col cols="12"><strong>Resource Key:</strong> {{ selectedJob.resourceKey }}</v-col>
                    <v-col cols="12"><strong>Source:</strong> {{ selectedJob.source }}</v-col>
                    <v-col cols="12">
                        <strong>Error:</strong>
                        <div>{{ selectedJob.errorMessage || '—' }}</div>
                    </v-col>
                </v-row>

                <v-divider class="my-4" />

                <div class="text-subtitle-1 font-weight-semibold mb-2">Metadata</div>
                <v-table density="compact">
                    <thead>
                        <tr>
                            <th class="text-subtitle-2 font-weight-semibold">Key</th>
                            <th class="text-subtitle-2 font-weight-semibold">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!metadataKeys(selectedJob.metadata).length">
                            <td colspan="2" class="text-subtitle-2 text-center py-4">No metadata provided.</td>
                        </tr>
                        <tr v-else v-for="key in metadataKeys(selectedJob.metadata)" :key="`${selectedJob.id}-${key}`">
                            <td class="text-subtitle-2 text-no-wrap">{{ key }}</td>
                            <td class="text-subtitle-2">{{ selectedJob.metadata[key] }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style lang="scss">
.background-job-table {
    .v-table__wrapper > table {
        width: 100%;
    }
}

.background-job-page-size {
    max-width: 160px;
}

.status-summary-card {
    height: 100%;
    min-height: 76px;
    padding: 12px;
}
</style>



