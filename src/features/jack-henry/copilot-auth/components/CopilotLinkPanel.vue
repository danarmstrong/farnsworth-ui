<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { formatUtcLocal } from '@/utils/helpers/dateTime';
import { useCopilotAuthStore } from '@/features/jack-henry/copilot-auth/stores/copilotAuthStore';

const store = useCopilotAuthStore();
const starting = ref(false);
const completing = ref(false);
const refreshingStatus = ref(false);
const probing = ref(false);
const copiedSnackbar = ref(false);
const copiedSnackbarText = ref('');
const copiedSnackbarColor = ref<'success' | 'error'>('success');

const isBusy = computed(() => starting.value || completing.value || refreshingStatus.value || probing.value || store.loading);
const canCompleteLink = computed(() => (store.deviceStart?.deviceCode?.trim().length ?? 0) > 0);

onMounted(async () => {
    await refreshStatus();
});

function formatDateTime(value: string | null | undefined): string {
    return formatUtcLocal(value) || '—';
}

function linkStatusColor(isLinked: boolean): 'success' | 'warning' {
    return isLinked ? 'success' : 'warning';
}

async function copyToClipboard(value: string, successMessage: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
        copiedSnackbarColor.value = 'error';
        copiedSnackbarText.value = 'Clipboard is not available in this browser';
        copiedSnackbar.value = true;
        return;
    }

    try {
        await navigator.clipboard.writeText(value);
        copiedSnackbarColor.value = 'success';
        copiedSnackbarText.value = successMessage;
        copiedSnackbar.value = true;
    } catch {
        copiedSnackbarColor.value = 'error';
        copiedSnackbarText.value = 'Could not copy to clipboard';
        copiedSnackbar.value = true;
    }
}

function openVerificationPage(): void {
    const verificationUrl = store.deviceStart?.verificationUriComplete || store.deviceStart?.verificationUri;
    if (!verificationUrl) {
        return;
    }

    window.open(verificationUrl, '_blank', 'noopener,noreferrer');
}

async function startLink(): Promise<void> {
    if (isBusy.value) {
        return;
    }

    starting.value = true;
    try {
        await store.startLink();
    } finally {
        starting.value = false;
    }
}

async function completeLink(): Promise<void> {
    const deviceCode = store.deviceStart?.deviceCode?.trim();
    if (isBusy.value || !deviceCode) {
        return;
    }

    completing.value = true;
    try {
        await store.completeLink(deviceCode);
        await store.fetchStatus();
    } finally {
        completing.value = false;
    }
}

async function refreshStatus(): Promise<void> {
    if (isBusy.value) {
        return;
    }

    refreshingStatus.value = true;
    try {
        await store.fetchStatus();
    } finally {
        refreshingStatus.value = false;
    }
}

async function probeReadiness(): Promise<void> {
    if (isBusy.value) {
        return;
    }

    probing.value = true;
    try {
        await store.probe();
        await store.fetchStatus();
    } finally {
        probing.value = false;
    }
}

function resetFlow(): void {
    store.clearError();
    store.clearDeviceStart();
}
</script>

<template>
    <v-row>
        <v-col cols="12" lg="8">
            <v-alert type="info" variant="tonal" class="mb-4">
                Start the device flow, complete verification in GitHub Copilot, then finish linking and run a probe.
            </v-alert>
        </v-col>
        <v-col cols="12" lg="4" class="text-lg-right">
            <div class="d-flex ga-2 justify-lg-end flex-wrap">
                <v-btn color="primary" rounded="pill" :loading="starting" :disabled="isBusy" @click="startLink">Start Link</v-btn>
                <v-btn color="secondary" variant="outlined" rounded="pill" :loading="refreshingStatus" :disabled="isBusy" @click="refreshStatus">
                    Refresh Status
                </v-btn>
            </div>
        </v-col>
    </v-row>

    <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4">{{ store.error }}</v-alert>

    <v-row>
        <v-col cols="12" md="6">
            <v-card elevation="0" variant="outlined" class="h-100">
                <v-card-title class="text-h6">Link Status</v-card-title>
                <v-card-text>
                    <div class="d-flex align-center ga-2 mb-3">
                        <span class="text-subtitle-2">Current status:</span>
                        <v-chip size="small" :color="linkStatusColor(Boolean(store.status?.isLinked))" variant="tonal">
                            {{ store.status?.isLinked ? 'Linked' : 'Not Linked' }}
                        </v-chip>
                    </div>
                    <div class="text-body-2 mb-1"><strong>Linked At:</strong> {{ formatDateTime(store.status?.linkedAtUtc) }}</div>
                    <div class="text-body-2 mb-1"><strong>Linked By:</strong> {{ store.status?.linkedByUserId || '—' }}</div>
                    <div class="text-body-2 mb-1"><strong>Last Probe At:</strong> {{ formatDateTime(store.status?.lastProbeAtUtc) }}</div>
                    <div class="text-body-2 mb-1"><strong>Last Probe OK:</strong> {{ store.status?.lastProbeSucceeded === null || store.status?.lastProbeSucceeded === undefined ? '—' : store.status?.lastProbeSucceeded ? 'Yes' : 'No' }}</div>
                    <div class="text-body-2"><strong>Last Probe Message:</strong> {{ store.status?.lastProbeMessage || '—' }}</div>
                </v-card-text>
            </v-card>
        </v-col>

        <v-col cols="12" md="6">
            <v-card elevation="0" variant="outlined" class="h-100">
                <v-card-title class="text-h6">Probe</v-card-title>
                <v-card-text>
                    <div class="text-body-2 mb-1"><strong>Ready:</strong> {{ store.probeResult ? (store.probeResult.isReady ? 'Yes' : 'No') : '—' }}</div>
                    <div class="text-body-2 mb-1"><strong>Checked At:</strong> {{ formatDateTime(store.probeResult?.checkedAtUtc) }}</div>
                    <div class="text-body-2 mb-1"><strong>Model Count:</strong> {{ store.probeResult?.modelCount ?? '—' }}</div>
                    <div class="text-body-2 mb-4"><strong>Message:</strong> {{ store.probeResult?.message || '—' }}</div>
                    <v-btn color="secondary" rounded="pill" :loading="probing" :disabled="isBusy" @click="probeReadiness">Run Probe</v-btn>
                </v-card-text>
            </v-card>
        </v-col>
    </v-row>

    <v-card elevation="0" variant="outlined" class="mt-4">
        <v-card-title class="text-h6">Device Flow</v-card-title>
        <v-card-text>
            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field
                        :model-value="store.deviceStart?.userCode || ''"
                        label="User Code"
                        readonly
                        variant="outlined"
                        density="compact"
                        hide-details
                    />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        :model-value="store.deviceStart?.verificationUri || ''"
                        label="Verification URL"
                        readonly
                        variant="outlined"
                        density="compact"
                        hide-details
                    />
                </v-col>
            </v-row>

            <div class="text-body-2 mt-3 mb-4">
                Expires in {{ store.deviceStart?.expiresInSeconds ?? '—' }} seconds. Poll interval: {{ store.deviceStart?.pollIntervalSeconds ?? '—' }} seconds.
            </div>

            <div class="d-flex ga-2 flex-wrap">
                <v-btn
                    color="primary"
                    variant="outlined"
                    rounded="pill"
                    :disabled="!store.deviceStart?.verificationUri || isBusy"
                    @click="openVerificationPage"
                >
                    Open Verification Page
                </v-btn>
                <v-btn
                    color="secondary"
                    variant="outlined"
                    rounded="pill"
                    :disabled="!store.deviceStart?.userCode || isBusy"
                    @click="copyToClipboard(store.deviceStart?.userCode || '', 'User code copied')"
                >
                    Copy User Code
                </v-btn>
                <v-btn
                    color="secondary"
                    variant="outlined"
                    rounded="pill"
                    :disabled="!store.deviceStart?.verificationUri || isBusy"
                    @click="copyToClipboard(store.deviceStart?.verificationUri || '', 'Verification URL copied')"
                >
                    Copy Verification URL
                </v-btn>
                <v-btn color="primary" rounded="pill" :loading="completing" :disabled="!canCompleteLink || isBusy" @click="completeLink">Complete Link</v-btn>
                <v-btn color="error" variant="text" :disabled="isBusy" @click="resetFlow">Reset</v-btn>
            </div>
        </v-card-text>
    </v-card>

    <v-snackbar v-model="copiedSnackbar" :timeout="1800" :color="copiedSnackbarColor">
        {{ copiedSnackbarText }}
    </v-snackbar>
</template>

