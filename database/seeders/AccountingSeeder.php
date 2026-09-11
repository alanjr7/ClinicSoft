<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\AccountingAccount;
use App\Models\ExpenseCategory;

class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            \App\Services\TenantSetupService::setupDefaults($tenant);
        }
    }
}
