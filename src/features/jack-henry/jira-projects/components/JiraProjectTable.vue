<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
    JIRA_PROJECTS_DEFAULT_PAGE_SIZE,
    useJiraProjectStore
} from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import JiraProjectForm from '@/features/jack-henry/jira-projects/components/JiraProjectForm.vue';
import type { JiraProject, JiraProjectFormSubmitPayload, JiraProjectSyncQueueResponse } from '@/features/jack-henry/jira-projects/types/JiraProject';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { formatUtcLocal, parseUtcDateMillis } from '@/utils/helpers/dateTime';
import { PencilIcon, RefreshIcon, TrashIcon } from 'vue-tabler-icons';

const MS_PER_HOUR = 1000 * 60 * 60;
const PerfectScrollbarTag = 'perfect-scrollbar';

const store = useJiraProjectStore();
const confirm = useConfirm();
const pageSizeOptions = [10, 25, 50];

onMounted(() => {
    void loadPage(1);
});

const search = ref('');
const page = ref(1);
const pageSize = ref(JIRA_PROJECTS_DEFAULT_PAGE_SIZE);
const saving = ref(false);
const deleting = ref(false);
const syncingProjectId = ref<string | null>(null);
const syncSnackbar = ref(false);
const syncSnackbarText = ref('');
const syncSnackbarColor = ref<'success' | 'error'>('success');
const formRef = ref<InstanceType<typeof JiraProjectForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);
const hasPagination = computed(() => store.totalPages > 1);

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    if (!normalizedSearch) {
        return store.pagedJiraProjects;
    }
    return store.pagedJiraProjects.filter((p: JiraProject) => {
        return (
            p.name.toLowerCase().includes(normalizedSearch) ||
            p.description.toLowerCase().includes(normalizedSearch)
        );
    });
});

const pageSummary = computed(() => {
    if (!store.totalCount) {
        return 'No Jira projects found.';
    }

    if (search.value.trim()) {
        const count = filteredList.value.length;
        return count === 1 ? 'Showing 1 matching entry on this page' : `Showing ${count} matching entries on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.totalCount);
    return `Showing ${start} to ${end} of ${store.totalCount} entries`;
});

type LastSyncedTone = 'never' | 'success' | 'warning' | 'error';

function lastSyncedPresentation(lastSynced: string | null | undefined): {
    text: string;
    tone: LastSyncedTone;
    chipColor: 'success' | 'warning' | 'error' | undefined;
} {
    if (lastSynced === null || lastSynced === undefined || lastSynced === '') {
        return { text: 'NEVER', tone: 'never', chipColor: 'error' };
    }
    const parsed = parseUtcDateMillis(lastSynced);
    if (!Number.isFinite(parsed)) {
        return { text: 'NEVER', tone: 'never', chipColor: 'error' };
    }
    const ageHours = Math.max(0, (Date.now() - parsed) / MS_PER_HOUR);
    const text = formatUtcLocal(lastSynced) || 'NEVER';
    if (ageHours < 24) {
        return { text, tone: 'success', chipColor: 'success' };
    }
    if (ageHours < 48) {
        return { text, tone: 'warning', chipColor: 'warning' };
    }
    return { text, tone: 'error', chipColor: 'error' };
}

function lastSyncedTextClass(tone: LastSyncedTone): string {
    if (tone === 'never') {
        return 'text-error';
    }
    if (tone === 'success') {
        return 'text-success';
    }
    if (tone === 'warning') {
        return 'text-warning';
    }
    return 'text-error';
}

function wasQueued(result: JiraProjectSyncQueueResponse): boolean {
    return typeof result.queued === 'boolean' ? result.queued : true;
}

function editItem(item: JiraProject) {
    formRef.value?.openEdit(item);
}

async function loadPage(targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);
    await store.fetchJiraProjects({
        page: page.value,
        pageSize: pageSize.value
    });
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

async function deleteItem(item: JiraProject) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        const shouldStepBack = page.value > 1 && page.value === store.totalPages && store.pagedJiraProjects.length === 1;
        await store.deleteJiraProject(item.id);
        if (!store.error) {
            await loadPage(shouldStepBack ? page.value - 1 : page.value);
        }
    } finally {
        deleting.value = false;
    }
}

async function syncItem(item: JiraProject) {
    if (!item.id || syncingProjectId.value !== null) {
        return;
    }

    syncingProjectId.value = item.id;
    store.clearError();
    try {
        const result = await store.queueSyncJiraProject(item.id);
        if (store.error) {
            syncSnackbarColor.value = 'error';
            syncSnackbarText.value = store.error;
            syncSnackbar.value = true;
        } else if (result) {
            syncSnackbarColor.value = 'success';
            syncSnackbarText.value = wasQueued(result) ? 'Sync queued.' : 'Sync was not queued.';
            syncSnackbar.value = true;
            await loadPage(page.value);
        }
    } finally {
        syncingProjectId.value = null;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: JiraProjectFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateJiraProject(payload.id, {
                name: payload.name,
                description: payload.description,
                isEnabled: payload.isEnabled
            });
        } else {
            await store.createJiraProject({
                name: payload.name,
                description: payload.description,
                isEnabled: payload.isEnabled
            });
        }

        if (!store.error) {
            await loadPage(page.value);
            formRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field
                density="compact"
                v-model="search"
                label="Search Jira projects"
                hide-details
                variant="outlined"
            ></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <JiraProjectForm
                ref="formRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <component :is="PerfectScrollbarTag" class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 jira-project-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-name">Name</th>
                        <th class="text-subtitle-1 font-weight-semibold col-desc">Description</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-flag">Enabled</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-last-sync">Last synced</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.pagedJiraProjects.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">Loading Jira projects...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">No Jira projects found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-name">
                            <RouterLink
                                v-if="item.name"
                                :to="{ name: 'Jira Project Details', params: { projectKey: item.name } }"
                                class="text-primary text-decoration-none font-weight-medium"
                            >
                                {{ item.name }}
                            </RouterLink>
                            <template v-else>{{ item.name }}</template>
                        </td>
                        <td class="text-subtitle-1 col-desc">{{ item.description }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-flag">
                            <v-chip size="small" :color="item.isEnabled ? 'success' : 'default'" variant="tonal">
                                {{ item.isEnabled ? 'Yes' : 'No' }}
                            </v-chip>
                        </td>
                        <td class="text-subtitle-1 text-no-wrap col-last-sync">
                            <template v-for="ls in [lastSyncedPresentation(item.lastSynced)]" :key="`${item.id}-${ls.tone}`">
                                <span v-if="ls.tone === 'never'" class="font-weight-semibold" :class="lastSyncedTextClass(ls.tone)">
                                    {{ ls.text }}
                                </span>
                                <v-chip v-else size="small" :color="ls.chipColor" variant="tonal" class="font-weight-medium">
                                    {{ ls.text }}
                                </v-chip>
                            </template>
                        </td>
                        <td class="text-right text-no-wrap col-actions">
                            <div class="d-flex align-center justify-end">
                                <v-tooltip text="Sync">
                                    <template v-slot:activator="{ props: tipProps }">
                                        <v-btn
                                            icon
                                            flat
                                            :disabled="isBusy || syncingProjectId !== null"
                                            :loading="syncingProjectId === item.id"
                                            @click="syncItem(item)"
                                            v-bind="tipProps"
                                        >
                                            <RefreshIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Edit">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="editItem(item)" v-bind="props">
                                            <PencilIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="deleteItem(item)" v-bind="props">
                                            <TrashIcon stroke-width="1.5" size="20" class="text-error" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </component>

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
                class="jira-project-page-size"
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

    <v-snackbar v-model="syncSnackbar" location="bottom right" :color="syncSnackbarColor" variant="flat" rounded="md">
        {{ syncSnackbarText }}
    </v-snackbar>
</template>

<style lang="scss">
.jira-project-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-name,
    .col-flag,
    .col-last-sync,
    .col-actions {
        width: 1%;
        white-space: nowrap;
    }

    .col-desc {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}

.jira-project-page-size {
    max-width: 160px;
}
</style>
