<?php

namespace App\Exports;

use App\Models\Patient;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PatientsExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private string $tenantId) {}

    public function title(): string
    {
        return 'Pacientes';
    }

    public function query()
    {
        return Patient::query()
            ->where('tenant_id', $this->tenantId)
            ->where('is_active', true)
            ->orderBy('last_name');
    }

    public function headings(): array
    {
        return [
            'Apellido',
            'Nombre',
            'CI / Documento',
            'Fecha de Nacimiento',
            'Género',
            'Grupo Sanguíneo',
            'Teléfono',
            'Email',
            'Ciudad',
            'Dirección',
            'Notas',
            'Fecha de Registro',
        ];
    }

    public function map($patient): array
    {
        return [
            $patient->last_name,
            $patient->first_name,
            $patient->national_id ?? '',
            $patient->date_of_birth ? $patient->date_of_birth->format('d/m/Y') : '',
            $patient->gender ? ucfirst($patient->gender) : '',
            $patient->blood_type ?? '',
            $patient->phone ?? '',
            $patient->email ?? '',
            $patient->city ?? '',
            $patient->address ?? '',
            $patient->notes ?? '',
            $patient->created_at->format('d/m/Y'),
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
