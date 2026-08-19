export interface TeamDto {
    id: string;
    name: string;
    staffMemberIds: string[];
}

export interface TeamCreateRequest {
    name: string;
    staffMemberIds?: string[];
}

export interface TeamUpsertRequest {
    name: string;
    staffMemberIds?: string[];
}

export type Team = TeamDto;

