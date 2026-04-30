/**
 * axios setup to use mock service
 */

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/';

const axiosServices = axios.create({
    baseURL
});

axiosServices.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// interceptor for http
axiosServices.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject((error.response && error.response.data) || 'Wrong Services')
);

export default axiosServices;
