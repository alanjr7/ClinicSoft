<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     * These are accessible in every Inertia page via usePage().props
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $authData = null;

        if ($user) {
            $impersonatedTenantId = $request->session()->get('area_impersonated_tenant_id');
            $isAreaImpersonating = false;
            $areaName = null;
            $impersonatedTenantName = null;

            if ($user->global_role === 'area') {
                $area = $user->area;
                $areaName = $area?->name;

                if ($impersonatedTenantId) {
                    $tenant = \App\Models\Tenant::find($impersonatedTenantId);
                    if ($tenant) {
                        $tenantId   = $tenant->id;
                        $tenantName = $tenant->name;
                        $role       = 'admin';
                        $isAreaImpersonating = true;
                        $impersonatedTenantName = $tenant->name;
                    }
                } else {
                    $tenantId   = null;
                    $tenantName = $areaName;
                    $role       = 'area_admin';
                }
                $permissions = [];
            } else {
                $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
                $tenantId   = $tenantUser?->tenant_id;
                $tenantName = $tenantUser?->tenant?->name;
                $role       = $tenantUser?->role;
                if ($role === 'dentist') {
                    $role = 'doctor';
                }

                $permissions = [];
                if (in_array($role, ['doctor', 'staff', 'asistente']) && $tenantId) {
                    $permissions = $user->modulePermissions()
                        ->where('tenant_id', $tenantId)
                        ->where('is_enabled', true)
                        ->pluck('module')
                        ->toArray();
                }
            }

            $authData = [
                'id'          => $user->id,
                'email'       => $user->email,
                'first_name'  => $user->first_name,
                'last_name'   => $user->last_name,
                'phone'       => $user->phone,
                'avatar_url'  => $user->avatar_url,
                'global_role' => $user->global_role,
                'tenant_id'   => $tenantId,
                'tenant_name' => $tenantName,
                'area_name'   => $areaName,
                'role'        => $role,
                'permissions' => $permissions,
            ];
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $authData,
            ],
            'area_impersonation' => [
                'is_active'   => (bool) ($isAreaImpersonating ?? false),
                'tenant_name' => $impersonatedTenantName ?? null,
                'area_name'   => $areaName ?? null,
            ],
            'is_demo_mode' => (bool) $request->session()->get('is_demo_mode', false),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'new_budget_id' => fn () => $request->session()->get('new_budget_id'),
                'new_payment_id' => fn () => $request->session()->get('new_payment_id'),
            ],
        ]);
    }
}
