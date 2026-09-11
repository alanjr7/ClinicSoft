<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class AccountingAccount extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'type',
        'parent_id',
        'is_active',
    ];

    public function parent()
    {
        return $this->belongsTo(AccountingAccount::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(AccountingAccount::class, 'parent_id');
    }
}
