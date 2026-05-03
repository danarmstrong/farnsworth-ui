export interface CostCenter {
    id: string;
    departmentNumber: string;
    name: string;
}

export type CreateCostCenterDto = Omit<CostCenter, 'id'>;
export type UpdateCostCenterDto = CreateCostCenterDto;
