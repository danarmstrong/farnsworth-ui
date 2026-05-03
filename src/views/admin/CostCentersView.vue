<script setup lang="ts">
import CostCenterTable from '@/features/jack-henry/cost-centers/components/CostCenterTable.vue';
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <h5 class="text-h5 font-weight-semibold mb-7">Cost Centers</h5>
            <CostCenterTable />
        </v-card-text>
    </v-card>
</template>
