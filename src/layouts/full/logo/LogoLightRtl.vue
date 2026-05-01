<script setup lang="ts">
import { RouterLink } from 'vue-router';
import logo from '@/assets/images/logos/farnsworth-logo.png';
</script>
<template>
    <div class="logo">
        <RouterLink to="/">
            <img :src="logo" alt="home" />
        </RouterLink>
    </div>
</template>
