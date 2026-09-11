<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use App\Services\FinancialStatementService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialReportController extends Controller
{
    public function __construct(private FinancialStatementService $service) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Estado de Resultados (P&G / Income Statement)
    // ─────────────────────────────────────────────────────────────────────────

    public function incomeStatement(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Period defaults: current month
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year',  now()->year);

        $from = Carbon::create($year, $month, 1)->startOfMonth();
        $to   = Carbon::create($year, $month, 1)->endOfMonth();

        $data = $this->service->getIncomeStatement($tenantId, $from, $to);

        return Inertia::render('IncomeStatement', array_merge($data, [
            'filters' => ['month' => $month, 'year' => $year],
        ]));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Balance General (Balance Sheet)
    // ─────────────────────────────────────────────────────────────────────────

    public function balanceSheet(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Date default: end of current month
        $asOfStr = $request->get('as_of', now()->endOfMonth()->toDateString());
        $asOf    = Carbon::parse($asOfStr)->endOfDay();

        $data = $this->service->getBalanceSheet($tenantId, $asOf);

        return Inertia::render('BalanceSheet', array_merge($data, [
            'filters' => ['as_of' => $asOfStr],
        ]));
    }
}
