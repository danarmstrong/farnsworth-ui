<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InfoCircleIcon, XIcon } from 'vue-tabler-icons';
import { useNotificationStore } from '@/features/notifications/stores/notificationStore';

const notifications = useNotificationStore();
const { snackbarOpen, snackbarTitle, snackbarMessage } = storeToRefs(notifications);

function close(): void {
    notifications.closeSnackbar();
}
</script>

<template>
    <v-snackbar rounded="xl" color="primary" class="mt-4" v-model="snackbarOpen" location="top right" elevation="0">
        <div class="d-flex gap-2">
            <InfoCircleIcon size="22" />
            <div class="">
                <h5 class="text-body-1">{{ snackbarTitle }}</h5>
                <p class="text-12">{{ snackbarMessage }}</p>
            </div>
        </div>
        <template v-slot:actions>
            <v-btn variant="text" @click="close"> <XIcon /> </v-btn>
        </template>
    </v-snackbar>
</template>
