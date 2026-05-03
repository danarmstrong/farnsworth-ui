import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import '@/scss/style.scss';
import PerfectScrollbar from 'vue3-perfect-scrollbar';
import VueApexCharts from 'vue3-apexcharts';
import VueTablerIcons from 'vue-tabler-icons';
import 'vue3-carousel/dist/carousel.css';
import Maska from 'maska';

//LightBox
import VueEasyLightbox from 'vue-easy-lightbox';

//ScrollTop
import VueScrollTo from 'vue-scrollto';

async function bootstrap() {
    const enableMocks = import.meta.env.VITE_ENABLE_MOCKS === 'true';

    if (enableMocks) {
        // Load mock layers only when explicitly enabled.
        await import('./_mockApis');
        const { fakeBackend } = await import('@/utils/helpers/fake-backend');
        fakeBackend();
    }

    const app = createApp(App);
    app.use(router);

    app.use(PerfectScrollbar);
    app.use(createPinia());
    app.use(VueTablerIcons);
    // app.use(print);
    app.use(Maska);
    app.use(VueApexCharts);
    app.use(VueEasyLightbox);
    //ScrollTop Use
    // app.use(VueScrollTo);
    app.use(VueScrollTo, {
        duration: 1000,
        easing: 'ease',
        offset: -50
    });

    app.use(vuetify).mount('#app');
}

bootstrap();
