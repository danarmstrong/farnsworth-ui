<script setup lang="ts">
import { computed } from 'vue';
import { useConfirmDialogStore } from '@/stores/confirmDialog';

const confirmDialogStore = useConfirmDialogStore();

const dialogModel = computed({
    get: () => confirmDialogStore.isOpen,
    set: (value: boolean) => {
        if (!value) {
            confirmDialogStore.cancel();
        }
    }
});
</script>

<template>
    <v-dialog v-model="dialogModel" max-width="440">
        <v-card elevation="10">
            <v-card-text class="py-6 text-subtitle-1">
                {{ confirmDialogStore.message }}
            </v-card-text>
            <v-divider />
            <v-card-actions class="justify-end pa-4">
                <v-btn variant="text" color="secondary" @click="confirmDialogStore.cancel">Cancel</v-btn>
                <v-btn variant="flat" color="primary" @click="confirmDialogStore.confirm">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
