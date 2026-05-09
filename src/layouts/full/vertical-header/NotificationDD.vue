<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@iconify/vue';
import { useNotificationStore } from '@/features/notifications/stores/notificationStore';
import { getNotificationHref } from '@/features/notifications/notificationCategoryRoutes';
import type { NotificationDto } from '@/features/notifications/types/Notification';

const router = useRouter();
const notifications = useNotificationStore();
const { items, unreadCount, loading } = storeToRefs(notifications);

const menuOpen = ref(false);

const visibleItems = computed(() => items.value.filter((i) => !i.isDismissed));

function relativeTime(iso: string): string {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
        return '';
    }
}

async function onNotificationClick(item: NotificationDto): Promise<void> {
    await notifications.markRead(item.id);
    const href = getNotificationHref(item);
    menuOpen.value = false;
    if (href) {
        console.log(href);
        await router.push(href);
    }
}
</script>
<template>
    <!-- ---------------------------------------------- -->
    <!-- notifications DD -->
    <!-- ---------------------------------------------- -->
    <v-menu v-model="menuOpen" :close-on-content-click="false" class="notification_popup">
        <template v-slot:activator="{ props }">
            <v-btn icon flat v-bind="props" size="small" class="custom-hover-primary">
                <div class="position-relative">
                    <div class="notify">
                        <template v-if="unreadCount > 0">
                            <span class="heartbeat"></span>
                            <span class="point"></span>
                        </template>
                    </div>
                    <Icon icon="solar:bell-bing-line-duotone" height="24" width="24" />
                </div>
            </v-btn>
        </template>
        <v-sheet rounded="lg" width="385" elevation="10" class="mt-5 dropdown-box">
            <div class="px-8 pb-4 pt-6">
                <div class="d-flex align-center">
                    <h6 class="text-h5 font-weight-semibold">Notifications</h6>
                    <v-chip
                        v-if="unreadCount > 0"
                        color="primary"
                        variant="flat"
                        size="x-small"
                        class="text-white ml-4"
                        rounded="xl"
                    >
                        {{ unreadCount }} New
                    </v-chip>
                </div>
            </div>
            <perfect-scrollbar style="height: 300px">
                <div v-if="loading" class="px-8 py-6 text-subtitle-2 text-grey100">Loading…</div>
                <div v-else-if="visibleItems.length === 0" class="px-8 py-6 text-subtitle-2 text-grey100">No notifications</div>
                <v-list v-else class="py-0 theme-list" lines="two">
                    <template v-for="(item, index) in visibleItems" :key="item.id">
                        <v-list-item
                            :value="item"
                            color="primary"
                            class="py-4 px-8 cursor-pointer"
                            @click="onNotificationClick(item)"
                        >
                            <template v-slot:prepend>
                                <v-avatar size="48" rounded="md" color="lightprimary">
                                    <Icon icon="solar:bell-bing-bold-duotone" height="26" width="26" class="text-primary" />
                                </v-avatar>
                            </template>
                            <div class="d-flex align-center flex-wrap ga-2 mb-1">
                                <h6 class="text-h6 font-weight-medium">{{ item.title }}</h6>
                                <v-chip v-if="item.category" size="x-small" variant="tonal" color="secondary" rounded="sm">
                                    {{ item.category }}
                                </v-chip>
                                <span v-if="item.isUnread" class="text-caption text-primary font-weight-medium">Unread</span>
                            </div>
                            <p class="text-subtitle-1 font-weight-medium text-grey100 mb-1">{{ item.message }}</p>
                            <p class="text-caption text-medium-emphasis">{{ relativeTime(item.createdAtUtc) }}</p>
                        </v-list-item>
                        <v-divider v-if="index < visibleItems.length - 1" />
                    </template>
                </v-list>
            </perfect-scrollbar>
            <div class="py-4 px-6 text-center">
                <v-btn color="primary" size="large" rounded="pill" block to="/pages/account-settings">Notification settings</v-btn>
            </div>
        </v-sheet>
    </v-menu>
</template>
