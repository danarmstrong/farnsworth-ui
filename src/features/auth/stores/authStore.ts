import { defineStore } from 'pinia';
import { router } from '@/router';
import axios from '@/utils/axios';
import type { AuthUser, LoginDto, User } from '@/features/auth/types/AuthUser';
import { ref } from 'vue';

const authPath = '/auth/login';
const USER_KEY = 'user';
const TOKEN_KEY = 'accessToken';

/** Email hint for the login form after a successful "remember me" login (localStorage only). */
export const REMEMBERED_LOGIN_EMAIL_KEY = 'rememberedLoginEmail';

function clearPersistedAuth() {
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem(USER_KEY);
        storage.removeItem(TOKEN_KEY);
    }
}

function tryLoadFrom(storage: Storage): { user: User; accessToken: string } | null {
    const token = storage.getItem(TOKEN_KEY);
    const raw = storage.getItem(USER_KEY);
    if (!token || !raw) return null;
    try {
        return { user: JSON.parse(raw) as User, accessToken: token };
    } catch {
        storage.removeItem(USER_KEY);
        storage.removeItem(TOKEN_KEY);
        return null;
    }
}

/** Session bucket first so a tab-scoped login wins over stale local data. */
function loadPersistedAuth(): { user: User; accessToken: string } | null {
    return tryLoadFrom(sessionStorage) ?? tryLoadFrom(localStorage);
}

const initialAuth = loadPersistedAuth();

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(initialAuth?.user ?? null);
    const accessToken = ref<string | null>(initialAuth?.accessToken ?? null);
    const returnUrl = ref<string | null>(null);
    const loading = ref(false);

    async function login(loginDto: LoginDto, rememberMe = true) {
        loading.value = true;
        try {
            const { data } = await axios.post<AuthUser>(authPath, loginDto, { skip401Redirect: true });
            user.value = data.user;
            accessToken.value = data.accessToken;
            clearPersistedAuth();
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(USER_KEY, JSON.stringify(user.value));
            storage.setItem(TOKEN_KEY, accessToken.value);
            if (rememberMe) {
                localStorage.setItem(REMEMBERED_LOGIN_EMAIL_KEY, loginDto.email.trim());
            } else {
                localStorage.removeItem(REMEMBERED_LOGIN_EMAIL_KEY);
            }
            await router.push(returnUrl.value || '/dashboard1');
        } catch (error: any) {
            const message = error?.message || error?.error || (typeof error === 'string' ? error : 'Login failed');
            return Promise.reject(message);
        } finally {
            loading.value = false;
        }
    }

    function clearSession() {
        user.value = null;
        accessToken.value = null;
        clearPersistedAuth();
    }

    /** Clears session and sends user to login (e.g. explicit logout). */
    function logout() {
        returnUrl.value = null;
        clearSession();
        router.replace('/auth/login');
    }

    /** Clears session after API 401; preserves return path for post-login redirect. */
    function redirectToLoginAfterUnauthorized() {
        const path = router.currentRoute.value.fullPath;
        if (!path.startsWith('/auth/login')) {
            returnUrl.value = path;
        }
        clearSession();
        router.replace('/auth/login');
    }

    return {
        user,
        accessToken,
        returnUrl,
        login,
        logout,
        redirectToLoginAfterUnauthorized
    };
});
