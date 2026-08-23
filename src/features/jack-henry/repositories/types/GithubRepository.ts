export interface GithubRepository {
    id: string;
    name: string;
    url: string;
    isPersonal: boolean;
    isWatched: boolean;
    useSsh: boolean;
    isCloned: boolean;
    lastSynced: string | null;
    lastPulled: string | null;
}

export interface GithubRepoCreateRequest {
    name: string;
    url: string;
    isPersonal: boolean;
    isWatched: boolean;
    useSsh: boolean;
}

export interface GithubRepoUpsertRequest {
    name: string;
    url: string;
    isPersonal: boolean;
    isWatched: boolean;
    useSsh: boolean;
}

export type CreateGithubRepositoryDto = GithubRepoCreateRequest;
export type UpdateGithubRepositoryDto = GithubRepoUpsertRequest;

export interface GithubRepoQueryFilters {
    isWatched?: boolean;
    isPersonal?: boolean;
}

export interface RepositoryFormSubmitPayload {
    id?: string;
    name: string;
    url: string;
    isPersonal: boolean;
    isWatched: boolean;
    useSsh: boolean;
}

export interface GitRepositoryJobQueueResponse {
    jobId: string;
    operation: string;
    status: string;
    message: string;
}

export type GithubRepoSyncQueueResponse = GitRepositoryJobQueueResponse | GitRepositoryJobQueueResponse[];
