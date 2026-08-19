<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { JOB_TITLES_DEFAULT_PAGE_SIZE, useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import JobTitleForm from '@/features/jack-henry/job-titles/components/JobTitleForm.vue';
import { usePayGradeStore } from '@/features/jack-henry/pay-grades/stores/payGradeStore';
import { useJobFamilyStore } from '@/features/jack-henry/job-families/stores/jobFamilyStore';
import type { ExemptionStatus, JobTitle } from '@/features/jack-henry/job-titles/types/JobTitle';
import { useConfirm } from '@/utils/helpers/useConfirm';
import { PencilIcon, TrashIcon } from 'vue-tabler-icons';

const PencilIconComponent = PencilIcon;
const TrashIconComponent = TrashIcon;

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
const pageSizeOptions = [10, 25, 50];

onMounted(() => {
    void loadPage(1);
    if (!payGradeStore.payGrades.length) {
        void payGradeStore.fetchPayGrades();
    }
    if (!jobFamilyStore.jobFamilies.length) {
        void jobFamilyStore.fetchJobFamilies();
    }
});

const search = ref('');
const page = ref(1);
const pageSize = ref(JOB_TITLES_DEFAULT_PAGE_SIZE);
const saving = ref(false);
const deleting = ref(false);
const jobTitleFormRef = ref<InstanceType<typeof JobTitleForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);
const hasPagination = computed(() => store.totalPages > 1);

//Methods
const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase();
    return store.pagedJobTitles.filter((jobTitle: JobTitle) => {
        return jobTitle.title.toLowerCase().includes(normalizedSearch) || jobTitle.longTitle.toLowerCase().includes(normalizedSearch);
    });
});

const pageSummary = computed(() => {
    if (!store.totalCount) {
        return 'No job titles found.';
    }

    if (search.value.trim()) {
        const count = filteredList.value.length;
        return count === 1 ? 'Showing 1 matching entry on this page' : `Showing ${count} matching entries on this page`;
    }

    const start = (page.value - 1) * pageSize.value + 1;
    const end = Math.min(page.value * pageSize.value, store.totalCount);
    return `Showing ${start} to ${end} of ${store.totalCount} entries`;
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

async function loadPage(targetPage: number): Promise<void> {
    page.value = Math.max(1, targetPage);
    await store.fetchJobTitles({
        page: page.value,
        pageSize: pageSize.value
    });
}

async function changePage(nextPage: number): Promise<void> {
    if (nextPage === page.value) {
        return;
    }

    await loadPage(nextPage);
}

async function changePageSize(nextPageSize: number): Promise<void> {
    pageSize.value = nextPageSize;
    await loadPage(1);
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
        const shouldStepBack = page.value > 1 && page.value === store.totalPages && store.pagedJobTitles.length === 1;
        await store.deleteJobTitle(item.id);
        if (!store.error) {
            await loadPage(shouldStepBack ? page.value - 1 : page.value);
        }
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
            await loadPage(page.value);
            jobTitleFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="clearStoreError">
        {{ store.error }}
    </v-alert>

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
                    <tr v-if="store.loading && !store.pagedJobTitles.length">
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
                                            <component :is="PencilIconComponent" stroke-width="1.5" size="20" class="text-primary" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                                <v-tooltip text="Delete">
                                    <template v-slot:activator="{ props }">
                                        <v-btn icon flat :disabled="isBusy" @click="deleteItem(item)" v-bind="props">
                                            <component :is="TrashIconComponent" stroke-width="1.5" size="20" class="text-error" />
                                        </v-btn>
                                    </template>
                                </v-tooltip>
                            </div>
                        </td>
                    </tr>
                </tbody>
        </v-table>
    </div>

    <v-divider class="my-4"></v-divider>

    <div class="d-sm-flex justify-space-between align-center gap-4">
        <div class="text-subtitle-1 text-grey100">{{ pageSummary }}</div>

        <div class="d-flex align-center flex-wrap justify-end gap-3">
            <v-select
                :model-value="pageSize"
                :items="pageSizeOptions"
                label="Rows per page"
                density="compact"
                hide-details
                variant="outlined"
                class="job-title-page-size"
                :disabled="isBusy"
                @update:modelValue="changePageSize"
            ></v-select>

            <v-pagination
                v-if="hasPagination"
                :model-value="page"
                :length="store.totalPages"
                :total-visible="7"
                rounded="circle"
                density="compact"
                class="text-subtitle-1 text-grey100"
                :disabled="isBusy"
                @update:modelValue="changePage"
            ></v-pagination>
        </div>
    </div>
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

.job-title-page-size {
    max-width: 160px;
}
</style>
