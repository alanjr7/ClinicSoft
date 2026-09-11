<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Patient;

class RadiographController extends Controller
{
    public function index(Request $request)
    {
        $tenantId  = $request->attributes->get('tenant_id');
        $patientId = $request->input('patient_id');

        // Fetch active patients list for the selector
        $patients = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'national_id', 'phone', 'email', 'date_of_birth', 'gender']);

        $selectedPatient = null;
        if ($patientId) {
            $selectedPatient = Patient::where('tenant_id', $tenantId)
                ->where('id', $patientId)
                ->with(['folders.files'])
                ->first();
        }

        // If no specific patient requested and there is at least one patient, we can leave selectedPatient as null or select first
        // Leaving null allows a clean patient selection screen if preferred, but if patient_id was invalid, it stays null.

        return Inertia::render('Radiographs', [
            'patients'        => $patients,
            'selectedPatient' => $selectedPatient,
            'patient_id'      => $patientId,
        ]);
    }
}
