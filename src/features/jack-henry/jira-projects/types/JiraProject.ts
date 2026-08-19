export interface JiraProject {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    lastSynced: string | null;
}

export interface JiraProjectSyncQueueResponse {
    queued?: boolean;
}

export interface CreateJiraProjectDto {
    name: string;
    description: string;
    isEnabled: boolean;
}

export interface UpdateJiraProjectDto {
    name: string;
    description: string;
    isEnabled: boolean;
}

export type JiraProjectFormSubmitPayload = {
    id?: string;
    name: string;
    description: string;
    isEnabled: boolean;
};
