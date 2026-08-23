import { defineStore } from 'pinia';
import axios from '@/utils/axios';
import { isAxiosError } from 'axios';
import { ref, computed } from 'vue';
import { chatHub } from '@/features/chat/services/chatHub';
import { parseUtcDateMillis } from '@/utils/helpers/dateTime';
import type {
    ChatConversation,
    ChatConversationListItem,
    ChatConversationResolved,
    ChatMessage,
    ChatModel,
    ConnectionState,
    MessageRole
} from '@/features/chat/types/Chat';

const conversationsPath = '/chat/conversations';
const modelsPath = '/chat/models';
const legacyActiveModelStorageKey = 'chat.activeModel';
const newChatDefaultModelStorageKey = 'chat.newChatDefaultModel';

// Sentinel id used while a brand-new conversation hasn't been resolved by the
// hub yet. Swapped to the real id when `ConversationResolved` arrives.
export const PENDING_CHAT_ID = '__pending__';

// Backend `ChatMessageRole` may arrive as an integer (default System.Text.Json
// behaviour) or as a PascalCase / camelCase string depending on whether
// `JsonStringEnumConverter` is registered. Normalize to the canonical lowercase
// strings the UI uses. Numeric mapping assumes the conventional Ollama order
// (User = 0, Assistant = 1, System = 2); change here if the server's enum
// differs.
function normalizeRole(role: unknown): MessageRole {
    if (typeof role === 'string') {
        const lower = role.toLowerCase();
        if (lower === 'user' || lower === 'assistant' || lower === 'system') {
            return lower;
        }
    }
    if (typeof role === 'number') {
        switch (role) {
            case 0:
                return 'user';
            case 1:
                return 'assistant';
            case 2:
                return 'system';
        }
    }
    return 'assistant';
}

function normalizeMessage(message: ChatMessage): ChatMessage {
    return { ...message, role: normalizeRole(message.role) };
}

export const useChatStore = defineStore('chat', () => {
    const chats = ref<ChatConversationListItem[]>([]);
    const messagesByChat = ref<Record<string, ChatMessage[]>>({});
    const conversationDetailLoaded = ref<Record<string, boolean>>({});
    const messagesLoadingByChat = ref<Record<string, boolean>>({});
    const models = ref<ChatModel[]>([]);
    const activeChatId = ref<string | null>(null);
    const modelByChatId = ref<Record<string, string | null>>({});
    const newChatDefaultModel = ref<string | null>(
        localStorage.getItem(newChatDefaultModelStorageKey) ?? localStorage.getItem(legacyActiveModelStorageKey)
    );
    const isStreaming = ref(false);
    const streamingChatId = ref<string | null>(null);
    const connectionState = ref<ConnectionState>(chatHub.getConnectionState());
    const loading = ref(false);
    const error = ref<string | null>(null);

    const activeChat = computed<ChatConversationListItem | null>(() => {
        if (!activeChatId.value) {
            return null;
        }
        if (activeChatId.value === PENDING_CHAT_ID) {
            const pendingMessages = messagesByChat.value[PENDING_CHAT_ID] ?? [];
            const now = new Date().toISOString();
            return {
                id: PENDING_CHAT_ID,
                name: 'New chat',
                model: getModelForChat(PENDING_CHAT_ID) ?? '',
                messageCount: pendingMessages.length,
                createdAtUtc: now,
                updatedAtUtc: now
            };
        }
        return chats.value.find((chat) => chat.id === activeChatId.value) ?? null;
    });

    const activeMessages = computed<ChatMessage[]>(() => {
        if (!activeChatId.value) {
            return [];
        }
        return messagesByChat.value[activeChatId.value] ?? [];
    });

    const activeModel = computed<string | null>(() => getModelForChat(activeChatId.value));

    function setErrorMessage(err: unknown, fallback: string): string {
        if (isAxiosError(err)) {
            return err.response?.data?.message || err.message || fallback;
        }
        if (err instanceof Error) {
            return err.message || fallback;
        }
        if (typeof err === 'string') {
            return err || fallback;
        }
        return fallback;
    }

    function clearError(): void {
        error.value = null;
    }

    function setNewChatDefaultModel(model: string | null): void {
        if (model) {
            localStorage.setItem(newChatDefaultModelStorageKey, model);
        } else {
            localStorage.removeItem(newChatDefaultModelStorageKey);
        }
        localStorage.removeItem(legacyActiveModelStorageKey);
        newChatDefaultModel.value = model;
    }

    function getFallbackModel(): string | null {
        return models.value[0]?.name ?? null;
    }

    function normalizeModelChoice(model: string | null): string | null {
        if (!model) {
            return getFallbackModel();
        }
        if (models.value.some((entry) => entry.name === model)) {
            return model;
        }
        return getFallbackModel();
    }

    function getModelForChat(chatId: string | null): string | null {
        if (!chatId) {
            return normalizeModelChoice(newChatDefaultModel.value);
        }

        const explicitModel = modelByChatId.value[chatId];
        if (explicitModel !== undefined) {
            return normalizeModelChoice(explicitModel);
        }

        if (chatId === PENDING_CHAT_ID) {
            return normalizeModelChoice(newChatDefaultModel.value);
        }

        const summary = chats.value.find((chat) => chat.id === chatId);
        return normalizeModelChoice(summary?.model ?? null);
    }

    function setModelForChat(chatId: string | null, model: string | null): void {
        const normalized = normalizeModelChoice(model);
        const targetChatId = chatId ?? PENDING_CHAT_ID;
        modelByChatId.value[targetChatId] = normalized;

        // Remember the most recent selection as the default for future new chats.
        setNewChatDefaultModel(normalized);

        if (targetChatId !== PENDING_CHAT_ID) {
            const summary = chats.value.find((chat) => chat.id === targetChatId);
            if (summary) {
                summary.model = normalized ?? '';
            }
        }
    }

    function setActiveModel(model: string | null): void {
        setModelForChat(activeChatId.value ?? PENDING_CHAT_ID, model);
    }

    function moveChatToTop(chatId: string): void {
        const index = chats.value.findIndex((chat) => chat.id === chatId);
        if (index <= 0) {
            return;
        }
        const [moved] = chats.value.splice(index, 1);
        chats.value.unshift(moved);
    }

    async function fetchChats(): Promise<void> {
        error.value = null;
        loading.value = true;
        try {
            const { data } = await axios.get<ChatConversationListItem[]>(conversationsPath);
            chats.value = [...data].sort(
                (a, b) => parseUtcDateMillis(b.updatedAtUtc) - parseUtcDateMillis(a.updatedAtUtc)
            );
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch chats');
        } finally {
            loading.value = false;
        }
    }

    async function fetchModels(): Promise<void> {
        try {
            const { data } = await axios.get<ChatModel[]>(modelsPath);
            models.value = data;

            const normalizedDefault = normalizeModelChoice(newChatDefaultModel.value);
            setNewChatDefaultModel(normalizedDefault);

            Object.keys(modelByChatId.value).forEach((chatId) => {
                modelByChatId.value[chatId] = normalizeModelChoice(modelByChatId.value[chatId] ?? null);
            });

            if (activeChatId.value === PENDING_CHAT_ID) {
                modelByChatId.value[PENDING_CHAT_ID] = normalizeModelChoice(
                    modelByChatId.value[PENDING_CHAT_ID] ?? newChatDefaultModel.value
                );
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to fetch models');
        }
    }

    async function loadConversation(chatId: string, force = false): Promise<void> {
        if (!chatId || chatId === PENDING_CHAT_ID) {
            return;
        }
        if (!force && conversationDetailLoaded.value[chatId]) {
            return;
        }
        messagesLoadingByChat.value[chatId] = true;
        try {
            const { data } = await axios.get<ChatConversation>(`${conversationsPath}/${chatId}`);
            messagesByChat.value[chatId] = (data.messages ?? []).map(normalizeMessage);
            conversationDetailLoaded.value[chatId] = true;
            const index = chats.value.findIndex((chat) => chat.id === chatId);
            const summary: ChatConversationListItem = {
                id: data.id,
                name: data.name,
                model: normalizeModelChoice(data.model) ?? '',
                messageCount: data.messages?.length ?? 0,
                createdAtUtc: data.createdAtUtc,
                updatedAtUtc: data.updatedAtUtc,
                contextSummary: data.contextSummary ?? null
            };
            modelByChatId.value[chatId] = summary.model;
            if (index === -1) {
                chats.value.unshift(summary);
            } else {
                chats.value[index] = summary;
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to load conversation');
        } finally {
            messagesLoadingByChat.value[chatId] = false;
        }
    }

    async function selectChat(chatId: string): Promise<void> {
        activeChatId.value = chatId;
        await loadConversation(chatId);
    }

    function startNewChat(): void {
        if (isStreaming.value) {
            return;
        }
        messagesByChat.value[PENDING_CHAT_ID] = [];
        modelByChatId.value[PENDING_CHAT_ID] = normalizeModelChoice(newChatDefaultModel.value);
        activeChatId.value = PENDING_CHAT_ID;
    }

    async function renameChat(id: string, name: string): Promise<void> {
        const trimmed = name.trim();
        if (!trimmed || id === PENDING_CHAT_ID) {
            return;
        }
        const previous = chats.value.find((chat) => chat.id === id);
        const previousName = previous?.name;
        if (previous) {
            previous.name = trimmed;
        }
        try {
            await axios.put(`${conversationsPath}/${id}/name`, { name: trimmed });
        } catch (err) {
            if (previous && previousName !== undefined) {
                previous.name = previousName;
            }
            error.value = setErrorMessage(err, 'Failed to rename chat');
        }
    }

    async function deleteChat(id: string): Promise<void> {
        if (id === PENDING_CHAT_ID) {
            delete messagesByChat.value[PENDING_CHAT_ID];
            if (activeChatId.value === PENDING_CHAT_ID) {
                activeChatId.value = chats.value[0]?.id ?? null;
            }
            return;
        }
        try {
            await axios.delete(`${conversationsPath}/${id}`);
            chats.value = chats.value.filter((chat) => chat.id !== id);
            delete messagesByChat.value[id];
            delete conversationDetailLoaded.value[id];
            delete modelByChatId.value[id];
            if (activeChatId.value === id) {
                activeChatId.value = chats.value[0]?.id ?? null;
                if (activeChatId.value) {
                    void loadConversation(activeChatId.value);
                }
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to delete chat');
        }
    }

    function appendToken(token: string): void {
        if (!streamingChatId.value) {
            return;
        }
        const list = messagesByChat.value[streamingChatId.value];
        if (!list || !list.length) {
            return;
        }
        const last = list[list.length - 1];
        if (last.role !== 'assistant') {
            return;
        }
        last.content += token;
    }

    function finalizeStreaming(): void {
        if (!streamingChatId.value) {
            isStreaming.value = false;
            return;
        }
        const chatId = streamingChatId.value;
        const list = messagesByChat.value[chatId];
        if (list?.length) {
            const last = list[list.length - 1];
            if (last.role === 'assistant') {
                last.createdAtUtc = new Date().toISOString();
            }
            const summary = chats.value.find((chat) => chat.id === chatId);
            if (summary) {
                summary.messageCount = list.length;
                summary.updatedAtUtc = new Date().toISOString();
            }
        }
        isStreaming.value = false;
        streamingChatId.value = null;
    }

    function handleStreamError(message: string): void {
        if (streamingChatId.value) {
            const list = messagesByChat.value[streamingChatId.value];
            if (list?.length) {
                const last = list[list.length - 1];
                if (last.role === 'assistant') {
                    const prefix = last.content ? `${last.content}\n\n` : '';
                    last.content = `${prefix}_Error: ${message}_`;
                }
            }
        }
        isStreaming.value = false;
        streamingChatId.value = null;
        error.value = message;
    }

    function handleConversationResolved(payload: ChatConversationResolved): void {
        const wasPending = streamingChatId.value === PENDING_CHAT_ID;
        if (wasPending) {
            messagesByChat.value[payload.conversationId] =
                messagesByChat.value[PENDING_CHAT_ID] ?? [];
            delete messagesByChat.value[PENDING_CHAT_ID];
            streamingChatId.value = payload.conversationId;
            if (activeChatId.value === PENDING_CHAT_ID) {
                activeChatId.value = payload.conversationId;
            }
        }

        const messageCount = messagesByChat.value[payload.conversationId]?.length ?? 0;
        const nowIso = new Date().toISOString();
        const existing = chats.value.find((chat) => chat.id === payload.conversationId);
        if (existing) {
            existing.name = payload.conversationName;
            existing.model = normalizeModelChoice(payload.model) ?? '';
            existing.messageCount = messageCount;
            existing.updatedAtUtc = nowIso;
        } else {
            const normalizedModel = normalizeModelChoice(payload.model) ?? '';
            chats.value.unshift({
                id: payload.conversationId,
                name: payload.conversationName,
                model: normalizedModel,
                messageCount,
                createdAtUtc: nowIso,
                updatedAtUtc: nowIso,
                contextSummary: null
            });
            conversationDetailLoaded.value[payload.conversationId] = true;
        }

        modelByChatId.value[payload.conversationId] = normalizeModelChoice(payload.model);
        if (wasPending) {
            delete modelByChatId.value[PENDING_CHAT_ID];
        }
        moveChatToTop(payload.conversationId);
    }

    async function sendPrompt(prompt: string): Promise<void> {
        const trimmed = prompt.trim();
        if (!trimmed || isStreaming.value) {
            return;
        }
        if (!activeChatId.value) {
            startNewChat();
        }

        const targetId = activeChatId.value!;
        const targetModel = getModelForChat(targetId);
        if (!targetModel) {
            error.value = 'No model available. Add or pull a model to continue.';
            return;
        }

        const isNew = targetId === PENDING_CHAT_ID;
        const list = messagesByChat.value[targetId] ?? (messagesByChat.value[targetId] = []);
        const nowIso = new Date().toISOString();

        list.push({ role: 'user', content: trimmed, createdAtUtc: nowIso });
        list.push({ role: 'assistant', content: '', createdAtUtc: nowIso });

        if (!isNew) {
            const summary = chats.value.find((chat) => chat.id === targetId);
            if (summary) {
                summary.updatedAtUtc = nowIso;
                summary.messageCount = list.length;
                moveChatToTop(targetId);
            }
        }

        isStreaming.value = true;
        streamingChatId.value = targetId;

        try {
            await chatHub.sendMessage({
                conversationId: isNew ? null : targetId,
                model: targetModel,
                userPrompt: trimmed
            });
        } catch (err) {
            handleStreamError(setErrorMessage(err, 'Failed to send prompt'));
        }
    }

    async function connect(): Promise<void> {
        try {
            if (chatHub.getConnectionState() == 'disconnected') {
                await chatHub.connect();
            }
        } catch (err) {
            error.value = setErrorMessage(err, 'Failed to connect to chat hub');
        }
    }

    async function disconnect(): Promise<void> {
        await chatHub.disconnect();
    }

    chatHub.onConversationResolved(handleConversationResolved);
    chatHub.onToken(appendToken);
    chatHub.onCompleted(finalizeStreaming);
    chatHub.onConnectionStateChange((state) => {
        connectionState.value = state;
    });

    return {
        chats,
        messagesByChat,
        models,
        modelByChatId,
        activeChatId,
        activeModel,
        isStreaming,
        streamingChatId,
        connectionState,
        loading,
        messagesLoadingByChat,
        error,
        activeChat,
        activeMessages,
        clearError,
        getModelForChat,
        setModelForChat,
        setActiveModel,
        fetchChats,
        fetchModels,
        loadConversation,
        selectChat,
        startNewChat,
        renameChat,
        deleteChat,
        sendPrompt,
        connect,
        disconnect
    };
});
