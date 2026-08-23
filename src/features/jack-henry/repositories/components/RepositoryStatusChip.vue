<script setup lang="ts">
import type { RepositoryStatusTone } from '@/features/jack-henry/repositories/utils/repositoryStatusPresentation';

interface Props {
    label: string;
    tone?: RepositoryStatusTone;
    color?: RepositoryStatusTone | string;
    size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large';
}

const props = withDefaults(defineProps<Props>(), {
    tone: 'default',
    color: '',
    size: 'small'
});
</script>

<template>
    <v-chip :size="props.size" :color="props.color || props.tone" variant="tonal">
        {{ props.label }}
    </v-chip>
</template>


