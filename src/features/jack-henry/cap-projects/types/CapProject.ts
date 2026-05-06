export interface CapProject {
    id: string;
    title: string;
    projectName: string;
    capPercentage: number;
    staffMemberIds: string[];
}

export interface CapProjectCreateDto {
    title: string;
    projectName: string;
    capPercentage?: number;
    staffMemberIds?: string[];
}

export interface CapProjectUpsertDto {
    title: string;
    projectName: string;
    capPercentage: number;
    staffMemberIds?: string[];
}

export interface AddStaffMembersDto {
    staffMemberIds: string[];
}
