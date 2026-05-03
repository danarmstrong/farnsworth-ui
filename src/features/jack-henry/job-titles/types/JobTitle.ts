export type ExemptionStatus = 'exempt' | 'notexempt';

export interface JobTitle {
    id: string;
    payGradeId: string;
    jobFamilyId: string | null;
    title: string;
    longTitle: string;
    jobCode: string;
    exemptionStatus: ExemptionStatus;
}

export type CreateJobTitleDto = Omit<JobTitle, 'id'>;
export type UpdateJobTitleDto = CreateJobTitleDto;
