<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Appointment;
use App\Models\ClinicalRecord;
use App\Models\Patient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ClinicalController extends Controller
{
    public function index(Request $request)
    {
        $tenantId  = $request->attributes->get('tenant_id');
        $patientId = $request->input('patient_id');

        $query = ClinicalRecord::where('tenant_id', $tenantId)
            ->with(['patient:id,first_name,last_name', 'dentist:id,first_name,last_name', 'appointment:id,start_at,status,reason'])
            ->orderByDesc('visit_date')
            ->orderByDesc('created_at');

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        $records = $query->take(100)->get();

        $patients = Patient::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('last_name')->get(['id', 'first_name', 'last_name']);

        $patientDetail = null;
        $appointments = [];
        if ($patientId) {
            $patientDetail = Patient::where('tenant_id', $tenantId)
                ->where('id', $patientId)
                ->with(['allergies', 'medicalConditions'])
                ->first();

            $appointments = Appointment::where('tenant_id', $tenantId)
                ->where('patient_id', $patientId)
                ->with([
                    'dentist:id,first_name,last_name',
                    'treatments.treatment:id,name,base_price',
                ])
                ->orderByDesc('start_at')
                ->get();
        }

        return Inertia::render('ClinicalHistory', [
            'patients'       => $patients,
            'records'        => $records,
            'appointments'   => $appointments,
            'patient_id'     => $patientId,
            'patient_detail' => $patientDetail,
        ]);
    }

    public function storeRecord(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'           => 'required|exists:patients,id',
            'appointment_id'       => 'nullable|exists:appointments,id',
            'visit_date'           => 'required|date',
            'blood_pressure'       => 'nullable|string|max:20',
            'heart_rate'           => 'nullable|integer|min:20|max:300',
            'respiratory_rate'     => 'nullable|integer|min:5|max:100',
            'temperature'          => 'nullable|numeric|min:30|max:45',
            'weight'               => 'nullable|numeric|min:0.5|max:500',
            'height'               => 'nullable|numeric|min:20|max:280',
            'bmi'                  => 'nullable|numeric|min:5|max:100',
            'oxygen_saturation'    => 'nullable|integer|min:50|max:100',
            'blood_glucose'        => 'nullable|integer|min:10|max:1000',
            'chief_complaint'      => 'nullable|string',
            'medical_background'   => 'nullable|string',
            'physical_examination' => 'nullable|string',
            'diagnosis'            => 'nullable|string',
            'treatment_performed'  => 'nullable|string',
            'prescriptions'        => 'nullable|string',
            'prescription_items'   => 'nullable|array',
            'observations'         => 'nullable|string',
            'next_visit_notes'     => 'nullable|string',
        ]);

        // Auto-calculate BMI if not provided and height/weight exist
        if (empty($validated['bmi']) && !empty($validated['weight']) && !empty($validated['height'])) {
            $heightInMeters = $validated['height'] / 100;
            if ($heightInMeters > 0) {
                $validated['bmi'] = round($validated['weight'] / ($heightInMeters * $heightInMeters), 1);
            }
        }

        $record = ClinicalRecord::create(array_merge($validated, [
            'tenant_id'  => $tenantId,
            'dentist_id' => Auth::id(),
        ]));

        if (!empty($validated['appointment_id'])) {
            $appt = Appointment::where('id', $validated['appointment_id'])
                ->where('tenant_id', $tenantId)
                ->first();
            if ($appt && in_array($appt->status, ['scheduled', 'confirmed', 'in_progress'])) {
                $appt->update(['status' => 'completed']);
            }
        }

        return back()->with('success', 'Consulta médica registrada exitosamente.');
    }

    public function updateRecord(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $record = ClinicalRecord::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'appointment_id'       => 'nullable|exists:appointments,id',
            'visit_date'           => 'required|date',
            'blood_pressure'       => 'nullable|string|max:20',
            'heart_rate'           => 'nullable|integer|min:20|max:300',
            'respiratory_rate'     => 'nullable|integer|min:5|max:100',
            'temperature'          => 'nullable|numeric|min:30|max:45',
            'weight'               => 'nullable|numeric|min:0.5|max:500',
            'height'               => 'nullable|numeric|min:20|max:280',
            'bmi'                  => 'nullable|numeric|min:5|max:100',
            'oxygen_saturation'    => 'nullable|integer|min:50|max:100',
            'blood_glucose'        => 'nullable|integer|min:10|max:1000',
            'chief_complaint'      => 'nullable|string',
            'medical_background'   => 'nullable|string',
            'physical_examination' => 'nullable|string',
            'diagnosis'            => 'nullable|string',
            'treatment_performed'  => 'nullable|string',
            'prescriptions'        => 'nullable|string',
            'prescription_items'   => 'nullable|array',
            'observations'         => 'nullable|string',
            'next_visit_notes'     => 'nullable|string',
        ]);

        if (empty($validated['bmi']) && !empty($validated['weight']) && !empty($validated['height'])) {
            $heightInMeters = $validated['height'] / 100;
            if ($heightInMeters > 0) {
                $validated['bmi'] = round($validated['weight'] / ($heightInMeters * $heightInMeters), 1);
            }
        }

        $record->update($validated);

        return back()->with('success', 'Consulta médica actualizada exitosamente.');
    }

    public function destroyRecord(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        ClinicalRecord::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()->delete();
        return back()->with('success', 'Registro eliminado.');
    }
}
