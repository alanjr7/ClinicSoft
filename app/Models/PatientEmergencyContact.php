<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class PatientEmergencyContact extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'name',
        'relationship_type',
        'phone',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
