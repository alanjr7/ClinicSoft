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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Clinic isolation: nullable for global events, but populated for each clinic
            $table->foreignUuid('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->onDelete('cascade');
            
            // User reference: nullable if user is deleted or login failed with non-existent user
            $table->foreignUuid('user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            // Cached snapshot of user details for audit preservation
            $table->string('user_name', 150)->nullable();
            $table->string('user_email', 150)->nullable();
            $table->string('role', 50)->nullable();

            // Event categorization
            // Actions: login, logout, login_failed, login_blocked, create, update, delete, settings
            $table->string('action', 50)->index();
            // Modules: auth, patients, appointments, surgeries, clinical, budgets, payments, inventory, accounting, users, settings
            $table->string('module', 50)->index();

            // Human-readable summary
            $table->text('description');

            // Entity polymorphism
            $table->string('entity_type', 150)->nullable();
            $table->string('entity_id', 64)->nullable();

            // Changed attributes (diffs)
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Client and network telemetry
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            // Optimized indexes for tenant-scoped querying and filtering
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'action']);
            $table->index(['tenant_id', 'module']);
            $table->index(['tenant_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};

