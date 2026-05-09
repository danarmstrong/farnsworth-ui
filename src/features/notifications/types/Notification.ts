/** Mirrors FarnsworthAPI `NotificationCategory` (ASP.NET JSON: PascalCase names). */
export type NotificationCategory = 'Chat' | 'Other';

export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    category: NotificationCategory | string | null;
    resourceId?: string | null;
    isUnread: boolean;
    isDismissed: boolean;
    createdAtUtc: string;
    readAtUtc: string | null;
    dismissedAtUtc: string | null;
}

export interface NotificationUnreadCountDto {
    unreadCount: number;
}
