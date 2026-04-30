import 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        skip401Redirect?: boolean;
    }
}
