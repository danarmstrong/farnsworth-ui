export interface PayGrade {
    id: string;
    grade: string;
    note: string | null;
}

export type CreatePayGradeDto = Omit<PayGrade, 'id'>;
export type UpdatePayGradeDto = CreatePayGradeDto;
