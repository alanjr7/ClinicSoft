<?php

namespace App\Services;

use App\Models\AccountingAccount;
use App\Models\AccountingEntry;
use App\Models\AccountingEntryLine;
use App\Models\Payment;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class AccountingEntryService
{
    /**
     * Record a balanced double-entry for a patient payment.
     *
     * Double-Entry rule for income:
     * - DEBIT (Debe) -> Cash/Bank Asset account (1110 Caja or 1120 Banco)
     * - CREDIT (Haber) -> Revenue account (4100 Consultas or 4200 Tratamientos Especializados)
     */
    public static function recordPaymentEntry(
        string $tenantId,
        Payment $payment,
        string $description,
        ?string $accountAssetId = null,
        string $incomeAccountCode = '4100'
    ): ?AccountingEntry {
        $amount = (float) $payment->amount;
        if ($amount <= 0) {
            return null;
        }

        // Ensure accounting accounts exist for this tenant (not treatments)
        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            TenantSetupService::setupAccountingDefaults($tenant);
        }

        // 1. Resolve Asset Account (Debit)
        $assetAccount = null;
        if ($accountAssetId) {
            $assetAccount = AccountingAccount::where('id', $accountAssetId)->where('tenant_id', $tenantId)->first();
        }
        if (!$assetAccount) {
            $targetCode = in_array($payment->payment_method, ['transfer', 'card', 'check']) ? '1120' : '1110';
            $assetAccount = AccountingAccount::where('tenant_id', $tenantId)
                ->where('code', $targetCode)
                ->first();

            if (!$assetAccount) {
                $assetAccount = AccountingAccount::where('tenant_id', $tenantId)
                    ->where('type', 'asset')
                    ->orderBy('code')
                    ->first();
            }
        }

        // 2. Resolve Revenue Account (Credit)
        $revenueAccount = AccountingAccount::where('tenant_id', $tenantId)
            ->where('code', $incomeAccountCode)
            ->first();
        if (!$revenueAccount) {
            $revenueAccount = AccountingAccount::where('tenant_id', $tenantId)
                ->where('type', 'revenue')
                ->orderBy('code')
                ->first();
        }

        if (!$assetAccount || !$revenueAccount) {
            return null;
        }

        $entryDate = $payment->payment_date ? Carbon::parse($payment->payment_date)->toDateString() : now()->toDateString();

        $entry = null;
        $maxAttempts = 5;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $entryNumber = SequenceGeneratorService::generateNext($tenantId, AccountingEntry::class, 'entry_number', 'ASI', 5);
            try {
                $entry = AccountingEntry::create([
                    'tenant_id'      => $tenantId,
                    'created_by'     => Auth::id() ?? $payment->received_by,
                    'entry_number'   => $entryNumber,
                    'entry_date'     => $entryDate,
                    'reference_id'   => $payment->id,
                    'reference_type' => Payment::class,
                    'description'    => $description,
                ]);
                break;
            } catch (\Illuminate\Database\QueryException $ex) {
                if ($attempt < $maxAttempts && ($ex->getCode() == 23000 || str_contains($ex->getMessage(), 'Duplicate entry') || str_contains($ex->getMessage(), '1062'))) {
                    continue;
                }
                throw $ex;
            }
        }

        // Line 1: DEBE (Asset)
        AccountingEntryLine::create([
            'tenant_id'             => $tenantId,
            'accounting_entry_id'   => $entry->id,
            'accounting_account_id' => $assetAccount->id,
            'debit'                 => $amount,
            'credit'                => 0,
            'description'           => 'Ingreso en ' . $assetAccount->name,
        ]);

        // Line 2: HABER (Revenue)
        AccountingEntryLine::create([
            'tenant_id'             => $tenantId,
            'accounting_entry_id'   => $entry->id,
            'accounting_account_id' => $revenueAccount->id,
            'debit'                 => 0,
            'credit'                => $amount,
            'description'           => 'Ingreso devengado',
        ]);

        return $entry;
    }

    /**
     * Fix/repair incomplete legacy entries (like empty lines or single-sided entries).
     */
    public static function repairIncompleteEntries(string $tenantId): void
    {
        // Ensure accounting accounts exist for this tenant (not treatments)
        $tenant = Tenant::find($tenantId);
        if ($tenant) {
            TenantSetupService::setupAccountingDefaults($tenant);
        }

        $caja = AccountingAccount::where('tenant_id', $tenantId)->where('code', '1110')->first()
            ?? AccountingAccount::where('tenant_id', $tenantId)->where('type', 'asset')->first();

        $revenueConsultas = AccountingAccount::where('tenant_id', $tenantId)->where('code', '4100')->first()
            ?? AccountingAccount::where('tenant_id', $tenantId)->where('type', 'revenue')->first();

        $revenueOrtho = AccountingAccount::where('tenant_id', $tenantId)->where('code', '4200')->first()
            ?? $revenueConsultas;

        $entries = AccountingEntry::where('tenant_id', $tenantId)->with('lines')->get();

        foreach ($entries as $entry) {
            // Fix entry_date format if needed
            if ($entry->entry_date) {
                $entry->entry_date = Carbon::parse($entry->entry_date)->toDateString();
                $entry->save();
            }

            // Case 1: Entry has 0 lines
            if ($entry->lines->isEmpty()) {
                if ($entry->reference_type === Payment::class || str_contains($entry->description, 'Pago') || str_contains($entry->description, 'Ortodoncia')) {
                    $payment = Payment::find($entry->reference_id);
                    $amount = $payment ? (float) $payment->amount : 0;

                    if ($amount > 0 && $caja) {
                        $isOrtho = str_contains($entry->description, 'Ortodoncia');
                        $revAccount = $isOrtho ? ($revenueOrtho ?? $revenueConsultas) : $revenueConsultas;

                        // Line 1: DEBE
                        AccountingEntryLine::create([
                            'tenant_id'             => $tenantId,
                            'accounting_entry_id'   => $entry->id,
                            'accounting_account_id' => $caja->id,
                            'debit'                 => $amount,
                            'credit'                => 0,
                            'description'           => 'Ingreso en Caja',
                        ]);

                        // Line 2: HABER
                        if ($revAccount) {
                            AccountingEntryLine::create([
                                'tenant_id'             => $tenantId,
                                'accounting_entry_id'   => $entry->id,
                                'accounting_account_id' => $revAccount->id,
                                'debit'                 => 0,
                                'credit'                => $amount,
                                'description'           => 'Ingreso por tratamiento',
                            ]);
                        }
                    }
                }
            }
            // Case 2: Entry has only 1 line (e.g. missing balancing credit)
            elseif ($entry->lines->count() === 1) {
                $line = $entry->lines->first();
                if ((float) $line->debit > 0 && (float) $line->credit == 0 && $revenueConsultas) {
                    $revAccount = str_contains($entry->description, 'Ortodoncia') ? ($revenueOrtho ?? $revenueConsultas) : $revenueConsultas;
                    AccountingEntryLine::create([
                        'tenant_id'             => $tenantId,
                        'accounting_entry_id'   => $entry->id,
                        'accounting_account_id' => $revAccount->id,
                        'debit'                 => 0,
                        'credit'                => $line->debit,
                        'description'           => 'Ingreso por servicios',
                    ]);
                }
            }
        }
    }
}
