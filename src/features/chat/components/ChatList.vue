<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChatStore } from '@/features/chat/stores/chatStore';
import ChatListItem from '@/features/chat/components/ChatListItem.vue';

const store = useChatStore();
const search = ref('');

const filteredChats = computed(() => {
    const needle = search.value.trim().toLowerCase();
    if (!needle) {
        return store.chats;
    }
    return store.chats.filter((chat) => (chat.name || 'New chat').toLowerCase().includes(needle));
});

function newChat() {
    store.startNewChat();
}
</script>

<template>
    <div class="chat-list d-flex flex-column">
        <div class="pa-4 pb-3">
            <v-btn block color="primary" :disabled="store.isStreaming" @click="newChat">
                <PlusIcon size="18" stroke-width="2" class="mr-2" />
                New chat
            </v-btn>
            <v-text-field
                v-model="search"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Search chats"
                class="mt-3"
            >
                <template #prepend-inner>
                    <SearchIcon size="18" stroke-width="1.5" />
                </template>
            </v-text-field>
        </div>

        <v-divider />

        <perfect-scrollbar class="chat-list__scroll">
            <div v-if="store.loading && !store.chats.length" class="text-center text-medium-emphasis pa-6">
                Loading chats...
            </div>
            <div v-else-if="!filteredChats.length" class="text-center text-medium-emphasis pa-6">
                <template v-if="search">No chats match "{{ search }}".</template>
                <template v-else>No chats yet. Start a new one above.</template>
            </div>
            <ChatListItem v-for="chat in filteredChats" :key="chat.id" :chat="chat" />
        </perfect-scrollbar>
    </div>
</template>

<style lang="scss" scoped>
.chat-list {
    height: 100%;
    min-height: 0;

    &__scroll {
        flex: 1 1 auto;
        min-height: 0;
        height: calc(100vh - 290px);
    }
}
</style>
