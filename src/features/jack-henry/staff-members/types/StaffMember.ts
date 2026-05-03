export interface StaffMember {
    id: string;
    jobTitleId: string;
    costCenterId: string;
    managerId: string | null;
    firstName: string;
    lastName: string;
    employeeNumber: string | null;
    email: string;
    phoneNumber: string | null;
    companyProfileUrl: string | null;
    jiraUserId: string | null;
    githubUserId: string | null;
    slackUserId: string | null;
    teamsUserId: string | null;
    startDate: string;
    endDate: string | null;
    salary: number | null;
}

export type CreateStaffMemberDto = Omit<StaffMember, 'id'>;
export type UpdateStaffMemberDto = CreateStaffMemberDto;
