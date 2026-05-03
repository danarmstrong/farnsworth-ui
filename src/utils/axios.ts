/**
 * axios setup to use mock service
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/';

const axiosServices = axios.create({
    baseURL
});

let handling401 = false;

axiosServices.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('accessToken') ?? localStorage.getItem('accessToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// interceptor for http
axiosServices.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const config = error.config;

        if (status === 401 && config && !config.skip401Redirect && !handling401) {
            handling401 = true;
            try {
                const { useAuthStore } = await import('@/features/auth/stores/authStore');
                useAuthStore().redirectToLoginAfterUnauthorized();
            } finally {
                handling401 = false;
            }
        }

        return Promise.reject((error.response && error.response.data) || 'Wrong Services');
    }
);

export default axiosServices;
