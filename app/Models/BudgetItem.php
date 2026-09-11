<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Traits\BelongsToTenant;

class BudgetItem extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'budget_id',
        'treatment_id',
        'description',
        'tooth_number',
        'quantity',
        'unit_price',
        'discount_amount',
        'total',
    ];

    public function budget()
    {
        return $this->belongsTo(Budget::class);
    }

    public function treatment()
    {
        return $this->belongsTo(Treatment::class);
    }
}
