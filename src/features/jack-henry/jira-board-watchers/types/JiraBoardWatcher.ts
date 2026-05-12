export interface JiraBoardWatcher {
    id: string;
    boardId: number;
    description: string;
    isEnabled: boolean;
    jiraBoardId?: string | null;
}

export interface CreateJiraBoardWatcherDto {
    boardId: number;
    description: string;
    isEnabled: boolean;
}

export interface UpdateJiraBoardWatcherDto {
    description: string;
    isEnabled: boolean;
}

/** Emitted from `JiraBoardWatcherForm` on save (create includes `boardId`, edit includes `id`). */
export interface JiraBoardWatcherFormSubmitPayload {
    id?: string;
    boardId?: number;
    description: string;
    isEnabled: boolean;
}
