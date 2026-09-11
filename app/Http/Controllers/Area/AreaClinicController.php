<?php

namespace App\Http\Controllers\Area;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Area;
use App\Models\Tenant;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Patient;
use App\Models\Appointment;
use Illuminate\Support\Facades\Crypt;

class AreaClinicController extends Controller
{
    public function index(Request $request)
    {
        $area = $request->attributes->get('area') ?? $request->user()->area;
        if (! $area) {
            abort(403, 'No tienes un Área asignada.');
        }

        $currentMonthStart = now()->startOfMonth();
        $currentMonthEnd   = now()->endOfMonth();

        $clinics = $area->tenants()->with(['plan', 'users'])->get()->map(function ($t) use ($currentMonthStart, $currentMonthEnd) {
            // Month financial data
            $monthIncome = (float) Payment::where('tenant_id', $t->id)
                ->whereBetween('payment_date', [$currentMonthStart, $currentMonthEnd])
                ->sum('amount');

            $monthExpense = (float) Expense::where('tenant_id', $t->id)
                ->whereBetween('expense_date', [$currentMonthStart, $currentMonthEnd])
                ->sum('amount');

            $monthNet = $monthIncome - $monthExpense;

            // Total financial data
            $totalIncome = (float) Payment::where('tenant_id', $t->id)->sum('amount');
            $totalExpense = (float) Expense::where('tenant_id', $t->id)->sum('amount');
            $totalNet = $totalIncome - $totalExpense;

            $totalPatients = Patient::where('tenant_id', $t->id)->where('is_active', true)->count();
            $totalAppointments = Appointment::where('tenant_id', $t->id)->count();

            // Clinic primary/admin users with decrypted password if available
            $adminUsers = $t->users->map(function ($u) {
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
                    'name'           => "{$u->first_name} {$u->last_name}",
                    'email'          => $u->email,
                    'role'           => $u->pivot->role ?? 'admin',
                    'plain_password' => $plainPassword,
                ];
            });

            return [
                'id'                 => $t->id,
                'name'               => $t->name,
                'slug'               => $t->slug,
                'email'              => $t->email,
                'phone'              => $t->phone,
                'address'            => $t->address,
                'city'               => $t->city,
                'status'             => $t->status,
                'plan_name'          => $t->plan?->name,
                'currency'           => $t->currency ?? 'Bs.',
                'month_income'       => $monthIncome,
                'month_expense'      => $monthExpense,
                'month_net'          => $monthNet,
                'total_income'       => $totalIncome,
                'total_expense'      => $totalExpense,
                'total_net'          => $totalNet,
                'total_patients'     => $totalPatients,
                'total_appointments' => $totalAppointments,
                'users'              => $adminUsers,
            ];
        });

        return Inertia::render('area/AreaClinics', [
            'area'    => [
                'id'    => $area->id,
                'name'  => $area->name,
                'email' => $area->email,
                'phone' => $area->phone,
            ],
            'clinics' => $clinics,
        ]);
    }

    public function impersonate(Request $request, $tenantId)
    {
        $area = $request->attributes->get('area') ?? $request->user()->area;
        if (! $area) {
            abort(403, 'No tienes un Área asignada.');
        }

        $tenant = $area->tenants()->where('tenants.id', $tenantId)->firstOrFail();

        // Set session for context switching
        $request->session()->put('area_impersonated_tenant_id', $tenant->id);

        return redirect()->route('dashboard')->with('success', "Has ingresado al panel de la clínica: {$tenant->name}");
    }

    public function exitImpersonation(Request $request)
    {
        $request->session()->forget('area_impersonated_tenant_id');

        return redirect()->route('area.clinics.index')->with('success', 'Has regresado a tu panel de Área.');
    }
}
