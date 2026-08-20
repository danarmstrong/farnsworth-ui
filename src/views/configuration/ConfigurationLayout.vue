<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { configurationSectionLinks } from '@/views/configuration/configurationNavItems';

const route = useRoute();

function isExactPathActive(path: string): boolean {
    return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
    <v-row class="configuration-layout flex-grow-1" align="stretch">
        <v-col cols="12" md="3" lg="2" class="d-flex">
            <v-card class="flex-grow-1 flex-shrink-0" elevation="10" min-width="200">
                <v-list density="compact" nav class="py-3">
                    <template v-for="link in configurationSectionLinks" :key="link.to">
                        <v-list-item :to="link.to" :active="isExactPathActive(link.to)" active-color="primary" rounded="lg" class="mb-1">
                            <v-list-item-title>{{ link.title }}</v-list-item-title>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card>
        </v-col>
        <v-col cols="12" md="9" lg="10" class="min-height-0">
            <RouterView />
        </v-col>
    </v-row>
</template>

