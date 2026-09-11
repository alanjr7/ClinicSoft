<?php

namespace App\Http\Controllers\Area;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Area;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Appointment;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AreaReportController extends Controller
{
    public function index(Request $request)
    {
        $area = $request->attributes->get('area') ?? $request->user()->area;
        if (! $area) {
            abort(403, 'No tienes un Área asignada.');
        }

        $tenants = $area->tenants()->get();
        $tenantIds = $tenants->pluck('id')->toArray();

        // ── Filter period (month & year) ──────────────────────────────────
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd   = Carbon::create($year, $month, 1)->endOfMonth();

        // ── Multi-clinic comparative analytics for the selected period ─────
        $clinicComparisons = $tenants->map(function ($tenant) use ($periodStart, $periodEnd) {
            $income = (float) Payment::where('tenant_id', $tenant->id)
                ->whereBetween('payment_date', [$periodStart, $periodEnd])
                ->sum('amount');

            $expense = (float) Expense::where('tenant_id', $tenant->id)
                ->whereBetween('expense_date', [$periodStart, $periodEnd])
                ->sum('amount');

            $appointments = Appointment::where('tenant_id', $tenant->id)
                ->whereBetween('start_at', [$periodStart, $periodEnd])
                ->count();

            $patients = Patient::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->count();

            $newPatients = Patient::where('tenant_id', $tenant->id)
                ->whereBetween('created_at', [$periodStart, $periodEnd])
                ->count();

            $net = $income - $expense;
            $margin = $income > 0 ? round(($net / $income) * 100, 1) : 0;

            return [
                'id'           => $tenant->id,
                'name'         => $tenant->name,
                'city'         => $tenant->city ?? 'N/A',
                'income'       => $income,
                'expense'      => $expense,
                'net'          => $net,
                'margin'       => $margin,
                'appointments' => $appointments,
                'patients'     => $patients,
                'new_patients' => $newPatients,
            ];
        });

        // ── Totals for the period ──────────────────────────────────────────
        $totalPeriodIncome       = $clinicComparisons->sum('income');
        $totalPeriodExpenses     = $clinicComparisons->sum('expense');
        $totalPeriodNet          = $totalPeriodIncome - $totalPeriodExpenses;
        $totalPeriodAppointments = $clinicComparisons->sum('appointments');
        $totalPeriodNewPatients  = $clinicComparisons->sum('new_patients');

        return Inertia::render('area/AreaReports', [
            'area'              => [
                'id'   => $area->id,
                'name' => $area->name,
            ],
            'period'            => [
                'month' => $month,
                'year'  => $year,
            ],
            'clinicComparisons' => $clinicComparisons,
            'summary'           => [
                'total_income'       => (float) $totalPeriodIncome,
                'total_expenses'     => (float) $totalPeriodExpenses,
                'total_net'          => (float) $totalPeriodNet,
                'total_appointments' => $totalPeriodAppointments,
                'total_new_patients' => $totalPeriodNewPatients,
            ],
        ]);
    }
}
