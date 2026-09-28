<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class ToothCondition extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'snapshot_id',
        'tooth_number',
        'state',
        'face',
        'notes',
    ];

    public function snapshot()
    {
        return $this->belongsTo(OdontogramSnapshot::class, 'snapshot_id');
    }
}
