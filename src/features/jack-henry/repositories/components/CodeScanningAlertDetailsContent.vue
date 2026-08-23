<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import { useGithubRepoStore } from '@/features/jack-henry/repositories/stores/githubRepoStore';
import type { GithubRepository } from '@/features/jack-henry/repositories/types/GithubRepository';
import { formatUtcLocal } from '@/utils/helpers/dateTime';
import {
    alertSeverityLabel,
    alertSeverityTone,
    securityAlertStateLabel,
    securityAlertStateTone
} from '@/features/jack-henry/repositories/utils/repositoryStatusPresentation';
import RepositoryStatusChip from '@/features/jack-henry/repositories/components/RepositoryStatusChip.vue';

const route = useRoute();
const store = useGithubRepoStore();
const repository = ref<GithubRepository | null>(null);
const loadError = ref(false);

const repositoryId = computed(() => {
    const raw = route.params.id;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const alertId = computed(() => {
    const raw = route.params.alertId;
    return typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? String(raw[0] ?? '').trim() : '';
});

const alert = computed(() => store.selectedCodeScanningAlert);

const pageTitle = computed(() => {
    if (alert.value?.ruleName) {
        return alert.value.ruleName;
    }
    if (alertId.value) {
        return `Alert ${alertId.value}`;
    }
    return 'Code Scanning Alert';
});

const breadcrumbs = computed(() => [
    { text: 'Repositories', disabled: false, to: '/repositories' },
    {
        text: repository.value?.name || 'Repository',
        disabled: false,
        to: repositoryId.value
            ? { name: 'Repository Detail', params: { id: repositoryId.value }, query: { tab: 'code-scanning-alerts' } }
            : '/repositories'
    },
    { text: pageTitle.value, disabled: true, href: '#' }
]);

watch(
    [repositoryId, alertId],
    async ([nextRepositoryId, nextAlertId]) => {
        loadError.value = false;
        repository.value = null;
        store.clearSelectedCodeScanningAlertError();
        store.clearError();

        if (!nextRepositoryId || !nextAlertId) {
            store.clearSelectedCodeScanningAlert();
            loadError.value = true;
            return;
        }

        repository.value = await store.getGithubRepo(nextRepositoryId);
        const result = await store.getRepositoryCodeScanningAlert(nextRepositoryId, nextAlertId);
        loadError.value = !result;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    store.clearSelectedCodeScanningAlert();
});

function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    return formatUtcLocal(value) || value;
}

function locationLineRange(): string {
    if (!alert.value) {
        return '-';
    }

    const start = alert.value.mostRecentInstanceStartLine;
    const end = alert.value.mostRecentInstanceEndLine;

    if (typeof start !== 'number' && typeof end !== 'number') {
        return '-';
    }

    if (typeof start === 'number' && typeof end === 'number') {
        return start === end ? String(start) : `${start}-${end}`;
    }

    return String(start ?? end);
}
</script>

<template>
    <BaseBreadcrumb :title="pageTitle" :breadcrumbs="breadcrumbs" />

    <v-alert
        v-if="loadError || store.selectedCodeScanningAlertError"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="
            store.clearSelectedCodeScanningAlertError();
            loadError = false;
        "
    >
        {{ store.selectedCodeScanningAlertError || 'Code scanning alert could not be loaded.' }}
    </v-alert>

    <div v-else-if="store.selectedCodeScanningAlertLoading && !alert" class="text-subtitle-1 py-8 text-center">
        Loading code scanning alert...
    </div>

    <template v-else-if="alert">
        <v-card elevation="10">
            <v-card-text class="pa-6 pa-sm-8">
                <div class="d-flex flex-column flex-lg-row justify-space-between align-start gap-4 mb-5">
                    <div class="alert-header-copy">
                        <div class="d-flex flex-wrap align-center gap-2 mb-3">
                            <RepositoryStatusChip :label="alert.ruleName || alert.ruleId || 'Unnamed rule'" color="primary" />
                            <RepositoryStatusChip
                                :label="alertSeverityLabel(alert.securitySeverityLevel || alert.ruleSeverity)"
                                :tone="alertSeverityTone(alert.securitySeverityLevel || alert.ruleSeverity)"
                            />
                            <RepositoryStatusChip :label="securityAlertStateLabel(alert.state)" :tone="securityAlertStateTone(alert.state)" />
                        </div>

                        <h1 class="text-h4 font-weight-bold mb-2 alert-title">{{ alert.ruleDescription || 'No rule description provided.' }}</h1>
                        <p class="text-body-1 text-medium-emphasis mb-0">{{ alert.repositoryOwner }}/{{ alert.repositoryName }}</p>
                    </div>

                    <div class="d-flex flex-wrap gap-3 justify-start justify-lg-end">
                        <v-btn
                            :to="{ name: 'Repository Detail', params: { id: repositoryId }, query: { tab: 'code-scanning-alerts' } }"
                            variant="outlined"
                            color="primary"
                        >
                            Back to code scanning alerts
                        </v-btn>
                    </div>
                </div>

                <v-divider class="mb-5"></v-divider>

                <v-row>
                    <v-col cols="12" md="8">
                        <section class="mb-6">
                            <h2 class="text-h6 font-weight-semibold mb-3">Most Recent Instance</h2>
                            <div class="alert-description">
                                {{ alert.mostRecentInstanceMessage?.trim() ? alert.mostRecentInstanceMessage : 'No instance message provided.' }}
                            </div>
                        </section>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card variant="outlined" class="mb-4">
                            <v-card-text>
                                <h2 class="text-h6 font-weight-semibold mb-4">Details</h2>
                                <dl class="alert-detail-list">
                                    <div>
                                        <dt>Tool</dt>
                                        <dd>{{ alert.toolName || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Rule ID</dt>
                                        <dd>{{ alert.ruleId || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Path</dt>
                                        <dd>{{ alert.mostRecentInstancePath || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Line(s)</dt>
                                        <dd>{{ locationLineRange() }}</dd>
                                    </div>
                                    <div>
                                        <dt>Category</dt>
                                        <dd>{{ alert.mostRecentInstanceCategory || '-' }}</dd>
                                    </div>
                                    <div>
                                        <dt>Instance State</dt>
                                        <dd>{{ alert.mostRecentInstanceState || '-' }}</dd>
                                    </div>
                                </dl>
                            </v-card-text>
                        </v-card>

                        <v-card variant="outlined">
                            <v-card-text>
                                <h2 class="text-h6 font-weight-semibold mb-4">Timeline & IDs</h2>
                                <dl class="alert-detail-list alert-detail-list--compact">
                                    <div>
                                        <dt>Internal ID</dt>
                                        <dd>{{ alert.id }}</dd>
                                    </div>
                                    <div>
                                        <dt>External ID</dt>
                                        <dd>{{ alert.externalId }}</dd>
                                    </div>
                                    <div>
                                        <dt>Created</dt>
                                        <dd>{{ formatDate(alert.createdAtUtc) }}</dd>
                                    </div>
                                    <div>
                                        <dt>Dismissed</dt>
                                        <dd>{{ formatDate(alert.dismissedAtUtc) }}</dd>
                                    </div>
                                    <div>
                                        <dt>Fixed</dt>
                                        <dd>{{ formatDate(alert.fixedAtUtc) }}</dd>
                                    </div>
                                    <div>
                                        <dt>Synced</dt>
                                        <dd>{{ formatDate(alert.syncedAtUtc) }}</dd>
                                    </div>
                                </dl>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </template>
</template>

<style lang="scss">
.alert-header-copy {
    min-width: 0;
}

.alert-title,
.alert-description {
    word-break: break-word;
}

.alert-description {
    white-space: pre-wrap;
    padding: 1rem 1.125rem;
    border: 1px solid rgb(var(--v-theme-borderColor));
    border-radius: 12px;
    background: rgba(var(--v-theme-surface), 0.5);
    line-height: 1.7;
}

.alert-detail-list {
    display: grid;
    gap: 1rem;

    div {
        display: grid;
        gap: 0.35rem;
    }

    dt {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(var(--v-theme-on-surface), 0.65);
    }

    dd {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.5;
        word-break: break-word;
    }
}

.alert-detail-list--compact {
    gap: 0.9rem;
}
</style>


