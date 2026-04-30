import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfirmDialogStore = defineStore('confirmDialog', () => {
    const isOpen = ref(false);
    const message = ref('');
    const resolver = ref<((value: boolean) => void) | null>(null);

    function openConfirm(prompt: string): Promise<boolean> {
        if (resolver.value) {
            resolver.value(false);
        }

        message.value = prompt;
        isOpen.value = true;

        return new Promise<boolean>((resolve) => {
            resolver.value = resolve;
        });
    }

    function resolveConfirm(value: boolean) {
        const currentResolver = resolver.value;
        resolver.value = null;
        isOpen.value = false;
        message.value = '';
        currentResolver?.(value);
    }

    function confirm() {
        resolveConfirm(true);
    }

    function cancel() {
        resolveConfirm(false);
    }

    return {
        isOpen,
        message,
        openConfirm,
        confirm,
        cancel
    };
});
