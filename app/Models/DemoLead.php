<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DemoLead extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'full_name',
        'whatsapp',
        'company_name',
        'ip_address',
        'user_agent',
    ];
}
