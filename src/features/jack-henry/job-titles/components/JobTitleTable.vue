<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import JobTitleForm from '@/features/jack-henry/job-titles/components/JobTitleForm.vue';
import { usePayGradeStore } from '@/features/jack-henry/pay-grades/stores/payGradeStore';
import { useJobFamilyStore } from '@/features/jack-henry/job-families/stores/jobFamilyStore';
import type { ExemptionStatus, JobTitle } from '@/features/jack-henry/job-titles/types/JobTitle';
import { useConfirm } from '@/utils/helpers/useConfirm';

type JobTitleFormSubmitPayload = {
    id?: string;
    payGradeId: string;
    jobFamilyId: string | null;
    title: string;
    longTitle: string;
    jobCode: string;
    exemptionStatus: ExemptionStatus;
};

const store = useJobTitleStore();
const payGradeStore = usePayGradeStore();
const jobFamilyStore = useJobFamilyStore();
const confirm = useConfirm();

onMounted(() => {
    store.fetchJobTitles();
    if (!payGradeStore.payGrades.length) {
        void payGradeStore.fetchPayGrades();
    }
    if (!jobFamilyStore.jobFamilies.length) {
        void jobFamilyStore.fetchJobFamilies();
    }
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const jobTitleFormRef = ref<InstanceType<typeof JobTitleForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

//Methods
const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase();
    return store.jobTitles.filter((jobTitle: JobTitle) => {
        return jobTitle.title.toLowerCase().includes(normalizedSearch) || jobTitle.longTitle.toLowerCase().includes(normalizedSearch);
    });
});

const payGradeLabelById = computed(() => {
    return new Map(payGradeStore.payGrades.map((payGrade) => [payGrade.id, payGrade.grade]));
});

const jobFamilyLabelById = computed(() => {
    return new Map(jobFamilyStore.jobFamilies.map((jobFamily) => [jobFamily.id, jobFamily.description]));
});

function getPayGradeLabel(payGradeId: string): string {
    return payGradeLabelById.value.get(payGradeId) || payGradeId;
}

function getJobFamilyLabel(jobFamilyId: string | null): string {
    if (!jobFamilyId) {
        return 'None';
    }
    return jobFamilyLabelById.value.get(jobFamilyId) || jobFamilyId;
}

function editItem(item: JobTitle) {
    jobTitleFormRef.value?.openEdit(item);
}
async function deleteItem(item: JobTitle) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteJobTitle(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: JobTitleFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateJobTitle(payload.id, {
                payGradeId: payload.payGradeId,
                jobFamilyId: payload.jobFamilyId,
                jobCode: payload.jobCode,
                title: payload.title,
                longTitle: payload.longTitle,
                exemptionStatus: payload.exemptionStatus
            });
        } else {
            await store.createJobTitle({
                payGradeId: payload.payGradeId,
                jobFamilyId: payload.jobFamilyId,
                jobCode: payload.jobCode,
                title: payload.title,
                longTitle: payload.longTitle,
                exemptionStatus: payload.exemptionStatus
            });
        }

        if (!store.error) {
            jobTitleFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search Job Titles" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <JobTitleForm
                ref="jobTitleFormRef"
                :saving="saving"
                :submit-disabled="isBusy"
                :error="store.error"
                @submit="save"
                @cancel="clearStoreError"
            />
        </v-col>
    </v-row>

    <!-- The data table -->
    <perfect-scrollbar class="no-scrollbar">
        <div class="border-table">
            <v-table class="mt-5 job-title-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Job Code</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Title</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-note">Long Title</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Pay Grade</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Job Family</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.jobTitles.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">Loading job titles...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="6" class="text-subtitle-1 text-center py-6">No job titles found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ item.jobCode }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ item.title }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-note">{{ item.longTitle }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ getPayGradeLabel(item.payGradeId) }}</td>
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ getJobFamilyLabel(item.jobFamilyId) }}</td>
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
.job-title-table {
    .v-table__wrapper > table {
        width: 100%;
    }

    .col-code,
    .col-actions {
        width: 1%;
        white-space: nowrap;
    }

    .col-note {
        width: auto;
        white-space: normal;
        word-break: break-word;
    }
}
</style>
