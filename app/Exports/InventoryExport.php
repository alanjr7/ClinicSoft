<?php

namespace App\Exports;

use App\Models\InventoryItem;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithConditionalSheetStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private string $tenantId) {}

    public function title(): string
    {
        return 'Inventario';
    }

    public function query()
    {
        return InventoryItem::query()
            ->where('tenant_id', $this->tenantId)
            ->where('is_active', true)
            ->with('category:id,name')
            ->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'SKU',
            'Nombre',
            'Categoría',
            'Unidad',
            'Stock Actual',
            'Stock Mínimo',
            '¿Bajo Stock?',
            'Costo Unitario',
            'Valor Total Stock',
        ];
    }

    public function map($item): array
    {
        $isBelowMin = $item->current_stock <= $item->min_stock_level;

        return [
            $item->sku ?? '',
            $item->name,
            $item->category ? $item->category->name : '',
            $item->unit ?? '',
            $item->current_stock,
            $item->min_stock_level,
            $isBelowMin ? 'SÍ ⚠' : 'No',
            $item->unit_cost ? number_format($item->unit_cost, 2) : '—',
            $item->unit_cost ? number_format($item->unit_cost * $item->current_stock, 2) : '—',
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
