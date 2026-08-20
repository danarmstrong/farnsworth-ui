<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import JiraProjectIssuesTable from '@/features/jack-henry/jira-projects/components/JiraProjectIssuesTable.vue';

const route = useRoute();
const router = useRouter();

const projectKey = computed(() => {
    const raw = route.params.projectKey;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
    }

    return '';
});

function goBackToProjects(): void {
    void router.push('/configuration/jira-projects');
}
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <template v-if="projectKey">
                <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
                    <div>
                        <h5 class="text-h5 font-weight-semibold mb-1">Jira Project Issues</h5>
                        <p class="text-body-1 text-medium-emphasis mb-0">Project: {{ projectKey }}</p>
                    </div>
                    <a href="#" class="text-primary text-body-2 text-decoration-none" @click.prevent="goBackToProjects">
                        Back to Jira projects
                    </a>
                </div>

                <JiraProjectIssuesTable :project-key="projectKey" />
            </template>

            <template v-else>
                <h5 class="text-h5 font-weight-semibold mb-2">Jira Project Issues</h5>
                <p class="text-body-1 text-medium-emphasis mb-0">Select a Jira project from the table to view details.</p>
            </template>
        </v-card-text>
    </v-card>
</template>

