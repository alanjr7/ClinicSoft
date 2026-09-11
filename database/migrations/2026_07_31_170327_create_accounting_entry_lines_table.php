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
        Schema::create('accounting_entry_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('accounting_entry_id')->constrained('accounting_entries')->cascadeOnDelete();
            $table->foreignUuid('accounting_account_id')->constrained('accounting_accounts');
            $table->string('description', 255)->nullable();
            $table->decimal('debit', 12, 2)->default(0); // Debe
            $table->decimal('credit', 12, 2)->default(0); // Haber
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_entry_lines');
    }
};
