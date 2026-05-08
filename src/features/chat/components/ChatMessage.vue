<script setup lang="ts">
import { computed, ref } from 'vue';
import { format } from 'date-fns';
import MarkdownContent from '@/features/chat/components/MarkdownContent.vue';
import type { ChatMessage } from '@/features/chat/types/Chat';

const props = defineProps<{
    message: ChatMessage;
    streaming?: boolean;
}>();

const copied = ref(false);

const isUser = computed(() => props.message.role === 'user');
const showTypingDots = computed(() => Boolean(props.streaming) && !props.message.content);
const timestamp = computed(() => {
    if (!props.message.createdAtUtc) {
        return '';
    }
    try {
        return format(new Date(props.message.createdAtUtc), 'p');
    } catch {
        return '';
    }
});

async function copyToClipboard() {
    if (!props.message.content) {
        return;
    }
    try {
        await navigator.clipboard.writeText(props.message.content);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 1500);
    } catch {
        // ignore: clipboard may be unavailable in insecure contexts
    }
}
</script>

<template>
    <div class="chat-message" :class="{ 'chat-message--user': isUser }">
        <div class="chat-message__bubble">
            <div
                class="chat-message__body rounded-md px-4 py-3"
                :class="isUser ? 'bg-lightprimary' : 'bg-lightsecondary'"
            >
                <div v-if="showTypingDots" class="chat-message__typing">
                    <span />
                    <span />
                    <span />
                </div>
                <pre v-else-if="streaming" class="chat-message__streaming">{{ message.content }}</pre>
                <MarkdownContent v-else-if="!isUser" :content="message.content" />
                <div v-else class="chat-message__user-text">{{ message.content }}</div>
            </div>
            <div class="chat-message__meta d-flex align-center mt-1" :class="{ 'justify-end': isUser }">
                <small class="text-medium-emphasis">{{ timestamp }}</small>
                <v-btn
                    v-if="!streaming && message.content"
                    icon
                    variant="text"
                    size="x-small"
                    class="chat-message__copy ml-1"
                    @click="copyToClipboard"
                >
                    <CheckIcon v-if="copied" size="14" class="text-success" />
                    <CopyIcon v-else size="14" />
                </v-btn>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.chat-message {
    display: flex;
    margin-bottom: 1rem;

    &--user {
        justify-content: flex-end;
    }

    &__bubble {
        max-width: min(720px, 85%);
    }

    &__body {
        position: relative;
    }

    &__user-text {
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 0.9375rem;
        line-height: 1.5;
    }

    &__streaming {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        font-size: 0.9375rem;
        line-height: 1.6;
    }

    &__typing {
        display: inline-flex;
        gap: 4px;

        span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgb(var(--v-theme-on-surface), 0.5);
            animation: chat-typing 1.2s infinite ease-in-out;
        }

        span:nth-child(2) {
            animation-delay: 0.15s;
        }

        span:nth-child(3) {
            animation-delay: 0.3s;
        }
    }

    &__copy {
        opacity: 0;
        transition: opacity 0.15s ease;
    }

    &:hover &__copy {
        opacity: 1;
    }
}

@keyframes chat-typing {
    0%,
    80%,
    100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    40% {
        transform: translateY(-4px);
        opacity: 1;
    }
}
</style>
