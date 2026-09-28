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
        Schema::create('tooth_conditions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('snapshot_id')->constrained('odontogram_snapshots')->onDelete('cascade');
            $table->smallInteger('tooth_number');
            $table->string('state', 30);
            $table->string('face', 20)->nullable();
            $table->text('notes')->nullable();
            $table->unique(['snapshot_id', 'tooth_number', 'face']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tooth_conditions');
    }
};
