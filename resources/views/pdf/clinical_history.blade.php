<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Historia Clínica — {{ $patient->first_name }} {{ $patient->last_name }}</title>
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
    font-size: 9.5px;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    padding: 40px 50px;
  }

  .container {
    width: 100%;
  }

  /* ─── Encabezado Principal ─── */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 14px;
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
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .clinic-subtitle {
    font-size: 9px;
    color: #0d9488;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .clinic-meta {
    font-size: 9px;
    color: #475569;
    line-height: 1.4;
  }

  .doc-main-title {
    font-size: 18px;
    font-weight: bold;
    color: #0f172a;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .doc-sub {
    font-size: 8.5px;
    color: #64748b;
  }

  /* ─── Tarjeta del Paciente ─── */
  .patient-card {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0d9488;
    border-radius: 4px;
    margin-bottom: 12px;
  }

  .patient-card td {
    padding: 8px 12px;
    vertical-align: top;
  }

  .p-name {
    font-size: 12px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 4px;
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
    margin-bottom: 4px;
  }

  /* ─── Alertas Médicas ─── */
  .alerts-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }

  .alert-cell {
    width: 50%;
    padding: 0 4px;
    vertical-align: top;
  }

  .alert-cell:first-child { padding-left: 0; }
  .alert-cell:last-child  { padding-right: 0; }

  .alert-box {
    border-radius: 3px;
    padding: 7px 10px;
    font-size: 8.5px;
  }

  .alert-allergy {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-left: 3px solid #ea580c;
    color: #9a3412;
  }

  .alert-condition {
    background: #fefce8;
    border: 1px solid #fef08a;
    border-left: 3px solid #ca8a04;
    color: #854d0e;
  }

  .alert-title {
    font-size: 7.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  /* ─── Tabla de Registros ─── */
  .section-heading {
    font-size: 9px;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    padding-bottom: 2px;
    border-bottom: 1px solid #cbd5e1;
  }

  .records-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }

  .records-table th {
    background: #0f172a;
    color: #ffffff;
    font-size: 7.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 8px;
    text-align: left;
  }

  .records-table td {
    padding: 7px 8px;
    font-size: 9px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }

  .records-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .field-lbl {
    font-size: 7px;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    margin-top: 3px;
    margin-bottom: 1px;
  }

  /* ─── Pie de Página ─── */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 12px;
    font-size: 7.5px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.4;
  }
</style>
</head>
<body>
<div class="container">

  {{-- ── 1. ENCABEZADO ── --}}
  <table class="header-table">
    <tr>
      <td class="clinic-col">
        <div class="clinic-title">{{ $tenant->name }}</div>
        <div class="clinic-subtitle">Historial Clínico Odontológico</div>
        <div class="clinic-meta">
          @if($tenant->address){{ $tenant->address }}@endif
          @if($tenant->city), {{ $tenant->city }}@endif
          @if($tenant->phone) · Tel: {{ $tenant->phone }}@endif
        </div>
      </td>
      <td class="doc-col">
        <div class="doc-main-title">Expediente Clínico</div>
        <div class="doc-sub">Documento Médico Confidencial</div>
        <div class="doc-sub">Fecha: {{ now()->format('d/m/Y H:i') }}</div>
      </td>
    </tr>
  </table>

  {{-- ── 2. DATOS DEL PACIENTE ── --}}
  <table class="patient-card">
    <tr>
      <td style="width: 35%;">
        <div class="card-label">Nombre del Paciente</div>
        <div class="p-name">{{ $patient->first_name }} {{ $patient->last_name }}</div>
        <div class="card-label">CI / Documento</div>
        <div class="card-value">{{ $patient->national_id ?? '—' }}</div>
      </td>
      <td style="width: 35%;">
        <div class="card-label">Fecha de Nacimiento</div>
        <div class="card-value">{{ $patient->date_of_birth ? $patient->date_of_birth->format('d/m/Y') : '—' }}</div>
        <div class="card-label">Grupo Sanguíneo</div>
        <div class="card-value" style="font-weight: bold; color: #b91c1c;">{{ $patient->blood_type ?? '—' }}</div>
      </td>
      <td style="width: 30%;">
        <div class="card-label">Teléfono</div>
        <div class="card-value">{{ $patient->phone ?? '—' }}</div>
        <div class="card-label">Email</div>
        <div class="card-value">{{ $patient->email ?? '—' }}</div>
      </td>
    </tr>
  </table>

  {{-- ── 3. ALERTAS MÉDICAS ── --}}
  <table class="alerts-table">
    <tr>
      <td class="alert-cell">
        <div class="alert-box alert-allergy">
          <div class="alert-title">⚠ Alergias Registradas</div>
          @forelse($patient->allergies as $a)
            <div>• <strong>{{ $a->allergen }}</strong>@if($a->severity) ({{ $a->severity }})@endif</div>
          @empty
            <div style="color: #64748b; font-style: italic;">Sin alergias registradas</div>
          @endforelse
        </div>
      </td>
      <td class="alert-cell">
        <div class="alert-box alert-condition">
          <div class="alert-title">🏥 Antecedentes y Condiciones</div>
          @forelse($patient->medicalConditions as $c)
            <div>• <strong>{{ $c->condition_name }}</strong>@if($c->notes) — {{ $c->notes }}@endif</div>
          @empty
            <div style="color: #64748b; font-style: italic;">Sin condiciones registradas</div>
          @endforelse
        </div>
      </td>
    </tr>
  </table>

  {{-- ── 4. HISTORIAL DE VISITAS ── --}}
  <div class="section-heading">Historial de Evoluciones Clínicas ({{ $records->count() }} visitas)</div>
  <table class="records-table">
    <thead>
      <tr>
        <th style="width: 12%;">Fecha</th>
        <th style="width: 18%;">Profesional</th>
        <th style="width: 25%;">Motivo / Diagnóstico</th>
        <th style="width: 25%;">Tratamiento Realizado</th>
        <th style="width: 20%;">Prescripciones / Plan</th>
      </tr>
    </thead>
    <tbody>
      @forelse($records as $record)
      <tr>
        <td>
          <strong style="color: #0f172a;">{{ $record->visit_date ? \Carbon\Carbon::parse($record->visit_date)->format('d/m/Y') : '—' }}</strong>
        </td>
        <td>
          @if($record->dentist)
            Dr. {{ $record->dentist->first_name }} {{ $record->dentist->last_name }}
          @else
            —
          @endif
        </td>
        <td>
          @if($record->chief_complaint)
            <div class="field-lbl">Motivo</div>
            <div>{{ $record->chief_complaint }}</div>
          @endif
          @if($record->diagnosis)
            <div class="field-lbl">Diagnóstico</div>
            <div>{{ $record->diagnosis }}</div>
          @endif
          @if(!$record->chief_complaint && !$record->diagnosis)—@endif
        </td>
        <td>{{ $record->treatment_performed ?? '—' }}</td>
        <td>
          @if($record->prescriptions)
            <div class="field-lbl">Receta</div>
            <div>{{ $record->prescriptions }}</div>
          @endif
          @if($record->next_visit_notes)
            <div class="field-lbl">Próxima Visita</div>
            <div>{{ $record->next_visit_notes }}</div>
          @endif
          @if(!$record->prescriptions && !$record->next_visit_notes)—@endif
        </td>
      </tr>
      @empty
      <tr>
        <td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic; padding: 14px;">
          No hay registros clínicos archivados.
        </td>
      </tr>
      @endforelse
    </tbody>
  </table>

  {{-- ── 5. PIE DE PÁGINA ── --}}
  <div class="footer">
    {{ $tenant->name }} · Documento Médico Confidencial · Impreso el {{ now()->format('d/m/Y H:i') }} · Sistema DentalSoft
  </div>

</div>
</body>
</html>
