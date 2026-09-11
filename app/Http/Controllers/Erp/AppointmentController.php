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
            ->with(['patient:id,first_name,last_name', 'dentist:id,first_name,last_name'])
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
            ->orderBy('last_name')->get(['id', 'first_name', 'last_name']);

        $dentists = TenantUser::where('tenant_id', $tenantId)
            ->whereIn('role', ['doctor', 'dentist', 'admin', 'owner'])
            ->where('is_active', true)
            ->with('user:id,first_name,last_name')
            ->get()
            ->map(fn ($tu) => ['id' => $tu->user_id, 'name' => $tu->user?->first_name . ' ' . $tu->user?->last_name]);

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

        $validated = $request->validate([
            'patient_id'    => 'required|exists:patients,id',
            'dentist_id'    => 'required|exists:users,id',
            'start_at'      => 'required|date',
            'end_at'        => 'nullable|date|after:start_at',
            'status'        => 'string|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes'         => 'nullable|string',
            'treatment_ids' => 'nullable|array',
            'treatment_ids.*' => 'exists:treatments,id',
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

        return redirect()->route('appointments.index')->with('success', 'Cita creada.');
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
