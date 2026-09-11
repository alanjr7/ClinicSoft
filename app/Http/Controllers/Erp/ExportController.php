<?php

namespace App\Http\Controllers\Erp;

use App\Exports\AppointmentsExport;
use App\Exports\ExpensesExport;
use App\Exports\IncomeStatementExport;
use App\Exports\InventoryExport;
use App\Exports\PatientsExport;
use App\Exports\PaymentsExport;
use App\Http\Controllers\Controller;
use App\Services\FinancialStatementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * Resolve the export format from request: 'xlsx' (default) or 'csv'.
     * Usage: ?format=csv or ?format=xlsx
     */
    private function format(Request $request): string
    {
        return $request->get('format', 'xlsx') === 'csv'
            ? \Maatwebsite\Excel\Excel::CSV
            : \Maatwebsite\Excel\Excel::XLSX;
    }

    private function ext(Request $request): string
    {
        return $request->get('format', 'xlsx') === 'csv' ? 'csv' : 'xlsx';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pacientes
    // ─────────────────────────────────────────────────────────────────────────

    public function patients(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $filename = 'pacientes_' . now()->format('Ymd') . '.' . $this->ext($request);

        return Excel::download(
            new PatientsExport($tenantId),
            $filename,
            $this->format($request)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Citas
    // ─────────────────────────────────────────────────────────────────────────

    public function appointments(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $filename = 'citas_' . now()->format('Ymd') . '.' . $this->ext($request);

        return Excel::download(
            new AppointmentsExport($tenantId, $request->from_date, $request->to_date),
            $filename,
            $this->format($request)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cobros / Pagos
    // ─────────────────────────────────────────────────────────────────────────

    public function payments(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $filename = 'cobros_' . now()->format('Ymd') . '.' . $this->ext($request);

        return Excel::download(
            new PaymentsExport($tenantId, $request->from_date, $request->to_date),
            $filename,
            $this->format($request)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gastos
    // ─────────────────────────────────────────────────────────────────────────

    public function expenses(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $filename = 'gastos_' . now()->format('Ymd') . '.' . $this->ext($request);

        return Excel::download(
            new ExpensesExport($tenantId, $request->from_date, $request->to_date),
            $filename,
            $this->format($request)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inventario
    // ─────────────────────────────────────────────────────────────────────────

    public function inventory(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $filename = 'inventario_' . now()->format('Ymd') . '.' . $this->ext($request);

        return Excel::download(
            new InventoryExport($tenantId),
            $filename,
            $this->format($request)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Estado de Resultados
    // ─────────────────────────────────────────────────────────────────────────

    public function incomeStatement(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $from = Carbon::create($year, $month, 1)->startOfMonth();
        $to   = Carbon::create($year, $month, 1)->endOfMonth();

        /** @var FinancialStatementService $service */
        $service = app(FinancialStatementService::class);
        $data    = $service->getIncomeStatement($tenantId, $from, $to);

        $filename = 'estado_resultados_' . $year . sprintf('%02d', $month) . '.' . $this->ext($request);

        // CSV format only exports single sheet; use XLSX for multi-sheet
        if ($request->get('format') === 'csv') {
            return Excel::download(
                new IncomeStatementExport($data),
                $filename,
                \Maatwebsite\Excel\Excel::CSV
            );
        }

        return Excel::download(
            new IncomeStatementExport($data),
            $filename,
            \Maatwebsite\Excel\Excel::XLSX
        );
    }
}
