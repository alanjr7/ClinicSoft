<?php

namespace App\Http\Controllers\Erp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Tenant;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\AccountingAccount;
use App\Services\AccountingEntryService;
use App\Services\TenantSetupService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $search   = $request->input('search', '');

        // Auto-provision standard dental inventory categories if tenant has none (self-healing SaaS)
        if (InventoryCategory::where('tenant_id', $tenantId)->count() === 0) {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                TenantSetupService::setupInventoryDefaults($tenant);
            }
        }

        $query = InventoryItem::where('tenant_id', $tenantId)->where('is_active', true)->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $items      = $query->with('category:id,name')->get();
        $categories = InventoryCategory::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name', 'description']);
        $patients   = Patient::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'national_id', 'phone']);
        $accounts   = AccountingAccount::where('tenant_id', $tenantId)->where('is_active', true)->where('type', 'asset')->orderBy('code')->get(['id', 'code', 'name']);
        $tenant     = Tenant::find($tenantId);

        // Fetch recent POS sales for thermal ticket history and reprinting
        $payments = Payment::where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('notes', 'like', '%POS%')
                  ->orWhere('reference_number', 'like', 'POS%');
            })
            ->with(['patient:id,first_name,last_name,national_id', 'items', 'receivedBy:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->take(60)
            ->get();

        $sales = $payments->map(function ($p) use ($tenant) {
            preg_match('/(POS-[0-9A-Za-z-]+)/', ($p->notes ?? '') . ' ' . ($p->reference_number ?? ''), $matches);
            $ticket = $matches[1] ?? ($p->reference_number ?: ('POS-' . ($p->created_at ? $p->created_at->format('Ymd') : date('Ymd')) . '-' . strtoupper(substr(str_replace('-', '', $p->id), 0, 4))));

            $items = $p->items->map(function ($it) {
                // Parse description if format is "Name (x2 pza)"
                $name = $it->description;
                $qty = 1;
                $unit = 'pza';
                if (preg_match('/^(.*?)\s*\(x(\d+)\s*([^)]*)\)$/', $it->description, $m)) {
                    $name = $m[1];
                    $qty = (int) $m[2];
                    $unit = $m[3] ?: 'pza';
                }
                $unitPrice = $qty > 0 ? ((float) $it->amount / $qty) : (float) $it->amount;

                return [
                    'id'          => $it->id,
                    'name'        => $name,
                    'unit'        => $unit,
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'total'       => (float) $it->amount,
                ];
            });

            $cashierName = $p->receivedBy ? trim($p->receivedBy->first_name . ' ' . $p->receivedBy->last_name) : 'Cajero';

            return [
                'id'              => $p->id,
                'ticket_number'   => $ticket,
                'date'            => $p->created_at ? $p->created_at->format('d/m/Y H:i') : ($p->payment_date ? date('d/m/Y', strtotime($p->payment_date)) : date('d/m/Y H:i')),
                'patient_name'    => $p->patient ? trim($p->patient->first_name . ' ' . $p->patient->last_name) : ($p->customer_name ?: 'Cliente Mostrador'),
                'patient_ci'      => $p->patient?->national_id ?? $p->customer_ci,
                'payment_method'  => $p->payment_method,
                'items'           => $items->values()->all(),
                'subtotal'        => (float) $p->amount,
                'discount'        => 0,
                'tax_amount'      => 0,
                'total'           => (float) $p->amount,
                'received_amount' => (float) $p->amount,
                'change_amount'   => 0,
                'notes'           => $p->notes,
                'cashier'         => $cashierName ?: 'Cajero',
                'clinic'          => [
                    'name'     => $tenant?->name ?? 'Farmacia / Clínica',
                    'address'  => $tenant?->address ?? '',
                    'phone'    => $tenant?->phone ?? '',
                    'currency' => $tenant?->currency ?? 'BOB',
                ],
            ];
        });

        return Inertia::render('Inventory', [
            'items'      => $items,
            'categories' => $categories,
            'patients'   => $patients,
            'accounts'   => $accounts,
            'sales'      => $sales,
            'clinic'     => $tenant ? [
                'name'     => $tenant->name,
                'address'  => $tenant->address,
                'phone'    => $tenant->phone,
                'currency' => $tenant->currency ?? 'BOB',
                'logo_url' => $tenant->logo_url,
            ] : null,
            'filters'    => ['search' => $search],
        ]);
    }

    public function storeCategory(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string|max:500',
        ]);

        $category = InventoryCategory::firstOrCreate(
            ['tenant_id' => $tenantId, 'name' => trim($validated['name'])],
            ['description' => $validated['description'] ?? null]
        );

        return back()->with('success', 'Categoría creada.');
    }

    public function destroyCategory(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $category = InventoryCategory::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        if ($category->items()->count() > 0) {
            return back()->with('error', 'No se puede eliminar una categoría que contiene productos asociados.');
        }

        $category->delete();
        return back()->with('success', 'Categoría eliminada.');
    }

    public function storeItem(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'category_id'     => 'required|exists:inventory_categories,id',
            'name'            => 'required|string|max:150',
            'sku'             => 'nullable|string|max:50',
            'unit_of_measure' => 'required|string|max:20',
            'min_stock_level' => 'required|numeric|min:0',
            'current_stock'   => 'numeric|min:0',
            'unit_cost'       => 'nullable|numeric|min:0',
        ]);

        // Map unit_of_measure → unit (column name in migration)
        $data = array_merge($validated, [
            'tenant_id' => $tenantId,
            'unit'      => $validated['unit_of_measure'],
        ]);
        unset($data['unit_of_measure']);

        InventoryItem::create($data);

        return back()->with('success', 'Artículo creado.');
    }

    public function updateItem(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $item = InventoryItem::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'name'            => 'string|max:150',
            'sku'             => 'nullable|string|max:50',
            'unit_of_measure' => 'string|max:20',
            'min_stock_level' => 'numeric|min:0',
            'unit_cost'       => 'nullable|numeric|min:0',
        ]);

        if (isset($validated['unit_of_measure'])) {
            $validated['unit'] = $validated['unit_of_measure'];
            unset($validated['unit_of_measure']);
        }

        $item->update($validated);
        return back()->with('success', 'Artículo actualizado.');
    }

    public function storeMovement(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'item_id'       => 'required|exists:inventory_items,id',
            'movement_type' => 'required|string|in:in,out,adjustment',
            'quantity'      => 'required|numeric|min:0.01',
            'notes'         => 'nullable|string|max:1000',
            'reason'        => 'nullable|string|max:200',
            'reference'     => 'nullable|string|max:150',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $tenantId) {
            $item = InventoryItem::where('id', $validated['item_id'])
                ->where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->firstOrFail();

            $qty = (int) $validated['quantity'];
            $stockAfter = (int) $item->current_stock;

            if ($validated['movement_type'] === 'in') {
                $stockAfter += $qty;
            } elseif ($validated['movement_type'] === 'out') {
                $stockAfter = max(0, $stockAfter - $qty);
            } elseif ($validated['movement_type'] === 'adjustment') {
                $stockAfter = $qty;
            }

            InventoryMovement::create([
                'tenant_id'     => $tenantId,
                'user_id'       => Auth::id(),
                'item_id'       => $item->id,
                'movement_type' => $validated['movement_type'],
                'quantity'      => $qty,
                'stock_after'   => $stockAfter,
                'reason'        => $validated['reason'] ?? null,
                'reference'     => $validated['reference'] ?? null,
                'notes'         => $validated['notes'] ?? null,
            ]);

            $item->update(['current_stock' => $stockAfter]);
        });

        return back()->with('success', 'Movimiento registrado correctamente.');
    }

    public function destroyItem(Request $request, $id)
    {
        $tenantId = $request->attributes->get('tenant_id');
        $item = InventoryItem::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail();

        // Logical soft-delete: preserve movement/audit history
        $item->update(['is_active' => false]);

        return back()->with('success', 'Producto eliminado del inventario.');
    }

    public function storePosSale(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id');

        $validated = $request->validate([
            'patient_id'       => 'nullable|exists:patients,id',
            'patient_name'     => 'nullable|string|max:150',
            'patient_ci'       => 'nullable|string|max:50',
            'payment_method'   => 'required|string|in:cash,card,transfer,check,other',
            'account_id'       => 'nullable|exists:accounting_accounts,id',
            'tax_rate'         => 'nullable|numeric|min:0',
            'discount_amount'  => 'nullable|numeric|min:0',
            'received_amount'  => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string|max:500',
            'items'            => 'required|array|min:1',
            'items.*.id'       => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.price'    => 'required|numeric|min:0',
        ]);

        $saleReceipt = DB::transaction(function () use ($validated, $tenantId) {
            $patient = null;
            if (!empty($validated['patient_id'])) {
                $patient = Patient::where('id', $validated['patient_id'])->where('tenant_id', $tenantId)->first();
            }

            $customerName = $patient 
                ? trim($patient->first_name . ' ' . $patient->last_name) 
                : (!empty($validated['patient_name']) ? trim($validated['patient_name']) : 'Cliente Mostrador');

            $customerCi = $patient 
                ? $patient->national_id 
                : (!empty($validated['patient_ci']) ? trim($validated['patient_ci']) : null);

            // Generate sale ticket number
            $ticketNumber = 'POS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $totalSubtotal = 0;
            $processedItems = [];

            foreach ($validated['items'] as $it) {
                $item = InventoryItem::where('id', $it['id'])
                    ->where('tenant_id', $tenantId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty = (int) $it['quantity'];
                $unitPrice = (float) $it['price'];
                $lineTotal = round($qty * $unitPrice, 2);
                $totalSubtotal += $lineTotal;

                $stockAfter = max(0, (int) $item->current_stock - $qty);

                InventoryMovement::create([
                    'tenant_id'     => $tenantId,
                    'user_id'       => Auth::id(),
                    'item_id'       => $item->id,
                    'movement_type' => 'out',
                    'quantity'      => $qty,
                    'stock_after'   => $stockAfter,
                    'reason'        => 'Venta POS (' . $ticketNumber . ')',
                    'reference'     => $ticketNumber,
                    'notes'         => 'Venta en mostrador / Farmacia a ' . $customerName,
                ]);

                $item->update(['current_stock' => $stockAfter]);

                $processedItems[] = [
                    'id'          => $item->id,
                    'name'        => $item->name,
                    'unit'        => $item->unit,
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'total'       => $lineTotal,
                ];
            }

            $discount = (float) ($validated['discount_amount'] ?? 0);
            $taxRate  = (float) ($validated['tax_rate'] ?? 0);
            $taxableBase = max(0, $totalSubtotal - $discount);
            $taxAmount   = round($taxableBase * ($taxRate / 100), 2);
            $grandTotal  = round($taxableBase + $taxAmount, 2);

            $receivedAmount = isset($validated['received_amount']) && (float)$validated['received_amount'] > 0 
                ? (float)$validated['received_amount'] 
                : $grandTotal;
            $changeAmount   = max(0, $receivedAmount - $grandTotal);

            // Register payment in ERP Financials (desacoplado de la ficha de paciente si es mostrador)
            $payment = Payment::create([
                'tenant_id'        => $tenantId,
                'patient_id'       => $patient?->id, // NULL si es cliente mostrador
                'customer_name'    => $customerName,
                'customer_ci'      => $customerCi,
                'received_by'      => Auth::id(),
                'amount'           => $grandTotal,
                'payment_method'   => $validated['payment_method'],
                'reference_number' => $ticketNumber,
                'notes'            => 'Venta Farmacia/POS Ticket #' . $ticketNumber . ($validated['notes'] ? ' - ' . $validated['notes'] : ''),
                'payment_date'     => now(),
            ]);

            foreach ($processedItems as $pItem) {
                $payment->items()->create([
                    'tenant_id'   => $tenantId,
                    'description' => $pItem['name'] . ' (x' . $pItem['quantity'] . ' ' . $pItem['unit'] . ')',
                    'amount'      => $pItem['total'],
                ]);
            }

            // Registro contable automático (Caja/Banco -> Ingresos Farmacia/Insumos)
            AccountingEntryService::recordPaymentEntry(
                tenantId: $tenantId,
                payment: $payment,
                description: 'Ingreso por Venta Farmacia / POS #' . $ticketNumber . ' - ' . $customerName,
                accountAssetId: $validated['account_id'] ?? null,
                incomeAccountCode: '4400'
            );

            $tenant = Tenant::find($tenantId);

            return [
                'ticket_number'   => $ticketNumber,
                'date'            => now()->format('d/m/Y H:i'),
                'patient_name'    => $customerName,
                'patient_ci'      => $customerCi,
                'payment_method'  => $validated['payment_method'],
                'items'           => $processedItems,
                'subtotal'        => $totalSubtotal,
                'discount'        => $discount,
                'tax_amount'      => $taxAmount,
                'total'           => $grandTotal,
                'received_amount' => $receivedAmount,
                'change_amount'   => $changeAmount,
                'notes'           => $validated['notes'] ?? null,
                'payment_id'      => $payment->id,
                'cashier'         => Auth::user()?->name ?? 'Cajero',
                'clinic'          => [
                    'name'     => $tenant?->name ?? 'Clínica',
                    'address'  => $tenant?->address ?? '',
                    'phone'    => $tenant?->phone ?? '',
                    'currency' => $tenant?->currency ?? 'BOB',
                ],
            ];
        });

        return back()->with([
            'success'      => '¡Venta POS registrada con éxito! Ticket: ' . $saleReceipt['ticket_number'],
            'sale_receipt' => $saleReceipt,
        ]);
    }
}
