<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useJiraBoardWatcherStore } from '@/features/jack-henry/jira-board-watchers/stores/jiraBoardWatcherStore';
import JiraBoardWatcherForm from '@/features/jack-henry/jira-board-watchers/components/JiraBoardWatcherForm.vue';
import type {
    JiraBoardWatcher,
    JiraBoardWatcherFormSubmitPayload
} from '@/features/jack-henry/jira-board-watchers/types/JiraBoardWatcher';
import { useConfirm } from '@/utils/helpers/useConfirm';

const store = useJiraBoardWatcherStore();
const confirm = useConfirm();

onMounted(() => {
    store.fetchJiraBoardWatchers();
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const formRef = ref<InstanceType<typeof JiraBoardWatcherForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

function dash(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }
    return value;
}

const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase().trim();
    if (!normalizedSearch) {
        return store.items;
    }
    return store.items.filter((w: JiraBoardWatcher) => {
        const boardMatch = String(w.boardId).includes(normalizedSearch);
        const descMatch = w.description.toLowerCase().includes(normalizedSearch);
        const jiraBoard = (w.jiraBoardId ?? '').toLowerCase();
        const jiraMatch = jiraBoard.includes(normalizedSearch);
        return boardMatch || descMatch || jiraMatch;
    });
});

function editItem(item: JiraBoardWatcher) {
    formRef.value?.openEdit(item);
}

async function deleteItem(item: JiraBoardWatcher) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteJiraBoardWatcher(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: JiraBoardWatcherFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateJiraBoardWatcher(payload.id, {
                description: payload.description,
                isEnabled: payload.isEnabled
            });
        } else if (payload.boardId !== undefined) {
            await store.createJiraBoardWatcher({
                boardId: payload.boardId,
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
                label="Search watchers"
                hide-details
                variant="outlined"
            ></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <JiraBoardWatcherForm
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
            <v-table class="mt-5 jira-board-watcher-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-narrow">Board ID</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-note">Description</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-narrow">Enabled</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-jira">Jira board ID</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.items.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">Loading Jira board watchers...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="5" class="text-subtitle-1 text-center py-6">No Jira board watchers found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-narrow">{{ item.boardId }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-note">{{ item.description }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-narrow">
                            <v-chip size="small" :color="item.isEnabled ? 'success' : 'default'" variant="tonal">
                                {{ item.isEnabled ? 'Yes' : 'No' }}
                            </v-chip>
                        </td>
                        <td class="text-subtitle-1 text-no-wrap col-jira">{{ dash(item.jiraBoardId) }}</td>
                        <td class="text-right text-no-wrap col-actions">
                            <div class="d-flex align-center justify-end">
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
</template>

<style lang="scss">
.jira-board-watcher-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-narrow,
    .col-actions {
        width: 1%;
        white-space: nowrap;
    }

    .col-jira {
        width: auto;
        white-space: nowrap;
    }

    .col-note {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}
</style>
