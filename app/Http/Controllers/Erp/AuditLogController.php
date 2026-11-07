<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Display the clinic's audit log (Bitácora).
     * Strictly isolates data per clinic (tenant).
     */
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $user = Auth::user();

        // ── 1. Authorization Check ─────────────────────────────────────────
        $callerTu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $user->id)->first();
        $isAuthorized = $callerTu && (
            in_array($callerTu->role, ['admin', 'owner'])
            || $user->modulePermissions()->where('tenant_id', $tenantId)->where('module', 'audit_log')->where('is_enabled', true)->exists()
            || $user->global_role === 'superadmin'
        );

        if (!$isAuthorized) {
            abort(403, 'No tienes permisos para acceder a la bitácora de la clínica.');
        }

        // ── 2. Filters ─────────────────────────────────────────────────────
        $search   = $request->input('search');
        $action   = $request->input('action');
        $module   = $request->input('module');
        $userId   = $request->input('user_id');
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        // ── 3. Base Scoped Query (Clinic isolation enforced) ───────────────
        $query = AuditLog::where('tenant_id', $tenantId);

        if (!empty($search)) {
            $query->search($search);
        }

        if (!empty($action) && $action !== 'all') {
            $query->where('action', $action);
        }

        if (!empty($module) && $module !== 'all') {
            $query->where('module', $module);
        }

        if (!empty($userId) && $userId !== 'all') {
            $query->where('user_id', $userId);
        }

        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // ── 4. Key Performance Indicators (Metrics) ────────────────────────
        $baseTenantQuery = AuditLog::where('tenant_id', $tenantId);
        $stats = [
            'total_events'   => (clone $baseTenantQuery)->count(),
            'total_logins'   => (clone $baseTenantQuery)->where('action', 'login')->count(),
            'total_changes'  => (clone $baseTenantQuery)->whereIn('action', ['create', 'update', 'delete'])->count(),
            'total_security' => (clone $baseTenantQuery)->whereIn('action', ['login_failed', 'login_blocked'])->count(),
        ];

        // ── 5. Users List for Filter Dropdown ──────────────────────────────
        $clinicUsers = TenantUser::where('tenant_id', $tenantId)
            ->with('user:id,first_name,last_name,email')
            ->get()
            ->map(function ($tu) {
                $name = trim(($tu->user?->first_name ?? '') . ' ' . ($tu->user?->last_name ?? ''));
                return [
                    'id'    => $tu->user_id,
                    'name'  => !empty($name) ? $name : ($tu->user?->email ?? 'Usuario'),
                    'email' => $tu->user?->email,
                    'role'  => $tu->role,
                ];
            });

        // ── 6. Paginated Results ───────────────────────────────────────────
        $logs = $query->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('AuditLogs', [
            'logs'        => $logs,
            'stats'       => $stats,
            'clinicUsers' => $clinicUsers,
            'filters'     => [
                'search'    => $search ?? '',
                'action'    => $action ?? 'all',
                'module'    => $module ?? 'all',
                'user_id'   => $userId ?? 'all',
                'date_from' => $dateFrom ?? '',
                'date_to'   => $dateTo ?? '',
            ],
        ]);
    }

    /**
     * Export filtered audit logs to CSV
     */
    public function export(Request $request): StreamedResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        $user = Auth::user();

        $callerTu = TenantUser::where('tenant_id', $tenantId)->where('user_id', $user->id)->first();
        if (!$callerTu || (!in_array($callerTu->role, ['admin', 'owner']) && $user->global_role !== 'superadmin')) {
            abort(403, 'No autorizado para exportar la bitácora.');
        }

        $search   = $request->input('search');
        $action   = $request->input('action');
        $module   = $request->input('module');
        $userId   = $request->input('user_id');
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $query = AuditLog::where('tenant_id', $tenantId);

        if (!empty($search)) {
            $query->search($search);
        }
        if (!empty($action) && $action !== 'all') {
            $query->where('action', $action);
        }
        if (!empty($module) && $module !== 'all') {
            $query->where('module', $module);
        }
        if (!empty($userId) && $userId !== 'all') {
            $query->where('user_id', $userId);
        }
        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $fileName = 'bitacora_' . now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            // Add UTF-8 BOM for Microsoft Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Fecha y Hora',
                'Usuario',
                'Email',
                'Rol',
                'Acción',
                'Módulo',
                'Descripción',
                'IP',
                'Navegador / Dispositivo',
            ]);

            $query->latest('created_at')->chunk(200, function ($chunk) use ($handle) {
                foreach ($chunk as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->created_at?->format('Y-m-d H:i:s'),
                        $log->user_name ?? 'Sistema',
                        $log->user_email ?? '-',
                        $log->role ?? '-',
                        $log->action,
                        $log->module,
                        $log->description,
                        $log->ip_address ?? '-',
                        $log->user_agent ?? '-',
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}

