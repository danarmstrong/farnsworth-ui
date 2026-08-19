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

export type CreateGithubRepositoryDto = Omit<GithubRepository, 'id' | 'lastSynced' | 'lastPulled' | 'isCloned'>;
export type UpdateGithubRepositoryDto = Omit<GithubRepository, 'id' | 'lastSynced' | 'lastPulled' | 'isCloned'>;

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

export interface GithubRepoSyncQueueResponse {
    queued?: boolean;
}







