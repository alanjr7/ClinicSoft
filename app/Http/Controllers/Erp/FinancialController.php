<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Patient;
use App\Models\Treatment;
use App\Services\SequenceGeneratorService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FinancialController extends Controller
{
    // -------- Budgets --------
    public function indexBudgets(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $budgets = Budget::where('tenant_id', $tenantId)
            ->with(['patient:id,first_name,last_name', 'items'])
            ->orderByDesc('created_at')
            ->get();

        $patients = Patient::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('last_name')->get(['id', 'first_name', 'last_name']);

        $treatments = Treatment::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('name')->get(['id', 'name', 'base_price']);

        $tenant = \App\Models\Tenant::findOrFail($tenantId);

        return Inertia::render('Budgets', [
            'budgets'    => $budgets,
            'patients'   => $patients,
            'treatments' => $treatments,
            'clinic'     => [
                'name'     => $tenant->name,
                'address'  => $tenant->address,
                'phone'    => $tenant->phone,
                'logo_url' => $tenant->logo_url,
            ],
        ]);
    }

    public function storeBudget(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'       => 'nullable|exists:patients,id',
            'patient_name'     => 'nullable|string',
            'valid_until'      => 'nullable|date',
            'status'           => 'string',
            'notes'            => 'nullable|string',
            'tax_rate'         => 'numeric',
            'discount_amount'  => 'numeric',
            'items'            => 'required|array',
            'items.*.treatment_id' => 'nullable|exists:treatments,id',
            'items.*.description'  => 'nullable|string',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.unit_price'   => 'required|numeric',
            'items.*.discount_amount' => 'numeric',
        ]);

        DB::transaction(function () use ($validated, $tenantId, &$budget) {
            $patientId = $validated['patient_id'] ?? null;
            if (!$patientId && !empty($validated['patient_name'])) {
                $parts = explode(' ', $validated['patient_name'], 2);
                $patient = Patient::create([
                    'tenant_id' => $tenantId,
                    'created_by' => Auth::id(),
                    'first_name' => $parts[0],
                    'last_name' => $parts[1] ?? '',
                    'is_active' => true,
                ]);
                $patientId = $patient->id;
            }

            $budget = Budget::create([
                'tenant_id'       => $tenantId,
                'created_by'      => Auth::id(),
                'budget_number'   => $this->nextNumber($tenantId, 'PRES', Budget::class),
                'patient_id'      => $patientId,
                'valid_until'     => $validated['valid_until'] ?? null,
                'status'          => $validated['status'] ?? 'draft',
                'notes'           => $validated['notes'] ?? null,
                'tax_rate'        => $validated['tax_rate'] ?? 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
            ]);

            foreach ($validated['items'] as $item) {
                $lineTotal = round(($item['unit_price'] * $item['quantity']) - ($item['discount_amount'] ?? 0), 2);
                BudgetItem::create(array_merge($item, [
                    'tenant_id' => $tenantId,
                    'budget_id' => $budget->id,
                    'total'     => $lineTotal,
                ]));
            }

            $totals = $this->calcTotals($validated['items'], $budget->tax_rate, $budget->discount_amount);
            $budget->update($totals);
        });

        return redirect()->route('budgets.index')->with([
            'success' => 'Presupuesto creado.',
            'new_budget_id' => $budget->id,
        ]);
    }

    public function updateBudget(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $budget = Budget::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'valid_until' => 'nullable|date',
            'status'      => 'string',
            'notes'       => 'nullable|string',
        ]);

        $budget->update($validated);
        return back()->with('success', 'Presupuesto actualizado.');
    }

    public function destroyBudget(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        Budget::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()->delete();
        return back()->with('success', 'Presupuesto eliminado.');
    }

    // -------- Invoices --------
    public function indexInvoices(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $invoices = Invoice::where('tenant_id', $tenantId)
            ->with(['patient:id,first_name,last_name', 'items'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Invoices', [
            'invoices' => $invoices,
        ]);
    }

    public function storeInvoice(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'       => 'required|exists:patients,id',
            'issued_at'        => 'nullable|date',
            'due_date'         => 'nullable|date',
            'status'           => 'string',
            'notes'            => 'nullable|string',
            'tax_rate'         => 'numeric',
            'discount_amount'  => 'numeric',
            'items'            => 'required|array',
            'items.*.treatment_id' => 'nullable|exists:treatments,id',
            'items.*.description'  => 'nullable|string',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.unit_price'   => 'required|numeric',
            'items.*.discount_amount' => 'numeric',
        ]);

        DB::transaction(function () use ($validated, $tenantId) {
            $invoice = Invoice::create([
                'tenant_id'       => $tenantId,
                'created_by'      => Auth::id(),
                'invoice_number'  => $this->nextNumber($tenantId, 'FAC', Invoice::class),
                'patient_id'      => $validated['patient_id'],
                'issued_at'       => $validated['issued_at'] ?? now(),
                'due_date'        => $validated['due_date'] ?? null,
                'status'          => $validated['status'] ?? 'draft',
                'notes'           => $validated['notes'] ?? null,
                'tax_rate'        => $validated['tax_rate'] ?? 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
            ]);

            foreach ($validated['items'] as $item) {
                $lineTotal = round(($item['unit_price'] * $item['quantity']) - ($item['discount_amount'] ?? 0), 2);
                InvoiceItem::create(array_merge($item, [
                    'tenant_id'  => $tenantId,
                    'invoice_id' => $invoice->id,
                    'total'      => $lineTotal,
                ]));
            }

            $totals = $this->calcTotals($validated['items'], $invoice->tax_rate, $invoice->discount_amount);
            $invoice->update($totals);
        });

        return back()->with('success', 'Factura creada.');
    }

    // -------- Payments --------
    public function indexPayments(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $payments = Payment::where('tenant_id', $tenantId)
            ->with(['patient:id,first_name,last_name,national_id', 'items'])
            ->orderByDesc('created_at')
            ->get();

        $patients = Patient::where('tenant_id', $tenantId)->where('is_active', true)
            ->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'national_id']);

        $accountingAccounts = \App\Models\AccountingAccount::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->where('type', 'asset')
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Payments', [
            'payments' => $payments,
            'patients' => $patients,
            'accounts' => $accountingAccounts,
        ]);
    }

    public function storePayment(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'     => 'nullable|exists:patients,id',
            'patient_name'   => 'nullable|string',
            'patient_ci'     => 'nullable|string',
            'amount'         => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'notes'          => 'nullable|string',
            'items'          => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.amount'      => 'required|numeric|min:0',
            'account_id'     => 'nullable|exists:accounting_accounts,id',
        ]);

        $payment = DB::transaction(function () use ($validated, $tenantId) {
            $patientId = $validated['patient_id'] ?? null;
            $patient = null;
            
            if ($patientId) {
                $patient = Patient::where('id', $patientId)->where('tenant_id', $tenantId)->first();
            }

            if (!$patient && !empty($validated['patient_name'])) {
                // Try to find by name
                $patient = Patient::where('tenant_id', $tenantId)
                    ->where('first_name', $validated['patient_name'])
                    ->first();

                if (!$patient) {
                    $patient = Patient::create([
                        'tenant_id'   => $tenantId,
                        'created_by'  => Auth::id(),
                        'first_name'  => $validated['patient_name'],
                        'last_name'   => '',
                        'national_id' => $validated['patient_ci'] ?? null,
                        'is_active'   => true,
                    ]);
                }
            }

            if (!$patient) {
                abort(400, 'Se requiere el paciente');
            }

            $totalAmount = collect($validated['items'])->sum('amount');

            $payment = Payment::create([
                'tenant_id'      => $tenantId,
                'patient_id'     => $patient->id,
                'received_by'    => Auth::id(),
                'amount'         => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'notes'          => $validated['notes'] ?? null,
                'payment_date'   => now(),
            ]);

            foreach ($validated['items'] as $item) {
                $payment->items()->create([
                    'tenant_id' => $tenantId,
                    'description' => $item['description'],
                    'amount' => $item['amount'],
                ]);
            }

            if (!empty($validated['account_id'])) {
                \App\Services\AccountingEntryService::recordPaymentEntry(
                    tenantId: $tenantId,
                    payment: $payment,
                    description: 'Ingreso por pago de paciente: ' . $patient->first_name . ' ' . $patient->last_name,
                    accountAssetId: $validated['account_id'],
                    incomeAccountCode: '4100'
                );
            }

            return $payment;
        });

        return back()->with([
            'success' => 'Pago registrado.',
            'new_payment_id' => $payment->id,
        ]);
    }

    public function destroyPayment(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $payment = Payment::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        DB::transaction(function () use ($payment, $tenantId) {
            // Delete associated accounting entries & their lines
            $entries = \App\Models\AccountingEntry::where('tenant_id', $tenantId)
                ->where('reference_type', Payment::class)
                ->where('reference_id', $payment->id)
                ->get();

            foreach ($entries as $entry) {
                $entry->lines()->delete();
                $entry->delete();
            }

            // Delete payment items
            $payment->items()->delete();

            // Delete payment
            $payment->delete();
        });

        return back()->with('success', 'Pago eliminado correctamente.');
    }

    // -------- Helpers --------
    private function nextNumber(string $tenantId, string $prefix, string $model): string
    {
        $columnMap = [
            Invoice::class => 'invoice_number',
            Budget::class  => 'budget_number',
        ];
        $column = $columnMap[$model] ?? 'number';

        return SequenceGeneratorService::generateNext($tenantId, $model, $column, $prefix, 5);
    }

    private function calcTotals(array $items, float $taxRate, float $discountAmount): array
    {
        $subtotal = collect($items)->sum(fn ($i) => $i['unit_price'] * $i['quantity'] - ($i['discount_amount'] ?? 0));
        $tax      = round($subtotal * ($taxRate / 100), 2);
        $total    = round($subtotal + $tax - $discountAmount, 2);
        return ['subtotal' => $subtotal, 'tax_amount' => $tax, 'total' => $total];
    }
}
