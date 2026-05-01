<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePayGradeStore } from '@/features/jack-henry/pay-grades/stores/payGradeStore';
import PayGradeForm from '@/features/jack-henry/pay-grades/components/PayGradeForm.vue';
import type { PayGrade } from '@/features/jack-henry/pay-grades/types/PayGrade';
import { useConfirm } from '@/utils/helpers/useConfirm';

type PayGradeFormSubmitPayload = {
    id?: string;
    grade: string;
    note: string | null;
};

const store = usePayGradeStore();
const confirm = useConfirm();

onMounted(() => {
    store.fetchPayGrades();
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const payGradeFormRef = ref<InstanceType<typeof PayGradeForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

//Methods
const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase();
    return store.payGrades.filter((payGrade: PayGrade) => {
        return payGrade.grade.toLowerCase().includes(normalizedSearch) || payGrade.note?.toLowerCase().includes(normalizedSearch);
    });
});

function editItem(item: PayGrade) {
    payGradeFormRef.value?.openEdit(item);
}
async function deleteItem(item: PayGrade) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deletePayGrade(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: PayGradeFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updatePayGrade(payload.id, {
                grade: payload.grade,
                note: payload.note
            });
        } else {
            await store.createPayGrade({
                grade: payload.grade,
                note: payload.note
            });
        }

        if (!store.error) {
            payGradeFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search Pay Grades" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <PayGradeForm
                ref="payGradeFormRef"
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
            <v-table class="mt-5 pay-grade-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Grade</th>
                        <th class="text-subtitle-1 font-weight-semibold col-note">Note</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.payGrades.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">Loading pay grades...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">No pay grades found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ item.grade }}</td>
                        <td class="text-subtitle-1 col-note">{{ item.note || '-' }}</td>
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
.pay-grade-table {
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
