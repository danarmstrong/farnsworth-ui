<script setup lang="ts">
import StaffMemberProfileBanner from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberProfileBanner.vue';
import StaffMemberIntroCard from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberIntroCard.vue';
import StaffMemberOrgCard from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberOrgCard.vue';
import StaffMemberSummaryCards from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberSummaryCards.vue';
import StaffMemberEmploymentCard from '@/features/jack-henry/staff-members/components/staff-profile/StaffMemberEmploymentCard.vue';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

defineProps<{
    member: StaffMember;
    jobTitleLabel: string;
    costCenterLabel: string;
    managerLabel: string;
}>();
</script>

<template>
    <StaffMemberProfileBanner :member="member" :job-title-label="jobTitleLabel" />
    <div class="mx-sm-4">
        <v-row class="mt-4">
            <v-col cols="12" lg="4" md="4">
                <StaffMemberIntroCard :member="member" />
                <StaffMemberOrgCard
                    :job-title-label="jobTitleLabel"
                    :cost-center-label="costCenterLabel"
                    :manager-label="managerLabel"
                    :manager-id="member.managerId"
                />
            </v-col>
            <v-col cols="12" lg="8" md="8">
                <StaffMemberSummaryCards :member="member" />
                <StaffMemberEmploymentCard :member="member" />
            </v-col>
        </v-row>
    </div>
</template>
