<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Surgery;
use App\Models\Patient;
use App\Models\TenantUser;
use Illuminate\Support\Facades\Auth;

class SurgeryController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $query = Surgery::where('tenant_id', $tenantId)
            ->with(['patient' => function ($q) {
                $q->select('id', 'first_name', 'last_name', 'national_id', 'blood_type', 'phone', 'gender', 'date_of_birth')
                  ->with(['allergies:id,patient_id,allergen,severity', 'medicalConditions:id,patient_id,condition_name']);
            }])
            ->orderByDesc('scheduled_start_at');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->input('patient_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('operating_room') && $request->input('operating_room') !== 'all') {
            $query->where('operating_room', $request->input('operating_room'));
        }

        if ($request->filled('from_date')) {
            $query->whereDate('scheduled_start_at', '>=', $request->input('from_date'));
        }

        if ($request->filled('to_date')) {
            $query->whereDate('scheduled_start_at', '<=', $request->input('to_date'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('procedure_name', 'like', $search)
                  ->orWhere('surgeon_name', 'like', $search)
                  ->orWhere('operating_room', 'like', $search)
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('first_name', 'like', $search)
                         ->orWhere('last_name', 'like', $search)
                         ->orWhere('national_id', 'like', $search);
                  });
            });
        }

        $surgeries = $query->get();

        // Patients with allergies and conditions for easy quick-access
        $patients = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->with(['allergies:id,patient_id,allergen,severity', 'medicalConditions:id,patient_id,condition_name'])
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'national_id', 'blood_type', 'date_of_birth', 'gender', 'phone']);

        // Doctors/staff names in tenant for autocomplete suggestions
        $staffDoctors = TenantUser::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->with('user:id,first_name,last_name')
            ->get()
            ->map(function ($tu) {
                return [
                    'id' => $tu->user_id,
                    'name' => 'Dr(a). ' . trim(($tu->user?->first_name ?? '') . ' ' . ($tu->user?->last_name ?? '')),
                    'role' => $tu->role,
                ];
            });

        // KPIs
        $allTenantSurgeries = Surgery::where('tenant_id', $tenantId)->get();
        $stats = [
            'total_scheduled' => $allTenantSurgeries->whereIn('status', ['scheduled', 'confirmed'])->count(),
            'in_progress'     => $allTenantSurgeries->where('status', 'in_progress')->count(),
            'completed_month' => $allTenantSurgeries->where('status', 'completed')
                ->filter(fn ($s) => $s->scheduled_start_at && $s->scheduled_start_at->isCurrentMonth())->count(),
            'total_completed' => $allTenantSurgeries->where('status', 'completed')->count(),
            'active_rooms'    => $allTenantSurgeries->where('status', 'in_progress')->pluck('operating_room')->filter()->unique()->count(),
        ];

        return Inertia::render('Surgeries', [
            'surgeries'     => $surgeries,
            'patients'      => $patients,
            'staffDoctors'  => $staffDoctors,
            'stats'         => $stats,
            'filters'       => $request->only(['patient_id', 'status', 'operating_room', 'from_date', 'to_date', 'search']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Support creating a quick patient on the fly if needed
        if ($request->boolean('create_quick_patient') || empty($request->input('patient_id'))) {
            $patientName = trim($request->input('new_patient_name', ''));
            if (!empty($patientName)) {
                $nameParts = explode(' ', $patientName, 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';

                $newPatient = Patient::create([
                    'tenant_id'   => $tenantId,
                    'first_name'  => $firstName,
                    'last_name'   => $lastName,
                    'national_id' => $request->input('new_patient_national_id') ?: null,
                    'phone'       => $request->input('new_patient_phone') ?: null,
                    'is_active'   => true,
                    'created_by'  => Auth::id(),
                ]);
                $request->merge(['patient_id' => $newPatient->id]);
            }
        }

        $validated = $request->validate([
            'patient_id'            => 'required|exists:patients,id',
            'surgeon_name'          => 'required|string|max:255',
            'anesthesiologist_name' => 'nullable|string|max:255',
            'assistant_name'        => 'nullable|string|max:255',
            'nurse_name'            => 'nullable|string|max:255',
            'procedure_name'        => 'required|string|max:255',
            'surgery_type'          => 'nullable|string|max:100',
            'operating_room'        => 'nullable|string|max:100',
            'scheduled_start_at'    => 'required|date',
            'scheduled_end_at'      => 'nullable|date',
            'actual_start_at'       => 'nullable|date',
            'actual_end_at'         => 'nullable|date',
            'status'                => 'string|in:scheduled,confirmed,completed,cancelled',
            'pre_op_diagnosis'      => 'nullable|string',
            'post_op_diagnosis'     => 'nullable|string',
            'anesthesia_type'       => 'nullable|string|max:100',
            'surgical_protocol'     => 'nullable|string',
            'findings'              => 'nullable|string',
            'complications'         => 'nullable|string',
            'estimated_blood_loss'  => 'nullable|string|max:100',
            'pathology_samples'     => 'nullable|string',
            'implants_or_materials' => 'nullable|string',
            'post_op_orders'        => 'nullable|string',
            'supplies_used'         => 'nullable|array',
            'estimated_cost'        => 'nullable|numeric|min:0',
            'notes'                 => 'nullable|string',
        ]);

        $status = $validated['status'] ?? 'completed';

        $surgery = Surgery::create(array_merge($validated, [
            'tenant_id'  => $tenantId,
            'created_by' => Auth::id(),
            'status'     => $status,
        ]));

        $msg = ($surgery->status === 'completed')
            ? 'Cirugía realizada registrada exitosamente.'
            : 'Cirugía programada exitosamente.';

        return back()->with('success', $msg);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $surgery = Surgery::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'patient_id'            => 'sometimes|required|exists:patients,id',
            'surgeon_name'          => 'sometimes|required|string|max:255',
            'anesthesiologist_name' => 'nullable|string|max:255',
            'assistant_name'        => 'nullable|string|max:255',
            'nurse_name'            => 'nullable|string|max:255',
            'procedure_name'        => 'sometimes|required|string|max:255',
            'surgery_type'          => 'nullable|string|max:100',
            'operating_room'        => 'nullable|string|max:100',
            'scheduled_start_at'    => 'sometimes|required|date',
            'scheduled_end_at'      => 'nullable|date',
            'actual_start_at'       => 'nullable|date',
            'actual_end_at'         => 'nullable|date',
            'status'                => 'sometimes|string|in:scheduled,confirmed,in_progress,post_op,completed,cancelled',
            'pre_op_diagnosis'      => 'nullable|string',
            'post_op_diagnosis'     => 'nullable|string',
            'anesthesia_type'       => 'nullable|string|max:100',
            'surgical_protocol'     => 'nullable|string',
            'findings'              => 'nullable|string',
            'complications'         => 'nullable|string',
            'estimated_blood_loss'  => 'nullable|string|max:100',
            'pathology_samples'     => 'nullable|string',
            'implants_or_materials' => 'nullable|string',
            'post_op_orders'        => 'nullable|string',
            'supplies_used'         => 'nullable|array',
            'estimated_cost'        => 'nullable|numeric|min:0',
            'notes'                 => 'nullable|string',
        ]);

        $surgery->update($validated);

        return back()->with('success', 'Cirugía actualizada exitosamente.');
    }

    public function updateProtocol(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $surgery = Surgery::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'surgeon_name'          => 'required|string|max:255',
            'anesthesiologist_name' => 'nullable|string|max:255',
            'assistant_name'        => 'nullable|string|max:255',
            'nurse_name'            => 'nullable|string|max:255',
            'procedure_name'        => 'required|string|max:255',
            'operating_room'        => 'nullable|string|max:100',
            'actual_start_at'       => 'nullable|date',
            'actual_end_at'         => 'nullable|date',
            'pre_op_diagnosis'      => 'nullable|string',
            'post_op_diagnosis'     => 'nullable|string',
            'anesthesia_type'       => 'nullable|string|max:100',
            'surgical_protocol'     => 'required|string',
            'findings'              => 'nullable|string',
            'complications'         => 'nullable|string',
            'estimated_blood_loss'  => 'nullable|string|max:100',
            'pathology_samples'     => 'nullable|string',
            'implants_or_materials' => 'nullable|string',
            'post_op_orders'        => 'nullable|string',
            'supplies_used'         => 'nullable|array',
            'notes'                 => 'nullable|string',
        ]);

        $surgery->update(array_merge($validated, [
            'status' => 'completed',
        ]));

        return back()->with('success', 'Protocolo quirúrgico registrado exitosamente.');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $surgery = Surgery::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();
        $surgery->delete();

        return back()->with('success', 'Cirugía eliminada.');
    }
}
