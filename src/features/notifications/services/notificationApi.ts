import axios from '@/utils/axios';
import type { NotificationDto } from '@/features/notifications/types/Notification';

const NOTIFICATIONS_PATH = '/notifications';

export interface ListNotificationsParams {
    includeDismissed?: boolean;
    unreadOnly?: boolean;
}

export async function listNotifications(params?: ListNotificationsParams): Promise<NotificationDto[]> {
    const { data } = await axios.get<NotificationDto[]>(NOTIFICATIONS_PATH, { params });
    return data;
}

export async function markNotificationRead(id: string): Promise<void> {
    const path = `${NOTIFICATIONS_PATH}/${encodeURIComponent(id)}/read`;
    await axios.post(path);
}
