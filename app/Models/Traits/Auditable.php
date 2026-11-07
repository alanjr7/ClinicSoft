<?php

namespace App\Models\Traits;

use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            self::auditModelEvent('create', $model);
        });

        static::updated(function (Model $model) {
            self::auditModelEvent('update', $model);
        });

        static::deleted(function (Model $model) {
            self::auditModelEvent('delete', $model);
        });
    }

    protected static function auditModelEvent(string $event, Model $model): void
    {
        // Don't log if there is no authenticated user and no request context
        if (!Auth::check() && (!function_exists('request') || !request())) {
            return;
        }

        $module = self::resolveAuditModuleName($model);
        $oldValues = null;
        $newValues = null;
        $description = '';

        if ($event === 'create') {
            $newValues = $model->getAttributes();
            $description = self::buildAuditDescription('create', $model);
        } elseif ($event === 'update') {
            $dirty = $model->getDirty();

            // Ignore timestamps and technical fields
            unset(
                $dirty['updated_at'],
                $dirty['created_at'],
                $dirty['last_login_at'],
                $dirty['remember_token'],
                $dirty['password'],
                $dirty['encrypted_password']
            );

            if (empty($dirty)) {
                return; // No real data changed
            }

            $oldValues = [];
            foreach ($dirty as $key => $newValue) {
                $oldValues[$key] = $model->getOriginal($key);
            }
            $newValues = $dirty;
            $description = self::buildAuditDescription('update', $model, array_keys($dirty));
        } elseif ($event === 'delete') {
            $oldValues = $model->getAttributes();
            $description = self::buildAuditDescription('delete', $model);
        }

        $tenantId = $model->tenant_id ?? null;

        AuditLogger::log(
            action: $event,
            module: $module,
            description: $description,
            tenantId: $tenantId,
            user: Auth::user(),
            entity: $model,
            oldValues: $oldValues,
            newValues: $newValues
        );
    }

    protected static function resolveAuditModuleName(Model $model): string
    {
        $baseName = class_basename($model);

        return match ($baseName) {
            'Patient'            => 'pacientes',
            'Appointment'        => 'citas',
            'ClinicalRecord'     => 'historia_clinica',
            'Budget'             => 'presupuestos',
            'Payment'            => 'caja',
            'Invoice'            => 'facturacion',
            'Expense'            => 'gastos',
            'InventoryItem'      => 'inventario',
            'InventoryMovement'  => 'inventario',
            'Surgery'            => 'cirugias',
            'AccountingAccount',
            'AccountingEntry'    => 'contabilidad',
            'TenantUser'         => 'usuarios',
            'Tenant'             => 'configuracion',
            default              => strtolower($baseName),
        };
    }

    protected static function buildAuditDescription(string $event, Model $model, array $changedKeys = []): string
    {
        $baseName = class_basename($model);

        $name = match ($baseName) {
            'Patient'            => 'el paciente ' . trim(($model->first_name ?? '') . ' ' . ($model->last_name ?? '')),
            'Appointment'        => 'la cita médica #' . substr((string)$model->getKey(), 0, 8),
            'ClinicalRecord'     => 'la consulta / historia clínica #' . substr((string)$model->getKey(), 0, 8),
            'Budget'             => 'el presupuesto ' . ($model->budget_number ?? ('#' . substr((string)$model->getKey(), 0, 8))),
            'Payment'            => 'el recibo de caja / cobro ' . ($model->payment_number ?? ('#' . substr((string)$model->getKey(), 0, 8))),
            'Invoice'            => 'la factura ' . ($model->invoice_number ?? ('#' . substr((string)$model->getKey(), 0, 8))),
            'Expense'            => 'el gasto: ' . ($model->description ?? ('#' . substr((string)$model->getKey(), 0, 8))),
            'InventoryItem'      => 'el ítem de inventario "' . ($model->name ?? '') . '"',
            'InventoryMovement'  => 'el movimiento de inventario (' . ($model->type ?? '') . ')',
            'Surgery'            => 'la cirugía médica #' . substr((string)$model->getKey(), 0, 8),
            'TenantUser'         => 'el usuario de clínica',
            default              => 'el registro en ' . $baseName,
        };

        if ($event === 'create') {
            return 'Creó ' . $name;
        }

        if ($event === 'update') {
            $fieldsText = !empty($changedKeys) ? ' (' . implode(', ', array_slice($changedKeys, 0, 4)) . ')' : '';
            return 'Actualizó ' . $name . $fieldsText;
        }

        if ($event === 'delete') {
            return 'Eliminó ' . $name;
        }

        return ucfirst($event) . ' ' . $name;
    }
}

