<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'plan_id',
        'name',
        'slug',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'logo_url',
        'timezone',
        'currency',
        'default_tax_rate',
        'payment_qr_path',
        'primary_color',
        'header_text_color',
        'status',
        'trial_ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
    ];

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tenant_users', 'tenant_id', 'user_id')
            ->withPivot('role', 'is_active', 'joined_at')
            ->withTimestamps();
    }

    public function settings()
    {
        return $this->hasOne(TenantSetting::class);
    }

    public function areas()
    {
        return $this->belongsToMany(Area::class, 'area_tenants', 'tenant_id', 'area_id')
            ->withTimestamps();
    }
}
