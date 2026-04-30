<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SalaryPlan } from '@/features/jack-henry/salary-plans/types/SalaryPlan';

type SalaryPlanFormSubmitPayload = {
    id?: string;
    code: string;
    note: string | null;
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
    submit: [payload: SalaryPlanFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const item = ref<SalaryPlan>({
    id: '',
    code: '',
    note: null
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Salary Plan' : 'Edit Salary Plan'));

function resetForm() {
    item.value = {
        id: '',
        code: '',
        note: null
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

function openEdit(salaryPlan: SalaryPlan) {
    mode.value = 'edit';
    item.value = { ...salaryPlan };
    dialog.value = true;
}

function save() {
    const code = item.value.code.trim();
    if (!code) {
        return;
    }

    const note = item.value.note?.trim() || null;

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        code,
        note
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="500">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>Add Salary Plan
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
                        <v-col cols="12" sm="12">
                            <v-text-field variant="outlined" hide-details v-model="item.code" label="Code" />
                        </v-col>
                        <v-col cols="12" sm="12">
                            <v-textarea variant="outlined" hide-details v-model="item.note" label="Note" />
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
                    :disabled="!item.code.trim() || props.submitDisabled"
                    class="px-3 rounded-pill"
                >
                    Save
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>
