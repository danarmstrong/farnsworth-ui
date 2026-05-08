import * as signalR from '@microsoft/signalr';
import type {
    ChatConversationResolved,
    ChatSendMessageRequest,
    ConnectionState
} from '@/features/chat/types/Chat';

// Method/event names mirror FarnsworthAPI/Hubs/ChatHub.cs.
// `SendMessage` returns once `ReceiveOllamaCompleted` has been emitted; failures
// surface as a rejected promise from `invoke` (the hub wraps known
// `ArgumentException` / `InvalidOperationException` in `HubException`; everything
// else collapses to a generic "error on the server" unless the API has
// `EnableDetailedErrors = true`).
//
// Note: the hub currently exposes no cancellation method, so server-side
// generation cannot be aborted from the client. Add a corresponding hub method
// before re-introducing a Stop control.
const HUB_PATH = '/hubs/chat';
const SEND_METHOD = 'SendMessage';
const EVENT_CONVERSATION_RESOLVED = 'ConversationResolved';
const EVENT_RECEIVE_TOKEN = 'ReceiveOllamaToken';
const EVENT_RECEIVE_COMPLETED = 'ReceiveOllamaCompleted';

type ConversationResolvedHandler = (payload: ChatConversationResolved) => void;
type TokenHandler = (token: string) => void;
type CompletedHandler = () => void;
type ConnectionStateHandler = (state: ConnectionState) => void;

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

const conversationResolvedHandlers = new Set<ConversationResolvedHandler>();
const tokenHandlers = new Set<TokenHandler>();
const completedHandlers = new Set<CompletedHandler>();
const stateHandlers = new Set<ConnectionStateHandler>();

let connectionState: ConnectionState = 'disconnected';

function setConnectionState(next: ConnectionState): void {
    if (connectionState === next) {
        return;
    }
    connectionState = next;
    stateHandlers.forEach((handler) => handler(next));
}

function buildConnection(): signalR.HubConnection {
    const built = new signalR.HubConnectionBuilder()
        .withUrl(resolveHubUrl(), { accessTokenFactory: readAccessToken })
        .withAutomaticReconnect()
        .build();

    built.on(EVENT_CONVERSATION_RESOLVED, (payload: ChatConversationResolved) => {
        conversationResolvedHandlers.forEach((handler) => handler(payload));
    });

    built.on(EVENT_RECEIVE_TOKEN, (token: string) => {
        tokenHandlers.forEach((handler) => handler(token));
    });

    built.on(EVENT_RECEIVE_COMPLETED, () => {
        completedHandlers.forEach((handler) => handler());
    });

    built.onreconnecting(() => setConnectionState('reconnecting'));
    built.onreconnected(() => setConnectionState('connected'));
    built.onclose(() => setConnectionState('disconnected'));

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

    setConnectionState('connecting');
    connectPromise = (async () => {
        try {
            await connection!.start();
            setConnectionState('connected');
        } catch (err) {
            setConnectionState('disconnected');
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
        setConnectionState('disconnected');
    }
}

async function sendMessage(request: ChatSendMessageRequest): Promise<void> {
    await connect();
    await connection!.invoke(SEND_METHOD, request);
}

function onConversationResolved(handler: ConversationResolvedHandler): () => void {
    conversationResolvedHandlers.add(handler);
    return () => conversationResolvedHandlers.delete(handler);
}

function onToken(handler: TokenHandler): () => void {
    tokenHandlers.add(handler);
    return () => tokenHandlers.delete(handler);
}

function onCompleted(handler: CompletedHandler): () => void {
    completedHandlers.add(handler);
    return () => completedHandlers.delete(handler);
}

function onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    stateHandlers.add(handler);
    handler(connectionState);
    return () => stateHandlers.delete(handler);
}

function getConnectionState(): ConnectionState {
    return connectionState;
}

export const chatHub = {
    connect,
    disconnect,
    sendMessage,
    onConversationResolved,
    onToken,
    onCompleted,
    onConnectionStateChange,
    getConnectionState
};
