<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useApplicationSettingStore } from '@/features/jack-henry/application-settings/stores/applicationSettingStore';
import type { ApplicationSetting } from '@/features/jack-henry/application-settings/types/ApplicationSetting';

const store = useApplicationSettingStore();
const search = ref('');
const saving = ref(false);
const creating = ref(false);
const draftValues = ref<Record<string, string | null>>({});
const createDialog = ref(false);
const createKey = ref('');
const createValue = ref('');
const createUseDefaultValue = ref(true);

const booleanValueOptions = [
    { title: 'Use effective value', value: null },
    { title: 'True', value: 'true' },
    { title: 'False', value: 'false' }
];

const isBusy = computed(() => saving.value || creating.value || store.loading);

onMounted(async () => {
    await store.fetchApplicationSettings();
    initializeDraftValues();
});

const filteredItems = computed(() => {
    const query = search.value.toLowerCase().trim();
    if (!query) {
        return store.items;
    }

    return store.items.filter((item) => {
        return (
            item.label.toLowerCase().includes(query) ||
            item.key.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    });
});

const hasChanges = computed(() => {
    return store.items.some((item) => getDraftValue(item.key) !== normalizeNullableString(item.value));
});

function normalizeNullableString(value: string | null | undefined): string | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return value;
}

function initializeDraftValues(): void {
    draftValues.value = store.items.reduce<Record<string, string | null>>((acc, item) => {
        acc[item.key] = normalizeNullableString(item.value);
        return acc;
    }, {});
}

function normalizeSettingType(type: ApplicationSetting['type']): 'boolean' | 'number' | 'secret' | 'string' {
    if (typeof type !== 'string') {
        return 'string';
    }

    const normalized = type.toLowerCase();
    if (normalized.includes('bool')) {
        return 'boolean';
    }

    if (normalized.includes('number') || normalized.includes('int') || normalized.includes('decimal')) {
        return 'number';
    }

    if (normalized.includes('secret') || normalized.includes('password')) {
        return 'secret';
    }

    return 'string';
}

function displayType(type: ApplicationSetting['type']): string {
    return typeof type === 'string' ? type : String(type);
}

function getDraftValue(key: string): string | null {
    return normalizeNullableString(draftValues.value[key]);
}

function setTextDraftValue(key: string, value: string): void {
    store.clearError();
    draftValues.value[key] = normalizeNullableString(value);
}

function setBooleanDraftValue(key: string, value: string | null): void {
    store.clearError();
    draftValues.value[key] = value;
}

function resetToDefault(key: string): void {
    store.clearError();
    draftValues.value[key] = null;
}

function openCreateDialog(): void {
    store.clearError();
    createKey.value = '';
    createValue.value = '';
    createUseDefaultValue.value = true;
    createDialog.value = true;
}

function closeCreateDialog(): void {
    createDialog.value = false;
}

const canCreate = computed(() => {
    return createKey.value.trim().length > 0 && (createUseDefaultValue.value || createValue.value.trim().length > 0);
});

async function createSetting(): Promise<void> {
    if (isBusy.value || !canCreate.value) {
        return;
    }

    creating.value = true;
    try {
        await store.createApplicationSettings([
            {
                key: createKey.value.trim(),
                value: createUseDefaultValue.value ? null : normalizeNullableString(createValue.value)
            }
        ]);

        if (!store.error) {
            initializeDraftValues();
            closeCreateDialog();
        }
    } finally {
        creating.value = false;
    }
}

async function saveChanges(): Promise<void> {
    if (isBusy.value || !hasChanges.value) {
        return;
    }

    saving.value = true;
    try {
        await store.replaceApplicationSettings(
            store.items.map((item) => ({
                key: item.key,
                value: getDraftValue(item.key)
            }))
        );

        if (!store.error) {
            initializeDraftValues();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" md="6" lg="5">
            <v-text-field
                density="compact"
                v-model="search"
                label="Search settings"
                hide-details
                variant="outlined"
                :disabled="isBusy"
            />
        </v-col>
        <v-col cols="12" md="6" lg="7" class="d-flex justify-end">
            <div class="d-flex ga-2">
                <v-btn color="secondary" variant="outlined" rounded="pill" :disabled="isBusy" @click="openCreateDialog">Create Setting</v-btn>
                <v-btn color="primary" rounded="pill" :loading="saving" :disabled="!hasChanges || isBusy" @click="saveChanges">
                    Save Changes
                </v-btn>
            </div>
        </v-col>
    </v-row>

    <v-alert v-if="store.error" type="error" variant="tonal" class="mt-4 mb-0">{{ store.error }}</v-alert>

    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 application-settings-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold">Setting</th>
                        <th class="text-subtitle-1 font-weight-semibold">Description</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Type</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Effective Value</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Override</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap">Configured</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.items.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">Loading application settings...</td>
                    </tr>
                    <tr v-else-if="!filteredItems.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">No settings found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredItems" :key="item.key">
                        <td class="text-subtitle-2">
                            <div class="font-weight-medium">{{ item.label }}</div>
                            <div class="text-caption text-medium-emphasis">{{ item.key }}</div>
                        </td>
                        <td class="text-subtitle-2">{{ item.description }}</td>
                        <td class="text-subtitle-2 text-no-wrap">{{ displayType(item.type) }}</td>
                        <td class="text-subtitle-2">
                            <code>{{ item.effectiveValue }}</code>
                        </td>
                        <td class="text-subtitle-2">
                            <div class="d-flex align-center ga-2">
                                <v-select
                                    v-if="normalizeSettingType(item.type) === 'boolean'"
                                    :model-value="getDraftValue(item.key)"
                                    :items="booleanValueOptions"
                                    item-title="title"
                                    item-value="value"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    style="min-width: 210px"
                                    :disabled="isBusy"
                                    @update:model-value="setBooleanDraftValue(item.key, $event)"
                                />
                                <v-text-field
                                    v-else
                                    :model-value="getDraftValue(item.key) ?? ''"
                                    :type="normalizeSettingType(item.type) === 'secret' ? 'password' : normalizeSettingType(item.type)"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    autocomplete="off"
                                    :disabled="isBusy"
                                    @update:model-value="setTextDraftValue(item.key, $event)"
                                />
                                <v-tooltip text="Use effective value">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon variant="text" size="small" :disabled="isBusy" @click="resetToDefault(item.key)" v-bind="props">
                                            <v-icon size="18">mdi-close-circle-outline</v-icon>
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </div>
                        </td>
                        <td class="text-subtitle-2 text-no-wrap">
                            <v-chip :color="item.isConfigured ? 'success' : 'default'" size="small" variant="tonal">
                                {{ item.isConfigured ? 'Yes' : 'No' }}
                            </v-chip>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </div>
    </perfect-scrollbar>

    <v-dialog v-model="createDialog" max-width="560">
        <v-card>
            <v-card-title class="px-4 pt-6 pb-2 d-flex align-center justify-space-between">
                <span class="text-h5">Create Setting</span>
                <v-btn icon="mdi-close" density="compact" :disabled="creating" @click="closeCreateDialog" />
            </v-card-title>
            <v-card-text class="px-4">
                <v-alert v-if="store.error" type="error" variant="tonal" density="compact" class="mb-4">{{ store.error }}</v-alert>
                <v-row>
                    <v-col cols="12">
                        <v-text-field
                            v-model="createKey"
                            label="Key"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            :disabled="creating"
                        />
                    </v-col>
                    <v-col cols="12">
                        <v-switch
                            v-model="createUseDefaultValue"
                            color="primary"
                            label="Use effective/default value"
                            hide-details
                            :disabled="creating"
                        />
                    </v-col>
                    <v-col cols="12" v-if="!createUseDefaultValue">
                        <v-text-field
                            v-model="createValue"
                            label="Override Value"
                            variant="outlined"
                            density="compact"
                            hide-details="auto"
                            :disabled="creating"
                        />
                    </v-col>
                </v-row>
            </v-card-text>
            <div class="pa-4 d-flex justify-end ga-2">
                <v-btn class="bg-error px-3 rounded-pill" :disabled="creating" @click="closeCreateDialog">Cancel</v-btn>
                <v-btn color="primary" class="px-3 rounded-pill" :loading="creating" :disabled="!canCreate || creating" @click="createSetting">
                    Create
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<style lang="scss">
.application-settings-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    td,
    th {
        vertical-align: top;
    }
}
</style>


