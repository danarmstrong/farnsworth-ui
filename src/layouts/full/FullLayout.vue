<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { RouterView } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import NotificationSnackbar from '@/components/dashboards/snackbar.vue';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useNotificationStore } from '@/features/notifications/stores/notificationStore';

const ui = useUiStore();
const auth = useAuthStore();
const notifications = useNotificationStore();

onMounted(() => {
    if (auth.accessToken) {
        void notifications.bootstrap();
    }
});

watch(
    () => auth.accessToken,
    async (token) => {
        if (token) {
            await notifications.bootstrap();
        } else {
            await notifications.reset();
        }
    }
);
</script>

<template>
    <v-app
        :theme="ui.actTheme"
        :class="[ui.actTheme, ui.mini_sidebar ? 'mini-sidebar' : '', 'verticalLayout', ui.setBorderCard ? 'cardBordered' : '']"
    >
        <VerticalSidebarVue />
        <div :class="ui.boxed ? 'maxWidth' : 'full-header'">
            <VerticalHeaderVue />
        </div>

        <v-main>
            <div class="mb-3 hr-layout">
                <v-container fluid class="page-wrapper px-sm-5 px-4 pt-12 rounded-xl">
                    <div class="">
                        <div :class="ui.boxed ? 'maxWidth' : ''">
                            <RouterView />
                        </div>
                    </div>
                </v-container>
            </div>
        </v-main>
        <ConfirmDialog />
        <NotificationSnackbar />
    </v-app>
</template>
