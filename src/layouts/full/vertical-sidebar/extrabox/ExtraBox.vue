<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
    <v-sheet rounded="md" color="lightprimary" class="pa-4 ExtraBox hide-menu">
        <div class="d-flex align-center justify-space-between">
            <div>
                <h6 class="text-h6 d-flex align-center font-weight-semibold">Mike Nielsen</h6>
                <span class="text-subtitle-2 font-weight-medium text-grey100">Admin</span>
            </div>
            <div>
                <v-btn icon class="bg-lightprimary" flat size="small">
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
