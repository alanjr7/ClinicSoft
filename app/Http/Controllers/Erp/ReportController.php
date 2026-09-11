<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // ── Monthly revenue (payments) — last 6 months ──────────────────────
        $monthlyRevenue = Payment::where('tenant_id', $tenantId)
            ->selectRaw("DATE_FORMAT(payment_date, '%Y-%m') as ym,
                         DATE_FORMAT(payment_date, '%b')    as month,
                         SUM(amount)                        as revenue,
                         COUNT(*)                           as payment_count")
            ->whereNotNull('payment_date')
            ->where('payment_date', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('ym', 'month')
            ->orderBy('ym')
            ->get(['ym', 'month', 'revenue', 'payment_count']);

        // ── Monthly appointments — last 6 months ────────────────────────────
        $monthlyAppointments = Appointment::where('tenant_id', $tenantId)
            ->selectRaw("DATE_FORMAT(start_at, '%Y-%m') as ym,
                         DATE_FORMAT(start_at, '%b')    as month,
                         COUNT(*)                       as appointments")
            ->where('start_at', '>=', now()->subMonths(6)->startOfMonth())
            ->whereIn('status', ['completed', 'confirmed', 'in_progress'])
            ->groupBy('ym', 'month')
            ->orderBy('ym')
            ->get(['ym', 'month', 'appointments']);

        // Merge monthly revenue + appointments into one dataset
        $monthlyMap = [];
        foreach ($monthlyRevenue as $r) {
            $monthlyMap[$r->ym] = [
                'month'        => ucfirst($r->month),
                'revenue'      => (float) $r->revenue,
                'appointments' => 0,
            ];
        }
        foreach ($monthlyAppointments as $a) {
            if (!isset($monthlyMap[$a->ym])) {
                $monthlyMap[$a->ym] = ['month' => ucfirst($a->month), 'revenue' => 0, 'appointments' => 0];
            }
            $monthlyMap[$a->ym]['appointments'] = (int) $a->appointments;
        }
        ksort($monthlyMap);
        $monthlyData = array_values($monthlyMap);

        // ── New patients per month — last 6 months ───────────────────────────
        $newPatients = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym,
                         DATE_FORMAT(created_at, '%b')    as month,
                         COUNT(*)                         as count")
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('ym', 'month')
            ->orderBy('ym')
            ->get(['ym', 'month', 'count'])
            ->map(fn ($r) => ['month' => ucfirst($r->month), 'count' => (int) $r->count]);

        // ── Top treatments (from appointment-treatment joins or invoice items) ─
        $topTreatments = DB::table('appointment_treatments as at')
            ->join('treatments as t', 't.id', '=', 'at.treatment_id')
            ->where('at.tenant_id', $tenantId)
            ->selectRaw('t.name, COUNT(*) as count, SUM(t.base_price) as value')
            ->groupBy('t.id', 't.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get(['name', 'count', 'value'])
            ->map(fn ($r) => [
                'name'  => $r->name,
                'count' => (int) $r->count,
                'value' => (float) $r->value,
            ]);

        // ── Summary stats ────────────────────────────────────────────────────
        $totalAppointments = Appointment::where('tenant_id', $tenantId)->count();
        $totalPatients     = Patient::where('tenant_id', $tenantId)->where('is_active', true)->count();
        $totalRevenue      = Payment::where('tenant_id', $tenantId)->sum('amount');
        $avgPerAppointment = $totalAppointments > 0
            ? round($totalRevenue / $totalAppointments, 2)
            : 0;

        return Inertia::render('Reports', [
            'monthlyData'      => $monthlyData,
            'newPatients'      => $newPatients,
            'topTreatments'    => $topTreatments,
            'stats' => [
                'total_appointments' => $totalAppointments,
                'total_patients'     => $totalPatients,
                'total_revenue'      => (float) $totalRevenue,
                'avg_per_appt'       => $avgPerAppointment,
            ],
        ]);
    }
}
