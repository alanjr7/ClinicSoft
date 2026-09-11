<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Receta Médica — {{ $patient->first_name }} {{ $patient->last_name }}</title>
<style>
  @page {
    size: letter portrait;
    margin: 0;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'DejaVu Sans', Arial, sans-serif;
    font-size: 10px;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.5;
    padding: 40px 50px;
  }

  .container {
    width: 100%;
    min-height: 900px;
    position: relative;
  }

  /* Encabezado */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2.5px solid #0284c7;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }

  .clinic-col {
    width: 60%;
    vertical-align: top;
  }

  .doc-col {
    width: 40%;
    vertical-align: top;
    text-align: right;
  }

  .clinic-title {
    font-size: 18px;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .clinic-subtitle {
    font-size: 9px;
    color: #0284c7;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .clinic-meta {
    font-size: 8.5px;
    color: #475569;
    line-height: 1.4;
  }

  .doc-main-title {
    font-size: 18px;
    font-weight: bold;
    color: #0284c7;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .doc-sub {
    font-size: 8.5px;
    color: #64748b;
  }

  /* Tarjeta Paciente & Signos */
  .patient-card {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0284c7;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .patient-card td {
    padding: 8px 12px;
    vertical-align: top;
  }

  .card-label {
    font-size: 7.5px;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .card-value {
    font-size: 9.5px;
    color: #0f172a;
    font-weight: 500;
  }

  .p-name {
    font-size: 12px;
    font-weight: bold;
    color: #0f172a;
  }

  /* Signos Vitales Bar */
  .vitals-bar {
    width: 100%;
    border-collapse: collapse;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    margin-bottom: 20px;
  }

  .vitals-bar td {
    padding: 6px 8px;
    text-align: center;
    border-right: 1px solid #e2e8f0;
    font-size: 8.5px;
  }

  .vitals-bar td:last-child {
    border-right: none;
  }

  .vitals-label {
    font-size: 7px;
    color: #64748b;
    text-transform: uppercase;
    font-weight: bold;
  }

  .vitals-val {
    font-size: 9.5px;
    font-weight: bold;
    color: #0f172a;
  }

  /* Diagnostico */
  .dx-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-left: 3px solid #3b82f6;
    padding: 8px 12px;
    margin-bottom: 20px;
    border-radius: 3px;
  }

  .dx-title {
    font-size: 8px;
    font-weight: bold;
    color: #1d4ed8;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .dx-content {
    font-size: 10px;
    color: #1e3a8a;
    font-weight: 600;
  }

  /* Prescripción Médica */
  .rx-header {
    font-size: 14px;
    font-weight: bold;
    color: #0284c7;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 4px;
  }

  .rx-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .rx-table th {
    background: #0f172a;
    color: #ffffff;
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    padding: 7px 10px;
    text-align: left;
  }

  .rx-table td {
    padding: 9px 10px;
    font-size: 9.5px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: top;
  }

  .rx-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .med-name {
    font-size: 10.5px;
    font-weight: bold;
    color: #0f172a;
  }

  .med-inst {
    font-size: 8.5px;
    color: #475569;
    margin-top: 2px;
  }

  .notes-box {
    background: #fdf4ff;
    border: 1px solid #f0abfc;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 30px;
    font-size: 9px;
    color: #701a75;
  }

  /* Firma */
  .signature-area {
    margin-top: 50px;
    width: 100%;
  }

  .sig-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sig-col {
    width: 50%;
    vertical-align: top;
    text-align: center;
  }

  .sig-line {
    width: 200px;
    border-top: 1px solid #0f172a;
    margin: 0 auto 6px auto;
  }

  .sig-doc-name {
    font-size: 10px;
    font-weight: bold;
    color: #0f172a;
  }

  .sig-doc-sub {
    font-size: 8px;
    color: #64748b;
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    font-size: 7.5px;
    color: #94a3b8;
    text-align: center;
  }
</style>
</head>
<body>
<div class="container">

  {{-- Encabezado --}}
  <table class="header-table">
    <tr>
      <td class="clinic-col">
        <div class="clinic-title">{{ $tenant->name }}</div>
        <div class="clinic-subtitle">Centro de Atención Médica Integral</div>
        <div class="clinic-meta">
          @if($tenant->address){{ $tenant->address }}@endif
          @if($tenant->city), {{ $tenant->city }}@endif
          @if($tenant->phone) · Tel: {{ $tenant->phone }}@endif
          @if($tenant->email) · {{ $tenant->email }}@endif
        </div>
      </td>
      <td class="doc-col">
        <div class="doc-main-title">Receta Médica</div>
        <div class="doc-sub">Folio: #{{ substr($record->id, 0, 8) }}</div>
        <div class="doc-sub">Fecha: {{ $record->visit_date ? \Carbon\Carbon::parse($record->visit_date)->format('d/m/Y') : now()->format('d/m/Y') }}</div>
      </td>
    </tr>
  </table>

  {{-- Datos del Paciente --}}
  <table class="patient-card">
    <tr>
      <td style="width: 40%;">
        <div class="card-label">Paciente</div>
        <div class="p-name">{{ $patient->first_name }} {{ $patient->last_name }}</div>
        <div class="card-label" style="margin-top: 3px;">CI / Documento</div>
        <div class="card-value">{{ $patient->national_id ?? '—' }}</div>
      </td>
      <td style="width: 30%;">
        <div class="card-label">Fecha de Nacimiento / Edad</div>
        <div class="card-value">
          {{ $patient->date_of_birth ? $patient->date_of_birth->format('d/m/Y') : '—' }}
          @if($patient->date_of_birth)
            ({{ \Carbon\Carbon::parse($patient->date_of_birth)->age }} años)
          @endif
        </div>
        <div class="card-label" style="margin-top: 3px;">Grupo Sanguíneo</div>
        <div class="card-value" style="color: #b91c1c; font-weight: bold;">{{ $patient->blood_type ?? '—' }}</div>
      </td>
      <td style="width: 30%;">
        <div class="card-label">Médico Tratante</div>
        <div class="card-value">
          @if($record->dentist)
            Dr. {{ $record->dentist->first_name }} {{ $record->dentist->last_name }}
          @else
            Médico de Turno
          @endif
        </div>
        <div class="card-label" style="margin-top: 3px;">Especialidad</div>
        <div class="card-value">
          {{ $record->dentist?->doctorProfile?->specialty ?? $record->dentist?->dentistProfile?->specialty ?? 'Medicina General' }}
        </div>
      </td>
    </tr>
  </table>

  {{-- Signos Vitales (si existen) --}}
  @if($record->blood_pressure || $record->heart_rate || $record->temperature || $record->weight || $record->bmi || $record->oxygen_saturation)
  <table class="vitals-bar">
    <tr>
      @if($record->blood_pressure)
      <td>
        <div class="vitals-label">P. Arterial</div>
        <div class="vitals-val">{{ $record->blood_pressure }} <span style="font-size:7px; font-weight:normal;">mmHg</span></div>
      </td>
      @endif
      @if($record->heart_rate)
      <td>
        <div class="vitals-label">Frec. Cardíaca</div>
        <div class="vitals-val">{{ $record->heart_rate }} <span style="font-size:7px; font-weight:normal;">bpm</span></div>
      </td>
      @endif
      @if($record->temperature)
      <td>
        <div class="vitals-label">Temperatura</div>
        <div class="vitals-val">{{ $record->temperature }} <span style="font-size:7px; font-weight:normal;">°C</span></div>
      </td>
      @endif
      @if($record->weight)
      <td>
        <div class="vitals-label">Peso</div>
        <div class="vitals-val">{{ $record->weight }} <span style="font-size:7px; font-weight:normal;">kg</span></div>
      </td>
      @endif
      @if($record->height)
      <td>
        <div class="vitals-label">Talla</div>
        <div class="vitals-val">{{ $record->height }} <span style="font-size:7px; font-weight:normal;">cm</span></div>
      </td>
      @endif
      @if($record->bmi)
      <td>
        <div class="vitals-label">IMC</div>
        <div class="vitals-val">{{ $record->bmi }}</div>
      </td>
      @endif
      @if($record->oxygen_saturation)
      <td>
        <div class="vitals-label">Sat. O2</div>
        <div class="vitals-val">{{ $record->oxygen_saturation }} <span style="font-size:7px; font-weight:normal;">%</span></div>
      </td>
      @endif
    </tr>
  </table>
  @endif

  {{-- Diagnóstico --}}
  @if($record->diagnosis)
  <div class="dx-box">
    <div class="dx-title">Diagnóstico Clínico</div>
    <div class="dx-content">{{ $record->diagnosis }}</div>
  </div>
  @endif

  {{-- Tabla de Prescripciones --}}
  <div class="rx-header">Rp. / Prescripción Médica</div>

  @if(!empty($record->prescription_items) && is_array($record->prescription_items) && count($record->prescription_items) > 0)
  <table class="rx-table">
    <thead>
      <tr>
        <th style="width: 35%;">Medicamento / Presentación</th>
        <th style="width: 20%;">Dosis / Vía</th>
        <th style="width: 20%;">Frecuencia</th>
        <th style="width: 25%;">Duración e Indicaciones</th>
      </tr>
    </thead>
    <tbody>
      @foreach($record->prescription_items as $item)
      <tr>
        <td>
          <div class="med-name">{{ $item['name'] ?? 'Medicamento' }}</div>
          @if(!empty($item['presentation']))
            <div class="med-inst">{{ $item['presentation'] }}</div>
          @endif
        </td>
        <td>{{ $item['dose'] ?? 'Según indicación' }}</td>
        <td>{{ $item['frequency'] ?? '—' }}</td>
        <td>
          <strong>{{ $item['duration'] ?? '—' }}</strong>
          @if(!empty($item['instructions']))
            <div class="med-inst">{{ $item['instructions'] }}</div>
          @endif
        </td>
      </tr>
      @endforeach
    </tbody>
  </table>
  @elseif($record->prescriptions)
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 4px; margin-bottom: 20px; white-space: pre-line; font-size: 10px;">
    {{ $record->prescriptions }}
  </div>
  @else
  <div style="color: #64748b; font-style: italic; margin-bottom: 20px;">
    No se registraron medicamentos en esta consulta.
  </div>
  @endif

  {{-- Indicaciones Generales y Próxima Cita --}}
  @if($record->observations || $record->next_visit_notes)
  <div class="notes-box">
    @if($record->observations)
      <div><strong>Indicaciones generales / Cuidados:</strong> {{ $record->observations }}</div>
    @endif
    @if($record->next_visit_notes)
      <div style="margin-top: 4px;"><strong>Próximo control médico:</strong> {{ $record->next_visit_notes }}</div>
    @endif
  </div>
  @endif

  {{-- Firma y Sello --}}
  <div class="signature-area">
    <table class="sig-table">
      <tr>
        <td class="sig-col"></td>
        <td class="sig-col">
          <div class="sig-line"></div>
          <div class="sig-doc-name">
            @if($record->dentist)
              Dr. {{ $record->dentist->first_name }} {{ $record->dentist->last_name }}
            @else
              Médico Tratante
            @endif
          </div>
          <div class="sig-doc-sub">
            {{ $record->dentist?->doctorProfile?->specialty ?? $record->dentist?->dentistProfile?->specialty ?? 'Médico Cirujano' }}
            @if($record->dentist?->doctorProfile?->license_number || $record->dentist?->dentistProfile?->license_number)
              · Mat. Prof: {{ $record->dentist?->doctorProfile?->license_number ?? $record->dentist?->dentistProfile?->license_number }}
            @endif
          </div>
        </td>
      </tr>
    </table>
  </div>

  {{-- Pie de página --}}
  <div class="footer">
    {{ $tenant->name }} · Receta Médica Oficial · Impreso el {{ now()->format('d/m/Y H:i') }} · ClinicasSoft
  </div>

</div>
</body>
</html>
