// A placeholder for server-side session logic
import { cookies } from 'next/headers';
import type { Pengurus } from './types';

type UserInContext = Omit<Pengurus, 'password'>;

export async function getCurrentUser(): Promise<UserInContext | null> {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('rt-user');

    if (userCookie?.value) {
        try {
            return JSON.parse(userCookie.value) as UserInContext;
        } catch (e) {
            console.error('Failed to parse user cookie', e);
            return null;
        }
    }
    return null;
}
