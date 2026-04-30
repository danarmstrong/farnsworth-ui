<script setup lang="ts">
import { ref } from 'vue';
import StaffListTable from '@/views/jack-henry/staff/StaffListTable.vue';
// theme breadcrumb
const page = ref({ title: 'Staff Members' });
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <h5 class="text-h5 font-weight-semibold mb-7">Staff Members</h5>
            <StaffListTable />
        </v-card-text>
    </v-card>
</template>
