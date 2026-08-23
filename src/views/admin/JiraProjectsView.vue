<script setup lang="ts">
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import JiraProjectTable from '@/features/jack-henry/jira-projects/components/JiraProjectTable.vue';
</script>

<template>
    <JackHenryPageCard title="Jira Projects">
        <JiraProjectTable />
    </JackHenryPageCard>
</template>
