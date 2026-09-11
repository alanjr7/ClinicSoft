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
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('expense_category_id')->constrained('expense_categories');
            $table->foreignUuid('patient_id')->nullable()->constrained('patients')->onDelete('set null');
            $table->string('expense_number', 50); // ej. GAS-2024-001
            $table->date('expense_date');
            $table->string('description', 500);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('BOB'); // BOB, USD
            $table->string('payment_method')->nullable();
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('paid');
            $table->string('receipt_url')->nullable(); // Foto de factura/recibo
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
            
            $table->unique(['tenant_id', 'expense_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
