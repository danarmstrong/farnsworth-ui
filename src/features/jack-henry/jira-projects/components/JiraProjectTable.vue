<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import JiraProjectForm from '@/features/jack-henry/jira-projects/components/JiraProjectForm.vue';
import type { JiraProject, JiraProjectFormSubmitPayload, JiraProjectSyncQueueResponse } from '@/features/jack-henry/jira-projects/types/JiraProject';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { PencilIcon, RefreshIcon, TrashIcon } from 'vue-tabler-icons';

const MS_PER_HOUR = 1000 * 60 * 60;

const store = useJiraProjectStore();
const confirm = useConfirm();

onMounted(() => {
    store.fetchJiraProjects();
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const syncingProjectId = ref<string | null>(null);
const syncSnackbar = ref(false);
const syncSnackbarText = ref('');
const syncSnackbarColor = ref<'success' | 'error'>('success');
const formRef = ref<InstanceType<typeof JiraProjectForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    if (!normalizedSearch) {
        return store.jiraProjects;
    }
    return store.jiraProjects.filter((p: JiraProject) => {
        return (
            p.name.toLowerCase().includes(normalizedSearch) ||
            p.description.toLowerCase().includes(normalizedSearch)
        );
    });
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
    const parsed = Date.parse(lastSynced);
    if (Number.isNaN(parsed)) {
        return { text: 'NEVER', tone: 'never', chipColor: 'error' };
    }
    const ageHours = Math.max(0, (Date.now() - parsed) / MS_PER_HOUR);
    const text = new Date(lastSynced).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
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
        await store.deleteJiraProject(item.id);
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
            await store.fetchJiraProjects();
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

    <perfect-scrollbar class="no-scrollbar">
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
                    <tr v-if="store.loading && !store.jiraProjects.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">Loading Jira projects...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">No Jira projects found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-name">{{ item.name }}</td>
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
    </perfect-scrollbar>

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
</style>
