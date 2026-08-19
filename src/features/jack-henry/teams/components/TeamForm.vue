<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStaffMemberStore } from '@/features/jack-henry/staff-members/stores/staffMemberStore';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';
import type { SelectOption } from '@/types/SelectOption';
import type { TeamDto } from '@/features/jack-henry/teams/types/Team';

type TeamFormSubmitPayload = {
    id?: string;
    name: string;
    staffMemberIds: string[];
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
    submit: [payload: TeamFormSubmitPayload];
    cancel: [];
}>();

const dialog = ref(false);
const mode = ref<'create' | 'edit'>('create');
const staffMemberStore = useStaffMemberStore();

const item = ref<TeamDto>({
    id: '',
    name: '',
    staffMemberIds: []
});

const formTitle = computed(() => (mode.value === 'create' ? 'New Team' : 'Edit Team'));
const canSave = computed(() => Boolean(item.value.name.trim()));

const staffMemberOptions = computed<SelectOption<string>[]>(() => {
    return staffMemberStore.staffMembers.map((staffMember) => ({
        label: formatStaffMember(staffMember),
        value: staffMember.id
    }));
});

onMounted(() => {
    if (!staffMemberStore.staffMembers.length) {
        void staffMemberStore.fetchStaffMembers();
    }
});

function formatStaffMember(m: StaffMember): string {
    return [m.firstName, m.lastName].filter(Boolean).join(' ') + (m.employeeNumber ? ` (${m.employeeNumber})` : '');
}

function resetForm() {
    item.value = {
        id: '',
        name: '',
        staffMemberIds: []
    };
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

function openEdit(team: TeamDto) {
    mode.value = 'edit';
    item.value = {
        ...team,
        staffMemberIds: [...team.staffMemberIds]
    };
    dialog.value = true;
}

function save() {
    const name = item.value.name.trim();
    if (!name) {
        return;
    }

    emit('submit', {
        id: mode.value === 'edit' ? item.value.id : undefined,
        name,
        staffMemberIds: [...item.value.staffMemberIds]
    });
}

defineExpose({
    openCreate,
    openEdit,
    close
});
</script>

<template>
    <v-dialog v-model="dialog" max-width="640" scrollable>
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn color="primary" v-bind="activatorProps" rounded="pill" class="ml-auto" @click="openCreate">
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>Add Team
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
                        <v-col cols="12">
                            <v-text-field variant="outlined" hide-details v-model="item.name" label="Team name" />
                        </v-col>
                        <v-col cols="12">
                            <v-autocomplete
                                v-model="item.staffMemberIds"
                                :items="staffMemberOptions"
                                item-title="label"
                                item-value="value"
                                variant="outlined"
                                hide-details="auto"
                                label="Staff members"
                                multiple
                                chips
                                closable-chips
                                clearable
                            />
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

