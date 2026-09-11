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
        Schema::create('clinical_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('patient_id')->constrained('patients')->onDelete('cascade');
            $table->uuid('appointment_id')->nullable();
            $table->foreignUuid('dentist_id')->constrained('users')->onDelete('cascade');
            $table->date('visit_date');
            $table->string('blood_pressure', 20)->nullable();
            $table->integer('heart_rate')->nullable();
            $table->integer('respiratory_rate')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('bmi', 4, 1)->nullable();
            $table->integer('oxygen_saturation')->nullable();
            $table->integer('blood_glucose')->nullable();
            $table->text('chief_complaint')->nullable();
            $table->text('medical_background')->nullable();
            $table->text('physical_examination')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment_performed')->nullable();
            $table->text('prescriptions')->nullable();
            $table->json('prescription_items')->nullable();
            $table->text('observations')->nullable();
            $table->text('next_visit_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinical_records');
    }
};
