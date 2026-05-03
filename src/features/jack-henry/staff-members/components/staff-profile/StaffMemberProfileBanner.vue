<script setup lang="ts">
import { computed } from 'vue';
import { PlusIcon } from 'vue-tabler-icons';
import profileBg from '@/assets/images/backgrounds/profilebg-2.jpg';
import UserImage from '@/assets/images/profile/user6.jpg';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

const props = defineProps<{
    member: StaffMember;
    jobTitleLabel: string;
}>();

const displayName = computed(() => `${props.member.firstName} ${props.member.lastName}`.trim() || props.member.email);

const isActive = computed(() => !props.member.endDate);
</script>

<template>
    <div>
        <v-card elevation="10" class="overflow-hidden">
            <v-card-item class="pb-6">
                <v-row class="mt-1 justify-space-between">
                    <v-col cols="12" md="12" sm="12" class="pt-0">
                        <div class="d-sm-flex align-center justify-sm-start justify-center">
                            <div class="text-sm-left text-center">
                                <v-avatar size="100" class="userImage position-relative overflow-visible">
                                    <img :src="UserImage" width="100" :alt="displayName" class="rounded-circle" />
                                    <v-avatar size="26" class="bg-primary position-absolute plus">
                                        <PlusIcon size="16" stroke-width="2" />
                                    </v-avatar>
                                </v-avatar>
                            </div>
                            <div class="ml-sm-4 text-sm-left text-center">
                                <h5 class="text-h3 font-weight-semibold mb-1 my-sm-0 my-2">
                                    {{ displayName }}
                                    <v-chip
                                        v-if="member.employeeNumber"
                                        color="primary"
                                        class="bg-lightprimary font-weight-semibold ml-2 mt-n1"
                                        variant="outlined"
                                        size="x-small"
                                    >
                                        {{ member.employeeNumber }}
                                    </v-chip>
                                </h5>
                                <span class="text-h6 font-weight-medium text-grey100">{{ jobTitleLabel }}</span>
                                <div
                                    class="text-subtitle-1 font-weight-semibold text-grey200 d-flex align-center mt-1 justify-sm-start justify-center"
                                >
                                    <div
                                        class="pa-1 rounded-circle mr-2"
                                        :class="isActive ? 'bg-success' : 'bg-grey'"
                                    ></div>
                                    {{ isActive ? 'Active' : 'Inactive' }}
                                </div>
                            </div>
                        </div>
                    </v-col>
                </v-row>
            </v-card-item>
        </v-card>
    </div>
</template>

<style lang="scss" scoped>
.plus {
    bottom: 0;
    right: 0;
    border: 2px solid #fff;
}
</style>
