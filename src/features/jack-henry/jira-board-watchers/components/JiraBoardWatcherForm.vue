<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
    JiraBoardWatcher,
    JiraBoardWatcherFormSubmitPayload
} from '@/features/jack-henry/jira-board-watchers/types/JiraBoardWatcher';

interface Props {
    saving: boolean;
    submitDisabled?: boolean;
    error: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    submitDisabled: false
});

const emit = defineEmits<{
    submit: [JiraBoardWatcherFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const editingId = ref<string | null>(null);
const boardIdInput = ref('');
const description = ref('');
const isEnabled = ref(true);
const readOnlyBoardId = ref<number | null>(null);
const readOnlyJiraBoardId = ref<string | null>(null);

const formTitle = computed(() => (mode.value === 'create' ? 'New Jira Board Watcher' : 'Edit Jira Board Watcher'));

const parsedBoardId = computed(() => {
    const n = Number.parseInt(boardIdInput.value.trim(), 10);
    return Number.isFinite(n) ? n : null;
});

const canSave = computed(() => {
    const desc = description.value.trim();
    if (!desc) {
        return false;
    }
    if (mode.value === 'create') {
        return parsedBoardId.value !== null && parsedBoardId.value > 0;
    }
    return true;
});

function resetForm() {
    boardIdInput.value = '';
    description.value = '';
    isEnabled.value = true;
    readOnlyBoardId.value = null;
    readOnlyJiraBoardId.value = null;
    editingId.value = null;
    mode.value = 'create';
}

function close() {
    dialog.value = false;
    emit('cancel');
    setTimeout(() => {
        resetForm();
    }, 300);
}

function openCreate() {
    resetForm();
    dialog.value = true;
}

function openEdit(watcher: JiraBoardWatcher) {
    mode.value = 'edit';
    editingId.value = watcher.id;
    boardIdInput.value = '';
    readOnlyBoardId.value = watcher.boardId;
    readOnlyJiraBoardId.value = watcher.jiraBoardId ?? null;
    description.value = watcher.description;
    isEnabled.value = watcher.isEnabled;
    dialog.value = true;
}

function save() {
    const desc = description.value.trim();
    if (!desc) {
        return;
    }

    if (mode.value === 'create') {
        const bid = parsedBoardId.value;
        if (bid === null || bid <= 0) {
            return;
        }
        emit('submit', {
            boardId: bid,
            description: desc,
            isEnabled: isEnabled.value
        });
        return;
    }

    if (!editingId.value) {
        return;
    }

    emit('submit', {
        id: editingId.value,
        description: desc,
        isEnabled: isEnabled.value
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="520">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-view-dashboard-outline</v-icon>
                Add Watcher
            </v-btn>
        </template>

        <v-card>
            <v-card-title class="px-4 pt-6 justify-space-between d-flex align-center">
                <span class="text-h5">{{ formTitle }}</span>
                <v-btn @click="close" :disabled="props.saving" :ripple="false" density="compact" icon="mdi-close"></v-btn>
            </v-card-title>

            <v-card-text class="px-4">
                <v-alert v-if="props.error" type="error" variant="tonal" density="compact" class="mb-4">{{ props.error }}</v-alert>
                <v-form class="dialog_form" lazy-validation>
                    <v-row>
                        <template v-if="mode === 'create'">
                            <v-col cols="12">
                                <v-text-field
                                    variant="outlined"
                                    hide-details="auto"
                                    v-model="boardIdInput"
                                    label="Board ID"
                                    type="text"
                                    inputmode="numeric"
                                    autocomplete="off"
                                />
                            </v-col>
                        </template>
                        <template v-else>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    variant="outlined"
                                    hide-details
                                    :model-value="String(readOnlyBoardId ?? '')"
                                    label="Board ID"
                                    readonly
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    variant="outlined"
                                    hide-details
                                    :model-value="readOnlyJiraBoardId ?? ''"
                                    label="Jira board ID"
                                    readonly
                                />
                            </v-col>
                        </template>
                        <v-col cols="12">
                            <v-text-field variant="outlined" hide-details="auto" v-model="description" label="Description" />
                        </v-col>
                        <v-col cols="12">
                            <v-switch v-model="isEnabled" color="primary" hide-details label="Enabled" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <div class="pa-4 d-flex justify-end gap-2">
                <v-spacer></v-spacer>
                <v-btn @click="close" :disabled="props.saving" class="bg-error px-3 rounded-pill">Cancel</v-btn>
                <v-btn
                    @click="save"
                    color="primary"
                    :loading="props.saving"
                    :disabled="!canSave || props.submitDisabled"
                    class="px-3 rounded-pill"
                >
                    Save
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>
