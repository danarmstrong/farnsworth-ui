import { defineStore } from 'pinia';
import { router } from '@/router';
import axios from '@/utils/axios';

const authPath = '/auth/login';

type AuthUser = {
    id?: string | number;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
};

function getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('user');
        return null;
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: getStoredUser(),
        returnUrl: null as string | null
    }),
    actions: {
        async login(username: string, password: string) {
            try {
                const response = await axios.post(authPath, { username, password });
                const payload = response.data || {};
                const token = payload.accessToken || payload.token || payload.jwt;

                if (!token) {
                    return Promise.reject('Login response did not include an access token');
                }

                const userProfile = payload.user || {};
                const user: AuthUser = {
                    ...userProfile,
                    username: userProfile.username || username,
                    token,
                    accessToken: payload.accessToken,
                    refreshToken: payload.refreshToken
                };

                this.user = user;
                localStorage.setItem('user', JSON.stringify(user));

                router.push(this.returnUrl || '/dashboard1');
            } catch (error: any) {
                const message = error?.message || error?.error || (typeof error === 'string' ? error : 'Login failed');
                return Promise.reject(message);
            }
        },
        logout() {
            this.user = null;
            localStorage.removeItem('user');
            router.push('/');
        }
    }
});
