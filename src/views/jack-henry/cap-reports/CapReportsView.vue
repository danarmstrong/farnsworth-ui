<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CapProjectReportPanel from '@/features/jack-henry/cap-projects/components/CapProjectReportPanel.vue';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => {
    const raw = route.params.projectId;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }

    return undefined;
});

function goToReportIndex(): void {
    void router.replace('/cap-reports');
}
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <template v-if="projectId">
                <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                    <h5 class="text-h5 font-weight-semibold mb-0">CAP Report</h5>
                    <a href="#" class="text-primary text-body-2 text-decoration-none" @click.prevent="goToReportIndex">
                        Back to CAP reports
                    </a>
                </div>
                <CapProjectReportPanel :project-id="projectId" />
            </template>
            <template v-else>
                <h5 class="text-h5 font-weight-semibold mb-2">CAP Reports</h5>
                <p class="text-body-1 text-medium-emphasis mb-0">Select a CAP report from the sidebar.</p>
            </template>
        </v-card-text>
    </v-card>
</template>

