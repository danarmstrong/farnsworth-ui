<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import JackHenryPageCard from '@/components/shared/JackHenryPageCard.vue';
import TeamCalendar from '@/features/jack-henry/calendars/team-calendar/components/TeamCalendar.vue';

const page = ref({ title: 'Team Calendar' });
const breadcrumbs = ref([
    {
        text: 'Calendars',
        disabled: false,
        href: '/calendars/team-calendar'
    },
    {
        text: 'Team Calendar',
        disabled: true,
        href: '#'
    }
]);
</script>
<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <JackHenryPageCard title="Team Calendar">
        <TeamCalendar />
    </JackHenryPageCard>
</template>
