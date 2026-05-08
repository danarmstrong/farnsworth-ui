<script setup>
import { computed } from 'vue';
import LogoLight from './LogoLight.vue';
import LogoDark from './LogoDark.vue';
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();

//const dark = ref(false);
const dark = computed(() => {
    if (
        ui.actTheme === 'DARK_BLUE_THEME' ||
        ui.actTheme === 'DARK_AQUA_THEME' ||
        ui.actTheme === 'DARK_ORANGE_THEME' ||
        ui.actTheme === 'DARK_PURPLE_THEME' ||
        ui.actTheme === 'DARK_GREEN_THEME' ||
        ui.actTheme === 'DARK_CYAN_THEME'
    ) {
        return true;
    } else {
        return false;
    }
});
</script>
<template>
    <div>
        <LogoLight v-if="dark" />
        <LogoDark v-else />
    </div>
</template>
