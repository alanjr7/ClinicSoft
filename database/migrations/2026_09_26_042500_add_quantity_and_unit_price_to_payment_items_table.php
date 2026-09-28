<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_items', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->default(1)->after('description');
            $table->decimal('unit_price', 12, 2)->default(0)->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('payment_items', function (Blueprint $table) {
            $table->dropColumn(['quantity', 'unit_price']);
        });
    }
};
