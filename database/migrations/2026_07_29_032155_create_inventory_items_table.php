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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignUuid('category_id')->nullable()->constrained('inventory_categories')->onDelete('set null');
            $table->foreignUuid('supplier_id')->nullable()->constrained('inventory_suppliers')->onDelete('set null');
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('sku', 100)->nullable();
            $table->string('unit', 50)->default('pza');
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_level')->default(0);
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unique(['tenant_id', 'sku']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
