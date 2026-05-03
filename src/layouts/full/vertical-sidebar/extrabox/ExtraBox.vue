<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/features/auth/stores/authStore';

const authStore = useAuthStore();

const displayName = computed(() => {
    const u = authStore.user;
    if (!u) return 'User';
    const parts = [u.firstName?.trim(), u.lastName?.trim()].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return u.email?.trim() || 'User';
});

const displayEmail = computed(() => authStore.user?.email?.trim() ?? '');
</script>

<template>
    <v-sheet rounded="md" color="lightprimary" class="pa-4 ExtraBox hide-menu">
        <div class="d-flex align-center justify-space-between">
            <div>
                <h6 class="text-h6 d-flex align-center font-weight-semibold">{{ displayName }}</h6>
                <span v-if="displayEmail" class="text-subtitle-2 font-weight-medium text-grey100">{{ displayEmail }}</span>
            </div>
            <div>
                <v-btn icon class="bg-lightprimary" flat size="small" @click="authStore.logout()">
                    <Icon icon="solar:logout-linear" class="text-primary" stroke-width="3" height="24" width="24" />
                </v-btn>
            </div>
        </div>
    </v-sheet>
</template>
<style lang="scss">
.ExtraBox {
    position: relative;
}

.line-height-none {
    line-height: normal;
}
</style>
