<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\ClinicalRecord;
use App\Models\PatientFile;
use App\Models\PatientPortalPreference;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Treatment;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PatientPortalController extends Controller
{
    /**
     * Historial del Paciente (Citas, atenciones clínicas, recetas y archivos).
     */
    public function history(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient  = $request->attributes->get('patient');

        $appointments = Appointment::where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->with(['dentist:id,first_name,last_name'])
            ->orderByDesc('start_at')
            ->get()
            ->map(function ($apt) {
                return [
                    'id'            => $apt->id,
                    'start_at'      => $apt->start_at ? Carbon::parse($apt->start_at)->format('Y-m-d H:i') : null,
                    'end_at'        => $apt->end_at ? Carbon::parse($apt->end_at)->format('Y-m-d H:i') : null,
                    'status'        => $apt->status,
                    'reason'        => $apt->reason,
                    'notes'         => $apt->notes,
                    'doctor_name'   => $apt->dentist ? $apt->dentist->name : 'Médico Asignado',
                    'is_past'       => $apt->start_at ? Carbon::parse($apt->start_at)->isPast() : false,
                ];
            });

        $clinicalRecords = ClinicalRecord::where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->with(['dentist:id,first_name,last_name', 'attachments'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($record) {
                return [
                    'id'               => $record->id,
                    'date'             => $record->created_at->format('d/m/Y'),
                    'doctor_name'      => $record->dentist ? $record->dentist->name : 'Médico Tratante',
                    'chief_complaint'  => $record->chief_complaint,
                    'diagnosis'        => $record->diagnosis,
                    'treatment_plan'   => $record->treatment_performed ?? $record->observations,
                    'prescription'     => $record->prescriptions,
                    'has_prescription' => !empty($record->prescriptions) || !empty($record->prescription_items),
                    'attachments'      => $record->attachments ?? [],
                ];
            });

        $files = PatientFile::whereHas('folder', function ($q) use ($patient) {
            $q->where('patient_id', $patient->id);
        })
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($f) {
            return [
                'id'         => $f->id,
                'name'       => $f->original_name ?? $f->file_name,
                'file_type'  => $f->file_type,
                'size'       => $f->file_size,
                'created_at' => $f->created_at->format('d/m/Y'),
                'url'        => $f->file_path ? asset('storage/' . $f->file_path) : null,
            ];
        });

        return Inertia::render('portal/History', [
            'patient'         => $patient,
            'appointments'    => $appointments,
            'clinicalRecords' => $clinicalRecords,
            'files'           => $files,
        ]);
    }

    /**
     * Formulario de Reserva de Cita Médica.
     */
    public function bookAppointment(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient  = $request->attributes->get('patient');
        $tenant   = Tenant::find($tenantId);

        $doctors = User::whereHas('tenantUsers', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)
              ->whereIn('role', ['doctor', 'dentist', 'admin']);
        })
        ->where('is_active', true)
        ->select('id', 'first_name', 'last_name')
        ->get();

        $treatments = Treatment::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->select('id', 'name', 'base_price as price', 'duration_minutes')
            ->get();

        return Inertia::render('portal/BookAppointment', [
            'patient'    => $patient,
            'doctors'    => $doctors,
            'treatments' => $treatments,
            'clinicName' => $tenant?->name ?? 'ClinicSoft',
        ]);
    }

    /**
     * Procesar la reserva de cita.
     */
    public function storeAppointment(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient  = $request->attributes->get('patient');

        $validated = $request->validate([
            'dentist_id'   => 'required|exists:users,id',
            'date'         => 'required|date|after_or_equal:today',
            'time'         => 'required|string',
            'reason'       => 'required|string|max:255',
            'treatment_id' => 'nullable|exists:treatments,id',
            'notes'        => 'nullable|string|max:500',
        ], [
            'dentist_id.required'   => 'Por favor selecciona un médico.',
            'date.required'         => 'Indica la fecha de la cita.',
            'date.after_or_equal'   => 'La fecha debe ser hoy o una fecha posterior.',
            'time.required'         => 'Indica el horario de la cita.',
            'reason.required'       => 'Indica el motivo de la consulta.',
        ]);

        $startAt = Carbon::parse($validated['date'] . ' ' . $validated['time']);
        $endAt   = (clone $startAt)->addMinutes(45);

        // Prevenir solapamiento para el mismo doctor
        $conflict = Appointment::where('tenant_id', $tenantId)
            ->where('dentist_id', $validated['dentist_id'])
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->where(function ($q) use ($startAt, $endAt) {
                $q->whereBetween('start_at', [$startAt, $endAt])
                  ->orWhereBetween('end_at', [$startAt, $endAt]);
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors([
                'time' => 'El horario seleccionado no está disponible con este médico. Por favor elige otro horario.',
            ]);
        }

        $appointment = Appointment::create([
            'tenant_id'   => $tenantId,
            'patient_id'  => $patient->id,
            'dentist_id'  => $validated['dentist_id'],
            'start_at'    => $startAt,
            'end_at'      => $endAt,
            'status'      => 'scheduled',
            'reason'      => $validated['reason'],
            'notes'       => $validated['notes'] ?? 'Reserva solicitada desde el Portal del Paciente',
        ]);

        return redirect()->route('portal.history')->with('success', '¡Tu cita médica ha sido reservada con éxito!');
    }

    /**
     * Cancelar cita médica.
     */
    public function cancelAppointment(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $patient  = $request->attributes->get('patient');

        $appointment = Appointment::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->where('patient_id', $patient->id)
            ->firstOrFail();

        $appointment->update([
            'status' => 'cancelled',
            'notes'  => trim(($appointment->notes ?? '') . ' [Cancelada por el paciente]'),
        ]);

        return back()->with('success', 'La cita ha sido cancelada.');
    }

    /**
     * Configuración de datos personales y preferencias.
     */
    public function settings(Request $request)
    {
        $patient = $request->attributes->get('patient');
        $user    = $request->user();

        $preferences = PatientPortalPreference::firstOrCreate(
            ['patient_id' => $patient->id],
            [
                'email_notifications'     => true,
                'whatsapp_notifications'  => true,
                'privacy_policy_accepted' => true,
            ]
        );

        return Inertia::render('portal/Settings', [
            'patient'     => $patient,
            'user'        => [
                'id'         => $user->id,
                'email'      => $user->email,
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'phone'      => $user->phone,
            ],
            'preferences' => $preferences,
        ]);
    }

    /**
     * Actualizar solo datos permitidos (nombre, email, teléfono, contraseña y preferencias).
     */
    public function updateSettings(Request $request)
    {
        $patient = $request->attributes->get('patient');
        $user    = $request->user();

        $validated = $request->validate([
            'first_name'             => 'required|string|max:100',
            'last_name'              => 'required|string|max:100',
            'email'                  => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone'                  => 'nullable|string|max:30',
            'password'               => 'nullable|string|min:6|confirmed',
            'email_notifications'    => 'boolean',
            'whatsapp_notifications' => 'boolean',
        ], [
            'first_name.required' => 'El nombre es obligatorio.',
            'last_name.required'  => 'El apellido es obligatorio.',
            'email.required'      => 'El correo electrónico es obligatorio.',
            'email.unique'        => 'Este correo electrónico ya está en uso.',
            'password.min'        => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'password.confirmed'  => 'La confirmación de la contraseña no coincide.',
        ]);

        // 1. Actualizar usuario de login
        $user->first_name = $validated['first_name'];
        $user->last_name  = $validated['last_name'];
        $user->email      = $validated['email'];
        $user->phone      = $validated['phone'] ?? null;

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
            $user->encrypted_password = $validated['password'];
        }
        $user->save();

        // 2. Actualizar ficha del paciente (sincronizar nombre, email y teléfono)
        $patient->update([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'email'      => $validated['email'],
            'phone'      => $validated['phone'] ?? null,
        ]);

        // 3. Actualizar preferencias
        PatientPortalPreference::updateOrCreate(
            ['patient_id' => $patient->id],
            [
                'email_notifications'    => $request->boolean('email_notifications', true),
                'whatsapp_notifications' => $request->boolean('whatsapp_notifications', true),
            ]
        );

        return back()->with('success', 'Tus datos personales y preferencias han sido actualizados.');
    }
}

