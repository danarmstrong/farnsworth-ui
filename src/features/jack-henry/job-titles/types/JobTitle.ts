export type ExemptionStatus = 'Exempt' | 'NotExempt';

export interface JobTitle {
    id: string;
    payGradeId: string;
    jobFamilyId: string | null;
    title: string;
    longTitle: string;
    jobCode: string;
    exemptionStatus: ExemptionStatus;
}

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export type JobTitlePageResponse = PagedResponse<JobTitle>;

export const JOB_TITLE_PAGE_RESPONSE_FIELDS: (keyof JobTitlePageResponse)[] = ['items', 'page', 'pageSize', 'totalCount', 'totalPages'];

export type CreateJobTitleDto = Omit<JobTitle, 'id'>;
export type UpdateJobTitleDto = CreateJobTitleDto;
