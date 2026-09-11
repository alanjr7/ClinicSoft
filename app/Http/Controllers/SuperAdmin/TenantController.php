<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Models\User;
use App\Models\TenantUser;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function dashboard()
    {
        $tenants = Tenant::all();
        $demoLeads = \App\Models\DemoLead::orderByDesc('created_at')->take(10)->get();
        $totalDemoLeads = \App\Models\DemoLead::count();

        return Inertia::render('superadmin/SuperAdminDashboard', [
            'tenants'        => $tenants,
            'demoLeads'      => $demoLeads,
            'totalDemoLeads' => $totalDemoLeads,
        ]);
    }

    public function index()
    {
        $tenants = Tenant::with('plan')->orderByDesc('created_at')->get()
            ->each(fn ($t) => $t->plan_name = $t->plan?->name);

        $plans = SubscriptionPlan::orderBy('name')->get(['id', 'name']);

        return Inertia::render('superadmin/Clinics', [
            'tenants' => $tenants,
            'plans'   => $plans,
        ]);
    }

    public function show($id)
    {
        $tenant = Tenant::with('plan')->findOrFail($id);
        $tenant->plan_name = $tenant->plan?->name;

        $users = $tenant->users()->get()->map(function ($u) {
            $plainPassword = null;
            if ($u->encrypted_password) {
                try {
                    $plainPassword = Crypt::decryptString($u->encrypted_password);
                } catch (\Exception $e) {
                    $plainPassword = null;
                }
            }

            return [
                'id'             => $u->id,
                'first_name'     => $u->first_name,
                'last_name'      => $u->last_name,
                'email'          => $u->email,
                'role'           => $u->pivot->role,
                'is_active'      => (bool) $u->pivot->is_active,
                'joined_at'      => $u->pivot->joined_at ?? $u->pivot->created_at,
                'plain_password' => $plainPassword,
            ];
        });

        return Inertia::render('superadmin/ClinicDetail', [
            'tenant' => $tenant,
            'users'  => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:150',
            'slug'             => 'required|string|max:100|unique:tenants',
            'email'            => 'required|email|max:255',
            'phone'            => 'nullable|string|max:50',
            'address'          => 'nullable|string',
            'city'             => 'nullable|string|max:100',
            'country'          => 'nullable|string|max:100',
            'plan_id'          => 'nullable|exists:subscription_plans,id',
            'status'           => 'string|in:active,suspended,trial,cancelled',
            'default_tax_rate' => 'numeric',
        ]);

        DB::transaction(function () use ($validated) {
            $tenant = Tenant::create($validated);
            TenantSetting::create(['tenant_id' => $tenant->id]);
            
            // Set up default accounts, categories, and treatments
            \App\Services\TenantSetupService::setupDefaults($tenant);
        });

        return redirect()->route('superadmin.clinics.index')->with('success', 'Clínica creada.');
    }

    public function update(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'    => 'string|max:150',
            'email'   => 'email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city'    => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'plan_id' => 'nullable|exists:subscription_plans,id',
        ]);

        $tenant->update($validated);
        return back()->with('success', 'Clínica actualizada.');
    }

    public function toggleStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,suspended,trial,cancelled',
        ]);

        $tenant = Tenant::findOrFail($id);
        $tenant->status = $validated['status'];
        $tenant->save();

        return back()->with('success', 'Estado actualizado.');
    }

    public function createUser(Request $request, $id)
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:6',
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'role'       => 'nullable|string|in:owner,admin,doctor,dentist,staff',
        ]);

        $role = $validated['role'] ?? 'admin';

        DB::transaction(function () use ($validated, $tenant, $role) {
            $user = User::create([
                'email'              => $validated['email'],
                'password'           => Hash::make($validated['password']),
                'encrypted_password' => Crypt::encryptString($validated['password']),
                'first_name'         => $validated['first_name'],
                'last_name'          => $validated['last_name'],
                'global_role'        => 'regular',
                'is_active'          => true,
            ]);
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id'   => $user->id,
                'role'      => $role,
                'is_active' => true,
            ]);
        });

        return back()->with('success', 'Usuario creado en la clínica.');
    }

    public function updateUser(Request $request, $tenantId, $userId)
    {
        $tu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $userId)->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email,' . $userId,
            'role'       => 'required|string|in:owner,admin,doctor,dentist,staff',
            'is_active'  => 'nullable|boolean',
        ]);

        $user = User::findOrFail($userId);
        $user->update([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'email'      => $validated['email'],
            'is_active'  => $validated['is_active'] ?? $user->is_active,
        ]);

        $tu->update([
            'role'      => $validated['role'],
            'is_active' => $validated['is_active'] ?? $tu->is_active,
        ]);

        return back()->with('success', 'Usuario y rol actualizados correctamente.');
    }

    public function resetUserPassword(Request $request, $tenantId, $userId)
    {
        TenantUser::where('tenant_id', $tenantId)->where('user_id', $userId)->firstOrFail();

        $validated = $request->validate([
            'new_password' => 'required|string|min:6',
        ], [
            'new_password.required' => 'La nueva contraseña es obligatoria.',
            'new_password.min'      => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        $user = User::findOrFail($userId);
        $user->update([
            'password'           => Hash::make($validated['new_password']),
            'encrypted_password' => Crypt::encryptString($validated['new_password']),
        ]);

        return back()->with('success', 'Contraseña actualizada para ' . $user->first_name . ' ' . $user->last_name . '.');
    }

    public function destroyUser(Request $request, $tenantId, $userId)
    {
        $tu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $userId)->firstOrFail();
        $tu->delete();

        $user = User::find($userId);
        if ($user && $user->global_role !== 'superadmin' && $user->tenantUsers()->count() === 0) {
            $user->delete();
        }

        return back()->with('success', 'Usuario eliminado de la clínica.');
    }
}
