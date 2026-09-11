<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AccountingAccount;
use App\Models\AccountingEntry;
use App\Models\AccountingEntryLine;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\Payment;
use App\Services\AccountingEntryService;
use App\Services\SequenceGeneratorService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AccountingController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        // Repair incomplete legacy entries automatically
        AccountingEntryService::repairIncompleteEntries($tenantId);

        // --- Period filter (default: current month) ---
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd   = Carbon::create($year, $month, 1)->endOfMonth();

        // --- Accounts ---
        $accounts = AccountingAccount::where('tenant_id', $tenantId)
            ->orderBy('code')
            ->get();

        // --- Expenses for the selected period ---
        $expenses = Expense::where('tenant_id', $tenantId)
            ->with(['category:id,name,code', 'creator:id,first_name,last_name', 'patient:id,first_name,last_name,national_id'])
            ->whereBetween('expense_date', [$periodStart, $periodEnd])
            ->orderByDesc('expense_date')
            ->get();

        // --- Expense Categories ---
        $categories = ExpenseCategory::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        // --- Patients ---
        $patients = \App\Models\Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'national_id']);

        // --- Accounting Entries ---
        $entries = AccountingEntry::where('tenant_id', $tenantId)
            ->with(['lines.account:id,code,name'])
            ->whereBetween('entry_date', [$periodStart, $periodEnd])
            ->orderByDesc('entry_date')
            ->get();

        // --- Monthly Income from Payments module ---
        $monthlyIncome = Payment::where('tenant_id', $tenantId)
            ->whereBetween('payment_date', [$periodStart, $periodEnd])
            ->sum('amount');

        // --- Total expenses this period ---
        $monthlyExpenses = Expense::where('tenant_id', $tenantId)
            ->whereBetween('expense_date', [$periodStart, $periodEnd])
            ->sum('amount');

        // --- Expenses by category (for chart/summary) ---
        $expensesByCategory = Expense::where('expenses.tenant_id', $tenantId)
            ->whereBetween('expense_date', [$periodStart, $periodEnd])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select('expense_categories.name as category_name', 'expense_categories.code as category_code', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.id', 'expense_categories.name', 'expense_categories.code')
            ->orderByDesc('total')
            ->get();

        return Inertia::render('Accounting', [
            'accounts'            => $accounts,
            'expenses'            => $expenses,
            'expenseCategories'   => $categories,
            'entries'             => $entries,
            'monthlyIncome'       => (float) $monthlyIncome,
            'monthlyExpenses'     => (float) $monthlyExpenses,
            'expensesByCategory'  => $expensesByCategory,
            'period'              => ['month' => $month, 'year' => $year],
            'patients'            => $patients,
        ]);
    }

    // --- Expenses ---
    public function storeExpense(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'patient_id'          => 'nullable|exists:patients,id',
            'expense_date'        => 'required|date',
            'description'         => 'required|string|max:500',
            'amount'              => 'required|numeric|min:0.01',
            'currency'            => 'string|max:3',
            'payment_method'      => 'nullable|string|in:cash,transfer,qr,check,card,other',
            'receipt_url'         => 'nullable|string|max:500',
        ]);

        $expenseNumber = SequenceGeneratorService::generateNext($tenantId, Expense::class, 'expense_number', 'GAS', 5);

        Expense::create(array_merge($validated, [
            'tenant_id'      => $tenantId,
            'expense_number' => $expenseNumber,
            'created_by'     => Auth::id(),
            'currency'       => $validated['currency'] ?? 'BOB',
            'status'         => 'paid',
            'patient_id'     => $validated['patient_id'] ?? null,
        ]));

        return back()->with('success', 'Gasto registrado correctamente.');
    }

    public function updateExpense(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $expense  = Expense::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'patient_id'          => 'nullable|exists:patients,id',
            'expense_date'        => 'required|date',
            'description'         => 'required|string|max:500',
            'amount'              => 'required|numeric|min:0.01',
            'payment_method'      => 'nullable|string|in:cash,transfer,qr,check,card,other',
            'receipt_url'         => 'nullable|string|max:500',
            'status'              => 'string|in:pending,paid,cancelled',
        ]);

        $expense->update($validated);
        return back()->with('success', 'Gasto actualizado.');
    }

    public function destroyExpense(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        Expense::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()->delete();
        return back()->with('success', 'Gasto eliminado.');
    }

    // --- Accounts ---
    public function storeAccount(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'code'      => 'required|string|max:20',
            'name'      => 'required|string|max:255',
            'type'      => 'required|in:asset,liability,equity,revenue,expense',
            'parent_id' => 'nullable|exists:accounting_accounts,id',
        ]);

        AccountingAccount::create(array_merge($validated, ['tenant_id' => $tenantId]));

        return back()->with('success', 'Cuenta creada.');
    }

    // --- Entries ---
    public function storeEntry(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'entry_date'                          => 'required|date',
            'description'                         => 'required|string|max:500',
            'lines'                               => 'required|array|min:2',
            'lines.*.accounting_account_id'       => 'required|exists:accounting_accounts,id',
            'lines.*.debit'                        => 'required|numeric|min:0',
            'lines.*.credit'                       => 'required|numeric|min:0',
        ]);

        $totalDebit  = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return back()->withErrors(['lines' => 'El asiento no cuadra. Total Debe debe ser igual al Total Haber.']);
        }

        DB::transaction(function () use ($validated, $tenantId) {
            $entryNumber = SequenceGeneratorService::generateNext($tenantId, AccountingEntry::class, 'entry_number', 'ASI', 5);

            $entry = AccountingEntry::create([
                'tenant_id'   => $tenantId,
                'entry_number'=> $entryNumber,
                'entry_date'  => $validated['entry_date'],
                'description' => $validated['description'],
                'created_by'  => Auth::id(),
            ]);

            foreach ($validated['lines'] as $line) {
                AccountingEntryLine::create([
                    'tenant_id'              => $tenantId,
                    'accounting_entry_id'    => $entry->id,
                    'accounting_account_id'  => $line['accounting_account_id'],
                    'debit'                  => $line['debit'],
                    'credit'                 => $line['credit'],
                ]);
            }
        });

        return back()->with('success', 'Asiento registrado correctamente.');
    }

    // --- Libro Mayor (movements per account) ---
    public function libroMayor(Request $request, $accountId)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $account  = AccountingAccount::where('id', $accountId)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);
        $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
        $periodEnd   = Carbon::create($year, $month, 1)->endOfMonth();

        $lines = AccountingEntryLine::where('accounting_account_id', $accountId)
            ->whereHas('entry', fn($q) => $q->where('tenant_id', $tenantId)
                ->whereBetween('entry_date', [$periodStart, $periodEnd]))
            ->with('entry:id,entry_number,entry_date,description')
            ->get();

        return Inertia::render('AccountingLedger', [
            'account' => $account,
            'lines'   => $lines,
            'period'  => ['month' => $month, 'year' => $year],
        ]);
    }
}
