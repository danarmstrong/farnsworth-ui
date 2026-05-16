<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CapProjectTable from '@/features/jack-henry/cap-projects/components/CapProjectTable.vue';
import CapProjectReportPanel from '@/features/jack-henry/cap-projects/components/CapProjectReportPanel.vue';

const route = useRoute();
const router = useRouter();

const projectId = computed(() => {
    const raw = route.query.projectId;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }
    return undefined;
});

function goToCapProjectsList(): void {
    void router.replace({ path: '/configuration/cap-projects', query: {} });
}
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <template v-if="projectId">
                <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                    <h5 class="text-h5 font-weight-semibold mb-0">CAP Report</h5>
                    <a href="#" class="text-primary text-body-2 text-decoration-none" @click.prevent="goToCapProjectsList">Back to all CAP projects</a>
                </div>
                <CapProjectReportPanel :project-id="projectId" />
            </template>
            <template v-else>
                <h5 class="text-h5 font-weight-semibold mb-7">CAP Projects</h5>
                <CapProjectTable />
            </template>
        </v-card-text>
    </v-card>
</template>
