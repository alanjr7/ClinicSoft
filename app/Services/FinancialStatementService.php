<?php

namespace App\Services;

use App\Models\AccountingAccount;
use App\Models\AccountingEntryLine;
use App\Models\Expense;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * FinancialStatementService
 *
 * Computes financial statements from the existing double-entry accounting
 * data (accounting_accounts + accounting_entry_lines).
 *
 * Convention used (standard accounting):
 *   Asset / Expense accounts  → normal debit balance  → balance = SUM(debit) - SUM(credit)
 *   Liability / Equity / Revenue → normal credit balance → balance = SUM(credit) - SUM(debit)
 */
class FinancialStatementService
{
    // -------------------------------------------------------------------------
    // Estado de Resultados (Income Statement / P&G)
    // -------------------------------------------------------------------------

    /**
     * Returns the Income Statement for a given period.
     *
     * Structure:
     * [
     *   'period'       => ['from' => '...', 'to' => '...'],
     *   'ingresos'     => [ ['code', 'name', 'balance'], ... ],
     *   'egresos'      => [ ['code', 'name', 'balance'], ... ],
     *   'total_ingresos'  => float,
     *   'total_egresos'   => float,
     *   'utilidad_neta'   => float,      // positive = profit, negative = loss
     *   'source'          => 'accounting'|'operational', // data source used
     * ]
     */
    public function getIncomeStatement(string $tenantId, Carbon $from, Carbon $to): array
    {
        $revenueAccounts = $this->getAccountsWithBalances($tenantId, 'revenue', $from, $to, 'credit');
        $expenseAccounts = $this->getAccountsWithBalances($tenantId, 'expense', $from, $to, 'debit');

        $totalRevenue = collect($revenueAccounts)->sum('balance');
        $totalExpense = collect($expenseAccounts)->sum('balance');

        // Fallback: if no accounting entries exist for revenue, use payments module
        $source = 'accounting';
        if ($totalRevenue == 0) {
            $source        = 'operational';
            $totalRevenue  = (float) Payment::where('tenant_id', $tenantId)
                ->whereBetween('payment_date', [$from->toDateString(), $to->toDateString()])
                ->sum('amount');

            $revenueAccounts = [[
                'code'    => '4000',
                'name'    => 'Ingresos por Servicios (módulo de pagos)',
                'balance' => $totalRevenue,
            ]];
        }

        // Fallback for expenses: use expenses module if no accounting entries
        if ($totalExpense == 0) {
            $totalExpense = (float) Expense::where('tenant_id', $tenantId)
                ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
                ->sum('amount');

            if ($totalExpense > 0 && $source === 'accounting') {
                $source = 'operational';
            }

            if ($totalExpense > 0) {
                $expenseAccounts = [[
                    'code'    => '5000',
                    'name'    => 'Egresos Operativos (módulo de gastos)',
                    'balance' => $totalExpense,
                ]];
            }
        }

        return [
            'period'         => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'ingresos'       => $revenueAccounts,
            'egresos'        => $expenseAccounts,
            'total_ingresos' => round($totalRevenue, 2),
            'total_egresos'  => round($totalExpense, 2),
            'utilidad_neta'  => round($totalRevenue - $totalExpense, 2),
            'source'         => $source,
        ];
    }

    // -------------------------------------------------------------------------
    // Balance General (Balance Sheet)
    // -------------------------------------------------------------------------

    /**
     * Returns the Balance Sheet as of a given date.
     *
     * Structure:
     * [
     *   'as_of'        => 'YYYY-MM-DD',
     *   'activos'      => [ ['code', 'name', 'balance', 'children'], ... ],
     *   'pasivos'      => [...],
     *   'patrimonio'   => [...],
     *   'total_activos'    => float,
     *   'total_pasivos'    => float,
     *   'total_patrimonio' => float,
     *   'cuadra'           => bool,   // Activos == Pasivos + Patrimonio
     *   'diferencia'       => float,  // should be 0 if cuadra
     * ]
     */
    public function getBalanceSheet(string $tenantId, Carbon $asOf): array
    {
        $assets      = $this->getAccountsWithBalances($tenantId, 'asset',      null, $asOf, 'debit');
        $liabilities = $this->getAccountsWithBalances($tenantId, 'liability',  null, $asOf, 'credit');
        $equity      = $this->getAccountsWithBalances($tenantId, 'equity',     null, $asOf, 'credit');

        // Add retained earnings (net income up to asOf) to equity
        $incomeStatement = $this->getIncomeStatement(
            $tenantId,
            Carbon::create($asOf->year, 1, 1)->startOfDay(),
            $asOf->endOfDay()
        );

        $retainedEarnings = $incomeStatement['utilidad_neta'];
        if ($retainedEarnings != 0) {
            $equity[] = [
                'code'    => '3200',
                'name'    => 'Utilidad del Período',
                'balance' => $retainedEarnings,
            ];
        }

        $totalAssets      = collect($assets)->sum('balance');
        $totalLiabilities = collect($liabilities)->sum('balance');
        $totalEquity      = collect($equity)->sum('balance');
        $totalPL          = $totalLiabilities + $totalEquity;
        $difference       = round($totalAssets - $totalPL, 2);

        return [
            'as_of'             => $asOf->toDateString(),
            'activos'           => $assets,
            'pasivos'           => $liabilities,
            'patrimonio'        => $equity,
            'total_activos'     => round($totalAssets, 2),
            'total_pasivos'     => round($totalLiabilities, 2),
            'total_patrimonio'  => round($totalEquity, 2),
            'total_pasivos_patrimonio' => round($totalPL, 2),
            'cuadra'            => abs($difference) < 0.02,
            'diferencia'        => $difference,
        ];
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Fetches all leaf accounts of a given type and calculates their net balance
     * from accounting_entry_lines, filtered by an optional date range.
     *
     * @param  string      $tenantId
     * @param  string      $type          'asset'|'liability'|'equity'|'revenue'|'expense'
     * @param  Carbon|null $from          null = from beginning of time
     * @param  Carbon      $to
     * @param  string      $normalBalance 'debit'|'credit'  — the normal balance side for this account type
     * @return array
     */
    private function getAccountsWithBalances(
        string $tenantId,
        string $type,
        ?Carbon $from,
        Carbon $to,
        string $normalBalance
    ): array {
        $accounts = AccountingAccount::where('tenant_id', $tenantId)
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $result = [];

        foreach ($accounts as $account) {
            $query = AccountingEntryLine::where('accounting_account_id', $account->id)
                ->where('tenant_id', $tenantId)
                ->whereHas('entry', function ($q) use ($tenantId, $from, $to) {
                    $q->where('tenant_id', $tenantId)
                      ->when($from, fn($q2) => $q2->where('entry_date', '>=', $from->toDateString()))
                      ->where('entry_date', '<=', $to->toDateString());
                });

            $totalDebit  = (float) $query->sum('debit');
            $totalCredit = (float) $query->clone()->sum('credit');

            $balance = $normalBalance === 'debit'
                ? $totalDebit - $totalCredit
                : $totalCredit - $totalDebit;

            // Only include accounts with non-zero balances in the output
            if (abs($balance) >= 0.005) {
                $result[] = [
                    'code'    => $account->code,
                    'name'    => $account->name,
                    'balance' => round($balance, 2),
                ];
            }
        }

        return $result;
    }
}
