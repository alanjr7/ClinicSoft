<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\AppointmentTreatment;
use App\Models\Patient;
use App\Models\Treatment;
use App\Models\TenantUser;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $query = Appointment::where('tenant_id', $tenantId)
            ->with(['patient:id,first_name,last_name,national_id', 'dentist:id,first_name,last_name'])
            ->orderBy('start_at');

        if ($request->has('from_date')) {
            $query->where('start_at', '>=', $request->input('from_date'));
        }
        if ($request->has('to_date')) {
            $query->where('start_at', '<=', $request->input('to_date'));
        }
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $appointments = $query->get();

        // Options for forms
        $patients = Patient::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'national_id', 'phone']);

        $dentists = TenantUser::where('tenant_id', $tenantId)
            ->whereIn('role', ['doctor', 'dentist', 'admin', 'owner', 'staff', 'nurse'])
            ->where('is_active', true)
            ->with('user:id,first_name,last_name')
            ->get()
            ->map(function ($tu) {
                $roleLabel = match ($tu->role) {
                    'doctor'  => 'Doctor(a)',
                    'dentist' => 'Odontólogo(a)',
                    'nurse'   => 'Enfermero(a)',
                    'admin'   => 'Admin / Personal',
                    'owner'   => 'Director(a)',
                    'staff'   => 'Personal',
                    default   => 'Personal'
                };
                $name = trim(($tu->user?->first_name ?? '') . ' ' . ($tu->user?->last_name ?? ''));
                return [
                    'id'         => $tu->user_id,
                    'name'       => $name,
                    'role'       => $tu->role,
                    'role_label' => $roleLabel,
                ];
            });

        $treatments = Treatment::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('name')->get(['id', 'name', 'base_price', 'duration_minutes']);

        return Inertia::render('Appointments', [
            'appointments' => $appointments,
            'patients'     => $patients,
            'dentists'     => $dentists,
            'treatments'   => $treatments,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Quick patient creation support directly from appointment modal
        if ($request->boolean('create_quick_patient') || (empty($request->input('patient_id')) && $request->filled('new_patient_name'))) {
            $patientName = trim($request->input('new_patient_name', ''));
            if (!empty($patientName)) {
                $nameParts = preg_split('/\s+/', $patientName, 2);
                $firstName = $nameParts[0];
                $lastName  = $nameParts[1] ?? '';

                $newPatient = Patient::create([
                    'tenant_id'   => $tenantId,
                    'first_name'  => $firstName,
                    'last_name'   => $lastName,
                    'national_id' => $request->filled('new_patient_national_id') ? trim($request->input('new_patient_national_id')) : null,
                    'phone'       => $request->filled('new_patient_phone') ? trim($request->input('new_patient_phone')) : null,
                    'is_active'   => true,
                    'created_by'  => Auth::id(),
                ]);
                $request->merge(['patient_id' => $newPatient->id]);
            }
        }

        $validated = $request->validate([
            'patient_id'    => 'required|exists:patients,id',
            'dentist_id'    => 'required|exists:users,id',
            'start_at'      => 'required|date',
            'end_at'        => 'nullable|date|after:start_at',
            'status'        => 'string|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes'         => 'nullable|string',
            'treatment_ids' => 'nullable|array',
            'treatment_ids.*' => 'exists:treatments,id',
        ], [
            'patient_id.required' => 'Debes seleccionar o ingresar un paciente.',
            'dentist_id.required' => 'Debes seleccionar un doctor o personal.',
            'start_at.required'   => 'La fecha y hora son obligatorias.',
        ]);

        DB::transaction(function () use ($validated, $tenantId) {
            $appt = Appointment::create(array_merge(
                collect($validated)->except('treatment_ids')->toArray(),
                ['tenant_id' => $tenantId, 'created_by' => Auth::id()]
            ));
            foreach ($validated['treatment_ids'] ?? [] as $tid) {
                AppointmentTreatment::create(['appointment_id' => $appt->id, 'treatment_id' => $tid, 'tenant_id' => $tenantId]);
            }
        });

        return redirect()->route('appointments.index')->with('success', 'Cita agendada.');
    }

    public function update(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $appt = Appointment::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'patient_id' => 'exists:patients,id',
            'dentist_id' => 'exists:users,id',
            'start_at'   => 'date',
            'end_at'     => 'nullable|date',
            'status'     => 'string|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes'      => 'nullable|string',
        ]);

        $appt->update($validated);
        return back()->with('success', 'Cita actualizada.');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        Appointment::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()->delete();
        return redirect()->route('appointments.index')->with('success', 'Cita eliminada.');
    }
}
