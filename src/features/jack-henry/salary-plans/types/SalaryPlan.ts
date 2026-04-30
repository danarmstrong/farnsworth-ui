export interface SalaryPlan {
    id: string;
    code: string;
    note: string | null;
}

export type CreateSalaryPlanDto = Omit<SalaryPlan, 'id'>;
export type UpdateSalaryPlanDto = CreateSalaryPlanDto;
