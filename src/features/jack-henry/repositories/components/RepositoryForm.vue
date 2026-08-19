<script setup lang="ts">
import { computed, ref } from 'vue';
import type { GithubRepository, RepositoryFormSubmitPayload } from '@/features/jack-henry/repositories/types/GithubRepository';

interface Props {
    saving: boolean;
    submitDisabled?: boolean;
    error: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    submitDisabled: false
});

const emit = defineEmits<{
    submit: [RepositoryFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');

const item = ref<GithubRepository>({
    id: '',
    name: '',
    url: '',
    isPersonal: false,
    isWatched: true,
    useSsh: true,
    isCloned: false,
    lastSynced: null,
    lastPulled: null
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Repository' : 'Edit Repository'));

const trimmedUrl = computed(() => item.value.url.trim());

const urlErrorMessage = computed(() => {
    if (!trimmedUrl.value) {
        return '';
    }
    return isValidGithubRepositoryUrl(trimmedUrl.value)
        ? ''
        : 'Enter a valid GitHub repository URL using HTTPS (for example https://github.com/org/repo.git).';
});

const canSave = computed(() => {
    return Boolean(item.value.name.trim() && trimmedUrl.value && !urlErrorMessage.value);
});

function isValidGithubRepositoryUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        const host = parsed.hostname.toLowerCase();
        const pathParts = parsed.pathname.split('/').filter(Boolean);

        if (parsed.protocol !== 'https:') {
            return false;
        }
        if (host !== 'github.com' && host !== 'www.github.com') {
            return false;
        }
        if (parsed.search || parsed.hash) {
            return false;
        }
        if (pathParts.length !== 2) {
            return false;
        }

        const [owner, repo] = pathParts;
        if (!owner || !repo) {
            return false;
        }

        const normalizedRepo = repo.endsWith('.git') ? repo.slice(0, -4) : repo;
        return Boolean(normalizedRepo);
    } catch {
        return false;
    }
}

function resetForm() {
    item.value = {
        id: '',
        name: '',
        url: '',
        isPersonal: false,
        isWatched: true,
        useSsh: true,
        isCloned: false,
        lastSynced: null,
        lastPulled: null
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

function openEdit(repository: GithubRepository) {
    mode.value = 'edit';
    item.value = { ...repository };
    dialog.value = true;
}

function save() {
    const name = item.value.name.trim();
    const url = trimmedUrl.value;

    if (!name || !url || !isValidGithubRepositoryUrl(url)) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        name,
        url,
        isPersonal: item.value.isPersonal,
        isWatched: item.value.isWatched,
        useSsh: item.value.useSsh
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="640">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-source-repository-plus</v-icon>Add Repository
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
                            <v-text-field
                                variant="outlined"
                                hide-details="auto"
                                v-model="item.url"
                                label="GitHub URL"
                                placeholder="https://github.com/org/repo.git"
                                :error-messages="urlErrorMessage ? [urlErrorMessage] : []"
                                autocomplete="off"
                                spellcheck="false"
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-switch v-model="item.isPersonal" color="primary" hide-details label="Personal" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-switch v-model="item.isWatched" color="primary" hide-details label="Watched" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-switch v-model="item.useSsh" color="primary" hide-details label="Use SSH" />
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





