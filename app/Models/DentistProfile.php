<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class DentistProfile extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;
    
    protected $table = 'doctor_profiles';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'license_number',
        'specialty',
        'calendar_color',
        'bio',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
