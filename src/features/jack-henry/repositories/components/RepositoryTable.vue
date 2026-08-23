<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import RepositoryForm from '@/features/jack-henry/repositories/components/RepositoryForm.vue';
import { useGithubRepoStore } from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type {
    GithubRepoQueryFilters,
    GithubRepository,
    GithubRepoSyncQueueResponse,
    RepositoryFormSubmitPayload
} from '@/features/jack-henry/repositories/types/GithubRepository';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { formatUtcLocal, parseUtcDateMillis } from '@/utils/helpers/dateTime';
import { DownloadIcon, RefreshIcon } from 'vue-tabler-icons';

const MS_PER_HOUR = 1000 * 60 * 60;

type QuickFilter = 'all' | 'watched' | 'personal' | 'watchedPersonal';

const store = useGithubRepoStore();
const confirm = useConfirm();

const search = ref('');
const quickFilter = ref<QuickFilter>('all');
const saving = ref(false);
const deleting = ref(false);
const syncingRepoId = ref<string | null>(null);
const downloadingRepoId = ref<string | null>(null);
const syncingAll = ref(false);
const syncSnackbar = ref(false);
const syncSnackbarText = ref('');
const syncSnackbarColor = ref<'success' | 'error'>('success');
const formRef = ref<InstanceType<typeof RepositoryForm> | null>(null);

const isBusy = computed(() => saving.value || deleting.value || syncingAll.value || downloadingRepoId.value !== null || store.loading);

const quickFilterOptions: ReadonlyArray<{ label: string; value: QuickFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Watched', value: 'watched' },
    { label: 'Personal', value: 'personal' },
    { label: 'Watched + Personal', value: 'watchedPersonal' }
];

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

function wasQueued(result: GithubRepoSyncQueueResponse): boolean {
    return typeof result.queued === 'boolean' ? result.queued : true;
}

onMounted(() => {
    void reloadList();
});

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    if (!normalizedSearch) {
        return store.githubRepos;
    }

    return store.githubRepos.filter((repo: GithubRepository) => {
        return repo.name.toLowerCase().includes(normalizedSearch) || repo.url.toLowerCase().includes(normalizedSearch);
    });
});

function quickFilterToQuery(filter: QuickFilter): GithubRepoQueryFilters | undefined {
    if (filter === 'watched') {
        return { isWatched: true };
    }
    if (filter === 'personal') {
        return { isPersonal: true };
    }
    if (filter === 'watchedPersonal') {
        return { isWatched: true, isPersonal: true };
    }
    return undefined;
}

async function reloadList() {
    await store.fetchGithubRepos(quickFilterToQuery(quickFilter.value));
}

async function setQuickFilter(filter: QuickFilter) {
    if (quickFilter.value === filter || isBusy.value) {
        return;
    }

    quickFilter.value = filter;
    await reloadList();
}

function editItem(item: GithubRepository) {
    formRef.value?.openEdit(item);
}

async function deleteItem(item: GithubRepository) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this repository?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteGithubRepo(item.id);
    } finally {
        deleting.value = false;
    }
}

async function syncItem(item: GithubRepository) {
    if (!item.id || syncingRepoId.value !== null || syncingAll.value || downloadingRepoId.value !== null) {
        return;
    }

    syncingRepoId.value = item.id;
    store.clearError();
    try {
        const result = await store.queueSyncGithubRepo(item.id);
        if (store.error) {
            syncSnackbarColor.value = 'error';
            syncSnackbarText.value = store.error;
            syncSnackbar.value = true;
        } else if (result) {
            syncSnackbarColor.value = 'success';
            syncSnackbarText.value = wasQueued(result) ? 'Sync queued.' : 'Sync was not queued.';
            syncSnackbar.value = true;
            await reloadList();
        }
    } finally {
        syncingRepoId.value = null;
    }
}

function downloadTooltipText(item: GithubRepository): string {
    return item.lastPulled === null ? 'Download (Clone)' : 'Download (Pull)';
}

async function downloadItem(item: GithubRepository) {
    if (!item.id || downloadingRepoId.value !== null || syncingRepoId.value !== null || syncingAll.value) {
        return;
    }

    downloadingRepoId.value = item.id;
    store.clearError();
    try {
        const isClone = item.lastPulled === null;
        const result = isClone ? await store.queueCloneGithubRepo(item.id) : await store.queuePullGithubRepo(item.id);

        if (store.error) {
            syncSnackbarColor.value = 'error';
            syncSnackbarText.value = store.error;
            syncSnackbar.value = true;
        } else if (result) {
            syncSnackbarColor.value = 'success';
            syncSnackbarText.value = wasQueued(result)
                ? isClone
                    ? 'Clone queued.'
                    : 'Pull queued.'
                : isClone
                  ? 'Clone was not queued.'
                  : 'Pull was not queued.';
            syncSnackbar.value = true;
            await reloadList();
        }
    } finally {
        downloadingRepoId.value = null;
    }
}

async function syncAll() {
    if (isBusy.value || syncingRepoId.value !== null || downloadingRepoId.value !== null) {
        return;
    }

    syncingAll.value = true;
    store.clearError();
    try {
        const result = await store.queueSyncAllGithubRepos();
        if (store.error) {
            syncSnackbarColor.value = 'error';
            syncSnackbarText.value = store.error;
            syncSnackbar.value = true;
        } else if (result) {
            syncSnackbarColor.value = 'success';
            syncSnackbarText.value = wasQueued(result) ? 'All repository syncs queued.' : 'Repository syncs were not queued.';
            syncSnackbar.value = true;
            await reloadList();
        }
    } finally {
        syncingAll.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: RepositoryFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateGithubRepo(payload.id, {
                name: payload.name,
                url: payload.url,
                isPersonal: payload.isPersonal,
                isWatched: payload.isWatched,
                useSsh: payload.useSsh
            });
        } else {
            await store.createGithubRepo({
                name: payload.name,
                url: payload.url,
                isPersonal: payload.isPersonal,
                isWatched: payload.isWatched,
                useSsh: payload.useSsh
            });
        }

        if (!store.error) {
            formRef.value?.close();
            await reloadList();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search repositories" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="4" md="6" class="d-flex align-center flex-wrap ga-2">
            <v-btn
                v-for="option in quickFilterOptions"
                :key="option.value"
                size="small"
                rounded="pill"
                :variant="quickFilter === option.value ? 'flat' : 'tonal'"
                :color="quickFilter === option.value ? 'primary' : undefined"
                :disabled="isBusy"
                @click="setQuickFilter(option.value)"
            >
                {{ option.label }}
            </v-btn>
        </v-col>
        <v-col cols="12" lg="4" class="d-flex justify-end align-center flex-wrap ga-2">
            <v-btn
                color="secondary"
                rounded="pill"
                :loading="syncingAll"
                :disabled="isBusy || syncingRepoId !== null || downloadingRepoId !== null"
                @click="syncAll"
            >
                <v-icon class="mr-2">mdi-sync</v-icon>
                Sync All
            </v-btn>
            <RepositoryForm
                ref="formRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 repository-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-name">Name</th>
                        <th class="text-subtitle-1 font-weight-semibold col-url">URL</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-flag">Personal</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-flag">Watched</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-last-sync">Last synced</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.githubRepos.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">Loading repositories...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">No repositories found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-name">
                            <RouterLink
                                v-if="item.id"
                                :to="{ name: 'Repository Detail', params: { id: item.id } }"
                                class="text-primary text-decoration-none font-weight-medium"
                            >
                                {{ item.name }}
                            </RouterLink>
                            <template v-else>{{ item.name }}</template>
                        </td>
                        <td class="text-subtitle-1 col-url">
                            <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-primary">
                                {{ item.url }}
                            </a>
                        </td>
                        <td class="text-subtitle-1 text-no-wrap col-flag">
                            <v-chip size="small" :color="item.isPersonal ? 'success' : 'default'" variant="tonal">
                                {{ item.isPersonal ? 'Yes' : 'No' }}
                            </v-chip>
                        </td>
                        <td class="text-subtitle-1 text-no-wrap col-flag">
                            <v-chip size="small" :color="item.isWatched ? 'success' : 'default'" variant="tonal">
                                {{ item.isWatched ? 'Yes' : 'No' }}
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
                                            :disabled="isBusy || syncingRepoId !== null || downloadingRepoId !== null"
                                            :loading="syncingRepoId === item.id"
                                            @click="syncItem(item)"
                                            v-bind="tipProps"
                                        >
                                            <RefreshIcon stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip :text="downloadTooltipText(item)">
                                    <template v-slot:activator="{ props: tipProps }">
                                        <v-btn
                                            icon
                                            flat
                                            :disabled="isBusy || syncingRepoId !== null || downloadingRepoId !== null"
                                            :loading="downloadingRepoId === item.id"
                                            @click="downloadItem(item)"
                                            v-bind="tipProps"
                                        >
                                            <DownloadIcon stroke-width="1.5" size="20" class="text-primary" />
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
    </perfect-scrollbar>

    <v-snackbar v-model="syncSnackbar" location="bottom right" :color="syncSnackbarColor" variant="flat" rounded="md">
        {{ syncSnackbarText }}
    </v-snackbar>
</template>

<style lang="scss">
.repository-table {
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

    .col-url {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}
</style>
