<script setup lang="ts">
import { RouterView } from 'vue-router';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
</script>
// ===============================|| Blank Layout ||=============================== //
<template>
    <v-app class="authpage" :theme="ui.actTheme">
        <RouterView />
        <ConfirmDialog />
    </v-app>
</template>
