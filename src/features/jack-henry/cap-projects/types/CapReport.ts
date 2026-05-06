import type { CostCenter } from '@/features/jack-henry/cost-centers/types/CostCenter';

export interface CapReportStaffMemberDto {
    lastName: string;
    firstName: string;
    hourlyRate: number;
    ptoHours: number;
    netHours: number;
    capHours: number;
    capDollars: number;
}

export interface CapReportDto {
    date: string;
    costCenter: CostCenter;
    businessDays: number;
    availableHours: number;
    capPercent: number;
    totalCapHours: number;
    totalCapDollars: number;
    staffMembers: CapReportStaffMemberDto[];
}
