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
        Schema::create('accounting_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('entry_number', 50); // ej. ASI-2024-001
            $table->date('entry_date');
            $table->string('description', 500);
            $table->string('currency', 3)->default('BOB'); // BOB, USD
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->foreignUuid('created_by')->constrained('users');
            $table->uuid('reference_id')->nullable(); // Para enlazar con Expense o Invoice
            $table->string('reference_type')->nullable(); 
            $table->timestamps();
            
            $table->unique(['tenant_id', 'entry_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_entries');
    }
};
