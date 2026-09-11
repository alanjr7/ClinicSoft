<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;
use App\Models\PatientAllergy;
use App\Models\PatientMedicalCondition;
use App\Models\PatientEmergencyContact;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $search   = $request->input('search', '');

        $query = Patient::where('tenant_id', $tenantId)->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $patients = $query->latest()->get();

        return Inertia::render('Patients', [
            'patients' => $patients,
            'filters'  => ['search' => $search],
        ]);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $patient = Patient::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->with(['allergies', 'medicalConditions', 'emergencyContacts', 'folders.files', 'payments.items', 'surgeries'])
            ->firstOrFail();

        return Inertia::render('PatientProfile', [
            'patient' => $patient,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'first_name'                            => 'required|string|max:100',
            'last_name'                             => 'required|string|max:100',
            'email'                                 => 'nullable|email|max:255',
            'phone'                                 => 'nullable|string|max:50',
            'date_of_birth'                         => 'nullable|date',
            'gender'                                => 'nullable|string|max:20',
            'national_id'                           => 'nullable|string|max:50',
            'address'                               => 'nullable|string',
            'city'                                  => 'nullable|string|max:100',
            'state'                                 => 'nullable|string|max:100',
            'blood_type'                            => 'nullable|string|max:10',
            'notes'                                 => 'nullable|string',
            'allergies'                             => 'nullable|array',
            'allergies.*.allergen'                  => 'required|string',
            'allergies.*.severity'                  => 'nullable|string',
            'medical_conditions'                    => 'nullable|array',
            'medical_conditions.*.condition_name'   => 'required|string',
            'medical_conditions.*.notes'            => 'nullable|string',
            'emergency_contacts'                    => 'nullable|array',
            'emergency_contacts.*.name'             => 'required|string',
            'emergency_contacts.*.relationship'     => 'required|string',
            'emergency_contacts.*.phone'            => 'required|string',
        ]);

        DB::transaction(function () use ($validated, $tenantId) {
            $patient = Patient::create(array_merge(
                collect($validated)->except(['allergies', 'medical_conditions', 'emergency_contacts'])->toArray(),
                ['tenant_id' => $tenantId, 'created_by' => Auth::id()]
            ));

            foreach ($validated['allergies'] ?? [] as $a) {
                PatientAllergy::create(array_merge($a, ['tenant_id' => $tenantId, 'patient_id' => $patient->id]));
            }
            foreach ($validated['medical_conditions'] ?? [] as $c) {
                PatientMedicalCondition::create(array_merge($c, ['tenant_id' => $tenantId, 'patient_id' => $patient->id]));
            }
            foreach ($validated['emergency_contacts'] ?? [] as $ec) {
                PatientEmergencyContact::create(array_merge($ec, ['tenant_id' => $tenantId, 'patient_id' => $patient->id]));
            }
        });

        return redirect()->route('patients.index')->with('success', 'Paciente creado correctamente.');
    }

    public function update(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $patient = Patient::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'first_name'    => 'string|max:100',
            'last_name'     => 'string|max:100',
            'national_id'   => 'nullable|string|max:50',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'date_of_birth' => 'nullable|date',
            'gender'        => 'nullable|string|max:20',
            'address'       => 'nullable|string',
            'city'          => 'nullable|string|max:100',
            'state'         => 'nullable|string|max:100',
            'blood_type'    => 'nullable|string|max:10',
            'notes'         => 'nullable|string',
            'is_active'     => 'boolean',
        ]);

        $patient->update($validated);

        return back()->with('success', 'Paciente actualizado.');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $patient = Patient::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();
        $patient->is_active = false;
        $patient->save();

        return redirect()->route('patients.index')->with('success', 'Paciente eliminado.');
    }
}
