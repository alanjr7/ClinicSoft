<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class AccountingEntryLine extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'accounting_entry_id',
        'accounting_account_id',
        'description',
        'debit',
        'credit',
    ];

    public function entry()
    {
        return $this->belongsTo(AccountingEntry::class, 'accounting_entry_id');
    }

    public function account()
    {
        return $this->belongsTo(AccountingAccount::class, 'accounting_account_id');
    }
}
