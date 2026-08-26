<script setup lang="ts">
import { computed, ref } from 'vue';
import type { JiraProject, JiraProjectFormSubmitPayload } from '@/features/jack-henry/jira-projects/types/JiraProject';

interface Props {
    saving: boolean;
    submitDisabled?: boolean;
    error: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    submitDisabled: false
});

const emit = defineEmits<{
    submit: [JiraProjectFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const item = ref<JiraProject>({
    id: '',
    name: '',
    description: '',
    isEnabled: true,
    isScrumProject: false,
    isScrumProjectVerified: false,
    lastSynced: null
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Jira Project' : 'Edit Jira Project'));

const canSave = computed(() => {
    return Boolean(item.value.name.trim() && item.value.description.trim());
});

function resetForm() {
    item.value = {
        id: '',
        name: '',
        description: '',
        isEnabled: true,
        isScrumProject: false,
        isScrumProjectVerified: false,
        lastSynced: null
    };
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

function openEdit(project: JiraProject) {
    mode.value = 'edit';
    item.value = { ...project };
    dialog.value = true;
}

function save() {
    const name = item.value.name.trim();
    const description = item.value.description.trim();
    if (!name || !description) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        name,
        description,
        isEnabled: item.value.isEnabled
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="560">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-folder-plus-outline</v-icon>Add Jira Project
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
                        <v-col cols="12">
                            <v-text-field variant="outlined" hide-details v-model="item.name" label="Name" />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea variant="outlined" hide-details v-model="item.description" label="Description" rows="3" />
                        </v-col>
                        <v-col cols="12">
                            <v-switch v-model="item.isEnabled" color="primary" hide-details label="Enabled" />
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
