<script setup lang="ts">
import { computed } from 'vue';
import { format, parseISO, differenceInCalendarMonths } from 'date-fns';
import { CalendarIcon, IdIcon, ClockIcon } from 'vue-tabler-icons';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

const props = defineProps<{
    member: StaffMember;
}>();

const employeeDisplay = computed(() => props.member.employeeNumber?.trim() || '—');

const startDisplay = computed(() => {
    try {
        return format(parseISO(props.member.startDate), 'MMM d, yyyy');
    } catch {
        return props.member.startDate;
    }
});

const tenureDisplay = computed(() => {
    try {
        const start = parseISO(props.member.startDate);
        const end = props.member.endDate ? parseISO(props.member.endDate) : new Date();
        const months = differenceInCalendarMonths(end, start);
        if (months < 1) {
            return '< 1 mo';
        }
        const y = Math.floor(months / 12);
        const m = months % 12;
        const parts: string[] = [];
        if (y) {
            parts.push(`${y} yr${y === 1 ? '' : 's'}`);
        }
        if (m) {
            parts.push(`${m} mo`);
        }
        return parts.length ? parts.join(', ') : '< 1 mo';
    } catch {
        return '—';
    }
});
</script>

<template>
    <v-row class="justify-content-center mb-4">
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lightprimary">
                            <IdIcon size="24" stroke-width="1.5" class="text-primary" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ employeeDisplay }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Employee #</p>
                        </div>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lightsuccess">
                            <CalendarIcon size="24" stroke-width="1.5" class="text-success" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ startDisplay }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Start date</p>
                        </div>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
        <v-col cols="12" sm="4">
            <v-card elevation="10" class="bg-surface">
                <v-card-item class="py-6 px-md-6 px-5">
                    <div class="d-flex align-center">
                        <v-avatar size="48" class="bg-lighterror">
                            <ClockIcon size="24" stroke-width="1.5" class="text-error" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-h4 font-weight-semibold text-grey200 mb-1">{{ tenureDisplay }}</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">Tenure</p>
                        </div>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>
