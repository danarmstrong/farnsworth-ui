<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { BuildingIcon, IdIcon, UsersIcon } from 'vue-tabler-icons';

defineProps<{
    jobTitleLabel: string;
    costCenterLabel: string;
    managerLabel: string;
    managerId: string | null;
}>();
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-card elevation="10" class="bg-surface">
                <v-card-item>
                    <h4 class="text-h5 mb-4">Organization</h4>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightinfo">
                            <IdIcon size="20" stroke-width="1.5" class="text-info" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Job title</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ jobTitleLabel }}</p>
                        </div>
                    </div>
                    <div class="d-flex align-center mb-5">
                        <v-avatar size="40" class="bg-lightprimary">
                            <BuildingIcon size="20" stroke-width="1.5" class="text-primary" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Cost center</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">{{ costCenterLabel }}</p>
                        </div>
                    </div>
                    <div class="d-flex align-center">
                        <v-avatar size="40" class="bg-lightsuccess">
                            <UsersIcon size="20" stroke-width="1.5" class="text-success" />
                        </v-avatar>
                        <div class="ml-3">
                            <h5 class="text-subtitle-1 font-weight-semibold text-grey200 mb-1">Manager</h5>
                            <p class="text-subtitle-1 font-weight-medium text-grey100">
                                <RouterLink
                                    v-if="managerId"
                                    :to="{ name: 'Staff Member Detail', params: { id: managerId } }"
                                    class="text-primary text-decoration-none font-weight-medium"
                                >
                                    {{ managerLabel }}
                                </RouterLink>
                                <template v-else>{{ managerLabel }}</template>
                            </p>
                        </div>
                    </div>
                </v-card-item>
            </v-card>
        </v-col>
    </v-row>
</template>
