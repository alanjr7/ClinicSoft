<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class Patient extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'national_id',
        'date_of_birth',
        'gender',
        'blood_type',
        'phone',
        'email',
        'address',
        'city',
        'state',
        'zip_code',
        'notes',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
        'is_active' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function allergies()
    {
        return $this->hasMany(PatientAllergy::class);
    }

    public function medicalConditions()
    {
        return $this->hasMany(PatientMedicalCondition::class);
    }

    public function emergencyContacts()
    {
        return $this->hasMany(PatientEmergencyContact::class);
    }

    public function folders()
    {
        return $this->hasMany(PatientFolder::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function clinicalRecords()
    {
        return $this->hasMany(ClinicalRecord::class);
    }

    public function surgeries()
    {
        return $this->hasMany(Surgery::class)->orderByDesc('scheduled_start_at');
    }
}
