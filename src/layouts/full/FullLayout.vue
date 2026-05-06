<script setup lang="ts">
import { RouterView } from 'vue-router';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import HorizontalHeader from './horizontal-header/HorizontalHeader.vue';
import HorizontalSidebar from './horizontal-sidebar/HorizontalSidebar.vue';
import Customizer from './customizer/Customizer.vue';
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue';
import { useCustomizerStore } from '../../stores/customizer';
const customizer = useCustomizerStore();
</script>

<template>
    <!-----RTL LAYOUT------->
    <v-locale-provider v-if="customizer.setRTLLayout" rtl>
        <v-app
            :theme="customizer.actTheme"
            :class="[
                customizer.actTheme,
                customizer.mini_sidebar ? 'mini-sidebar' : '',
                customizer.setHorizontalLayout ? 'horizontalLayout' : 'verticalLayout',
                customizer.setBorderCard ? 'cardBordered' : ''
            ]"
        >
            <VerticalSidebarVue v-if="!customizer.setHorizontalLayout" />
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'"><VerticalHeaderVue v-if="!customizer.setHorizontalLayout" /></div>
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'"><HorizontalHeader v-if="customizer.setHorizontalLayout" /></div>
            <HorizontalSidebar v-if="customizer.setHorizontalLayout" />

            <v-main>
                <div class="rtl-lyt mb-3 hr-layout">
                    <v-container fluid class="page-wrapper px-sm-5 px-4 pt-12 rounded-xl">
                        <div class="">
                            <div :class="customizer.boxed ? 'maxWidth' : ''">
                                <RouterView />
                            </div>
                        </div>
                    </v-container>
                </div>
            </v-main>
            <ConfirmDialog />
        </v-app>
    </v-locale-provider>

    <!-----LTR LAYOUT------->
    <v-locale-provider v-else>
        <v-app
            :theme="customizer.actTheme"
            :class="[
                customizer.actTheme,
                customizer.mini_sidebar ? 'mini-sidebar' : '',
                customizer.setHorizontalLayout ? 'horizontalLayout' : 'verticalLayout',
                customizer.setBorderCard ? 'cardBordered' : ''
            ]"
        >
            <VerticalSidebarVue v-if="!customizer.setHorizontalLayout" />
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'"><VerticalHeaderVue v-if="!customizer.setHorizontalLayout" /></div>
            <div :class="customizer.boxed ? 'maxWidth' : 'full-header'"><HorizontalHeader v-if="customizer.setHorizontalLayout" /></div>
            <HorizontalSidebar v-if="customizer.setHorizontalLayout" />

            <v-main>
                <div class="mb-3 hr-layout">
                    <v-container fluid class="page-wrapper px-sm-5 px-4 pt-12 rounded-xl">
                        <div class="">
                            <div :class="customizer.boxed ? 'maxWidth' : ''">
                                <RouterView />
                            </div>
                        </div>
                    </v-container>
                </div>
            </v-main>
            <ConfirmDialog />
        </v-app>
    </v-locale-provider>
</template>
