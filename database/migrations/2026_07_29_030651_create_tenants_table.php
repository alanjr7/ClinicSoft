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
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained('subscription_plans')->onDelete('cascade');
            $table->string('name', 255);
            $table->string('slug', 100)->unique();
            $table->string('email', 255);
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 2)->default('MX');
            $table->text('logo_url')->nullable();
            $table->string('payment_qr_path')->nullable();
            $table->string('primary_color', 7)->default('#0D9488');
            $table->string('secondary_color', 7)->nullable();
            $table->string('header_text_color', 7)->default('#FFFFFF');
            $table->string('timezone')->default('America/La_Paz');
            $table->string('currency', 10)->default('Bs.');
            $table->decimal('default_tax_rate', 5, 4)->default(0.16);
            $table->string('status', 20)->default('trial');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
