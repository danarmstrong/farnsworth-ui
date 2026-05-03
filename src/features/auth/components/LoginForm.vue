<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuthStore, REMEMBERED_LOGIN_EMAIL_KEY } from '@/features/auth/stores/authStore';
import { Form } from 'vee-validate';

const rememberMe = ref(true);
const password = ref('');
const emailAddress = ref('');
const passwordRules = ref([(v: string) => !!v || 'Password is required']);
const emailRules = ref([(v: string) => !!v || 'E-mail is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']);

onMounted(() => {
    const saved = localStorage.getItem(REMEMBERED_LOGIN_EMAIL_KEY);
    if (saved) {
        emailAddress.value = saved;
        rememberMe.value = true;
    }
});

function validate(_values: unknown, { setErrors }: { setErrors: (e: Record<string, string>) => void }) {
    const authStore = useAuthStore();
    return authStore
        .login({ email: emailAddress.value, password: password.value }, rememberMe.value)
        .catch((error) => setErrors({ apiError: error }));
}
</script>

<template>
    <Form @submit="validate" v-slot="{ errors, isSubmitting }" class="mt-5 w-100">
        <v-label class="text-subtitle-1 font-weight-semibold pb-2 text-grey200">Email</v-label>
        <VTextField v-model="emailAddress" :rules="emailRules" class="mb-2" required hide-details="auto" />
        <v-label class="text-subtitle-1 font-weight-semibold pb-2 text-grey200">Password</v-label>
        <VTextField v-model="password" :rules="passwordRules" required hide-details="auto" type="password" class="pwdInput" />
        <div class="d-flex align-center justify-space-between flex-wrap w-100 my-3 ga-2">
            <div class="d-flex align-center ga-2">
                <v-checkbox v-model="rememberMe" hide-details color="primary" density="comfortable">
                    <template #label>Remember me</template>
                </v-checkbox>
                <span class="text-medium-emphasis text-body-1 user-select-none" aria-hidden="true">|</span>
            </div>
            <RouterLink
                to="/auth/forgot-password"
                class="text-primary text-decoration-none text-body-1 opacity-1 font-weight-medium text-no-wrap"
            >
                Forgot password?
            </RouterLink>
        </div>
        <v-btn size="large" rounded="pill" :loading="isSubmitting" color="primary" block type="submit" flat>Sign In</v-btn>
        <div v-if="errors.apiError" class="mt-2">
            <v-alert color="error">{{ errors.apiError }}</v-alert>
        </div>
    </Form>
</template>
