import * as signalR from '@microsoft/signalr';
import type { BackgroundJobDto } from '@/features/background-jobs/types/BackgroundJob';

const HUB_PATH = '/hubs/background-jobs';
const EVENT_BACKGROUND_JOB_UPDATED = 'BackgroundJobUpdated';

type BackgroundJobUpdatedHandler = (dto: BackgroundJobDto) => void;

function resolveHubUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/';
    const trimmedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${trimmedBase}${HUB_PATH}`;
}

function readAccessToken(): string {
    return sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken') ?? '';
}

let connection: signalR.HubConnection | null = null;
let connectPromise: Promise<void> | null = null;
const handlers = new Set<BackgroundJobUpdatedHandler>();

function buildConnection(): signalR.HubConnection {
    const built = new signalR.HubConnectionBuilder()
        .withUrl(resolveHubUrl(), { accessTokenFactory: readAccessToken })
        .withAutomaticReconnect()
        .build();

    built.on(EVENT_BACKGROUND_JOB_UPDATED, (dto: BackgroundJobDto) => {
        handlers.forEach((handler) => handler(dto));
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

function onBackgroundJobUpdated(handler: BackgroundJobUpdatedHandler): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
}

export const backgroundJobHub = {
    connect,
    disconnect,
    onBackgroundJobUpdated
};
