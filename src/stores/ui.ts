import { defineStore } from 'pinia';
import config from '@/config';

export const useUiStore = defineStore('ui', {
    state: () => ({
        Sidebar_drawer: config.Sidebar_drawer,
        mini_sidebar: config.mini_sidebar,
        actTheme: config.actTheme,
        boxed: config.boxed,
        setBorderCard: config.setBorderCard
    }),

    getters: {},
    actions: {
        SET_SIDEBAR_DRAWER() {
            this.Sidebar_drawer = !this.Sidebar_drawer;
        },
        SET_MINI_SIDEBAR(payload: boolean) {
            this.mini_sidebar = payload;
        },
        SET_THEME(payload: string) {
            this.actTheme = payload;
        },
        SET_CARD_BORDER(payload: boolean) {
            this.setBorderCard = payload;
        }
    }
});
