<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import RepositoryPullRequestTable from '@/features/jack-henry/repositories/components/RepositoryPullRequestTable.vue';
import RepositoryDependabotAlertTable from '@/features/jack-henry/repositories/components/RepositoryDependabotAlertTable.vue';
import RepositoryCodeScanningAlertTable from '@/features/jack-henry/repositories/components/RepositoryCodeScanningAlertTable.vue';
import { useGithubRepoStore } from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type { GithubRepository } from '@/features/jack-henry/repositories/types/GithubRepository';
import { formatUtcLocal } from '@/utils/helpers/dateTime';

const route = useRoute();
const router = useRouter();
const store = useGithubRepoStore();

type RepositoryDetailsTab = 'pull-requests' | 'dependabot-alerts' | 'code-scanning-alerts';

const TAB_LABELS: Record<RepositoryDetailsTab, string> = {
    'pull-requests': 'Pull Requests',
    'dependabot-alerts': 'Dependabot Alerts',
    'code-scanning-alerts': 'Code Scanning Alerts'
};
const DEFAULT_TAB: RepositoryDetailsTab = 'pull-requests';
const TAB_ORDER: RepositoryDetailsTab[] = ['pull-requests', 'dependabot-alerts', 'code-scanning-alerts'];

const repository = ref<GithubRepository | null>(null);
const loadError = ref(false);
const activeTab = ref<RepositoryDetailsTab>(DEFAULT_TAB);

const repositoryId = computed(() => {
    const raw = route.params.id;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const pageTitle = computed(() => {
    if (repository.value?.name) {
        return repository.value.name;
    }

    return 'Repository';
});

const breadcrumbs = computed(() => [
    { text: 'Repositories', disabled: false, to: '/configuration/repositories' },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

watch(
    () => route.query.tab,
    (rawTab) => {
        const normalizedTab = typeof rawTab === 'string' ? rawTab.trim() : Array.isArray(rawTab) ? String(rawTab[0] ?? '').trim() : '';

        if (normalizedTab === 'pull-requests' || normalizedTab === 'dependabot-alerts' || normalizedTab === 'code-scanning-alerts') {
            activeTab.value = normalizedTab;
            return;
        }

        activeTab.value = DEFAULT_TAB;
        void router.replace({ query: { ...route.query, tab: DEFAULT_TAB } });
    },
    { immediate: true }
);

watch(activeTab, (nextTab) => {
    if (route.query.tab === nextTab) {
        return;
    }

    void router.replace({ query: { ...route.query, tab: nextTab } });
});

watch(
    repositoryId,
    async (id) => {
        loadError.value = false;
        repository.value = null;
        store.clearError();

        if (!id) {
            loadError.value = true;
            return;
        }

        const result = await store.getGithubRepo(id);
        if (result) {
            repository.value = result;
            return;
        }

        loadError.value = true;
    },
    { immediate: true }
);

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return formatUtcLocal(value) || value;
}
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || store.error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            store.clearError();
            loadError = false;
        "
    >
        {{ store.error || 'Repository could not be loaded.' }}
    </v-alert>

    <div v-else-if="store.loading && !repository" class="text-subtitle-1 py-8 text-center">Loading repository...</div>

    <template v-else-if="repository">
        <v-row>
            <v-col cols="12">
                <v-card elevation="10" class="mb-6">
                    <v-card-text class="pa-6 pa-sm-8">
                        <div class="d-flex flex-column flex-lg-row justify-space-between align-start gap-4 mb-5">
                            <div class="repository-header-copy">
                                <div class="d-flex flex-wrap align-center gap-2 mb-3">
                                    <v-chip size="small" :color="repository.isWatched ? 'success' : 'default'" variant="tonal">
                                        {{ repository.isWatched ? 'Watched' : 'Not Watched' }}
                                    </v-chip>
                                    <v-chip size="small" :color="repository.isPersonal ? 'success' : 'default'" variant="tonal">
                                        {{ repository.isPersonal ? 'Personal' : 'Shared' }}
                                    </v-chip>
                                    <v-chip size="small" :color="repository.isCloned ? 'success' : 'default'" variant="tonal">
                                        {{ repository.isCloned ? 'Cloned' : 'Not Cloned' }}
                                    </v-chip>
                                </div>

                                <h1 class="text-h4 font-weight-bold mb-2 repository-title">{{ repository.name }}</h1>
                                <p class="text-body-1 text-medium-emphasis mb-0">{{ repository.url }}</p>
                            </div>

                            <div class="d-flex flex-wrap gap-3 justify-start justify-lg-end">
                                <v-btn :to="{ name: 'Repositories' }" variant="outlined" color="primary">Back to repositories</v-btn>
                                <v-btn :href="repository.url" target="_blank" rel="noopener noreferrer" color="primary"
                                    >Open on GitHub</v-btn
                                >
                            </div>
                        </div>

                        <v-divider class="mb-5"></v-divider>

                        <v-row>
                            <v-col cols="12" md="4">
                                <div class="text-caption text-medium-emphasis mb-1">Repository ID</div>
                                <div class="text-subtitle-1 font-weight-medium">{{ repository.id }}</div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="text-caption text-medium-emphasis mb-1">Last Synced</div>
                                <div class="text-subtitle-1 font-weight-medium">{{ formatDate(repository.lastSynced) }}</div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="text-caption text-medium-emphasis mb-1">Last Pulled</div>
                                <div class="text-subtitle-1 font-weight-medium">{{ formatDate(repository.lastPulled) }}</div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-card elevation="10">
            <v-card-text>
                <v-tabs v-model="activeTab" color="primary" bg-color="transparent" class="mb-2" grow>
                    <v-tab v-for="tab in TAB_ORDER" :key="tab" :value="tab">
                        {{ TAB_LABELS[tab] }}
                    </v-tab>
                </v-tabs>

                <v-window v-model="activeTab">
                    <v-window-item value="pull-requests">
                        <RepositoryPullRequestTable :repository-id="repository.id" />
                    </v-window-item>
                    <v-window-item value="dependabot-alerts">
                        <RepositoryDependabotAlertTable :repository-id="repository.id" />
                    </v-window-item>
                    <v-window-item value="code-scanning-alerts">
                        <RepositoryCodeScanningAlertTable :repository-id="repository.id" />
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </template>
</template>

<style lang="scss">
.repository-header-copy {
    min-width: 0;
}

.repository-title {
    word-break: break-word;
}
</style>

