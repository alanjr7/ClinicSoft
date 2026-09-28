<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Presupuesto {{ $budget->budget_number }}</title>
    <style>
        @page {
            size: letter portrait;
            margin: 0;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: "DejaVu Sans", Arial, sans-serif;
            font-size: 10px;
            line-height: 1.5;
            color: #243238;
            background: #ffffff;
            margin: 0;
            padding: 40px 50px 40px 50px;
        }

        .document {
            width: 100%;
        }

        /* ─── Encabezado ─── */
        .header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .header-left {
            width: 60%;
            vertical-align: middle;
        }

        .header-right {
            width: 40%;
            text-align: right;
            vertical-align: middle;
        }

        .clinic-name {
            font-size: 18px;
            font-weight: bold;
            color: #167d72;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
        }

        .clinic-subtitle {
            font-size: 8.5px;
            color: #718087;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .document-type {
            font-size: 19px;
            font-weight: bold;
            color: #26363c;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .document-number {
            display: inline-block;
            border: 1.5px solid #167d72;
            color: #167d72;
            padding: 4px 12px;
            font-size: 9.5px;
            font-weight: bold;
            background: #f0fdfa;
            border-radius: 3px;
        }

        .top-line {
            height: 2.5px;
            background: #167d72;
            margin-bottom: 16px;
        }

        /* ─── Información General ─── */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .info-table td {
            width: 50%;
            vertical-align: top;
        }

        .info-left {
            padding-right: 14px;
        }

        .info-right {
            padding-left: 14px;
        }

        .section-title {
            font-size: 8.5px;
            font-weight: bold;
            color: #167d72;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px solid #cfd9d8;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        .info-row {
            margin-bottom: 3px;
            color: #4c5b60;
            font-size: 9.5px;
        }

        .info-label {
            font-weight: bold;
            color: #26363c;
        }

        .info-date {
            margin-top: 6px;
            display: inline-block;
            background: #eef7f5;
            border-left: 3px solid #167d72;
            padding: 4px 8px;
            font-size: 8.5px;
            color: #365058;
            border-radius: 2px;
        }

        /* ─── Tabla de Tratamientos ─── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 14px;
        }

        .items-table th {
            background: #167d72;
            color: #ffffff;
            padding: 8px 10px;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
        }

        .items-table th.center { text-align: center; }
        .items-table th.right  { text-align: right; }

        .items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #dce4e3;
            color: #344348;
            font-size: 9.5px;
            vertical-align: middle;
        }

        .items-table tr:nth-child(even) td {
            background: #f8fbfa;
        }

        .items-table td.center { text-align: center; }
        .items-table td.right  { text-align: right; }

        .treatment-name {
            font-weight: bold;
            color: #26363c;
        }

        /* ─── Totales ─── */
        .totals-container {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }

        .totals-empty {
            width: 55%;
        }

        .totals-column {
            width: 45%;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dce4e3;
        }

        .totals-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #dce4e3;
            font-size: 9.5px;
        }

        .total-label {
            color: #66767a;
            text-align: left;
            background: #fafcfb;
        }

        .total-value {
            color: #26363c;
            text-align: right;
            font-weight: bold;
        }

        .grand-total td {
            background: #167d72;
            color: #ffffff;
            border-bottom: none;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: bold;
        }

        /* ─── Observaciones ─── */
        .notes {
            border: 1px solid #d5dfde;
            border-left: 3.5px solid #167d72;
            padding: 9px 12px;
            margin-bottom: 20px;
            background: #fbfcfc;
            border-radius: 3px;
        }

        .notes-title {
            color: #167d72;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 4px;
        }

        .notes-content {
            font-size: 8.5px;
            color: #5b6a6f;
            line-height: 1.5;
        }

        /* ─── Firmas ─── */
        .signatures {
            width: 100%;
            border-collapse: collapse;
            margin-top: 22px;
            margin-bottom: 18px;
        }

        .signature {
            width: 44%;
            text-align: center;
            vertical-align: bottom;
        }

        .signature-space {
            width: 12%;
        }

        .signature-line {
            border-top: 1px solid #7b898d;
            margin-bottom: 4px;
        }

        .signature-name {
            font-size: 8.5px;
            font-weight: bold;
            color: #354449;
            text-transform: uppercase;
        }

        .signature-description {
            font-size: 7.5px;
            color: #839095;
            margin-top: 2px;
        }

        /* ─── Pie de Página ─── */
        .footer-line {
            border-top: 1px solid #d8e0df;
            margin-bottom: 6px;
        }

        .footer {
            text-align: center;
            color: #7b888c;
            font-size: 7.5px;
        }

        .footer strong {
            color: #167d72;
        }
    </style>
</head>

<body>
<div class="document">

    {{-- ENCABEZADO --}}
    <table class="header">
        <tr>
            <td class="header-left">
                <div class="clinic-name">{{ $tenant->name }}</div>
                <div class="clinic-subtitle">Servicios Odontológicos Especializados</div>
            </td>
            <td class="header-right">
                <div class="document-type">Presupuesto</div>
                <div class="document-number">N.º {{ $budget->budget_number }}</div>
            </td>
        </tr>
    </table>

    <div class="top-line"></div>

    {{-- INFORMACIÓN DEL PACIENTE Y CLÍNICA --}}
    <table class="info-table">
        <tr>
            {{-- PACIENTE --}}
            <td class="info-left">
                <div class="section-title">Datos del Paciente</div>
                <div class="info-row">
                    <span class="info-label">Paciente:</span>
                    @if($budget->patient)
                        {{ $budget->patient->first_name }} {{ $budget->patient->last_name }}
                    @else
                        Paciente Nuevo
                    @endif
                </div>

                @if($budget->patient && $budget->patient->national_id)
                    <div class="info-row">
                        <span class="info-label">CI / Documento:</span> {{ $budget->patient->national_id }}
                    </div>
                @endif

                @if($budget->patient && $budget->patient->phone)
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span> {{ $budget->patient->phone }}
                    </div>
                @endif

                @if($budget->patient && $budget->patient->email)
                    <div class="info-row">
                        <span class="info-label">Correo:</span> {{ $budget->patient->email }}
                    </div>
                @endif

                <div class="info-date">
                    <strong>Fecha de emisión:</strong> {{ $budget->created_at->format('d/m/Y') }}
                </div>
            </td>

            {{-- CLÍNICA --}}
            <td class="info-right">
                <div class="section-title">Información de la Clínica</div>
                <div class="info-row">
                    <span class="info-label">Clínica:</span> {{ $tenant->name }}
                </div>

                @if($tenant->address)
                    <div class="info-row">
                        <span class="info-label">Dirección:</span> {{ $tenant->address }}@if($tenant->city), {{ $tenant->city }}@endif
                    </div>
                @endif

                @if($tenant->phone)
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span> {{ $tenant->phone }}
                    </div>
                @endif

                @if($tenant->email)
                    <div class="info-row">
                        <span class="info-label">Correo:</span> {{ $tenant->email }}
                    </div>
                @endif

                @if($budget->valid_until)
                    <div class="info-date">
                        <strong>Válido hasta:</strong> {{ $budget->valid_until->format('d/m/Y') }}
                    </div>
                @endif
            </td>
        </tr>
    </table>

    {{-- TRATAMIENTOS --}}
    <div class="section-title">Detalle del Plan de Tratamiento</div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 52%;">Descripción / Tratamiento</th>
                <th style="width: 12%;" class="center">Cant.</th>
                <th style="width: 18%;" class="right">Precio Unit.</th>
                <th style="width: 18%;" class="right">Importe</th>
            </tr>
        </thead>
        <tbody>
            @forelse($budget->items as $item)
                <tr>
                    <td>
                        <span class="treatment-name">
                            @if($item->treatment)
                                {{ $item->treatment->name }}
                            @else
                                {{ $item->description ?: 'Tratamiento Dental' }}
                            @endif
                        </span>
                    </td>
                    <td class="center">{{ $item->quantity }}</td>
                    <td class="right">Bs. {{ number_format($item->unit_price, 2) }}</td>
                    <td class="right"><strong>Bs. {{ number_format($item->total, 2) }}</strong></td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align: center; color: #849195; padding: 16px;">
                        No existen tratamientos registrados.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- TOTALES --}}
    <table class="totals-container">
        <tr>
            <td class="totals-empty"></td>
            <td class="totals-column">
                <table class="totals-table">
                    <tr>
                        <td class="total-label">Subtotal</td>
                        <td class="total-value">Bs. {{ number_format($budget->subtotal, 2) }}</td>
                    </tr>
                    @if($budget->discount_amount > 0)
                        <tr>
                            <td class="total-label">Descuento</td>
                            <td class="total-value">- Bs. {{ number_format($budget->discount_amount, 2) }}</td>
                        </tr>
                    @endif
                    @if($budget->tax_rate > 0)
                        <tr>
                            <td class="total-label">IVA ({{ round($budget->tax_rate * 100, 0) }}%)</td>
                            <td class="total-value">Bs. {{ number_format($budget->tax_amount, 2) }}</td>
                        </tr>
                    @endif
                    <tr class="grand-total">
                        <td>TOTAL</td>
                        <td style="text-align: right;">Bs. {{ number_format($budget->total, 2) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- OBSERVACIONES --}}
    <div class="notes">
        <div class="notes-title">Observaciones y Condiciones</div>
        <div class="notes-content">
            @if($budget->notes)
                {{ $budget->notes }}<br><br>
            @endif
            • Este presupuesto ha sido elaborado de acuerdo con la evaluación y el plan de tratamiento propuesto para el paciente.<br>
            • Los valores indicados corresponden a las tarifas vigentes al momento de la emisión.
            @if($budget->valid_until)
                El presente presupuesto tiene validez hasta el {{ $budget->valid_until->format('d/m/Y') }}.
            @else
                El presente presupuesto tiene una validez de 30 días.
            @endif
            <br>
            • El diagnóstico, procedimiento y plan de tratamiento podrán requerir modificaciones de acuerdo con la evolución clínica del paciente.
        </div>
    </div>

    {{-- FIRMAS --}}
    <table class="signatures">
        <tr>
            <td class="signature">
                <div style="height: 32px;"></div>
                <div class="signature-line"></div>
                <div class="signature-name">Conformidad del Paciente</div>
                <div class="signature-description">Firma y aclaración</div>
            </td>
            <td class="signature-space"></td>
            <td class="signature">
                <div style="height: 32px;"></div>
                <div class="signature-line"></div>
                <div class="signature-name">Responsable Odontológico</div>
                <div class="signature-description">Firma y sello profesional</div>
            </td>
        </tr>
    </table>

    {{-- PIE DE PÁGINA --}}
    <div class="footer-line"></div>
    <div class="footer">
        <strong>{{ $tenant->name }}</strong>
        @if($tenant->phone)
            &nbsp; | &nbsp; Teléfono: {{ $tenant->phone }}
        @endif
        @if($tenant->email)
            &nbsp; | &nbsp; {{ $tenant->email }}
        @endif
    </div>

</div>
</body>
</html>
