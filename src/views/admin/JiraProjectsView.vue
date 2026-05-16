<script setup lang="ts">
import JiraProjectTable from '@/features/jack-henry/jira-projects/components/JiraProjectTable.vue';
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <h5 class="text-h5 font-weight-semibold mb-7">Jira Projects</h5>
            <JiraProjectTable />
        </v-card-text>
    </v-card>
</template>
