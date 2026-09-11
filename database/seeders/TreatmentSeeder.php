<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Treatment;
use App\Models\Tenant;

class TreatmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = Tenant::all();
        
        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Skipping treatment seeding.');
            return;
        }

        foreach ($tenants as $tenant) {
            \App\Services\TenantSetupService::setupDefaults($tenant);
        }

        $this->command->info("Seeded treatments for {$tenants->count()} tenants.");
    }
}
