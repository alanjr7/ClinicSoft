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
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete(); // Puede ser global si tenant_id es null
            $table->date('date');
            $table->string('currency', 3)->default('USD');
            $table->decimal('rate', 10, 4); // ej. 6.96
            $table->timestamps();
            
            // Un tenant no puede tener dos tipos de cambio para la misma fecha y moneda
            // Si tenant_id es null (global), no afecta a nivel tenant pero lo mejor es asegurarlo
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
