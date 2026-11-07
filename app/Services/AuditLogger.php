<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuditLogger
{
    /**
     * Sensitive attributes that should never appear in audit logs
     */
    protected static array $sensitiveAttributes = [
        'password',
        'encrypted_password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Record an audit event cleanly and defensibly.
     */
    public static function log(
        string $action,
        string $module,
        string $description,
        ?string $tenantId = null,
        ?User $user = null,
        ?Model $entity = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $details = null
    ): ?AuditLog {
        try {
            $currentUser = $user ?: Auth::user();

            // 1. Resolve tenant ID defensively
            $resolvedTenantId = self::resolveTenantId($tenantId, $currentUser, $entity);

            // 2. Resolve user snapshots
            $userName = null;
            $userEmail = null;
            $role = null;

            if ($currentUser) {
                $userName = trim(($currentUser->first_name ?? '') . ' ' . ($currentUser->last_name ?? ''));
                if (empty($userName)) {
                    $userName = $currentUser->email;
                }
                $userEmail = $currentUser->email;

                if ($resolvedTenantId) {
                    $tu = TenantUser::where('tenant_id', $resolvedTenantId)
                        ->where('user_id', $currentUser->id)
                        ->first();
                    $role = $tu?->role ?? $currentUser->global_role;
                } else {
                    $role = $currentUser->global_role;
                }
            }

            // 3. Prepare payload values
            $sanitizedOld = self::sanitize($oldValues);
            $sanitizedNew = self::sanitize($newValues ?? $details);

            $ipAddress = null;
            $userAgent = null;
            if (function_exists('request') && request()) {
                $ipAddress = request()->ip();
                $userAgent = substr((string) request()->userAgent(), 0, 500);
            }

            return AuditLog::create([
                'tenant_id'   => $resolvedTenantId,
                'user_id'     => $currentUser?->id,
                'user_name'   => $userName,
                'user_email'  => $userEmail,
                'role'        => $role,
                'action'      => $action,
                'module'      => $module,
                'description' => $description,
                'entity_type' => $entity ? get_class($entity) : null,
                'entity_id'   => $entity ? (string) $entity->getKey() : null,
                'old_values'  => !empty($sanitizedOld) ? $sanitizedOld : null,
                'new_values'  => !empty($sanitizedNew) ? $sanitizedNew : null,
                'ip_address'  => $ipAddress,
                'user_agent'  => $userAgent,
            ]);
        } catch (\Throwable $e) {
            // Defensive engineering: Never break user flows due to logging exceptions
            Log::warning('AuditLogger failed to record log: ' . $e->getMessage(), [
                'action' => $action,
                'module' => $module,
            ]);
            return null;
        }
    }

    /**
     * Resolve the most appropriate tenant ID
     */
    public static function resolveTenantId(?string $explicitTenantId, ?User $user, ?Model $entity = null): ?string
    {
        if (!empty($explicitTenantId)) {
            return $explicitTenantId;
        }

        if ($entity && !empty($entity->tenant_id)) {
            return $entity->tenant_id;
        }

        if (function_exists('request') && request()) {
            $reqTenantId = request()->attributes->get('tenant_id');
            if (!empty($reqTenantId)) {
                return $reqTenantId;
            }

            if (request()->hasSession() && request()->session()->has('area_impersonated_tenant_id')) {
                return request()->session()->get('area_impersonated_tenant_id');
            }
        }

        if ($user) {
            return $user->tenantUsers()
                ->where('is_active', true)
                ->value('tenant_id');
        }

        return null;
    }

    /**
     * Sanitize sensitive keys from diffs or attributes
     */
    protected static function sanitize(?array $values): ?array
    {
        if (empty($values)) {
            return null;
        }

        $sanitized = [];
        foreach ($values as $key => $val) {
            if (in_array(strtolower($key), self::$sensitiveAttributes, true)) {
                $sanitized[$key] = '********';
            } else {
                $sanitized[$key] = $val;
            }
        }

        return $sanitized;
    }
}

