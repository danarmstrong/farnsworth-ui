<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useChatStore } from '@/features/chat/stores/chatStore';
import ChatMessage from '@/features/chat/components/ChatMessage.vue';
import ChatComposer from '@/features/chat/components/ChatComposer.vue';

const store = useChatStore();
const scrollContainer = ref<HTMLElement | null>(null);

const modelOptions = computed(() =>
    store.models.map((model) => ({ title: model.name, value: model.name }))
);
const selectedModel = computed({
    get: () => store.activeModel,
    set: (value) => store.setActiveModel(value)
});

const connectionLabel = computed(() => {
    switch (store.connectionState) {
        case 'connected':
            return 'Connected';
        case 'connecting':
            return 'Connecting';
        case 'reconnecting':
            return 'Reconnecting';
        default:
            return 'Disconnected';
    }
});
const connectionColor = computed(() => {
    switch (store.connectionState) {
        case 'connected':
            return 'success';
        case 'connecting':
        case 'reconnecting':
            return 'warning';
        default:
            return 'error';
    }
});

const messagesLoading = computed(() => {
    if (!store.activeChatId) {
        return false;
    }
    return store.messagesLoadingByChat[store.activeChatId] === true;
});

const lastMessageIndex = computed(() => store.activeMessages.length - 1);
function isStreamingMessage(index: number, role: string): boolean {
    return (
        store.isStreaming &&
        store.streamingChatId === store.activeChatId &&
        index === lastMessageIndex.value &&
        role === 'assistant'
    );
}

function scrollToBottom() {
    const node = scrollContainer.value;
    if (!node) {
        return;
    }
    node.scrollTop = node.scrollHeight;
}

watch(
    () => store.activeMessages.length,
    async () => {
        await nextTick();
        scrollToBottom();
    }
);

watch(
    () =>
        store.activeMessages
            .map((message) => message.content.length)
            .reduce((sum, length) => sum + length, 0),
    async () => {
        await nextTick();
        scrollToBottom();
    }
);

watch(
    () => store.activeChatId,
    async () => {
        await nextTick();
        scrollToBottom();
    }
);

function startNewChat() {
    store.startNewChat();
}
</script>

<template>
    <div class="chat-thread d-flex flex-column">
        <template v-if="store.activeChat">
            <div class="chat-thread__header d-flex align-center gap-3 pa-4">
                <div class="flex-grow-1 overflow-hidden">
                    <h5 class="text-h5 mb-0 text-truncate">
                        {{ store.activeChat.name?.trim() || 'New chat' }}
                    </h5>
                    <v-chip
                        size="x-small"
                        :color="connectionColor"
                        variant="tonal"
                        class="mt-1"
                    >
                        {{ connectionLabel }}
                    </v-chip>
                </div>
                <v-select
                    v-model="selectedModel"
                    :items="modelOptions"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="chat-thread__model-picker"
                    placeholder="Model"
                    :disabled="!modelOptions.length"
                />
            </div>
            <v-divider />

            <div ref="scrollContainer" class="chat-thread__messages flex-grow-1">
                <div v-if="messagesLoading && !store.activeMessages.length" class="text-center text-medium-emphasis pa-6">
                    Loading messages...
                </div>
                <div v-else-if="!store.activeMessages.length" class="text-center text-medium-emphasis pa-10">
                    Send a message to start the conversation.
                </div>
                <div v-else class="pa-5">
                    <ChatMessage
                        v-for="(message, index) in store.activeMessages"
                        :key="`${store.activeChatId}-${index}`"
                        :message="message"
                        :streaming="isStreamingMessage(index, message.role)"
                    />
                </div>
            </div>

            <v-divider />
            <ChatComposer />
        </template>

        <div v-else class="chat-thread__empty d-flex flex-column align-center justify-center pa-10">
            <MessageCircleIcon size="48" stroke-width="1.5" class="text-medium-emphasis mb-4" />
            <h5 class="text-h5 mb-2">No chat selected</h5>
            <p class="text-medium-emphasis text-center mb-4">
                Pick a chat from the list or start a new conversation.
            </p>
            <v-btn color="primary" @click="startNewChat">
                <PlusIcon size="18" stroke-width="2" class="mr-2" />
                New chat
            </v-btn>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-thread {
    height: 100%;
    min-height: 0;

    &__header {
        flex-shrink: 0;
    }

    &__model-picker {
        max-width: 220px;
        flex-shrink: 0;
    }

    &__messages {
        overflow-y: auto;
        min-height: 0;
        height: calc(100vh - 360px);
    }

    &__empty {
        flex: 1 1 auto;
        min-height: calc(100vh - 290px);
    }
}
</style>
