<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\Treatment;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\TenantSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

use App\Models\AppointmentTreatment;
use App\Models\TenantUser;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PublicAppointmentController extends Controller
{
    public function create($tenantSlug)
    {
        $tenant = Tenant::where('slug', $tenantSlug)->where('status', 'active')->firstOrFail();
        
        return view('appointments.create', compact('tenant'));
    }

    public function getData($tenantSlug)
    {
        try {
            $tenant = Tenant::where('slug', $tenantSlug)->where('status', 'active')->firstOrFail();
            
            $treatments = Treatment::where('tenant_id', $tenant->id)
                                    ->where('is_active', true)
                                    ->get();

            $setting = TenantSetting::where('tenant_id', $tenant->id)->first();
            $settings = $setting ? ($setting->settings ?? []) : [];
            $bookingSchedule = \App\Http\Controllers\Erp\PublicViewController::normalizeBookingSchedule($settings['booking_hours'] ?? null);
            
            // Cargar citas ocupadas del tenant (excluyendo canceladas)
            $busySlots = Appointment::where('tenant_id', $tenant->id)
                ->where('start_at', '>=', now()->subDays(2)->startOfDay())
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->get(['start_at', 'end_at'])
                ->map(function ($appt) {
                    $start = $appt->start_at;
                    $end = $appt->end_at ?? (clone $start)->addMinutes(30);
                    return [
                        'date'  => $start->format('Y-m-d'),
                        'start' => $start->format('H:i'),
                        'end'   => $end->format('H:i'),
                    ];
                });

            return response()->json([
                'tenant'           => $tenant,
                'treatments'       => $treatments,
                'booking_schedule' => $bookingSchedule,
                'booking_hours'    => $bookingSchedule, // compatibility
                'busy_slots'       => $busySlots,
            ]);
        } catch (\Throwable $e) {
            Log::error('Error cargando datos públicos de cita: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'No se pudieron cargar los datos de la clínica.'
            ], 500);
        }
    }

    public function store(Request $request, $tenantSlug)
    {
        try {
            $tenant = Tenant::where('slug', $tenantSlug)->where('status', 'active')->firstOrFail();

            $validated = $request->validate([
                'treatment_id' => 'required|exists:treatments,id',
                'date' => 'required|date',
                'time' => 'required|date_format:H:i',
                'patient_name' => 'required|string|max:255',
                'patient_phone' => 'required|string|max:50',
                'receipt' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120'
            ]);

            $treatment = Treatment::where('tenant_id', $tenant->id)->findOrFail($validated['treatment_id']);

            // ---- Validate against tenant's day-by-day business hours ----
            $setting = TenantSetting::where('tenant_id', $tenant->id)->first();
            $settings = $setting ? ($setting->settings ?? []) : [];
            $schedule = \App\Http\Controllers\Erp\PublicViewController::normalizeBookingSchedule($settings['booking_hours'] ?? null);

            $dateCarbon = Carbon::parse($validated['date']);
            $dayKey = strtolower($dateCarbon->format('l')); // 'monday', 'tuesday', ..., 'sunday'
            $dayNamesSpanish = [
                'monday'    => 'Lunes',
                'tuesday'   => 'Martes',
                'wednesday' => 'Miércoles',
                'thursday'  => 'Jueves',
                'friday'    => 'Viernes',
                'saturday'  => 'Sábado',
                'sunday'    => 'Domingo',
            ];
            $dayNameEs = $dayNamesSpanish[$dayKey] ?? $dayKey;

            $dayConfig = $schedule[$dayKey] ?? null;
            if (!$dayConfig || empty($dayConfig['enabled'])) {
                return response()->json([
                    'success' => false,
                    'message' => "La clínica no atiende los días {$dayNameEs}.",
                ], 422);
            }

            $timeObj  = Carbon::createFromFormat('H:i', $validated['time']);
            $startObj = Carbon::createFromFormat('H:i', $dayConfig['start']);
            $endObj   = Carbon::createFromFormat('H:i', $dayConfig['end']);

            if ($timeObj->lt($startObj) || $timeObj->gte($endObj)) {
                return response()->json([
                    'success' => false,
                    'message' => "El horario seleccionado está fuera del horario de atención para los días {$dayNameEs} ({$dayConfig['start']} a {$dayConfig['end']}).",
                ], 422);
            }

            if (!empty($dayConfig['lunch_enabled']) && !empty($dayConfig['lunch_start']) && !empty($dayConfig['lunch_end'])) {
                $lsObj = Carbon::createFromFormat('H:i', $dayConfig['lunch_start']);
                $leObj = Carbon::createFromFormat('H:i', $dayConfig['lunch_end']);
                if ($timeObj->gte($lsObj) && $timeObj->lt($leObj)) {
                    return response()->json([
                        'success' => false,
                        'message' => "El horario seleccionado corresponde al horario de pausa de la clínica ({$dayConfig['lunch_start']} a {$dayConfig['lunch_end']}).",
                    ], 422);
                }
            }
            // -----------------------------------------

            // ---- Validar solapamiento con citas existentes del mismo tenant ----
            $startAt = Carbon::parse($validated['date'] . ' ' . $validated['time']);
            $durationMinutes = (int) ($treatment->duration_minutes ?? 30);
            $endAt = $startAt->copy()->addMinutes($durationMinutes > 0 ? $durationMinutes : 30);

            $hasConflict = Appointment::where('tenant_id', $tenant->id)
                ->whereNotIn('status', ['cancelled', 'no_show'])
                ->where(function ($query) use ($startAt, $endAt) {
                    $query->where('start_at', '<', $endAt)
                          ->where('end_at', '>', $startAt);
                })
                ->exists();

            if ($hasConflict) {
                return response()->json([
                    'success' => false,
                    'message' => 'El horario seleccionado ya no está disponible (ya existe una cita programada). Por favor selecciona otro horario.',
                ], 422);
            }
            // -------------------------------------------------------------------

            // Split patient name into first/last name safely
            $nameParts = explode(' ', trim($validated['patient_name']), 2);
            $firstName = $nameParts[0];
            $lastName  = isset($nameParts[1]) && trim($nameParts[1]) !== '' ? trim($nameParts[1]) : '-';

            // Check if patient exists for this tenant (by phone), else create
            $patient = Patient::firstOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $validated['patient_phone']],
                ['first_name' => $firstName, 'last_name' => $lastName]
            );

            $receiptPath = null;
            if ($request->hasFile('receipt') && $request->file('receipt')->isValid()) {
                try {
                    $receiptPath = $request->file('receipt')->store('receipts', 'public');
                } catch (\Throwable $uploadErr) {
                    Log::warning('No se pudo guardar el comprobante de pago: ' . $uploadErr->getMessage());
                }
            }

            $tenantUser = TenantUser::where('tenant_id', $tenant->id)
                ->whereIn('role', ['doctor', 'dentist'])
                ->where('is_active', true)
                ->first();

            if (!$tenantUser) {
                $tenantUser = TenantUser::where('tenant_id', $tenant->id)->where('is_active', true)->first();
            }

            if (!$tenantUser) {
                $tenantUser = TenantUser::where('tenant_id', $tenant->id)->first();
            }

            if (!$tenantUser || !$tenantUser->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuración de clínica incompleta (no hay médicos o usuarios activos registrados).'
                ], 400);
            }

            $appointment = Appointment::create([
                'tenant_id' => $tenant->id,
                'patient_id' => $patient->id,
                'dentist_id' => $tenantUser->user_id,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'status' => 'scheduled',
                'payment_status' => 'pending',
                'payment_receipt_path' => $receiptPath,
                'reason' => 'Reserva pública: ' . $treatment->name,
            ]);

            AppointmentTreatment::create([
                'tenant_id' => $tenant->id,
                'appointment_id' => $appointment->id,
                'treatment_id' => $treatment->id,
                'notes' => 'Seleccionado en web',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cita reservada con éxito.',
                'appointment' => $appointment
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Los datos ingresados no son válidos.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Error registrando cita pública [' . $tenantSlug . ']: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->except(['receipt'])
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error en el servidor al registrar la cita: ' . $e->getMessage()
            ], 500);
        }
    }
}
