<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { CapProject } from '@/features/jack-henry/cap-projects/types/CapProject';
import type { SelectOption } from '@/types/SelectOption';
import { isStaffEligibleForCapProject } from '@/features/jack-henry/cap-projects/utils/capProjectStaffEligibility';

type CapProjectFormSubmitPayload = {
    id?: string;
    title: string;
    projectName: string;
    capPercentage: number;
    staffMemberIds: string[];
};

interface Props {
    saving: boolean;
    submitDisabled?: boolean;
    error: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    submitDisabled: false
});

const emit = defineEmits<{
    submit: [payload: CapProjectFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const staffMemberStore = useStaffMemberStore();

const staffMemberOptions = computed<SelectOption<string>[]>(() => {
    const selectedIds = new Set(item.value.staffMemberIds);
    return staffMemberStore.staffMembers
        .filter((m) => isStaffEligibleForCapProject(m) || selectedIds.has(m.id))
        .map((m) => ({
            label: [m.firstName, m.lastName].filter(Boolean).join(' ') + (m.employeeNumber ? ` (${m.employeeNumber})` : ''),
            value: m.id
        }));
});

const item = ref<CapProject>({
    id: '',
    title: '',
    projectName: '',
    capPercentage: 80,
    staffMemberIds: []
});

const formTitle = computed(() => (mode.value === 'create' ? 'New CAP Project' : 'Edit CAP Project'));
const canSave = computed(() => {
    const title = item.value.title.trim();
    const projectName = item.value.projectName.trim();
    const pct = Number(item.value.capPercentage);
    return Boolean(title && projectName && Number.isFinite(pct) && Number.isInteger(pct) && pct >= 0 && pct <= 100);
});

onMounted(() => {
    if (!staffMemberStore.staffMembers.length) {
        void staffMemberStore.fetchStaffMembers();
    }
});

function resetForm() {
    item.value = {
        id: '',
        title: '',
        projectName: '',
        capPercentage: 80,
        staffMemberIds: []
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

function openEdit(project: CapProject) {
    mode.value = 'edit';
    item.value = {
        ...project,
        staffMemberIds: [...project.staffMemberIds]
    };
    dialog.value = true;
}

function save() {
    const title = item.value.title.trim();
    const projectName = item.value.projectName.trim();
    if (!title || !projectName) {
        return;
    }

    const capPercentage = Math.round(Number(item.value.capPercentage));
    if (!Number.isFinite(capPercentage) || capPercentage < 0 || capPercentage > 100) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        title,
        projectName,
        capPercentage,
        staffMemberIds: [...item.value.staffMemberIds]
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
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>Add CAP Project
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
                            <v-text-field variant="outlined" hide-details v-model="item.title" label="Title" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field variant="outlined" hide-details v-model="item.projectName" label="Project name" />
                        </v-col>
                        <v-col cols="12">
                            <v-slider
                                v-model="item.capPercentage"
                                :min="0"
                                :max="100"
                                :step="1"
                                thumb-label="always"
                                show-ticks="always"
                                hide-details
                                label="CAP percentage"
                            />
                        </v-col>
                        <v-col cols="12">
                            <v-autocomplete
                                v-model="item.staffMemberIds"
                                :items="staffMemberOptions"
                                item-title="label"
                                item-value="value"
                                variant="outlined"
                                hide-details="auto"
                                label="Staff members"
                                multiple
                                chips
                                closable-chips
                                clearable
                            />
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
