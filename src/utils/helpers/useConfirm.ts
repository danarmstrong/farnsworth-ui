import { useConfirmDialogStore } from '@/stores/confirmDialog';

export function useConfirm() {
    const confirmDialogStore = useConfirmDialogStore();

    return (message: string) => confirmDialogStore.openConfirm(message);
}
