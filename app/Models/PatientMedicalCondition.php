<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class PatientMedicalCondition extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'condition_name',
        'since_date',
        'notes',
    ];

    protected $casts = [
        'since_date' => 'date:Y-m-d',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
