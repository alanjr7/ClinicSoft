<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\User;

class AuthController extends Controller
{
    public function showLogin()
    {
        // If already authenticated, redirect appropriately
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->global_role === 'superadmin') {
                return redirect()->route('superadmin.dashboard');
            }
            if ($user->global_role === 'area') {
                return redirect()->route('area.dashboard');
            }
            return redirect()->route('dashboard');
        }

        return Inertia::render('Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return back()->withErrors(['email' => 'Correo o contraseña incorrectos']);
        }

        if (! $user->is_active) {
            return back()->withErrors(['email' => 'Usuario inactivo. Contacta al administrador.']);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $user->last_login_at = now();
        $user->save();

        $redirectTo = match ($user->global_role) {
            'superadmin' => route('superadmin.dashboard'),
            'area'       => route('area.dashboard'),
            default      => route('dashboard'),
        };

        return Inertia::location($redirectTo);
    }

    public function demoAccess(Request $request)
    {
        $validated = $request->validate([
            'full_name'    => 'required|string|max:150',
            'whatsapp'     => 'required|string|max:50',
            'company_name' => 'nullable|string|max:150',
        ], [
            'full_name.required' => 'Por favor ingresa tu nombre completo.',
            'whatsapp.required'  => 'El número de WhatsApp es necesario para iniciar el modo prueba.',
        ]);

        // 1. Save lead in DB
        \App\Models\DemoLead::create([
            'full_name'    => $validated['full_name'],
            'whatsapp'     => $validated['whatsapp'],
            'company_name' => $validated['company_name'] ?? null,
            'ip_address'   => $request->ip(),
            'user_agent'   => $request->userAgent(),
        ]);

        // 2. Locate or create Demo Clinic Tenant
        $planId = \App\Models\SubscriptionPlan::value('id') ?? \App\Models\SubscriptionPlan::create([
            'tier'          => 'premium',
            'name'          => 'Plan Demo',
            'max_users'     => 99,
            'max_patients'  => 9999,
            'price_monthly' => 0,
        ])->id;

        $demoTenant = \App\Models\Tenant::firstOrCreate(
            ['slug' => 'demo-dental'],
            [
                'plan_id'           => $planId,
                'name'              => !empty($validated['company_name']) ? $validated['company_name'] . ' (Demo)' : 'Clínica Dental Demo',
                'email'             => 'demo@dentalsoft.app',
                'phone'             => $validated['whatsapp'],
                'status'            => 'active',
                'currency'          => 'Bs.',
                'primary_color'     => '#14B8A6',
                'header_text_color' => '#FFFFFF',
            ]
        );

        if (!empty($validated['company_name'])) {
            $demoTenant->update([
                'name'  => $validated['company_name'] . ' (Demo)',
                'phone' => $validated['whatsapp'],
            ]);
        }

        // Run default setups only if tenant was just created (not on every demo login)
        if ($demoTenant->wasRecentlyCreated) {
            \App\Services\TenantSetupService::setupDefaults($demoTenant);
        }

        // 3. Locate or create Demo User
        $parts = explode(' ', trim($validated['full_name']), 2);
        $firstName = $parts[0] ?? 'Doctor';
        $lastName = $parts[1] ?? 'Demo';

        $demoUser = User::firstOrCreate(
            ['email' => 'demo@dentalsoft.app'],
            [
                'first_name'  => $firstName,
                'last_name'   => $lastName,
                'password'    => Hash::make('demo123456'),
                'global_role' => 'regular',
                'is_active'   => true,
            ]
        );

        $demoUser->update([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'phone'      => $validated['whatsapp'],
        ]);

        // Ensure user belongs to demo tenant as admin
        \App\Models\TenantUser::firstOrCreate(
            ['tenant_id' => $demoTenant->id, 'user_id' => $demoUser->id],
            ['role' => 'admin', 'is_active' => true]
        );

        // If demo tenant has no patients, create sample demo records
        if (\App\Models\Patient::where('tenant_id', $demoTenant->id)->count() === 0) {
            $p1 = \App\Models\Patient::create([
                'tenant_id'     => $demoTenant->id,
                'first_name'    => 'Carlos',
                'last_name'     => 'Mendoza Ramos',
                'national_id'   => '8492019',
                'phone'         => '+591 71234567',
                'email'         => 'carlos.mendoza@gmail.com',
                'gender'        => 'male',
                'date_of_birth' => '1992-05-14',
                'blood_type'    => 'O+',
                'city'          => 'Santa Cruz',
                'is_active'     => true,
            ]);

            $p2 = \App\Models\Patient::create([
                'tenant_id'     => $demoTenant->id,
                'first_name'    => 'María José',
                'last_name'     => 'Flores Vargas',
                'national_id'   => '7591024',
                'phone'         => '+591 76543210',
                'email'         => 'mariajose.flores@hotmail.com',
                'gender'        => 'female',
                'date_of_birth' => '1998-11-20',
                'blood_type'    => 'A+',
                'city'          => 'Santa Cruz',
                'is_active'     => true,
            ]);

            // Sample appointment
            \App\Models\Appointment::create([
                'tenant_id'  => $demoTenant->id,
                'patient_id' => $p1->id,
                'dentist_id' => $demoUser->id,
                'start_at'   => now()->setTime(10, 0, 0),
                'end_at'     => now()->setTime(10, 45, 0),
                'status'     => 'scheduled',
                'reason'     => 'Limpieza dental y revisión general (Demo)',
            ]);
        }

        // 4. Authenticate
        Auth::login($demoUser);
        $request->session()->regenerate();
        $request->session()->put('is_demo_mode', true);
        $request->session()->put('demo_user_name', $validated['full_name']);

        return Inertia::location(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Inertia::location(route('login'));
    }
}
