<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrthodonticPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'dentist_id',
        'total_cost',
        'initial_fee',
        'installment_amount',
        'estimated_duration',
        'frequency',
        'status',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dentist()
    {
        return $this->belongsTo(User::class, 'dentist_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
