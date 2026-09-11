<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AreaMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->global_role !== 'area' && $user->global_role !== 'superadmin') {
            abort(403, 'Acceso denegado: Se requiere rol de Área.');
        }

        if (! $user->is_active) {
            auth()->logout();
            return redirect()->route('login')->withErrors(['email' => 'Tu cuenta de Área está inactiva.']);
        }

        $area = $user->area;
        if (! $area && $user->global_role === 'area') {
            abort(403, 'No se encontró la configuración de Área asociada a este usuario.');
        }

        if ($area && ! $area->is_active) {
            auth()->logout();
            return redirect()->route('login')->withErrors(['email' => 'Esta Área se encuentra desactivada.']);
        }

        if ($area) {
            $request->attributes->add(['area' => $area, 'area_id' => $area->id]);
        }

        return $next($request);
    }
}
