export interface JiraProject {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    isScrumProject: boolean;
    isScrumProjectVerified: boolean;
    lastSynced: string | null;
}

export interface JiraProjectSprint {
    id: string;
    jiraSprintId: string;
    boardId: string | null;
    name: string;
    state: string | null;
    startDateUtc: string | null;
    endDateUtc: string | null;
    completeDateUtc: string | null;
    originBoardId: string | null;
    goal: string | null;
}

export interface JiraProjectSprintListResponse {
    jiraProjectId: string;
    isScrumProject: boolean;
    isScrumProjectVerified: boolean;
    items: JiraProjectSprint[];
}

export type JiraBoardType = string;

export interface JiraProjectBoard {
    id: string;
    jiraBoardId: string;
    name: string;
    boardType: JiraBoardType;
    key: string;
}

export interface JiraProjectBoardListResponse {
    jiraProjectId: string;
    items: JiraProjectBoard[];
}

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export type JiraProjectPageResponse = PagedResponse<JiraProject>;

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
