import { defineStore } from 'pinia';
import { router } from '@/router';
import axios from '@/utils/axios';
import type { AuthUser, LoginDto, User } from '@/features/auth/types/AuthUser';
import { ref } from 'vue';

const authPath = '/auth/login';

function getStoredUser(): User | null {
    const raw: string | null = localStorage.getItem('user');
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('user');
        return null;
    }
}

function getAccessToken(): string | null {
    return localStorage.getItem('accessToken') ?? null;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(getStoredUser());
    const accessToken = ref<string | null>(getAccessToken());
    const returnUrl = ref<string | null>(null);
    const loading = ref(false);

    async function login(loginDto: LoginDto) {
        loading.value = true;
        try {
            const { data } = await axios.post<AuthUser>(authPath, loginDto);
            user.value = data.user;
            accessToken.value = data.accessToken;
            localStorage.setItem('user', JSON.stringify(user.value));
            localStorage.setItem('accessToken', accessToken.value);
            await router.push(returnUrl.value || '/dashboard1');
        } catch (error: any) {
            const message = error?.message || error?.error || (typeof error === 'string' ? error : 'Login failed');
            return Promise.reject(message);
        } finally {
            loading.value = false;
        }
    }

    function logout() {
        user.value = null;
        accessToken.value = null;
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        router.push('/');
    }

    return {
        user,
        accessToken,
        returnUrl,
        login,
        logout
    };
});
