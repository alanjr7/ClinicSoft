<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\UserModulePermission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $currentUserId = Auth::id();

        // Check if caller is admin or owner of the clinic
        $callerTu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $currentUserId)->first();
        $isAdmin = $callerTu && in_array($callerTu->role, ['admin', 'owner']);

        $users = TenantUser::where('tenant_id', $tenantId)
            ->with([
                'user.doctorProfile',
                'user.modulePermissions' => function ($q) use ($tenantId) {
                    $q->where('tenant_id', $tenantId);
                },
                'user:id,first_name,last_name,email,phone,avatar_url,is_active,encrypted_password'
            ])
            ->get()
            ->map(function ($tu) use ($isAdmin) {
                $plainPassword = null;
                // STRICT SECURITY: Only decrypt and send plain password if the viewing user is clinic Admin or Owner!
                if ($isAdmin && $tu->user?->encrypted_password) {
                    try {
                        $plainPassword = Crypt::decryptString($tu->user->encrypted_password);
                    } catch (\Exception $e) {
                        $plainPassword = null;
                    }
                }

                $docProfile = $tu->user?->doctorProfile;

                $userPermissions = $tu->user?->modulePermissions
                    ? $tu->user->modulePermissions
                        ->where('tenant_id', $tu->tenant_id)
                        ->map(fn($p) => [
                            'module' => $p->module,
                            'is_enabled' => (bool) $p->is_enabled,
                        ])
                        ->values()
                        ->all()
                    : [];

                $role = in_array($tu->role, ['dentist', 'doctor']) ? 'doctor' : ($tu->role === 'receptionist' ? 'staff' : $tu->role);

                return [
                    'id'             => $tu->user_id,
                    'first_name'     => $tu->user?->first_name,
                    'last_name'      => $tu->user?->last_name,
                    'email'          => $tu->user?->email,
                    'phone'          => $tu->user?->phone,
                    'avatar_url'     => $tu->user?->avatar_url,
                    'role'           => $role,
                    'specialty'      => $docProfile?->specialty,
                    'license_number' => $docProfile?->license_number,
                    'is_active'      => (bool) ($tu->is_active && $tu->user?->is_active),
                    'plain_password' => $plainPassword,
                    'permissions'    => $userPermissions,
                ];
            });

        $tenant = Tenant::with('plan:id,name,tier,price_monthly')->find($tenantId);

        return Inertia::render('Settings', [
            'users'  => $users,
            'tenant' => $tenant,
        ]);
    }

    /**
     * Admin/Owner updates the Clinic details (Name, Email, Phone, Address, City, Currency)
     */
    public function updateClinic(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $currentUserId = Auth::id();

        // Verify caller is admin or owner
        $callerTu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $currentUserId)->first();
        if (!$callerTu || !in_array($callerTu->role, ['admin', 'owner'])) {
            return back()->withErrors(['error' => 'Solo los administradores o propietarios pueden modificar la información de la clínica.']);
        }

        $tenant = Tenant::findOrFail($tenantId);

        $validated = $request->validate([
            'name'     => 'required|string|max:150',
            'email'    => 'nullable|email|max:150',
            'phone'    => 'nullable|string|max:50',
            'address'  => 'nullable|string|max:255',
            'city'     => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
        ], [
            'name.required' => 'El nombre de la clínica es obligatorio.',
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Información de la clínica actualizada correctamente.');
    }

    /**
     * User updates their own profile details (Name, Last Name, Phone, Email)
     */
    public function updateProfile(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email,' . $user->id,
            'phone'      => 'nullable|string|max:30',
        ]);

        $user->update($validated);

        return back()->with('success', 'Perfil actualizado correctamente.');
    }

    /**
     * User changes their own password (requires current password verification)
     */
    public function updatePassword(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Debes ingresar tu contraseña actual.',
            'password.required'         => 'La nueva contraseña es obligatoria.',
            'password.min'              => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed'        => 'Las contraseñas no coinciden.',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'La contraseña actual no es correcta.']);
        }

        $user->update([
            'password'           => $validated['password'],
            'encrypted_password' => Crypt::encryptString($validated['password']),
        ]);

        return back()->with('success', 'Tu contraseña ha sido actualizada con éxito.');
    }

    /**
     * Admin/Owner sets or resets a new password for any team member in their clinic
     */
    public function resetUserPassword(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $currentUserId = Auth::id();

        // Verify caller is admin or owner or dentist in this clinic
        $callerTu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $currentUserId)->first();
        if (!$callerTu || !in_array($callerTu->role, ['admin', 'owner', 'dentist'])) {
            return back()->withErrors(['error' => 'No tienes permisos para modificar contraseñas de otros usuarios.']);
        }

        // Verify target belongs to this tenant
        TenantUser::where('tenant_id', $tenantId)->where('user_id', $id)->firstOrFail();

        $validated = $request->validate([
            'new_password' => 'required|string|min:6',
        ], [
            'new_password.required' => 'La nueva contraseña es obligatoria.',
            'new_password.min'      => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        $targetUser = User::findOrFail($id);
        $targetUser->update([
            'password'           => $validated['new_password'],
            'encrypted_password' => Crypt::encryptString($validated['new_password']),
        ]);

        return back()->with('success', 'Contraseña actualizada para ' . $targetUser->first_name . ' ' . $targetUser->last_name . '.');
    }

    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:6',
            'first_name' => 'required|string|max:100',
            'last_name'  => 'required|string|max:100',
            'phone'      => 'nullable|string|max:30',
            'role'       => 'required|string|in:owner,admin,doctor,staff',
            'specialty'  => 'nullable|string|max:150',
            'license_number' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($validated, $tenantId) {
            $user = User::create([
                'email'              => $validated['email'],
                'password'           => $validated['password'],
                'encrypted_password' => Crypt::encryptString($validated['password']),
                'first_name'         => $validated['first_name'],
                'last_name'          => $validated['last_name'],
                'phone'              => $validated['phone'] ?? null,
            ]);
            TenantUser::create([
                'tenant_id' => $tenantId,
                'user_id'   => $user->id,
                'role'      => $validated['role'],
                'is_active' => true,
            ]);

            if ($validated['role'] === 'doctor' || !empty($validated['specialty'])) {
                \App\Models\DoctorProfile::create([
                    'tenant_id'      => $tenantId,
                    'user_id'        => $user->id,
                    'specialty'      => $validated['specialty'] ?? 'Medicina General',
                    'license_number' => $validated['license_number'] ?? null,
                ]);
            }
        });

        return back()->with('success', 'Usuario creado.');
    }

    public function update(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $tu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $id)->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:100',
            'last_name'  => 'nullable|string|max:100',
            'phone'      => 'nullable|string|max:30',
            'role'       => 'nullable|string|in:owner,admin,doctor,staff',
            'is_active'  => 'nullable|boolean',
            'specialty'  => 'nullable|string|max:150',
            'license_number' => 'nullable|string|max:100',
        ]);

        if (isset($validated['role'])) {
            $tu->role = $validated['role'];
        }
        if (isset($validated['is_active'])) {
            $tu->is_active = $validated['is_active'];
        }
        $tu->save();

        $user = User::findOrFail($id);
        if (isset($validated['first_name'])) $user->first_name = $validated['first_name'];
        if (isset($validated['last_name']))  $user->last_name  = $validated['last_name'];
        if (isset($validated['phone']))      $user->phone      = $validated['phone'];
        if (isset($validated['is_active']))  $user->is_active  = $validated['is_active'];
        $user->save();

        return back()->with('success', 'Usuario actualizado.');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $tu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $id)->firstOrFail();
        $tu->is_active = false;
        $tu->save();

        return back()->with('success', 'Usuario desactivado.');
    }

    public function updatePermissions(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Ensure the user belongs to this tenant
        TenantUser::where('tenant_id', $tenantId)->where('user_id', $id)->firstOrFail();

        $validated = $request->validate([
            'permissions'              => 'required|array',
            'permissions.*.module'     => 'required|string',
            'permissions.*.is_enabled' => 'required|boolean',
        ]);

        foreach ($validated['permissions'] as $perm) {
            UserModulePermission::updateOrCreate(
                ['user_id' => $id, 'tenant_id' => $tenantId, 'module' => $perm['module']],
                ['is_enabled' => $perm['is_enabled']]
            );
        }

        return back()->with('success', 'Permisos actualizados.');
    }
}

