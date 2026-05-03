<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCostCenterStore } from '@/features/jack-henry/cost-centers/stores/costCenterStore';
import CostCenterForm from '@/features/jack-henry/cost-centers/components/CostCenterForm.vue';
import type { CostCenter } from '@/features/jack-henry/cost-centers/types/CostCenter';
import { useConfirm } from '@/utils/helpers/useConfirm';

type CostCenterFormSubmitPayload = {
    id?: string;
    departmentNumber: string;
    name: string;
};

const store = useCostCenterStore();
const confirm = useConfirm();

onMounted(() => {
    store.fetchCostCenters();
});

const search = ref('');
const saving = ref(false);
const deleting = ref(false);
const costCenterFormRef = ref<InstanceType<typeof CostCenterForm> | null>(null);
const isBusy = computed(() => saving.value || deleting.value || store.loading);

//Methods
const filteredList = computed(() => {
    const normalizedSearch = search.value.toLowerCase();
    return store.costCenters.filter((costCenter: CostCenter) => {
        return costCenter.departmentNumber.toLowerCase().includes(normalizedSearch) || costCenter.name.toLowerCase().includes(normalizedSearch);
    });
});

function editItem(item: CostCenter) {
    costCenterFormRef.value?.openEdit(item);
}
async function deleteItem(item: CostCenter) {
    if (isBusy.value || !item.id) {
        return;
    }

    const isConfirmed = await confirm('Are you sure you want to delete this item?');
    if (!isConfirmed) {
        return;
    }

    deleting.value = true;
    try {
        await store.deleteCostCenter(item.id);
    } finally {
        deleting.value = false;
    }
}

function clearStoreError() {
    store.clearError();
}

async function save(payload: CostCenterFormSubmitPayload) {
    saving.value = true;
    try {
        if (payload.id) {
            await store.updateCostCenter(payload.id, {
                departmentNumber: payload.departmentNumber,
                name: payload.name
            });
        } else {
            await store.createCostCenter({
                departmentNumber: payload.departmentNumber,
                name: payload.name
            });
        }

        if (!store.error) {
            costCenterFormRef.value?.close();
        }
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="4" md="6">
            <v-text-field density="compact" v-model="search" label="Search Cost Centers" hide-details variant="outlined"></v-text-field>
        </v-col>
        <v-col cols="12" lg="8" md="6" class="text-right">
            <CostCenterForm
                ref="costCenterFormRef"
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
            <v-table class="mt-5 cost-center-table">
                <thead>
                    <tr>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap col-code">Department Number</th>
                        <th class="text-subtitle-1 font-weight-semibold col-note">Department Name</th>
                        <th class="text-subtitle-1 font-weight-semibold text-no-wrap text-right col-actions">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="store.loading && !store.costCenters.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">Loading cost centers...</td>
                    </tr>
                    <tr v-else-if="!filteredList.length">
                        <td colspan="3" class="text-subtitle-1 text-center py-6">No cost centers found.</td>
                    </tr>
                    <tr v-else v-for="item in filteredList" :key="item.id">
                        <td class="text-subtitle-1 text-no-wrap col-code">{{ item.departmentNumber }}</td>
                        <td class="text-subtitle-1 col-note">{{ item.name }}</td>
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
.cost-center-table {
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
