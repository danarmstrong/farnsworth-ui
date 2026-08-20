import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { NotificationDto } from '@/features/notifications/types/Notification';
import { listNotifications, markNotificationRead } from '@/features/notifications/services/notificationApi';
import { notificationHub } from '@/features/notifications/services/notificationHub';
import { parseUtcDateMillis } from '@/utils/helpers/dateTime';

function sortNewestFirst(list: NotificationDto[]): NotificationDto[] {
    return [...list].sort((a, b) => parseUtcDateMillis(b.createdAtUtc) - parseUtcDateMillis(a.createdAtUtc));
}

export const useNotificationStore = defineStore('notifications', () => {
    const items = ref<NotificationDto[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const snackbarOpen = ref(false);
    const snackbarTitle = ref('');
    const snackbarMessage = ref('');

    let hubUnsubscribe: (() => void) | null = null;

    const unreadCount = computed(() => items.value.filter((i) => i.isUnread && !i.isDismissed).length);

    function upsert(dto: NotificationDto): void {
        const idx = items.value.findIndex((x) => x.id === dto.id);
        const next = [...items.value];
        if (idx >= 0) {
            next[idx] = dto;
        } else {
            next.unshift(dto);
        }
        items.value = sortNewestFirst(next);
    }

    function pushToast(title: string, message: string): void {
        snackbarTitle.value = title;
        snackbarMessage.value = message;
        snackbarOpen.value = true;
    }

    async function fetchNotifications(): Promise<void> {
        loading.value = true;
        error.value = null;
        try {
            const list = await listNotifications({ includeDismissed: false });
            items.value = sortNewestFirst(list);
        } catch (e: unknown) {
            const msg = typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e);
            error.value = msg;
        } finally {
            loading.value = false;
        }
    }

    async function bootstrap(): Promise<void> {
        const token = sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken');
        if (!token) {
            return;
        }

        await fetchNotifications();

        if (hubUnsubscribe) {
            hubUnsubscribe();
            hubUnsubscribe = null;
        }

        hubUnsubscribe = notificationHub.onNotification((dto) => {
            upsert(dto);
            pushToast(dto.title, dto.message);
        });

        try {
            await notificationHub.connect();
        } catch {
            // REST list still works without SignalR
        }
    }

    async function reset(): Promise<void> {
        if (hubUnsubscribe) {
            hubUnsubscribe();
            hubUnsubscribe = null;
        }
        await notificationHub.disconnect();
        items.value = [];
        snackbarOpen.value = false;
        snackbarTitle.value = '';
        snackbarMessage.value = '';
        error.value = null;
    }

    function closeSnackbar(): void {
        snackbarOpen.value = false;
    }

    function patchLocalReadState(id: string): void {
        const idx = items.value.findIndex((x) => x.id === id);
        if (idx < 0) {
            return;
        }
        const prev = items.value[idx];
        if (!prev) {
            return;
        }
        const next = [...items.value];
        next[idx] = {
            ...prev,
            isUnread: false,
            readAtUtc: new Date().toISOString()
        };
        items.value = next;
    }

    async function markRead(id: string): Promise<void> {
        try {
            await markNotificationRead(id);
            patchLocalReadState(id);
        } catch {
            await fetchNotifications();
        }
    }

    return {
        items,
        loading,
        error,
        snackbarOpen,
        snackbarTitle,
        snackbarMessage,
        unreadCount,
        fetchNotifications,
        markRead,
        bootstrap,
        reset,
        closeSnackbar
    };
});
