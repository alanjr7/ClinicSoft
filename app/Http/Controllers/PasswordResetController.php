<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use Inertia\Inertia;

class PasswordResetController extends Controller
{
    /**
     * Show the "Forgot Password" form.
     */
    public function showForgotPassword()
    {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->global_role === 'superadmin') {
                return redirect()->route('superadmin.dashboard');
            }
            if ($user->global_role === 'area') {
                return redirect()->route('area.dashboard');
            }
            if ($user->isPatient()) {
                return redirect()->route('portal.history');
            }
            return redirect()->route('dashboard');
        }

        return Inertia::render('ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Send a password reset link to the given user.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Por favor ingresa tu correo electrónico.',
            'email.email'    => 'Por favor ingresa una dirección de correo válida.',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (! $user) {
            return back()->withErrors([
                'email' => 'Esta cuenta de correo no existe o no está registrada en el sistema.',
            ]);
        }

        if (! $user->is_active) {
            return back()->withErrors([
                'email' => 'Esta cuenta se encuentra desactivada. Por favor contacta al administrador.',
            ]);
        }

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return back()->with('status', 'Hemos enviado el enlace de restablecimiento a tu correo electrónico.');
        }

        if ($status === Password::RESET_THROTTLED) {
            return back()->withErrors([
                'email' => 'Has solicitado varios enlaces recientemente. Por favor espera unos minutos antes de reintentar.',
            ]);
        }

        return back()->withErrors([
            'email' => 'No fue posible enviar el enlace de recuperación. Intenta nuevamente.',
        ]);
    }

    /**
     * Show the password reset form with the given token.
     */
    public function showResetPassword(Request $request, string $token)
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    /**
     * Reset the user's password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|confirmed|min:8',
        ], [
            'token.required'     => 'Token de restablecimiento no proporcionado.',
            'email.required'     => 'Por favor ingresa tu correo electrónico.',
            'email.email'        => 'Ingresa una dirección de correo válida.',
            'password.required'  => 'La nueva contraseña es requerida.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',
            'password.min'       => 'La contraseña debe contener al menos 8 caracteres.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return match ($status) {
            Password::PASSWORD_RESET => redirect()->route('login')->with('success', '¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión.'),
            Password::INVALID_TOKEN  => back()->withErrors(['email' => 'El enlace de restablecimiento es inválido o ya ha expirado. Por favor solicita uno nuevo.']),
            Password::INVALID_USER   => back()->withErrors(['email' => 'No se encontró ninguna cuenta asociada a este correo electrónico.']),
            default                  => back()->withErrors(['email' => 'No fue posible restablecer tu contraseña. Intenta nuevamente más tarde.']),
        };
    }
}

