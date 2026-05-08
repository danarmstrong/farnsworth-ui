<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useCapProjectStore } from '@/features/jack-henry/cap-projects/stores/capProjectStore';
import sidebarItems, { type menu } from './sidebarItems';

import NavGroup from './NavGroup/index.vue';
import NavItem from './NavItem/index.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import ExtraBox from './extrabox/ExtraBox.vue';
import Moreoption from './MoreOption/Moreoption.vue';
import Logo from '../logo/Logo.vue';
import { Icon } from '@iconify/vue';

const ui = useUiStore();
const capProjectStore = useCapProjectStore();

onMounted(() => {
    void capProjectStore.fetchCapProjects();
});

const sidebarMenu = computed((): menu[] =>
    sidebarItems.map((item) => {
        if (item.dynamicCapProjects) {
            return {
                ...item,
                children: capProjectStore.capProjects.map((p) => ({
                    title: p.projectName,
                    to: `/admin/cap-projects?projectId=${encodeURIComponent(p.id)}`
                }))
            };
        }
        return item;
    })
);
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
                <template v-for="(item, i) in sidebarMenu">
                    <!---Item Sub Header -->
                    <NavGroup :item="item" v-if="item.header" :key="item.title" />
                    <!---If Has Child -->
                    <NavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
                    <!---Single Item-->
                    <NavItem :item="item" v-else class="leftPadding" />
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
