<script setup lang="ts">
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

const props = defineProps<{
    member: StaffMember;
}>();

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

const salaryDisplay = computed(() => {
    if (props.member.salary == null) {
        return '—';
    }
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
        props.member.salary
    );
});
</script>

<template>
    <v-card elevation="10" class="bg-surface">
        <v-card-item>
            <h4 class="text-h5 mb-4">Employment</h4>
            <v-table density="comfortable" class="text-subtitle-1">
                <tbody>
                    <tr>
                        <td class="text-grey200 font-weight-semibold" style="width: 40%">Start date</td>
                        <td>{{ formatDate(member.startDate) }}</td>
                    </tr>
                    <tr>
                        <td class="text-grey200 font-weight-semibold">End date</td>
                        <td>{{ formatDate(member.endDate) }}</td>
                    </tr>
                    <tr>
                        <td class="text-grey200 font-weight-semibold">Salary</td>
                        <td>{{ salaryDisplay }}</td>
                    </tr>
                </tbody>
            </v-table>
        </v-card-item>
    </v-card>
</template>
