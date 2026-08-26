import type { TeamMemberDto } from '@/features/jack-henry/teams/types/TeamMember';

export interface TeamSlimDto {
    id: string;
    name: string;
}

export interface GithubRepoSlimDto {
    id: string;
    name: string;
    url: string;
}

export interface JiraProjectSlimDto {
    id: string;
    name: string;
}

export interface TeamDto {
    id: string;
    name: string;
    teamMembers: TeamMemberDto[];
    githubRepos: GithubRepoSlimDto[];
    jiraProjects: JiraProjectSlimDto[];
    activeMemberCount: number;
}

export interface TeamCreateRequest {
    name: string;
    staffMemberIds?: string[];
    githubRepoIds?: string[];
    jiraProjectIds?: string[];
}

export interface TeamUpsertRequest {
    name: string;
    staffMemberIds?: string[];
    githubRepoIds?: string[];
    jiraProjectIds?: string[];
}

export type Team = TeamDto;
