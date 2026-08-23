<script setup lang="ts">
interface Props {
    title: string;
}

defineProps<Props>();
</script>

<template>
    <v-card elevation="10">
        <v-card-text>
            <slot name="header">
                <h5 class="text-h5 font-weight-semibold mb-7">{{ title }}</h5>
            </slot>
            <slot />
        </v-card-text>
    </v-card>
</template>

