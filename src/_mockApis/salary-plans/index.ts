import mock from '@/_mockApis/mockAdapter';
import type { CreateSalaryPlanDto, SalaryPlan, UpdateSalaryPlanDto } from '@/features/jack-henry/salary-plans/types/SalaryPlan';

const salaryPlans: SalaryPlan[] = [
    {
        id: 'abc',
        code: 'JH01',
        note: null
    },
    {
        id: 'bcd',
        code: 'JH02',
        note: null
    },
    {
        id: 'cde',
        code: 'JH03',
        note: null
    },
    {
        id: 'def',
        code: 'JH04',
        note: null
    },
    {
        id: 'efg',
        code: 'JH05',
        note: null
    }
];

// ==============================|| MOCK SERVICES ||============================== //

const normalizeCode = (code: string): string => code.trim().toLowerCase();
const normalizeNote = (note?: string | null): string | null => {
    const normalized = note?.trim();
    return normalized ? normalized : null;
};

const getIdFromUrl = (url?: string): string | null => {
    const id = url?.split('/').pop();
    return id ? decodeURIComponent(id) : null;
};

const hasDuplicateCode = (code: string, excludeId?: string): boolean => {
    const normalizedCode = normalizeCode(code);
    return salaryPlans.some((plan) => plan.id !== excludeId && normalizeCode(plan.code) === normalizedCode);
};

mock.onGet('/salary-plans').reply(() => {
    return [200, salaryPlans.map((plan) => ({ ...plan }))];
});

mock.onGet(/\/salary-plans\/[^/]+$/).reply((config) => {
    const id = getIdFromUrl(config.url);
    if (!id) {
        return [400, { message: 'Invalid salary plan id' }];
    }

    const salaryPlan = salaryPlans.find((plan) => plan.id === id);
    if (!salaryPlan) {
        return [404, { message: 'Salary plan not found' }];
    }

    return [200, { ...salaryPlan }];
});

mock.onPost('/salary-plans').reply((config) => {
    try {
        const payload = JSON.parse(config.data) as Partial<CreateSalaryPlanDto>;
        const code = payload.code?.trim();

        if (!code) {
            return [400, { message: 'Code is required' }];
        }

        if (hasDuplicateCode(code)) {
            return [409, { message: 'Salary plan code already exists' }];
        }

        const newSalaryPlan: SalaryPlan = {
            id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            code,
            note: normalizeNote(payload.note)
        };

        salaryPlans.push(newSalaryPlan);
        return [201, newSalaryPlan];
    } catch {
        return [400, { message: 'Invalid salary plan payload' }];
    }
});

mock.onPut(/\/salary-plans\/[^/]+$/).reply((config) => {
    const id = getIdFromUrl(config.url);
    if (!id) {
        return [400, { message: 'Invalid salary plan id' }];
    }

    const index = salaryPlans.findIndex((plan) => plan.id === id);
    if (index === -1) {
        return [404, { message: 'Salary plan not found' }];
    }

    try {
        const payload = JSON.parse(config.data) as Partial<UpdateSalaryPlanDto>;
        const code = payload.code?.trim();

        if (!code) {
            return [400, { message: 'Code is required' }];
        }

        if (hasDuplicateCode(code, id)) {
            return [409, { message: 'Salary plan code already exists' }];
        }

        const replacement: SalaryPlan = {
            id,
            code,
            note: normalizeNote(payload.note)
        };

        salaryPlans[index] = replacement;
        return [200, replacement];
    } catch {
        return [400, { message: 'Invalid salary plan payload' }];
    }
});

mock.onDelete(/\/salary-plans\/[^/]+$/).reply((config) => {
    const id = getIdFromUrl(config.url);
    if (!id) {
        return [400, { message: 'Invalid salary plan id' }];
    }

    const index = salaryPlans.findIndex((plan) => plan.id === id);
    if (index === -1) {
        return [404, { message: 'Salary plan not found' }];
    }

    salaryPlans.splice(index, 1);
    return [204];
});

export default salaryPlans;
