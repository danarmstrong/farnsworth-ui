<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import AppBaseCard from '@/components/shared/AppBaseCard.vue';
import ChatList from '@/features/chat/components/ChatList.vue';
import ChatThread from '@/features/chat/components/ChatThread.vue';
import { useChatStore } from '@/features/chat/stores/chatStore';

const store = useChatStore();

onMounted(async () => {
    await Promise.all([store.fetchChats(), store.fetchModels()]);
    void store.connect();
});

onBeforeUnmount(() => {
    void store.disconnect();
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
