import * as signalR from '@microsoft/signalr';
import type { NotificationDto } from '@/features/notifications/types/Notification';

const DEFAULT_HUB_PATH = '/hubs/notifications';

const RECEIVE_NOTIFICATION = 'ReceiveNotification';

type NotificationHandler = (dto: NotificationDto) => void;

function resolveHubUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/';
    const trimmedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const hubPath = import.meta.env.VITE_NOTIFICATION_HUB_PATH || DEFAULT_HUB_PATH;
    const pathSegment = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
    return `${trimmedBase}${pathSegment}`;
}

function readAccessToken(): string {
    return sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken') ?? '';
}

let connection: signalR.HubConnection | null = null;
let connectPromise: Promise<void> | null = null;
const handlers = new Set<NotificationHandler>();

function buildConnection(): signalR.HubConnection {
    const built = new signalR.HubConnectionBuilder()
        .withUrl(resolveHubUrl(), { accessTokenFactory: readAccessToken })
        .withAutomaticReconnect()
        .build();

    built.on(RECEIVE_NOTIFICATION, (dto: NotificationDto) => {
        handlers.forEach((h) => h(dto));
    });

    return built;
}

async function connect(): Promise<void> {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        return;
    }
    if (connectPromise) {
        return connectPromise;
    }

    if (!connection) {
        connection = buildConnection();
    }

    connectPromise = (async () => {
        try {
            await connection!.start();
        } catch (err) {
            connection = null;
            throw err;
        } finally {
            connectPromise = null;
        }
    })();

    return connectPromise;
}

async function disconnect(): Promise<void> {
    if (!connection) {
        return;
    }
    try {
        await connection.stop();
    } finally {
        connection = null;
    }
}

function onNotification(handler: NotificationHandler): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
}

export const notificationHub = {
    connect,
    disconnect,
    onNotification
};
