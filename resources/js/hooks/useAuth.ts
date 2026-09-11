/**
 * useAuth — reads the auth.user shared prop injected by HandleInertiaRequests.
 * No HTTP calls, no localStorage tokens. The user data comes directly from the server.
 */
import { usePage, router } from '@inertiajs/react';

export interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
    avatar_url: string | null;
    global_role: 'superadmin' | 'user';
    tenant_id: string | null;
    tenant_name: string | null;
    role: 'owner' | 'admin' | 'doctor' | 'dentist' | 'staff' | null;
    permissions: string[];
}

export type AppModule =
    | 'patients' | 'appointments' | 'surgeries' | 'clinical' | 'clinical_history'
    | 'budgets' | 'payments' | 'inventory' | 'reports' | 'settings' | 'accounting';

export function useAuth() {
    const { auth } = usePage<{ auth: { user: AuthUser | null } }>().props;
    const user = auth?.user ?? null;

    const logout = () => {
        router.post('/logout');
    };

    const hasModule = (module: AppModule): boolean => {
        if (!user) return false;
        if (user.global_role === 'superadmin') return false;
        if (user.role === 'doctor' || user.role === 'dentist' || user.role === 'admin' || user.role === 'owner') return true;
        return user.permissions.includes(module);
    };

    return {
        user,
        isAuthenticated: !!user,
        logout,
        hasModule,
    };
}
