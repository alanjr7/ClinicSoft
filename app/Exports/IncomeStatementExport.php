<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;

/**
 * Income Statement Export
 *
 * Exports a two-sheet workbook:
 *  - Sheet 1: Summary (total ingresos, egresos, utilidad)
 *  - Sheet 2: Detailed breakdown by account
 */
class IncomeStatementExport implements WithMultipleSheets
{
    public function __construct(private array $data) {}

    public function sheets(): array
    {
        return [
            new IncomeStatementSummarySheet($this->data),
            new IncomeStatementDetailSheet($this->data),
        ];
    }
}

// ─── Sheet 1: Summary ────────────────────────────────────────────────────────

class IncomeStatementSummarySheet implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private array $data) {}

    public function title(): string { return 'Resumen'; }

    public function collection(): Collection
    {
        $rows = collect([
            ['INGRESOS TOTALES', '', number_format($this->data['total_ingresos'], 2)],
            ['EGRESOS TOTALES',  '', number_format($this->data['total_egresos'], 2)],
            ['', '', ''],
        ]);

        $utilidad = $this->data['utilidad_neta'];
        $rows->push([
            $utilidad >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA',
            '',
            number_format(abs($utilidad), 2),
        ]);

        $rows->push(['', '', '']);
        $rows->push(['Período', $this->data['period']['from'] . ' — ' . $this->data['period']['to'], '']);
        $rows->push(['Fuente de datos', ucfirst($this->data['source']), '']);

        return $rows;
    }

    public function headings(): array
    {
        return ['Concepto', 'Detalle', 'Monto'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '16213E']],
            ],
            2 => ['font' => ['color' => ['rgb' => '166534']]],   // Revenue row — green
            3 => ['font' => ['color' => ['rgb' => '991B1B']]],   // Expense row — red
            5 => ['font' => ['bold' => true, 'size' => 12]],     // Net income/loss — bold
        ];
    }
}

// ─── Sheet 2: Detail ─────────────────────────────────────────────────────────

class IncomeStatementDetailSheet implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private array $data) {}

    public function title(): string { return 'Detalle por Cuenta'; }

    public function collection(): Collection
    {
        $rows = collect();

        $rows->push(['─── INGRESOS ───', '', '']);
        foreach ($this->data['ingresos'] as $row) {
            $rows->push([$row['code'], $row['name'], number_format($row['balance'], 2)]);
        }

        $rows->push(['', 'SUBTOTAL INGRESOS', number_format($this->data['total_ingresos'], 2)]);
        $rows->push(['', '', '']);

        $rows->push(['─── EGRESOS ───', '', '']);
        foreach ($this->data['egresos'] as $row) {
            $rows->push([$row['code'], $row['name'], number_format($row['balance'], 2)]);
        }
        $rows->push(['', 'SUBTOTAL EGRESOS', number_format($this->data['total_egresos'], 2)]);
        $rows->push(['', '', '']);

        $utilidad = $this->data['utilidad_neta'];
        $rows->push(['', $utilidad >= 0 ? 'UTILIDAD NETA' : 'PÉRDIDA NETA', number_format(abs($utilidad), 2)]);

        return $rows;
    }

    public function headings(): array
    {
        return ['Código', 'Cuenta / Concepto', 'Saldo'];
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
