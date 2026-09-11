<?php

namespace App\Models\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * BelongsToTenant — Multi-tenancy Global Scope
 *
 * Apply this trait to every tenant-scoped model to automatically:
 *  1. Filter all queries to the current user's tenant.
 *  2. Auto-inject tenant_id on create (no need to pass it manually).
 *
 * Usage in a model:
 *   use App\Models\Traits\BelongsToTenant;
 *   class Patient extends Model { use HasUuids, BelongsToTenant; }
 *
 * Superadmin bypass (intentional cross-tenant queries):
 *   Patient::withoutTenantScope()->where(...)->get();
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        // ── 1. Auto-filter all SELECT queries ──────────────────────────────
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = self::resolveTenantId();
            if ($tenantId) {
                $builder->where(
                    (new static())->getTable() . '.tenant_id',
                    $tenantId
                );
            }
        });

        // ── 2. Auto-inject tenant_id on INSERT ─────────────────────────────
        static::creating(function ($model) {
            if (empty($model->tenant_id)) {
                $tenantId = self::resolveTenantId();
                if ($tenantId) {
                    $model->tenant_id = $tenantId;
                }
            }
        });
    }

    /**
     * Resolve the tenant_id for the currently authenticated user.
     * Returns null for superadmin (no restriction) or unauthenticated requests.
     */
    private static function resolveTenantId(): ?string
    {
        $user = Auth::user();

        if (! $user || $user->global_role === 'superadmin') {
            return null;
        }

        return $user->tenantUsers()
            ->where('is_active', true)
            ->value('tenant_id');
    }

    /**
     * Escape hatch: bypass the tenant scope for intentional cross-tenant queries.
     * Use only in SuperAdmin controllers or migrations.
     *
     * Example: Patient::withoutTenantScope()->count()
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }
}
