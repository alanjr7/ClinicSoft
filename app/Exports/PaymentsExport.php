<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaymentsExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private string  $tenantId,
        private ?string $from = null,
        private ?string $to   = null,
    ) {}

    public function title(): string
    {
        return 'Cobros';
    }

    public function query()
    {
        return Payment::query()
            ->where('tenant_id', $this->tenantId)
            ->with(['patient:id,first_name,last_name', 'invoice:id,invoice_number'])
            ->when($this->from, fn($q) => $q->where('payment_date', '>=', $this->from))
            ->when($this->to,   fn($q) => $q->where('payment_date', '<=', $this->to))
            ->orderBy('payment_date', 'desc');
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Paciente',
            'Nº Factura',
            'Método de Pago',
            'Monto',
            'Nº Referencia',
            'Notas',
        ];
    }

    public function map($payment): array
    {
        $methodMap = [
            'cash'     => 'Efectivo',
            'transfer' => 'Transferencia',
            'qr'       => 'QR',
            'check'    => 'Cheque',
            'card'     => 'Tarjeta',
            'other'    => 'Otro',
        ];

        return [
            $payment->payment_date ? $payment->payment_date->format('d/m/Y') : '',
            $payment->patient ? $payment->patient->first_name . ' ' . $payment->patient->last_name : '',
            $payment->invoice ? $payment->invoice->invoice_number : '',
            $methodMap[$payment->payment_method] ?? ucfirst($payment->payment_method),
            number_format($payment->amount, 2),
            $payment->reference_number ?? '',
            $payment->notes ?? '',
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
