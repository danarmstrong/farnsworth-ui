<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { formatDistanceToNowStrict } from 'date-fns';
import { useChatStore } from '@/features/chat/stores/chatStore';
import { useConfirm } from '@/utils/helpers/useConfirm';
import type { ChatConversationListItem } from '@/features/chat/types/Chat';

const props = defineProps<{
    chat: ChatConversationListItem;
}>();

const store = useChatStore();
const confirm = useConfirm();

const renaming = ref(false);
const draftName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const isActive = computed(() => store.activeChatId === props.chat.id);
const displayName = computed(() => props.chat.name?.trim() || 'New chat');
const lastActivity = computed(() => {
    if (!props.chat.updatedAtUtc) {
        return '';
    }
    try {
        return formatDistanceToNowStrict(new Date(props.chat.updatedAtUtc), { addSuffix: false });
    } catch {
        return '';
    }
});

function selectChat() {
    if (renaming.value) {
        return;
    }
    void store.selectChat(props.chat.id);
}

async function startRename() {
    renaming.value = true;
    draftName.value = props.chat.name ?? '';
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
}

async function commitRename() {
    if (!renaming.value) {
        return;
    }
    const next = draftName.value.trim();
    renaming.value = false;
    if (!next || next === props.chat.name) {
        return;
    }
    await store.renameChat(props.chat.id, next);
}

function cancelRename() {
    renaming.value = false;
    draftName.value = '';
}

async function deleteChat() {
    const confirmed = await confirm(`Delete "${displayName.value}"? This cannot be undone.`);
    if (!confirmed) {
        return;
    }
    await store.deleteChat(props.chat.id);
}
</script>

<template>
    <div
        class="chat-list-item d-flex align-center px-4 py-3"
        :class="{ 'chat-list-item--active': isActive }"
        @click="selectChat"
    >
        <div class="flex-grow-1 overflow-hidden">
            <input
                v-if="renaming"
                ref="inputRef"
                v-model="draftName"
                class="chat-list-item__rename-input"
                type="text"
                maxlength="100"
                @click.stop
                @keydown.enter.prevent="commitRename"
                @keydown.esc.prevent="cancelRename"
                @blur="commitRename"
            />
            <div v-else class="text-subtitle-1 font-weight-semibold text-truncate">
                {{ displayName }}
            </div>
            <div v-if="!renaming && lastActivity" class="text-caption text-medium-emphasis text-truncate">
                {{ lastActivity }} ago
            </div>
        </div>
        <v-menu v-if="!renaming" location="bottom end" @click.stop>
            <template #activator="{ props: menuProps }">
                <v-btn icon variant="text" size="small" class="chat-list-item__menu" v-bind="menuProps" @click.stop>
                    <DotsVerticalIcon size="18" />
                </v-btn>
            </template>
            <v-list density="compact">
                <v-list-item @click="startRename">
                    <template #prepend>
                        <PencilIcon size="16" stroke-width="1.5" class="mr-2" />
                    </template>
                    <v-list-item-title>Rename</v-list-item-title>
                </v-list-item>
                <v-list-item @click="deleteChat">
                    <template #prepend>
                        <TrashIcon size="16" stroke-width="1.5" class="text-error mr-2" />
                    </template>
                    <v-list-item-title class="text-error">Delete</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>

<style lang="scss" scoped>
.chat-list-item {
    cursor: pointer;
    border-bottom: 1px solid rgb(var(--v-theme-borderColor));
    transition: background-color 0.15s ease;

    &:hover {
        background: rgba(var(--v-theme-primary), 0.05);
    }

    &__menu {
        opacity: 0;
        transition: opacity 0.15s ease;
    }

    &:hover .chat-list-item__menu {
        opacity: 1;
    }

    &--active {
        background: rgba(var(--v-theme-primary), 0.1);

        .chat-list-item__menu {
            opacity: 1;
        }
    }

    &__rename-input {
        width: 100%;
        padding: 0.25rem 0.5rem;
        font-size: 0.95rem;
        font-weight: 600;
        background: rgba(var(--v-theme-on-surface), 0.05);
        border: 1px solid rgb(var(--v-theme-primary));
        border-radius: 4px;
        color: inherit;
        outline: none;
    }
}
</style>
