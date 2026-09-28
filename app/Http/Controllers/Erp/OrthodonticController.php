<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;
use App\Models\User;
use App\Models\OrthodonticPlan;
use App\Models\Appointment;
use App\Models\Payment;
use App\Models\AccountingEntry;
use App\Services\AccountingEntryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

use Illuminate\Support\Str;

class OrthodonticController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $plans = OrthodonticPlan::where('tenant_id', $tenantId)
            ->with([
                'patient:id,first_name,last_name,national_id',
                'dentist:id,first_name,last_name',
                'appointments:id,orthodontic_plan_id,start_at,payment_status,amount_due,reason,status'
            ])
            ->latest()
            ->get();

        // Citas de ortodoncia (para la pestaña Calendario)
        $orthoAppointments = Appointment::where('tenant_id', $tenantId)
            ->whereNotNull('orthodontic_plan_id')
            ->with(['patient:id,first_name,last_name', 'dentist:id,first_name,last_name'])
            ->orderBy('start_at')
            ->get();

        $patients = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'national_id']);
            
        $dentists = User::whereHas('tenantUsers', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })
            ->where('is_active', true)
            ->whereHas('dentistProfiles')
            ->get(['id', 'first_name', 'last_name']);

        // Si no hay perfil de dentista estricto, mandar todos los usuarios activos
        if ($dentists->isEmpty()) {
            $dentists = User::whereHas('tenantUsers', function ($q) use ($tenantId) {
                $q->where('tenant_id', $tenantId);
            })->where('is_active', true)->get(['id', 'first_name', 'last_name']);
        }

        return Inertia::render('Orthodontics', [
            'plans'             => $plans,
            'orthoAppointments' => $orthoAppointments,
            'patients'          => $patients,
            'dentists'          => $dentists,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'         => 'required|exists:patients,id',
            'dentist_id'         => 'nullable|exists:users,id',
            'total_cost'         => 'required|numeric|min:1',
            'initial_fee'        => 'required|numeric|min:0|lt:total_cost',
            'installment_amount' => 'required|numeric|min:1',
            'frequency'          => 'required|string|in:weekly,biweekly,monthly',
            'start_date'         => 'required|date',
            'payment_method'     => 'nullable|string'
        ]);

        $remaining = (float) $validated['total_cost'] - (float) $validated['initial_fee'];
        $installment = (float) $validated['installment_amount'];
        $numberOfInstallments = $installment > 0 ? (int) ceil($remaining / $installment) : 0;

        if ($numberOfInstallments > 72) {
            return back()->withErrors([
                'installment_amount' => "El cálculo generaría {$numberOfInstallments} cuotas. El límite máximo permitido es de 72 cuotas (6 años). Aumente el monto de la cuota o cuota inicial."
            ])->withInput();
        }

        try {
            DB::transaction(function () use ($validated, $tenantId, $remaining, $installment, $numberOfInstallments) {
                $plan = OrthodonticPlan::create([
                    'tenant_id'          => $tenantId,
                    'patient_id'         => $validated['patient_id'],
                    'dentist_id'         => $validated['dentist_id'],
                    'total_cost'         => $validated['total_cost'],
                    'initial_fee'        => $validated['initial_fee'],
                    'installment_amount' => $validated['installment_amount'],
                    'frequency'          => $validated['frequency'],
                    'status'             => 'active',
                ]);

                // Cobrar cuota inicial si es mayor a 0
                if ($validated['initial_fee'] > 0) {
                    $payment = Payment::create([
                        'tenant_id'      => $tenantId,
                        'patient_id'     => $validated['patient_id'],
                        'payment_date'   => now(),
                        'amount'         => $validated['initial_fee'],
                        'payment_method' => $validated['payment_method'] ?? 'cash',
                        'received_by'    => Auth::id(),
                        'notes'          => 'Cuota inicial Ortodoncia',
                    ]);
                    
                    $payment->items()->create([
                        'tenant_id'   => $tenantId,
                        'description' => 'Cuota Inicial - Tratamiento Ortodoncia',
                        'amount'      => $validated['initial_fee'],
                    ]);
                    
                    // Contabilidad (Partida doble automatizada)
                    $patient = \App\Models\Patient::find($validated['patient_id']);
                    $patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Paciente';
                    AccountingEntryService::recordPaymentEntry(
                        tenantId: $tenantId,
                        payment: $payment,
                        description: 'Ingreso Cuota Inicial Ortodoncia - ' . $patientName,
                        incomeAccountCode: '4200'
                    );
                }

                // Generar citas en masa (Bulk Insert optimizado)
                if ($remaining > 0 && $numberOfInstallments > 0) {
                    $currentDate = Carbon::parse($validated['start_date']);
                    $rem = $remaining;
                    $appointmentsBatch = [];
                    $now = now();
                    $authId = Auth::id();

                    for ($i = 0; $i < $numberOfInstallments; $i++) {
                        $amountDueForThis = ($rem < $installment) ? $rem : $installment;
                        $rem -= $amountDueForThis;

                        $appointmentsBatch[] = [
                            'id'                  => (string) Str::uuid(),
                            'tenant_id'           => $tenantId,
                            'patient_id'          => $validated['patient_id'],
                            'dentist_id'          => $validated['dentist_id'],
                            'orthodontic_plan_id' => $plan->id,
                            'start_at'            => $currentDate->copy()->setHour(10)->setMinute(0)->format('Y-m-d H:i:s'),
                            'end_at'              => $currentDate->copy()->setHour(11)->setMinute(0)->format('Y-m-d H:i:s'),
                            'status'              => 'scheduled',
                            'payment_status'      => 'pending',
                            'amount_due'          => $amountDueForThis,
                            'reason'              => 'Control de Ortodoncia ' . ($i + 1) . '/' . $numberOfInstallments,
                            'created_by'          => $authId,
                            'created_at'          => $now,
                            'updated_at'          => $now,
                        ];

                        // Sumar intervalo
                        if ($validated['frequency'] === 'weekly') {
                            $currentDate->addWeek();
                        } elseif ($validated['frequency'] === 'biweekly') {
                            $currentDate->addWeeks(2);
                        } else {
                            $currentDate->addMonth();
                        }
                    }

                    if (!empty($appointmentsBatch)) {
                        foreach (array_chunk($appointmentsBatch, 100) as $chunk) {
                            Appointment::insert($chunk);
                        }
                    }
                }
            });

            return back()->with('success', 'Plan de ortodoncia creado y citas autogeneradas exitosamente.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error creating orthodontic plan: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return back()->withErrors([
                'general' => 'Ocurrió un error al procesar el plan de ortodoncia: ' . $e->getMessage()
            ])->withInput();
        }
    }

    /**
     * Cobrar una cuota de ortodoncia (desde el calendario)
     */
    public function payInstallment(Request $request, string $appointmentId)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $appointment = Appointment::where('tenant_id', $tenantId)
            ->whereNotNull('orthodontic_plan_id')
            ->findOrFail($appointmentId);

        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,transfer,qr,card',
        ]);

        if ($appointment->payment_status === 'paid') {
            return back()->withErrors(['appointment' => 'Esta cuota ya fue cobrada.']);
        }

        DB::transaction(function () use ($appointment, $validated, $tenantId) {
            // Actualizar estado de la cita
            $appointment->update([
                'payment_status' => 'paid',
                'status'         => 'completed',
            ]);

            // Registrar pago
            $payment = Payment::create([
                'tenant_id'      => $tenantId,
                'patient_id'     => $appointment->patient_id,
                'payment_date'   => now(),
                'amount'         => $appointment->amount_due,
                'payment_method' => $validated['payment_method'],
                'received_by'    => Auth::id(),
                'notes'          => 'Cuota ortodoncia - ' . $appointment->reason,
            ]);

            $payment->items()->create([
                'tenant_id'   => $tenantId,
                'description' => $appointment->reason ?? 'Cuota Ortodoncia',
                'amount'      => $appointment->amount_due,
            ]);

            // Registro contable (Partida doble automatizada)
            $patient = $appointment->patient;
            $patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'Paciente';
            AccountingEntryService::recordPaymentEntry(
                tenantId: $tenantId,
                payment: $payment,
                description: 'Cobro cuota ortodoncia - ' . ($appointment->reason ?? 'Control') . ' (' . $patientName . ')',
                incomeAccountCode: '4200'
            );

            // Verificar si el plan completo quedó pagado
            $plan = OrthodonticPlan::with('appointments')->find($appointment->orthodontic_plan_id);
            if ($plan) {
                $allPaid = $plan->appointments->every(fn($a) => $a->payment_status === 'paid');
                if ($allPaid) {
                    $plan->update(['status' => 'completed']);
                }
            }
        });

        return back()->with('success', 'Cuota cobrada exitosamente.');
    }

    /**
     * Eliminar un plan de ortodoncia y sus citas pendientes asociadas
     */
    public function destroy(Request $request, string $id)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $plan = OrthodonticPlan::where('tenant_id', $tenantId)->findOrFail($id);

        DB::transaction(function () use ($plan, $tenantId) {
            // Eliminar citas pendientes de control de ortodoncia de este plan
            Appointment::where('tenant_id', $tenantId)
                ->where('orthodontic_plan_id', $plan->id)
                ->where('payment_status', 'pending')
                ->delete();

            // Desvincular citas pagadas/completadas para preservar el historial clínico y financiero
            Appointment::where('tenant_id', $tenantId)
                ->where('orthodontic_plan_id', $plan->id)
                ->update(['orthodontic_plan_id' => null]);

            // Eliminar el plan de ortodoncia
            $plan->delete();
        });

        return back()->with('success', 'Plan de ortodoncia eliminado exitosamente.');
    }
}
