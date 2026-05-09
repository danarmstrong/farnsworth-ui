<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import ChatList from '@/features/chat/components/ChatList.vue';
import ChatThread from '@/features/chat/components/ChatThread.vue';
import { useChatStore } from '@/features/chat/stores/chatStore';

const store = useChatStore();
const route = useRoute();

function paramChatId(): string | null {
    const raw = route.params.chatId;
    if (raw === undefined || raw === null) {
        return null;
    }
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (typeof s !== 'string' || !s.trim()) {
        return null;
    }
    return s.trim();
}

async function applyRouteChatId(): Promise<void> {
    const id = paramChatId();
    if (id) {
        await store.selectChat(id);
    }
}

onMounted(async () => {
    await Promise.all([store.fetchChats(), store.fetchModels()]);
    void store.connect();
    await applyRouteChatId();
});

watch(
    () => route.params.chatId,
    () => {
        void applyRouteChatId();
    }
);

onBeforeUnmount(() => {
    //void store.disconnect();
});
</script>

<template>
    <v-card elevation="10">
        <AppBaseCard>
            <template #leftpart>
                <ChatList />
            </template>
            <template #rightpart>
                <ChatThread />
            </template>
            <template #mobileLeftContent>
                <ChatList />
            </template>
        </AppBaseCard>
    </v-card>
</template>

<style scoped lang="scss">
@media (max-width: 1279px) {
    .v-card {
        position: unset;
    }
}
</style>
