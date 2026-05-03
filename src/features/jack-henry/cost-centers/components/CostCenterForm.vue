<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CostCenter } from '@/features/jack-henry/cost-centers/types/CostCenter';

type CostCenterFormSubmitPayload = {
    id?: string;
    departmentNumber: string;
    name: string;
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
    submit: [payload: CostCenterFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const item = ref<CostCenter>({
    id: '',
    departmentNumber: '',
    name: ''
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Cost Center' : 'Edit Cost Center'));

function resetForm() {
    item.value = {
        id: '',
        departmentNumber: '',
        name: ''
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

function openEdit(costCenter: CostCenter) {
    mode.value = 'edit';
    item.value = { ...costCenter };
    dialog.value = true;
}

function save() {
    const departmentNumber = item.value.departmentNumber.trim();
    if (!departmentNumber) {
        return;
    }

    const name = item.value.name.trim();
    if (!name) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        departmentNumber,
        name
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
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>Add Cost Center
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
                            <v-text-field variant="outlined" hide-details v-model="item.departmentNumber" label="Department Number" />
                        </v-col>
                        <v-col cols="12" sm="12">
                            <v-textarea variant="outlined" hide-details v-model="item.name" label="Department Name" />
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
                    :disabled="!item.departmentNumber.trim() || props.submitDisabled"
                    class="px-3 rounded-pill"
                >
                    Save
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>
