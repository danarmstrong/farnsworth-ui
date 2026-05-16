<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { useCapProjectStore } from '@/features/jack-henry/cap-projects/stores/capProjectStore';
import {
    CONFIGURATION_BASE,
    configurationSectionLinks
} from '@/views/configuration/configurationNavItems';

const route = useRoute();
const capProjectStore = useCapProjectStore();

const capProjectsPath = `${CONFIGURATION_BASE}/cap-projects`;

onMounted(() => {
    void capProjectStore.fetchCapProjects();
});

function isExactPathActive(path: string): boolean {
    return route.path === path;
}

function isCapProjectsTableActive(): boolean {
    return route.path === capProjectsPath && !route.query.projectId;
}

function isCapProjectReportActive(projectId: string): boolean {
    const q = route.query.projectId;
    return route.path === capProjectsPath && typeof q === 'string' && q === projectId;
}

const capProjectLinks = computed(() =>
    capProjectStore.capProjects.map((p) => ({
        title: p.projectName,
        to: {
            path: capProjectsPath,
            query: { projectId: p.id }
        }
    }))
);
</script>

<template>
    <v-row class="configuration-layout flex-grow-1" align="stretch">
        <v-col cols="12" md="3" lg="2" class="d-flex">
            <v-card class="flex-grow-1 flex-shrink-0" elevation="10" min-width="200">
                <v-list density="compact" nav class="py-3">
                    <template v-for="link in configurationSectionLinks" :key="link.to">
                        <v-list-item
                            v-if="link.to === capProjectsPath"
                            :to="{ path: capProjectsPath, query: {} }"
                            :active="isCapProjectsTableActive()"
                            active-color="primary"
                            rounded="lg"
                            class="mb-1"
                        >
                            <v-list-item-title>{{ link.title }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item
                            v-else
                            :to="link.to"
                            :active="isExactPathActive(link.to)"
                            active-color="primary"
                            rounded="lg"
                            class="mb-1"
                        >
                            <v-list-item-title>{{ link.title }}</v-list-item-title>
                        </v-list-item>
                    </template>

                    <v-divider class="my-2" />

                    <v-list-subheader class="text-uppercase text-caption font-weight-semibold">
                        CAP reports
                    </v-list-subheader>

                    <v-list-item
                        v-for="row in capProjectLinks"
                        :key="String(row.to.query?.projectId ?? row.title)"
                        :to="row.to"
                        :active="isCapProjectReportActive(String(row.to.query?.projectId ?? ''))"
                        active-color="primary"
                        rounded="lg"
                        class="mb-1"
                    >
                        <v-list-item-title class="text-body-2 text-truncate">{{ row.title }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-col>
        <v-col cols="12" md="9" lg="10" class="min-height-0">
            <RouterView />
        </v-col>
    </v-row>
</template>

<style scoped>
.configuration-layout {
    min-height: calc(100vh - 180px);
}

.min-height-0 {
    min-height: 0;
}
</style>
