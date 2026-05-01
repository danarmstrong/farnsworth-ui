export interface JobFamily {
    id: string;
    description: string;
}

export type CreateJobFamilyDto = Omit<JobFamily, 'id'>;
export type UpdateJobFamilyDto = CreateJobFamilyDto;
