export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    category: string | null;
    isUnread: boolean;
    isDismissed: boolean;
    createdAtUtc: string;
    readAtUtc: string | null;
    dismissedAtUtc: string | null;
}

export interface NotificationUnreadCountDto {
    unreadCount: number;
}
