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

class AreaDashboardController extends Controller
{
    public function dashboard(Request $request)
    {
        $area = $request->attributes->get('area') ?? $request->user()->area;
        if (! $area) {
            abort(403, 'No tienes un Área asignada.');
        }

        $tenants = $area->tenants()->get();
        $tenantIds = $tenants->pluck('id')->toArray();

        $currentMonthStart = now()->startOfMonth();
        $currentMonthEnd   = now()->endOfMonth();

        // ── Consolidated Financials (Current Month & All Time) ───────────────
        $monthIncome = Payment::whereIn('tenant_id', $tenantIds)
            ->whereBetween('payment_date', [$currentMonthStart, $currentMonthEnd])
            ->sum('amount');

        $monthExpenses = Expense::whereIn('tenant_id', $tenantIds)
            ->whereBetween('expense_date', [$currentMonthStart, $currentMonthEnd])
            ->sum('amount');

        $monthNet = $monthIncome - $monthExpenses;

        $totalIncome = Payment::whereIn('tenant_id', $tenantIds)->sum('amount');
        $totalExpenses = Expense::whereIn('tenant_id', $tenantIds)->sum('amount');
        $totalNet = $totalIncome - $totalExpenses;

        // ── Consolidated Patients & Appointments ─────────────────────────────
        $totalPatients = Patient::whereIn('tenant_id', $tenantIds)->where('is_active', true)->count();
        $totalAppointments = Appointment::whereIn('tenant_id', $tenantIds)->count();
        $monthAppointments = Appointment::whereIn('tenant_id', $tenantIds)
            ->whereBetween('start_at', [$currentMonthStart, $currentMonthEnd])
            ->count();

        // ── Monthly 6-Month Consolidated Trend ──────────────────────────────
        $sixMonthsAgo = now()->subMonths(5)->startOfMonth();

        $payments = Payment::whereIn('tenant_id', $tenantIds)
            ->where('payment_date', '>=', $sixMonthsAgo)
            ->get(['payment_date', 'amount']);

        $expenses = Expense::whereIn('tenant_id', $tenantIds)
            ->where('expense_date', '>=', $sixMonthsAgo)
            ->get(['expense_date', 'amount']);

        $trendMap = [];
        // initialize 6 months
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $ym = $date->format('Y-m');
            $trendMap[$ym] = [
                'ym'      => $ym,
                'month'   => ucfirst($date->translatedFormat('M')),
                'income'  => 0,
                'expense' => 0,
                'net'     => 0,
            ];
        }

        foreach ($payments as $p) {
            $ym = Carbon::parse($p->payment_date)->format('Y-m');
            if (isset($trendMap[$ym])) {
                $trendMap[$ym]['income'] += (float) $p->amount;
            }
        }

        foreach ($expenses as $e) {
            $ym = Carbon::parse($e->expense_date)->format('Y-m');
            if (isset($trendMap[$ym])) {
                $trendMap[$ym]['expense'] += (float) $e->amount;
            }
        }

        foreach ($trendMap as $ym => $val) {
            $trendMap[$ym]['net'] = $val['income'] - $val['expense'];
        }

        $monthlyTrend = array_values($trendMap);

        // ── Clinics Overview with monthly financial snapshot ─────────────────
        $clinicsSummary = $tenants->map(function ($tenant) use ($currentMonthStart, $currentMonthEnd) {
            $income = (float) Payment::where('tenant_id', $tenant->id)
                ->whereBetween('payment_date', [$currentMonthStart, $currentMonthEnd])
                ->sum('amount');

            $expense = (float) Expense::where('tenant_id', $tenant->id)
                ->whereBetween('expense_date', [$currentMonthStart, $currentMonthEnd])
                ->sum('amount');

            $patients = Patient::where('tenant_id', $tenant->id)->where('is_active', true)->count();
            $appointments = Appointment::where('tenant_id', $tenant->id)
                ->whereBetween('start_at', [$currentMonthStart, $currentMonthEnd])
                ->count();

            return [
                'id'           => $tenant->id,
                'name'         => $tenant->name,
                'city'         => $tenant->city ?? 'N/A',
                'phone'        => $tenant->phone ?? 'N/A',
                'status'       => $tenant->status,
                'income'       => $income,
                'expense'      => $expense,
                'net'          => $income - $expense,
                'patients'     => $patients,
                'appointments' => $appointments,
            ];
        });

        return Inertia::render('area/AreaDashboard', [
            'area'           => [
                'id'    => $area->id,
                'name'  => $area->name,
                'email' => $area->email,
                'phone' => $area->phone,
            ],
            'kpis'           => [
                'month_income'        => (float) $monthIncome,
                'month_expenses'      => (float) $monthExpenses,
                'month_net'           => (float) $monthNet,
                'total_income'        => (float) $totalIncome,
                'total_expenses'      => (float) $totalExpenses,
                'total_net'           => (float) $totalNet,
                'total_patients'      => $totalPatients,
                'total_appointments'  => $totalAppointments,
                'month_appointments'  => $monthAppointments,
                'total_clinics'       => count($tenantIds),
            ],
            'monthlyTrend'   => $monthlyTrend,
            'clinicsSummary' => $clinicsSummary,
        ]);
    }
}
