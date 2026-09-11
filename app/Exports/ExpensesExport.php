<?php

namespace App\Exports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExpensesExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private string  $tenantId,
        private ?string $from = null,
        private ?string $to   = null,
    ) {}

    public function title(): string
    {
        return 'Gastos';
    }

    public function query()
    {
        return Expense::query()
            ->where('tenant_id', $this->tenantId)
            ->with(['category:id,name,code', 'creator:id,first_name,last_name'])
            ->when($this->from, fn($q) => $q->where('expense_date', '>=', $this->from))
            ->when($this->to,   fn($q) => $q->where('expense_date', '<=', $this->to))
            ->orderBy('expense_date', 'desc');
    }

    public function headings(): array
    {
        return [
            'Nº Gasto',
            'Fecha',
            'Categoría',
            'Descripción',
            'Monto',
            'Moneda',
            'Método de Pago',
            'Estado',
            'Registrado por',
        ];
    }

    public function map($expense): array
    {
        $methodMap = [
            'cash'     => 'Efectivo',
            'transfer' => 'Transferencia',
            'qr'       => 'QR',
            'check'    => 'Cheque',
            'card'     => 'Tarjeta',
            'other'    => 'Otro',
        ];
        $statusMap = [
            'pending'   => 'Pendiente',
            'paid'      => 'Pagado',
            'cancelled' => 'Anulado',
        ];

        return [
            $expense->expense_number,
            $expense->expense_date ? $expense->expense_date->format('d/m/Y') : '',
            $expense->category ? $expense->category->name : '',
            $expense->description,
            number_format($expense->amount, 2),
            $expense->currency ?? 'BOB',
            $methodMap[$expense->payment_method ?? ''] ?? ($expense->payment_method ?? ''),
            $statusMap[$expense->status] ?? ucfirst($expense->status),
            $expense->creator ? $expense->creator->first_name . ' ' . $expense->creator->last_name : '',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '16213E']],
            ],
        ];
    }
}
