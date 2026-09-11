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
        Schema::create('surgeries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('patient_id')->constrained('patients')->onDelete('cascade');
            
            // Personal Quirúrgico (Campos informativos de texto para máxima flexibilidad)
            $table->string('surgeon_name');
            $table->string('anesthesiologist_name')->nullable();
            $table->string('assistant_name')->nullable();
            $table->string('nurse_name')->nullable();

            // Detalles del Procedimiento
            $table->string('procedure_name');
            $table->string('surgery_type')->nullable(); // Ej: Mayor, Menor, Ambulatoria, Urgencia, Electiva
            $table->string('operating_room')->nullable(); // Ej: Quirófano 1, Quirófano 2, Sala de Procedimientos
            
            // Horarios
            $table->dateTime('scheduled_start_at');
            $table->dateTime('scheduled_end_at')->nullable();
            $table->dateTime('actual_start_at')->nullable();
            $table->dateTime('actual_end_at')->nullable();

            // Estado
            $table->string('status', 30)->default('scheduled'); // scheduled, confirmed, in_progress, post_op, completed, cancelled

            // Diagnósticos y Anestesia
            $table->text('pre_op_diagnosis')->nullable();
            $table->text('post_op_diagnosis')->nullable();
            $table->string('anesthesia_type')->nullable(); // General, Raquídea, Epidural, Sedación, Local, etc.

            // Protocolo Quirúrgico / Reporte Operatorio
            $table->longText('surgical_protocol')->nullable(); // Técnica quirúrgica y descripción del acto operatorio
            $table->text('findings')->nullable(); // Hallazgos quirúrgicos
            $table->text('complications')->nullable(); // Complicaciones / Incidentes
            $table->string('estimated_blood_loss')->nullable(); // Sangrado aproximado (ml)
            $table->text('pathology_samples')->nullable(); // Muestras remitidas a patología / Biopsias
            $table->text('implants_or_materials')->nullable(); // Prótesis, implantes o materiales especiales
            $table->text('post_op_orders')->nullable(); // Indicaciones y cuidados postoperatorios

            // Insumos y Costos
            $table->json('supplies_used')->nullable();
            $table->decimal('estimated_cost', 12, 2)->default(0);
            $table->text('notes')->nullable();

            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surgeries');
    }
};
