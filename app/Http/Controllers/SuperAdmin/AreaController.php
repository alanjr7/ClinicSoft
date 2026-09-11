<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Area;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::with(['user', 'tenants'])->orderByDesc('created_at')->get()
            ->map(function ($area) {
                $plainPassword = null;
                if ($area->user?->encrypted_password) {
                    try {
                        $plainPassword = Crypt::decryptString($area->user->encrypted_password);
                    } catch (\Exception $e) {
                        $plainPassword = null;
                    }
                }

                return [
                    'id'             => $area->id,
                    'name'           => $area->name,
                    'phone'          => $area->phone,
                    'email'          => $area->email,
                    'is_active'      => (bool) $area->is_active,
                    'created_at'     => $area->created_at->format('d/m/Y H:i'),
                    'plain_password' => $plainPassword,
                    'user'           => $area->user ? [
                        'id'         => $area->user->id,
                        'first_name' => $area->user->first_name,
                        'last_name'  => $area->user->last_name,
                        'email'      => $area->user->email,
                        'phone'      => $area->user->phone,
                    ] : null,
                    'tenants'        => $area->tenants->map(fn ($t) => [
                        'id'     => $t->id,
                        'name'   => $t->name,
                        'city'   => $t->city,
                        'status' => $t->status,
                    ]),
                    'tenants_count'  => $area->tenants->count(),
                ];
            });

        $availableTenants = Tenant::orderBy('name')->get(['id', 'name', 'city', 'status']);

        return Inertia::render('superadmin/Areas', [
            'areas'            => $areas,
            'availableTenants' => $availableTenants,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:150',
            'phone'      => 'nullable|string|max:50',
            'email'      => 'required|email|max:255|unique:users,email',
            'password'   => 'required|string|min:6',
            'tenant_ids' => 'nullable|array',
            'tenant_ids.*' => 'exists:tenants,id',
        ], [
            'name.required'     => 'El nombre del Área es obligatorio.',
            'email.required'    => 'El correo electrónico es obligatorio.',
            'email.unique'      => 'Este correo electrónico ya está registrado en el sistema.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min'      => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        DB::transaction(function () use ($validated) {
            // 1. Create User with role 'area'
            $parts = explode(' ', trim($validated['name']), 2);
            $firstName = $parts[0] ?? $validated['name'];
            $lastName  = $parts[1] ?? 'Área';

            $user = User::create([
                'first_name'         => $firstName,
                'last_name'          => $lastName,
                'email'              => $validated['email'],
                'phone'              => $validated['phone'] ?? null,
                'password'           => Hash::make($validated['password']),
                'encrypted_password' => Crypt::encryptString($validated['password']),
                'global_role'        => 'area',
                'is_active'          => true,
            ]);

            // 2. Create Area record
            $area = Area::create([
                'user_id'   => $user->id,
                'name'      => $validated['name'],
                'phone'     => $validated['phone'] ?? null,
                'email'     => $validated['email'],
                'is_active' => true,
            ]);

            // 3. Attach clinics
            if (! empty($validated['tenant_ids'])) {
                $area->tenants()->sync($validated['tenant_ids']);
            }
        });

        return back()->with('success', 'Área creada exitosamente.');
    }

    public function update(Request $request, $id)
    {
        $area = Area::with('user')->findOrFail($id);

        $validated = $request->validate([
            'name'       => 'required|string|max:150',
            'phone'      => 'nullable|string|max:50',
            'email'      => 'required|email|max:255|unique:users,email,' . $area->user_id,
            'tenant_ids' => 'nullable|array',
            'tenant_ids.*' => 'exists:tenants,id',
            'is_active'  => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($area, $validated) {
            $parts = explode(' ', trim($validated['name']), 2);
            $firstName = $parts[0] ?? $validated['name'];
            $lastName  = $parts[1] ?? 'Área';

            $area->update([
                'name'      => $validated['name'],
                'phone'     => $validated['phone'] ?? null,
                'email'     => $validated['email'],
                'is_active' => $validated['is_active'] ?? $area->is_active,
            ]);

            if ($area->user) {
                $area->user->update([
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'email'      => $validated['email'],
                    'phone'      => $validated['phone'] ?? null,
                    'is_active'  => $validated['is_active'] ?? $area->user->is_active,
                ]);
            }

            if (isset($validated['tenant_ids'])) {
                $area->tenants()->sync($validated['tenant_ids']);
            }
        });

        return back()->with('success', 'Área actualizada correctamente.');
    }

    public function resetPassword(Request $request, $id)
    {
        $area = Area::with('user')->findOrFail($id);

        $validated = $request->validate([
            'new_password' => 'required|string|min:6',
        ], [
            'new_password.required' => 'La nueva contraseña es obligatoria.',
            'new_password.min'      => 'La contraseña debe tener al menos 6 caracteres.',
        ]);

        if ($area->user) {
            $area->user->update([
                'password'           => Hash::make($validated['new_password']),
                'encrypted_password' => Crypt::encryptString($validated['new_password']),
            ]);
        }

        return back()->with('success', 'Contraseña del Área actualizada correctamente.');
    }

    public function toggleStatus($id)
    {
        $area = Area::with('user')->findOrFail($id);
        $newStatus = ! $area->is_active;

        DB::transaction(function () use ($area, $newStatus) {
            $area->update(['is_active' => $newStatus]);
            if ($area->user) {
                $area->user->update(['is_active' => $newStatus]);
            }
        });

        return back()->with('success', 'Estado del Área actualizado.');
    }

    public function destroy($id)
    {
        $area = Area::findOrFail($id);
        $userId = $area->user_id;

        DB::transaction(function () use ($area, $userId) {
            $area->tenants()->detach();
            $area->delete();

            if ($userId) {
                User::where('id', $userId)->delete();
            }
        });

        return back()->with('success', 'Área eliminada correctamente.');
    }
}
