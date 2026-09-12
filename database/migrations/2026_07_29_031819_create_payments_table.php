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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('invoice_id')->nullable()->constrained('invoices')->onDelete('cascade');
            $table->foreignUuid('patient_id')->nullable()->constrained('patients')->onDelete('cascade');
            $table->string('customer_name', 150)->nullable();
            $table->string('customer_ci', 50)->nullable();
            $table->foreignUuid('received_by')->constrained('users')->onDelete('cascade');
            $table->string('payment_method', 20);
            $table->decimal('amount', 12, 2);
            $table->string('reference_number', 150)->nullable();
            $table->text('notes')->nullable();
            $table->date('payment_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
