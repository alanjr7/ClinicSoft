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
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'orthodontic_plan_id')) {
                $table->foreignUuid('orthodontic_plan_id')->nullable()->after('dentist_id')->constrained('orthodontic_plans')->onDelete('set null');
            }
            if (!Schema::hasColumn('appointments', 'amount_due')) {
                $table->decimal('amount_due', 12, 2)->default(0)->after('payment_receipt_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropForeign(['orthodontic_plan_id']);
            $table->dropColumn(['orthodontic_plan_id', 'amount_due']);
        });
    }
};
