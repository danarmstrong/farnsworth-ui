import type { NotificationCategory, NotificationDto } from '@/features/notifications/types/Notification';

type HrefBuilder = (dto: NotificationDto) => string | null;

const hrefByCategory: Record<NotificationCategory, HrefBuilder> = {
    Chat: (dto) => {
        const id = dto.resourceId?.trim();
        if (!id) {
            return null;
        }
        return `/chat/${encodeURIComponent(id)}`;
    },
    Other: () => null
};

/** Resolve in-app path for a notification row (e.g. deep link into chat). Unknown categories return null. */
export function getNotificationHref(dto: NotificationDto): string | null {
    const cat = dto.category;
    if (!cat || !(cat in hrefByCategory)) {
        return null;
    }
    return hrefByCategory[cat as NotificationCategory](dto);
}
