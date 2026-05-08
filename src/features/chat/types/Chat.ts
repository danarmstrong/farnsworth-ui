// Mirrors FarnsworthAPI/Dtos/ChatDtos.cs.
// Backend serializes property names as camelCase by default; enums require
// `JsonStringEnumConverter` registered globally for `MessageRole` to be a string
// (assumed; trivially adjust if integers are sent).

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    role: MessageRole;
    content: string;
    createdAtUtc: string;
}

export interface ChatSummaryAnchor {
    upToMessageIndex: number;
    summary: string;
    createdAtUtc: string;
    estimatedContextTokensAtCreation: number;
}

export interface ChatConversationListItem {
    id: string;
    name: string;
    model: string;
    messageCount: number;
    createdAtUtc: string;
    updatedAtUtc: string;
    contextSummary?: string | null;
}

export interface ChatConversation extends ChatConversationListItem {
    estimatedContextTokens: number;
    summaryAnchors: ChatSummaryAnchor[];
    messages: ChatMessage[];
}

export interface ChatConversationResolved {
    conversationId: string;
    conversationName: string;
    model: string;
}

export interface ChatModel {
    name: string;
    modifiedAt?: string | null;
    size?: number | null;
    digest?: string | null;
}

export interface ChatSendMessageRequest {
    conversationId: string | null;
    model: string | null;
    userPrompt: string;
}

export interface ChatConversationRenameRequest {
    name: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
