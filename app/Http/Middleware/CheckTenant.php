<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->global_role === 'superadmin') {
            $tenantUser = $user->tenantUsers()->where('is_active', true)->first();
            if (! $tenantUser) {
                return redirect()->route('superadmin.dashboard')
                    ->with('error', 'El rol SuperAdmin gestiona la plataforma desde el panel de administración global. Para operar una clínica específica, inicia sesión con las credenciales de dicha clínica.');
            }
            $request->attributes->add(['tenant_id' => $tenantUser->tenant_id]);
            return $next($request);
        }

        if ($user->global_role === 'area') {
            $impersonatedTenantId = $request->session()->get('area_impersonated_tenant_id');
            $area = $user->area;
            if ($impersonatedTenantId && $area && $area->tenants()->where('tenants.id', $impersonatedTenantId)->exists()) {
                $request->attributes->add(['tenant_id' => $impersonatedTenantId]);
                return $next($request);
            }
            return redirect()->route('area.dashboard')
                ->with('error', 'Selecciona un consultorio desde tu panel de Área para ingresar.');
        }

        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();

        if (! $tenantUser) {
            Auth::logout();
            return redirect()->route('login')
                ->withErrors(['email' => 'Tu cuenta no está asociada a ninguna clínica activa.']);
        }

        // Inject tenant_id into request attributes for controllers
        $request->attributes->add(['tenant_id' => $tenantUser->tenant_id]);

        return $next($request);
    }
}
