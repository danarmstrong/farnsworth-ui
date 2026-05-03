<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { usePayGradeStore } from '@/features/jack-henry/pay-grades/stores/payGradeStore';
import { useJobFamilyStore } from '@/features/jack-henry/job-families/stores/jobFamilyStore';
import type { ExemptionStatus, JobTitle } from '@/features/jack-henry/job-titles/types/JobTitle';
import type { SelectOption } from '@/types/SelectOption';

type JobTitleFormSubmitPayload = {
    id?: string;
    payGradeId: string;
    jobFamilyId: string | null;
    title: string;
    longTitle: string;
    jobCode: string;
    exemptionStatus: ExemptionStatus;
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
    submit: [payload: JobTitleFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const payGradeStore = usePayGradeStore();
const jobFamilyStore = useJobFamilyStore();

const payGradeOptions = computed<SelectOption<string>[]>(() =>
    payGradeStore.payGrades.map((payGrade) => ({
        label: payGrade.grade,
        value: payGrade.id
    }))
);

const jobFamilyOptions = computed<SelectOption<string | null>[]>(() => [
    {
        label: 'None',
        value: null
    },
    ...jobFamilyStore.jobFamilies.map((jobFamily) => ({
        label: jobFamily.description,
        value: jobFamily.id
    }))
]);

const exemptionStatusOptions: SelectOption<ExemptionStatus>[] = [
    {
        label: 'Exempt',
        value: 'exempt'
    },
    {
        label: 'Not Exempt',
        value: 'notexempt'
    }
];
const item = ref<JobTitle>({
    id: '',
    payGradeId: '',
    jobFamilyId: null,
    title: '',
    longTitle: '',
    jobCode: '',
    exemptionStatus: 'notexempt'
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Job Title' : 'Edit Job Title'));
const canSave = computed(() => {
    return (
        !!item.value.payGradeId.trim() &&
        !!item.value.title.trim() &&
        !!item.value.longTitle.trim() &&
        !!item.value.jobCode.trim() &&
        !!item.value.exemptionStatus
    );
});

onMounted(() => {
    if (!payGradeStore.payGrades.length) {
        void payGradeStore.fetchPayGrades();
    }

    if (!jobFamilyStore.jobFamilies.length) {
        void jobFamilyStore.fetchJobFamilies();
    }
});

function resetForm() {
    item.value = {
        id: '',
        payGradeId: '',
        jobFamilyId: null,
        title: '',
        longTitle: '',
        jobCode: '',
        exemptionStatus: 'notexempt'
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

function openEdit(jobTitle: JobTitle) {
    mode.value = 'edit';
    item.value = { ...jobTitle };
    dialog.value = true;
}

function save() {
    const payGradeId = item.value.payGradeId.trim();
    if (!payGradeId) {
        return;
    }

    const jobFamilyId = item.value.jobFamilyId?.trim() ?? null;

    const title = item.value.title.trim();
    if (!title) {
        return;
    }

    const longTitle = item.value.longTitle.trim();
    if (!longTitle) {
        return;
    }

    const jobCode = item.value.jobCode.trim();
    if (!jobCode) {
        return;
    }

    const exemptionStatus = item.value.exemptionStatus;
    if (!exemptionStatus) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        payGradeId,
        jobFamilyId,
        title,
        longTitle,
        jobCode,
        exemptionStatus
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
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>Add Job Title
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
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.jobCode" label="Job Code" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-combobox
                                v-model="item.payGradeId"
                                :items="payGradeOptions"
                                item-title="label"
                                item-value="value"
                                :return-object="false"
                                variant="outlined"
                                hide-details
                                label="Pay Grade"
                            />
                        </v-col>
                        <v-col cols="12" sm="12">
                            <v-text-field variant="outlined" hide-details v-model="item.title" label="Title" />
                        </v-col>
                        <v-col cols="12" sm="12">
                            <v-text-field variant="outlined" hide-details v-model="item.longTitle" label="Long Title" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-combobox
                                v-model="item.jobFamilyId"
                                :items="jobFamilyOptions"
                                item-title="label"
                                item-value="value"
                                :return-object="false"
                                variant="outlined"
                                hide-details
                                label="Job Family (Optional)"
                                clearable
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-select
                                v-model="item.exemptionStatus"
                                :items="exemptionStatusOptions"
                                item-title="label"
                                item-value="value"
                                variant="outlined"
                                hide-details
                                label="Exemption Status"
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
