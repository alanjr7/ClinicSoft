<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class ClinicalRecord extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'appointment_id',
        'dentist_id',
        'visit_date',
        'blood_pressure',
        'heart_rate',
        'respiratory_rate',
        'temperature',
        'weight',
        'height',
        'bmi',
        'oxygen_saturation',
        'blood_glucose',
        'chief_complaint',
        'medical_background',
        'physical_examination',
        'diagnosis',
        'treatment_performed',
        'prescriptions',
        'prescription_items',
        'observations',
        'next_visit_notes',
    ];

    protected $casts = [
        'visit_date' => 'date:Y-m-d',
        'temperature' => 'decimal:1',
        'weight' => 'decimal:2',
        'height' => 'decimal:2',
        'bmi' => 'decimal:1',
        'prescription_items' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dentist()
    {
        return $this->belongsTo(User::class, 'dentist_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'dentist_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
