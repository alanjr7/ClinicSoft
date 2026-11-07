<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientPortalPreference extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'patient_id',
        'email_notifications',
        'whatsapp_notifications',
        'privacy_policy_accepted',
    ];

    protected $casts = [
        'email_notifications'     => 'boolean',
        'whatsapp_notifications'  => 'boolean',
        'privacy_policy_accepted' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}

