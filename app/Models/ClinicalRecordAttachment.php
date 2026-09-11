<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class ClinicalRecordAttachment extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'record_id',
        'file_name',
        'file_url',
        'file_type',
        'file_size_bytes',
        'created_by',
    ];

    public function record()
    {
        return $this->belongsTo(ClinicalRecord::class, 'record_id');
    }
}
