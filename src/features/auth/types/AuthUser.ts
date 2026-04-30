export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface AuthUser {
    user: User;
    accessToken: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export type CreateUserDto = Omit<User, 'id'>;