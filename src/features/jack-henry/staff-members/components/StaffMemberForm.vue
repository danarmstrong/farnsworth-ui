<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useJobTitleStore } from '@/features/jack-henry/job-titles/stores/jobTitleStore';
import { useCostCenterStore } from '@/features/jack-henry/cost-centers/stores/costCenterStore';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import type { SelectOption } from '@/types/SelectOption';

export type StaffMemberFormSubmitPayload = {
    id?: string;
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
};

interface Props {
    saving: boolean;
    submitDisabled?: boolean;
    error: string | null;
}

const props = withDefaults(defineProps<Props>(), {
    submitDisabled: false
});

const emit = defineEmits<{
    submit: [payload: StaffMemberFormSubmitPayload];
    cancel: [];
}>();

function emptyStaffMember(): StaffMember {
    return {
        id: '',
        jobTitleId: '',
        costCenterId: '',
        managerId: null,
        firstName: '',
        lastName: '',
        employeeNumber: '',
        email: '',
        phoneNumber: '',
        companyProfileUrl: '',
        jiraUserId: '',
        githubUserId: '',
        slackUserId: '',
        teamsUserId: '',
        startDate: '',
        endDate: '',
        salary: null
    };
}

function nullIfEmpty(s: string): string | null {
    const t = s.trim();
    return t ? t : null;
}

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const jobTitleStore = useJobTitleStore();
const costCenterStore = useCostCenterStore();
const staffMemberStore = useStaffMemberStore();
const item = ref<StaffMember>(emptyStaffMember());
const salaryInput = ref('');

const jobTitleOptions = computed<SelectOption<string>[]>(() =>
    jobTitleStore.jobTitles.map((jt) => ({
        label: `${jt.title} (${jt.jobCode})`,
        value: jt.id
    }))
);

const costCenterOptions = computed<SelectOption<string>[]>(() =>
    costCenterStore.costCenters.map((cc) => ({
        label: `${cc.departmentNumber} — ${cc.name}`,
        value: cc.id
    }))
);

const managerOptions = computed<SelectOption<string | null>[]>(() => {
    const none: SelectOption<string | null> = { label: 'None', value: null };
    const excludeId = mode.value === 'edit' ? item.value.id : '';
    const rows = staffMemberStore.staffMembers
        .filter((m) => m.id !== excludeId)
        .map((m) => ({
            label: `${m.firstName} ${m.lastName}`.trim() || m.email,
            value: m.id
        }));
    return [none, ...rows];
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Staff Member' : 'Edit Staff Member'));

const canSave = computed(() => {
    return (
        !!item.value.jobTitleId.trim() &&
        !!item.value.costCenterId.trim() &&
        !!item.value.firstName.trim() &&
        !!item.value.lastName.trim() &&
        !!item.value.email.trim() &&
        !!item.value.startDate.trim()
    );
});

onMounted(() => {
    if (!jobTitleStore.jobTitles.length) {
        void jobTitleStore.fetchJobTitles();
    }
    if (!costCenterStore.costCenters.length) {
        void costCenterStore.fetchCostCenters();
    }
    if (!staffMemberStore.staffMembers.length) {
        void staffMemberStore.fetchStaffMembers();
    }
});

function resetForm() {
    item.value = emptyStaffMember();
    salaryInput.value = '';
    mode.value = 'create';
}

function close() {
    dialog.value = false;
    emit('cancel');
    setTimeout(() => {
        resetForm();
    }, 300);
}

function openCreate() {
    resetForm();
    dialog.value = true;
}

function openEdit(member: StaffMember) {
    mode.value = 'edit';
    item.value = {
        ...member,
        employeeNumber: member.employeeNumber ?? '',
        phoneNumber: member.phoneNumber ?? '',
        companyProfileUrl: member.companyProfileUrl ?? '',
        jiraUserId: member.jiraUserId ?? '',
        githubUserId: member.githubUserId ?? '',
        slackUserId: member.slackUserId ?? '',
        teamsUserId: member.teamsUserId ?? '',
        endDate: member.endDate ?? ''
    };
    salaryInput.value = member.salary != null ? String(member.salary) : '';
    dialog.value = true;
}

function parseSalary(): number | null {
    const t = salaryInput.value.trim();
    if (!t) {
        return null;
    }
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

function save() {
    if (!canSave.value) {
        return;
    }

    const firstName = item.value.firstName.trim();
    const lastName = item.value.lastName.trim();
    const email = item.value.email.trim();
    const startDate = item.value.startDate.trim();

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        jobTitleId: item.value.jobTitleId.trim(),
        costCenterId: item.value.costCenterId.trim(),
        managerId: item.value.managerId?.trim() ? item.value.managerId.trim() : null,
        firstName,
        lastName,
        employeeNumber: nullIfEmpty(item.value.employeeNumber ?? ''),
        email,
        phoneNumber: nullIfEmpty(item.value.phoneNumber ?? ''),
        companyProfileUrl: nullIfEmpty(item.value.companyProfileUrl ?? ''),
        jiraUserId: nullIfEmpty(item.value.jiraUserId ?? ''),
        githubUserId: nullIfEmpty(item.value.githubUserId ?? ''),
        slackUserId: nullIfEmpty(item.value.slackUserId ?? ''),
        teamsUserId: nullIfEmpty(item.value.teamsUserId ?? ''),
        startDate,
        endDate: item.value.endDate?.trim() ? item.value.endDate.trim() : null,
        salary: parseSalary()
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="880" scrollable>
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-account-plus</v-icon>Add Staff Member
            </v-btn>
        </template>

        <v-card>
            <v-card-title class="px-4 pt-6 justify-space-between d-flex align-center">
                <span class="text-h5">{{ formTitle }}</span>
                <v-btn @click="close" :disabled="props.saving" :ripple="false" density="compact" icon="mdi-close"></v-btn>
            </v-card-title>

            <v-card-text class="px-4">
                <v-alert v-if="props.error" type="error" variant="tonal" density="compact" class="mb-4">{{ props.error }}</v-alert>
                <v-form class="dialog_form" lazy-validation>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.firstName" label="First name" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.lastName" label="Last name" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.email" label="Email" type="email" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.employeeNumber" label="Employee number" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-combobox
                                v-model="item.jobTitleId"
                                :items="jobTitleOptions"
                                item-title="label"
                                item-value="value"
                                :return-object="false"
                                variant="outlined"
                                hide-details
                                label="Job title"
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-combobox
                                v-model="item.costCenterId"
                                :items="costCenterOptions"
                                item-title="label"
                                item-value="value"
                                :return-object="false"
                                variant="outlined"
                                hide-details
                                label="Cost center"
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-combobox
                                v-model="item.managerId"
                                :items="managerOptions"
                                item-title="label"
                                item-value="value"
                                :return-object="false"
                                variant="outlined"
                                hide-details
                                label="Manager"
                                clearable
                            />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.phoneNumber" label="Phone number" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.startDate" label="Start date" type="date" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.endDate" label="End date" type="date" clearable />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="salaryInput" label="Salary" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field variant="outlined" hide-details v-model="item.companyProfileUrl" label="Company profile URL" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.jiraUserId" label="Jira user ID" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.githubUserId" label="GitHub user ID" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.slackUserId" label="Slack user ID" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field variant="outlined" hide-details v-model="item.teamsUserId" label="Teams user ID" />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <div class="pa-4 d-flex justify-end gap-2">
                <v-spacer></v-spacer>
                <v-btn @click="close" :disabled="props.saving" class="bg-error px-3 rounded-pill">Cancel</v-btn>
                <v-btn
                    @click="save"
                    color="primary"
                    :loading="props.saving"
                    :disabled="!canSave || props.submitDisabled"
                    class="px-3 rounded-pill"
                >
                    Save
                </v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>
