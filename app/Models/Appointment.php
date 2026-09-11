<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class Appointment extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'dentist_id',
        'start_at',
        'end_at',
        'status',
        'reason',
        'notes',
        'payment_status',
        'payment_receipt_path',
        'amount_due',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
        'created_by',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'cancelled_at' => 'datetime',
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

    public function treatments()
    {
        return $this->hasMany(AppointmentTreatment::class);
    }
}
