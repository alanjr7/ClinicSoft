<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Invoice;
use App\Models\Payment;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $today    = now()->toDateString();

        $todayAppointments = Appointment::where('tenant_id', $tenantId)
            ->whereDate('start_at', $today)
            ->with(['patient:id,first_name,last_name'])
            ->orderBy('start_at')
            ->get()
            ->map(fn ($a) => [
                'id'        => $a->id,
                'patient'   => $a->patient?->first_name . ' ' . $a->patient?->last_name,
                'time'      => $a->start_at ? \Carbon\Carbon::parse($a->start_at)->format('H:i') : '',
                'treatment' => $a->notes ?? 'Cita',
                'status'    => $a->status,
            ]);

        $totalPatients = Patient::where('tenant_id', $tenantId)->where('is_active', true)->count();

        $monthStart = now()->startOfMonth();
        $monthIncome = Payment::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $monthStart)
            ->sum('amount');

        $pendingAmount = Invoice::where('tenant_id', $tenantId)
            ->whereIn('status', ['draft', 'sent'])
            ->sum('total');

        return Inertia::render('Dashboard', [
            'stats' => [
                'today_appointments' => $todayAppointments->count(),
                'total_patients'     => $totalPatients,
                'month_income'       => $monthIncome,
                'pending_amount'     => $pendingAmount,
            ],
            'today_appointments' => $todayAppointments,
        ]);
    }
}
