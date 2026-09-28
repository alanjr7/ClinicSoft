<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orthodontic_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignUuid('dentist_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('total_cost', 12, 2);
            $table->decimal('initial_fee', 12, 2)->default(0);
            $table->decimal('installment_amount', 12, 2)->default(0);
            $table->integer('estimated_duration')->nullable(); // En meses o semanas
            $table->string('frequency', 20)->default('monthly'); // weekly, biweekly, monthly
            $table->string('status', 20)->default('active'); // active, completed, cancelled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orthodontic_plans');
    }
};
