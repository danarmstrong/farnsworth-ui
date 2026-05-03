<script setup lang="ts">
import { BrandSkypeIcon, MailIcon, MapPinIcon, PhoneIcon, IdIcon } from 'vue-tabler-icons';
import type { StaffMember } from '@/features/jack-henry/staff-members/types/StaffMember';

defineProps<{
    member: StaffMember;
}>();

function dash(value: string | null | undefined): string {
    return value?.trim() ? value : '—';
}
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card elevation="10" class="bg-surface">
                <v-card-item>
                    <h4 class="text-h5">Contact</h4>
                    <p v-if="member.employeeNumber" class="my-5 text-subtitle-1 lh-md font-weight-medium">
                        Employee #{{ member.employeeNumber }}
                    </p>
                    <v-divider v-if="member.employeeNumber" class="mb-4"></v-divider>
                    <h4 class="text-h5 mb-4">Details</h4>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lighterror">
                            <PhoneIcon size="20" stroke-width="1.5" class="text-error" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Phone</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ dash(member.phoneNumber) }}</p>
                        </div>
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightsuccess">
                            <MailIcon size="20" stroke-width="1.5" class="text-success" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Email</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ member.email }}</p>
                        </div>
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightprimary">
                            <MapPinIcon size="20" stroke-width="1.5" class="text-primary" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Company profile</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100 text-break">
                                <a
                                    v-if="member.companyProfileUrl"
                                    :href="member.companyProfileUrl"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-primary text-decoration-none"
                                >
                                    {{ member.companyProfileUrl }}
                                </a>
                                <template v-else>—</template>
                            </p>
                        </div>
                    </div>
                    <v-divider class="mb-4"></v-divider>
                    <h4 class="text-h5 mb-4">Integrations</h4>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightinfo">
                            <BrandSlackIcon size="20" stroke-width="1.5" class="text-info" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Slack</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ dash(member.slackUserId) }}</p>
                        </div>
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightindigo">
                            <BrandTeamsIcon size="20" stroke-width="1.5" class="text-indigo" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Teams</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                {{ dash(member.teamsUserId) }}
                            </p>
                        </div>
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightindigo">
                            <BrandGithubIcon size="20" stroke-width="1.5" class="text-indigo" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">GitHub</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                {{ dash(member.githubUserId) }}
                            </p>
                        </div>
                    </div>
                    <div class="d-flex align-center">
                        <v-avatar size="40" class="bg-lightindigo">
                            <BrandJiraIcon size="20" stroke-width="1.5" class="text-indigo" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Jira</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                {{ dash(member.jiraUserId) }}
                            </p>
                        </div>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>
