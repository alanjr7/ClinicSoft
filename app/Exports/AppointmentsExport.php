<?php

namespace App\Exports;

use App\Models\Appointment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AppointmentsExport implements FromQuery, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private string  $tenantId,
        private ?string $from = null,
        private ?string $to   = null,
    ) {}

    public function title(): string
    {
        return 'Citas';
    }

    public function query()
    {
        return Appointment::query()
            ->where('tenant_id', $this->tenantId)
            ->with(['patient:id,first_name,last_name', 'dentist:id,first_name,last_name'])
            ->when($this->from, fn($q) => $q->where('start_at', '>=', $this->from))
            ->when($this->to,   fn($q) => $q->where('start_at', '<=', $this->to))
            ->orderBy('start_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Hora Inicio',
            'Hora Fin',
            'Paciente',
            'Médico / Especialista',
            'Estado',
            'Notas',
        ];
    }

    public function map($appt): array
    {
        $statusMap = [
            'scheduled'  => 'Programada',
            'confirmed'  => 'Confirmada',
            'in_progress'=> 'En curso',
            'completed'  => 'Completada',
            'cancelled'  => 'Cancelada',
            'no_show'    => 'No se presentó',
        ];

        return [
            $appt->start_at ? \Carbon\Carbon::parse($appt->start_at)->format('d/m/Y') : '',
            $appt->start_at ? \Carbon\Carbon::parse($appt->start_at)->format('H:i')   : '',
            $appt->end_at   ? \Carbon\Carbon::parse($appt->end_at)->format('H:i')     : '',
            $appt->patient  ? $appt->patient->first_name . ' ' . $appt->patient->last_name : '',
            $appt->dentist  ? $appt->dentist->first_name . ' ' . $appt->dentist->last_name : '',
            $statusMap[$appt->status] ?? ucfirst($appt->status),
            $appt->notes ?? '',
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
