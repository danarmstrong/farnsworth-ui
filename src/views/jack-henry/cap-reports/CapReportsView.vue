<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import CapProjectReportPanel from '@/features/jack-henry/cap-projects/components/CapProjectReportPanel.vue';

const route = useRoute();

const projectId = computed(() => {
    const raw = route.params.projectId;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }

    return undefined;
});

</script>

<template>
    <JackHenryPageCard title="CAP Reports">
        <template #header v-if="projectId">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                <h5 class="text-h5 font-weight-semibold mb-0">CAP Report</h5>
                <v-btn variant="outlined" color="primary" :to="{ name: 'CAP Reports' }">Back to CAP reports</v-btn>
            </div>
        </template>

        <template v-if="projectId">
            <CapProjectReportPanel :project-id="projectId" />
        </template>
        <template v-else>
            <h5 class="text-h5 font-weight-semibold mb-2">CAP Reports</h5>
            <p class="text-body-1 text-medium-emphasis mb-0">Select a CAP report from the sidebar.</p>
        </template>
    </JackHenryPageCard>
</template>



