<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Patient;

class PatientPortalMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        $tenantUser = $user->tenantUsers()->where('is_active', true)->first();

        if (! $tenantUser) {
            Auth::logout();
            return redirect()->route('login')
                ->withErrors(['email' => 'Tu cuenta no está asociada a ninguna clínica activa.']);
        }

        if ($tenantUser->role !== 'patient') {
            return redirect()->route('dashboard');
        }

        $patient = Patient::where('tenant_id', $tenantUser->tenant_id)
            ->where('user_id', $user->id)
            ->first();

        if (! $patient) {
            // Edge-case recovery: try linking by email within same tenant
            $patient = Patient::where('tenant_id', $tenantUser->tenant_id)
                ->where('email', $user->email)
                ->first();

            if ($patient) {
                $patient->user_id = $user->id;
                $patient->save();
            } else {
                Auth::logout();
                return redirect()->route('login')
                    ->withErrors(['email' => 'No se encontró la ficha de paciente correspondiente a este usuario.']);
            }
        }

        $request->attributes->add([
            'tenant_id' => $tenantUser->tenant_id,
            'patient'   => $patient,
        ]);

        return $next($request);
    }
}

