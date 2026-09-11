<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Models\Tenant;
use App\Models\Appointment;
use App\Models\Treatment;
use App\Models\Payment;
use App\Models\TenantSetting;
use Illuminate\Support\Facades\DB;

class PublicViewController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $tenant = Tenant::findOrFail($tenantId);
        
        $appointments = Appointment::with(['patient', 'treatments.treatment'])
            ->where('tenant_id', $tenantId)
            ->where('reason', 'like', 'Reserva pública:%')  // Solo citas creadas desde la vista pública
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Formatear los tratamientos para que el frontend de React los lea correctamente (t.name, t.base_price)
        $appointments->each(function ($appt) {
            $appt->setRelation('treatments', $appt->treatments->map(function ($at) {
                return $at->treatment;
            })->filter()->values());
        });
            
        $treatments = Treatment::where('tenant_id', $tenantId)->get();

        $setting = TenantSetting::where('tenant_id', $tenantId)->first();
        $settings = $setting ? ($setting->settings ?? []) : [];
        $bookingSchedule = self::normalizeBookingSchedule($settings['booking_hours'] ?? null);

        return Inertia::render('PublicView', [
            'tenant'          => $tenant,
            'appointments'    => $appointments,
            'treatments'      => $treatments,
            'bookingSchedule' => $bookingSchedule,
        ]);
    }

    public function uploadQr(Request $request)
    {
        $request->validate([
            'qr_image' => 'required|image|mimes:jpeg,png,jpg,svg|max:2048'
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $tenant = Tenant::findOrFail($tenantId);

        if ($request->hasFile('qr_image')) {
            if ($tenant->payment_qr_path) {
                Storage::disk('public')->delete($tenant->payment_qr_path);
            }
            
            $path = $request->file('qr_image')->store('tenant_qrs', 'public');
            $tenant->payment_qr_path = $path;
            $tenant->save();
        }

        return redirect()->back()->with('success', 'Código QR actualizado exitosamente.');
    }

    public function acceptPayment(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $appointment = Appointment::where('tenant_id', $tenantId)
            ->with(['patient', 'treatments.treatment'])
            ->findOrFail($id);

        DB::transaction(function () use ($appointment, $tenantId) {
            $appointment->payment_status = 'paid';
            $appointment->status = 'confirmed';
            $appointment->save();

            // Register payment if it has treatments (we sum their base price, or just use 0 if unknown)
            $amount = $appointment->treatments->sum(function($at) {
                return $at->treatment ? (float) $at->treatment->base_price : 0;
            });
            
            $invoice = \App\Models\Invoice::create([
                'tenant_id' => $tenantId,
                'patient_id' => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'created_by' => auth()->id(),
                'invoice_number' => 'INV-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'status' => 'paid',
                'subtotal' => $amount,
                'total' => $amount,
                'amount_paid' => $amount,
                'issued_at' => now(),
            ]);
            
            $payment = Payment::create([
                'tenant_id' => $tenantId,
                'invoice_id' => $invoice->id,
                'patient_id' => $appointment->patient_id,
                'received_by' => auth()->id(),
                'amount' => $amount > 0 ? $amount : 0,
                'payment_method' => 'transfer', // QR is typically a transfer
                'payment_date' => now(),
                'notes' => 'Pago por reserva web (Cita #' . substr($appointment->id, 0, 8) . ')',
            ]);

            foreach ($appointment->treatments as $at) {
                if ($at->treatment) {
                    $payment->items()->create([
                        'tenant_id' => $tenantId,
                        'description' => $at->treatment->name,
                        'amount' => $at->treatment->base_price,
                    ]);

                    $invoice->items()->create([
                        'tenant_id' => $tenantId,
                        'treatment_id' => $at->treatment->id,
                        'description' => $at->treatment->name,
                        'quantity' => 1,
                        'unit_price' => $at->treatment->base_price,
                        'total' => $at->treatment->base_price,
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Pago aceptado y cita confirmada.');
    }

    public function rejectPayment(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $appointment = Appointment::where('tenant_id', $tenantId)->findOrFail($id);

        $appointment->payment_status = 'rejected';
        $appointment->status = 'cancelled'; // Liberar el horario para que otros pacientes puedan reservar
        $appointment->save();

        return redirect()->back()->with('success', 'Pago rechazado.');
    }

    public function storeTreatment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
            'duration_minutes' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean'
        ]);

        $tenantId = $request->attributes->get('tenant_id');

        $treatment = Treatment::create([
            'tenant_id' => $tenantId,
            'name' => $request->name,
            'base_price' => $request->base_price,
            'duration_minutes' => $request->duration_minutes ?? 30,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->back()->with('success', 'Tratamiento creado exitosamente.');
    }

    public function updateTreatment(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'base_price' => 'sometimes|numeric|min:0',
            'duration_minutes' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean'
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $treatment = Treatment::where('tenant_id', $tenantId)->findOrFail($id);

        $treatment->update($request->only(['name', 'base_price', 'duration_minutes', 'is_active']));

        return redirect()->back()->with('success', 'Tratamiento actualizado exitosamente.');
    }

    public function destroyTreatment(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $treatment = Treatment::where('tenant_id', $tenantId)->findOrFail($id);
        
        if ($treatment->image_path) {
            Storage::disk('public')->delete($treatment->image_path);
        }

        $treatment->delete();

        return redirect()->back()->with('success', 'Tratamiento eliminado exitosamente.');
    }

    public function uploadTreatmentImage(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $treatment = Treatment::where('tenant_id', $tenantId)->findOrFail($id);

        if ($request->hasFile('image')) {
            if ($treatment->image_path) {
                Storage::disk('public')->delete($treatment->image_path);
            }
            
            $path = $request->file('image')->store('treatments', 'public');
            $treatment->image_path = $path;
            $treatment->save();
        }

        return redirect()->back()->with('success', 'Imagen del tratamiento actualizada exitosamente.');
    }
    public function updateBookingHours(Request $request)
    {
        $request->validate([
            'days'                   => 'required|array',
            'days.*.enabled'         => 'required|boolean',
            'days.*.start'           => 'required|date_format:H:i',
            'days.*.end'             => 'required|date_format:H:i',
            'days.*.lunch_enabled'   => 'nullable|boolean',
            'days.*.lunch_start'     => 'nullable|date_format:H:i',
            'days.*.lunch_end'       => 'nullable|date_format:H:i',
        ]);

        $tenantId = $request->attributes->get('tenant_id');

        $setting = TenantSetting::firstOrNew(['tenant_id' => $tenantId]);
        $current = $setting->settings ?? [];

        $current['booking_hours'] = [
            'type' => 'custom_days',
            'days' => $request->days,
        ];

        $setting->tenant_id = $tenantId;
        $setting->settings  = $current;
        $setting->save();

        return redirect()->back()->with('success', 'Horario de atención por día actualizado exitosamente.');
    }

    public static function normalizeBookingSchedule(?array $saved): array
    {
        $daysList = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // If saved as 'days' map
        if (isset($saved['days']) && is_array($saved['days'])) {
            $result = [];
            foreach ($daysList as $day) {
                $d = $saved['days'][$day] ?? [];
                $result[$day] = [
                    'enabled'       => isset($d['enabled']) ? (bool) $d['enabled'] : true,
                    'start'         => !empty($d['start']) ? $d['start'] : '08:00',
                    'end'           => !empty($d['end']) ? $d['end'] : ($day === 'saturday' || $day === 'sunday' ? '16:00' : '19:00'),
                    'lunch_enabled' => !empty($d['lunch_enabled']),
                    'lunch_start'   => !empty($d['lunch_start']) ? $d['lunch_start'] : null,
                    'lunch_end'     => !empty($d['lunch_end']) ? $d['lunch_end'] : null,
                ];
            }
            return $result;
        }

        // Legacy format fallback: { start, end, lunch_start, lunch_end }
        $defaultStart = !empty($saved['start']) ? $saved['start'] : '08:00';
        $defaultEnd   = !empty($saved['end']) ? $saved['end'] : '19:00';
        $defaultLunchStart = !empty($saved['lunch_start']) ? $saved['lunch_start'] : null;
        $defaultLunchEnd   = !empty($saved['lunch_end']) ? $saved['lunch_end'] : null;
        $defaultLunchEnabled = !empty($defaultLunchStart) && !empty($defaultLunchEnd);

        $result = [];
        foreach ($daysList as $day) {
            $isWeekend = ($day === 'saturday' || $day === 'sunday');
            $result[$day] = [
                'enabled'       => true,
                'start'         => $defaultStart,
                'end'           => $isWeekend ? '16:00' : $defaultEnd,
                'lunch_enabled' => $defaultLunchEnabled,
                'lunch_start'   => $defaultLunchStart,
                'lunch_end'     => $defaultLunchEnd,
            ];
        }

        return $result;
    }

    public function updateAppearance(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $tenant = Tenant::findOrFail($tenantId);

        $request->validate([
            'name' => 'required|string|max:255',
            'primary_color' => 'required|string|max:7',
            'header_text_color' => 'required|string|max:7',
            'logo' => 'nullable|image|max:2048'
        ]);

        $tenant->name = $request->name;
        $tenant->primary_color = $request->primary_color;
        $tenant->header_text_color = $request->header_text_color;

        if ($request->hasFile('logo')) {
            if ($tenant->logo_url) {
                Storage::disk('public')->delete($tenant->logo_url);
            }
            $path = $request->file('logo')->store('tenant_logos', 'public');
            $tenant->logo_url = $path;
        }

        $tenant->save();

        return redirect()->back()->with('success', 'Apariencia actualizada exitosamente.');
    }
}
