<script setup lang="ts">
import { computed, ref } from 'vue';
import { useChatStore } from '@/features/chat/stores/chatStore';

const store = useChatStore();
const draft = ref('');

const canSend = computed(
    () => Boolean(draft.value.trim()) && !!store.activeModel && !store.isStreaming
);

const placeholder = computed(() => {
    if (!store.activeModel) {
        return 'Select a model to start chatting.';
    }
    if (store.isStreaming) {
        return 'Generating response...';
    }
    return 'Type a message. Enter to send, Shift+Enter for newline.';
});

async function send() {
    if (!canSend.value) {
        return;
    }
    const prompt = draft.value;
    draft.value = '';
    await store.sendPrompt(prompt);
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        void send();
    }
}
</script>

<template>
    <form class="chat-composer pa-3" @submit.prevent="send">
        <v-textarea
            v-model="draft"
            variant="outlined"
            density="comfortable"
            rows="1"
            max-rows="8"
            auto-grow
            hide-details
            :placeholder="placeholder"
            :disabled="!store.activeModel"
            @keydown="onKeydown"
        >
            <template #append-inner>
                <v-btn
                    icon
                    color="primary"
                    variant="flat"
                    size="small"
                    :loading="store.isStreaming"
                    :disabled="!canSend"
                    type="submit"
                >
                    <SendIcon size="18" />
                </v-btn>
            </template>
        </v-textarea>
    </form>
</template>

<style lang="scss" scoped>
.chat-composer {
    flex-shrink: 0;
}
</style>
