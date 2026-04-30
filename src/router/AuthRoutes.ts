const AuthRoutes = {
    path: '/auth',
    component: () => import('@/layouts/blank/BlankLayout.vue'),
    meta: {
        requiresAuth: false
    },
    children: [
        {
            name: 'Landing Page',
            path: '/',
            redirect: '/dashboard1'
            //component: () => import('@/views/pages/landingpage/index.vue')
        },
        {
            name: 'FrontPage',
            path: '/front-page/homepage',
            component: () => import('@/views/pages/front-pages/Landingpage.vue')
        },
        {
            name: 'About Us',
            path: '/front-page/about-us',
            component: () => import('@/views/pages/front-pages/Aboutpage.vue')
        },
        {
            name: 'Contact',
            path: '/front-page/contact-us',
            component: () => import('@/views/pages/front-pages/Contactpage.vue')
        },
        {
            name: 'Pricing1',
            path: '/front-page/pricing',
            component: () => import('@/views/pages/front-pages/PackagePricing.vue')
        },
        {
            name: 'Portfolio',
            path: '/front-page/portfolio',
            component: () => import('@/views/pages/front-pages/Portfolio.vue')
        },
        {
            name: 'Blog',
            path: '/front-page/blog/posts',
            component: () => import('@/views/pages/front-pages/BlogPage.vue')
        },
        {
            name: 'Blog Details',
            path: '/front-page/blog/:id',
            component: () => import('@/views/pages/front-pages/BlogDetails.vue')
        },
        {
            name: 'Boxed Login',
            path: '/auth/login',
            component: () => import('../views/auth/LoginView.vue')
        },
        {
            name: 'Boxed Register',
            path: '/auth/register',
            component: () => import('../views/auth/RegisterView.vue')
        },
        {
            name: 'Boxed Forgot Password',
            path: '/auth/forgot-password',
            component: () => import('../views/auth/ForgotPasswordView.vue')
        },
        {
            name: 'Boxed Two Steps',
            path: '/auth/two-step',
            component: () => import('../views/auth/TwoFactorView.vue')
        },
        {
            name: 'Error',
            path: '/auth/404',
            component: () => import('../views/Error.vue')
        },
        {
            name: 'Maintenance',
            path: '/auth/maintenance',
            component: () => import('../views/Maintenance.vue')
        }
    ]
};

export default AuthRoutes;
