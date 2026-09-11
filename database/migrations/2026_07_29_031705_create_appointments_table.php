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
        Schema::create('appointments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('patient_id')->constrained('patients')->onDelete('cascade'); // or restrict
            $table->foreignUuid('dentist_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('status', 20)->default('scheduled');
            $table->string('payment_status')->default('pending');
            $table->string('payment_receipt_path')->nullable();
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->foreignUuid('cancelled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('cancellation_reason')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
