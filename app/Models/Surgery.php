<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class Surgery extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $table = 'surgeries';

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'surgeon_name',
        'anesthesiologist_name',
        'assistant_name',
        'nurse_name',
        'procedure_name',
        'surgery_type',
        'operating_room',
        'scheduled_start_at',
        'scheduled_end_at',
        'actual_start_at',
        'actual_end_at',
        'status',
        'pre_op_diagnosis',
        'post_op_diagnosis',
        'anesthesia_type',
        'surgical_protocol',
        'findings',
        'complications',
        'estimated_blood_loss',
        'pathology_samples',
        'implants_or_materials',
        'post_op_orders',
        'supplies_used',
        'estimated_cost',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'scheduled_start_at' => 'datetime',
        'scheduled_end_at'   => 'datetime',
        'actual_start_at'    => 'datetime',
        'actual_end_at'      => 'datetime',
        'supplies_used'      => 'array',
        'estimated_cost'     => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
