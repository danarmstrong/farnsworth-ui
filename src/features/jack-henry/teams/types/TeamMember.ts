export interface TeamSlimDto {
    id: string;
    name: string;
}

export interface StaffMemberSlimReferenceDto {
    id: string;
    displayName: string;
}

export interface TeamMemberStatsDto {
    development: number;
    testing: number;
    reviewing: number;
    security: number;
}

export interface TeamMemberDto {
    id: string;
    team: TeamSlimDto;
    staffMember: StaffMemberSlimReferenceDto;
    isActive: boolean;
    stats: TeamMemberStatsDto;
}

