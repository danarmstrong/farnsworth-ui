<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUiStore } from '@/stores/ui';
import sidebarItems, { type menu } from './sidebarItems';
import { useCapProjectStore } from '@/features/jack-henry/cap-projects/stores/capProjectStore';
import { useJiraProjectStore } from '@/features/jack-henry/jira-projects/stores/jiraProjectStore';
import { useTeamStore } from '@/features/jack-henry/teams/stores/teamStore';

import NavGroup from './NavGroup/index.vue';
import NavItem from './NavItem/index.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import ExtraBox from './extrabox/ExtraBox.vue';
import Logo from '../logo/Logo.vue';

const ui = useUiStore();
const capProjectStore = useCapProjectStore();
const jiraProjectStore = useJiraProjectStore();
const teamStore = useTeamStore();

onMounted(() => {
    void capProjectStore.fetchCapProjects();
    void jiraProjectStore.fetchAllJiraProjects();
    if (!teamStore.teams.length) {
        void teamStore.fetchTeams();
    }
});

const navItems = computed(() => {
    const capReportChildren = [...capProjectStore.capProjects]
        .sort((a, b) => {
            const aLabel = (a.projectName || a.title || '').trim();
            const bLabel = (b.projectName || b.title || '').trim();
            return aLabel.localeCompare(bLabel, undefined, { sensitivity: 'base' });
        })
        .map((project) => ({
            title: (project.projectName || project.title || 'Untitled CAP Project').trim(),
            to: `/cap-reports/${project.id}`
        }));

    const teamChildren = [...teamStore.teams]
        .filter((team) => Boolean(team.id))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        .map((team) => ({
            title: team.name.trim() || 'Untitled Team',
            to: `/teams/${team.id}`
        }));

    const jiraChildren = [...jiraProjectStore.jiraProjects]
        .filter((project) => project.isEnabled && Boolean(project.id))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
        .map((project) => ({
            title: project.name.trim() || 'Untitled Jira Project',
            to: `/jira-projects/${project.id}`
        }));

    return sidebarItems
        .map((item): menu | null => {
        if (item.title === 'CAP Reports') {
            return {
                ...item,
                to: '/cap-reports',
                children: capReportChildren
            };
        }

        if (item.title === 'Teams') {
            return {
                ...item,
                children: teamChildren
            };
        }

        if (item.title === 'Jira') {
            if (!jiraChildren.length) {
                return null;
            }

            return {
                ...item,
                children: jiraChildren
            };
        }

        return item;
    })
        .filter((item): item is menu => item !== null);
});
</script>

<template>
    <v-navigation-drawer
        left
        v-model="ui.Sidebar_drawer"
        rail-width="70"
        app
        class="leftSidebar ms-lg-5 mt-sm-5 bg-containerBg"
        elevation="10"
        :rail="ui.mini_sidebar"
        expand-on-hover
        width="270"
    >
        <div class="pa-5 pl-4">
            <Logo />
        </div>
        <!-- ---------------------------------------------- -->
        <!---Navigation -->
        <!-- ---------------------------------------------- -->
        <perfect-scrollbar class="scrollnavbar bg-containerBg overflow-y-hidden">
            <v-list class="py-4 px-4 bg-containerBg">
                <!---Menu Loop -->
                <template v-for="item in navItems" :key="item.title || item.header">
                    <!---Item Sub Header -->
                    <NavGroup :item="item" v-if="item.header" :key="`header-${item.header}`" />
                    <!---If Has Child -->
                    <NavCollapse class="leftPadding" :item="item" :level="0" :key="`collapse-${item.title}`" v-else-if="item.children" />
                    <!---Single Item-->
                    <NavItem :item="item" :key="`item-${item.title}`" v-else class="leftPadding" />
                    <!---End Single Item-->
                </template>
                <!-- <Moreoption/> -->
            </v-list>
            <div class="pa-6 px-4 userbottom bg-containerBg mt-10">
                <ExtraBox />
            </div>
        </perfect-scrollbar>
    </v-navigation-drawer>
</template>
