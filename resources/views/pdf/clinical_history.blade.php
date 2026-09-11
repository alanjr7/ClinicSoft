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
    font-size: 9px;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.45;
    padding: 35px 45px;
  }

  .container {
    width: 100%;
  }

  /* ─── Encabezado Principal ─── */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 12px;
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
    font-size: 17px;
    font-weight: bold;
    color: #0f172a;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .clinic-subtitle {
    font-size: 8.5px;
    color: #0284c7;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 3px;
  }

  .clinic-meta {
    font-size: 8.5px;
    color: #475569;
    line-height: 1.35;
  }

  .doc-main-title {
    font-size: 17px;
    font-weight: bold;
    color: #0f172a;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .doc-sub {
    font-size: 8px;
    color: #64748b;
  }

  /* ─── Tarjeta del Paciente ─── */
  .patient-card {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0284c7;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .patient-card td {
    padding: 7px 10px;
    vertical-align: top;
  }

  .p-name {
    font-size: 11px;
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .card-label {
    font-size: 7px;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-value {
    font-size: 9px;
    color: #0f172a;
    margin-bottom: 3px;
  }

  /* ─── Alertas Médicas ─── */
  .alerts-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
  }

  .alert-cell {
    width: 50%;
    padding: 0 3px;
    vertical-align: top;
  }

  .alert-cell:first-child { padding-left: 0; }
  .alert-cell:last-child  { padding-right: 0; }

  .alert-box {
    border-radius: 3px;
    padding: 6px 9px;
    font-size: 8px;
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
    font-size: 7px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  /* ─── Consultas Médicas ─── */
  .section-heading {
    font-size: 9px;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid #cbd5e1;
  }

  .consultation-card {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    margin-bottom: 12px;
    background: #ffffff;
    page-break-inside: avoid;
  }

  .consultation-header {
    background: #f1f5f9;
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
  }

  .consultation-header table {
    width: 100%;
    border-collapse: collapse;
  }

  .consultation-body {
    padding: 8px 10px;
  }

  .vitals-grid {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    margin-bottom: 8px;
  }

  .vitals-grid td {
    padding: 4px 6px;
    text-align: center;
    border-right: 1px solid #e2e8f0;
    font-size: 8px;
  }

  .vitals-grid td:last-child {
    border-right: none;
  }

  .v-lbl {
    font-size: 6.5px;
    color: #64748b;
    font-weight: bold;
    text-transform: uppercase;
  }

  .v-val {
    font-size: 8.5px;
    font-weight: bold;
    color: #0f172a;
  }

  .field-block {
    margin-bottom: 6px;
  }

  .field-title {
    font-size: 7.5px;
    font-weight: bold;
    color: #0369a1;
    text-transform: uppercase;
    margin-bottom: 1px;
  }

  .field-text {
    font-size: 8.5px;
    color: #334155;
    line-height: 1.4;
  }

  /* ─── Pie de Página ─── */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 12px;
    font-size: 7px;
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
        <div class="clinic-subtitle">Expediente e Historial Clínico Integral</div>
        <div class="clinic-meta">
          @if($tenant->address){{ $tenant->address }}@endif
          @if($tenant->city), {{ $tenant->city }}@endif
          @if($tenant->phone) · Tel: {{ $tenant->phone }}@endif
          @if($tenant->email) · {{ $tenant->email }}@endif
        </div>
      </td>
      <td class="doc-col">
        <div class="doc-main-title">Expediente Clínico</div>
        <div class="doc-sub">Documento Médico Confidencial</div>
        <div class="doc-sub">Emisión: {{ now()->format('d/m/Y H:i') }}</div>
      </td>
    </tr>
  </table>

  {{-- ── 2. DATOS DEL PACIENTE ── --}}
  <table class="patient-card">
    <tr>
      <td style="width: 35%;">
        <div class="card-label">Nombre del Paciente</div>
        <div class="p-name">{{ $patient->first_name }} {{ $patient->last_name }}</div>
        <div class="card-label">CI / Documento de Identidad</div>
        <div class="card-value">{{ $patient->national_id ?? '—' }}</div>
      </td>
      <td style="width: 35%;">
        <div class="card-label">Fecha de Nacimiento / Edad</div>
        <div class="card-value">
          {{ $patient->date_of_birth ? $patient->date_of_birth->format('d/m/Y') : '—' }}
          @if($patient->date_of_birth)
            ({{ \Carbon\Carbon::parse($patient->date_of_birth)->age }} años)
          @endif
        </div>
        <div class="card-label">Grupo Sanguíneo</div>
        <div class="card-value" style="font-weight: bold; color: #b91c1c;">{{ $patient->blood_type ?? '—' }}</div>
      </td>
      <td style="width: 30%;">
        <div class="card-label">Teléfono de Contacto</div>
        <div class="card-value">{{ $patient->phone ?? '—' }}</div>
        <div class="card-label">Correo Electrónico</div>
        <div class="card-value">{{ $patient->email ?? '—' }}</div>
      </td>
    </tr>
  </table>

  {{-- ── 3. ALERTAS MÉDICAS ── --}}
  <table class="alerts-table">
    <tr>
      <td class="alert-cell">
        <div class="alert-box alert-allergy">
          <div class="alert-title">⚠ Alergias a Medicamentos / Sustancias</div>
          @forelse($patient->allergies as $a)
            <div>• <strong>{{ $a->allergen }}</strong>@if($a->severity) ({{ $a->severity }})@endif</div>
          @empty
            <div style="color: #64748b; font-style: italic;">Sin alergias registradas</div>
          @endforelse
        </div>
      </td>
      <td class="alert-cell">
        <div class="alert-box alert-condition">
          <div class="alert-title">🏥 Antecedentes Patológicos / Condiciones</div>
          @forelse($patient->medicalConditions as $c)
            <div>• <strong>{{ $c->condition_name }}</strong>@if($c->notes) — {{ $c->notes }}@endif</div>
          @empty
            <div style="color: #64748b; font-style: italic;">Sin condiciones registradas</div>
          @endforelse
        </div>
      </td>
    </tr>
  </table>

  {{-- ── 4. HISTORIAL DE CONSULTAS MÉDICAS ── --}}
  <div class="section-heading">Historial de Consultas y Evoluciones Médicas ({{ $records->count() }} consultas)</div>

  @forelse($records as $record)
    <div class="consultation-card">
      <div class="consultation-header">
        <table>
          <tr>
            <td style="font-weight: bold; color: #0f172a; font-size: 9.5px;">
              Consulta del {{ $record->visit_date ? \Carbon\Carbon::parse($record->visit_date)->format('d/m/Y') : '—' }}
            </td>
            <td style="text-align: right; color: #475569; font-size: 8.5px;">
              <strong>Médico:</strong>
              @if($record->dentist)
                Dr. {{ $record->dentist->first_name }} {{ $record->dentist->last_name }}
                @if($record->dentist->dentistProfile?->specialty)
                  ({{ $record->dentist->dentistProfile->specialty }})
                @endif
              @else
                Médico Tratante
              @endif
            </td>
          </tr>
        </table>
      </div>

      <div class="consultation-body">
        {{-- Signos Vitales --}}
        @if($record->blood_pressure || $record->heart_rate || $record->temperature || $record->weight || $record->bmi || $record->oxygen_saturation || $record->blood_glucose)
        <table class="vitals-grid">
          <tr>
            @if($record->blood_pressure)
            <td>
              <div class="v-lbl">P.A.</div>
              <div class="v-val">{{ $record->blood_pressure }} <span style="font-size:6px; font-weight:normal;">mmHg</span></div>
            </td>
            @endif
            @if($record->heart_rate)
            <td>
              <div class="v-lbl">F.C.</div>
              <div class="v-val">{{ $record->heart_rate }} <span style="font-size:6px; font-weight:normal;">bpm</span></div>
            </td>
            @endif
            @if($record->respiratory_rate)
            <td>
              <div class="v-lbl">F.R.</div>
              <div class="v-val">{{ $record->respiratory_rate }} <span style="font-size:6px; font-weight:normal;">rpm</span></div>
            </td>
            @endif
            @if($record->temperature)
            <td>
              <div class="v-lbl">Temp.</div>
              <div class="v-val">{{ $record->temperature }} <span style="font-size:6px; font-weight:normal;">°C</span></div>
            </td>
            @endif
            @if($record->weight)
            <td>
              <div class="v-lbl">Peso</div>
              <div class="v-val">{{ $record->weight }} <span style="font-size:6px; font-weight:normal;">kg</span></div>
            </td>
            @endif
            @if($record->height)
            <td>
              <div class="v-lbl">Talla</div>
              <div class="v-val">{{ $record->height }} <span style="font-size:6px; font-weight:normal;">cm</span></div>
            </td>
            @endif
            @if($record->bmi)
            <td>
              <div class="v-lbl">IMC</div>
              <div class="v-val">{{ $record->bmi }}</div>
            </td>
            @endif
            @if($record->oxygen_saturation)
            <td>
              <div class="v-lbl">Sat. O2</div>
              <div class="v-val">{{ $record->oxygen_saturation }} <span style="font-size:6px; font-weight:normal;">%</span></div>
            </td>
            @endif
            @if($record->blood_glucose)
            <td>
              <div class="v-lbl">Glucemia</div>
              <div class="v-val">{{ $record->blood_glucose }} <span style="font-size:6px; font-weight:normal;">mg/dL</span></div>
            </td>
            @endif
          </tr>
        </table>
        @endif

        {{-- Motivo y Antecedentes --}}
        @if($record->chief_complaint)
        <div class="field-block">
          <div class="field-title">Motivo de Consulta / Enfermedad Actual</div>
          <div class="field-text">{{ $record->chief_complaint }}</div>
        </div>
        @endif

        @if($record->medical_background)
        <div class="field-block">
          <div class="field-title">Antecedentes Clínicos Relevantes</div>
          <div class="field-text">{{ $record->medical_background }}</div>
        </div>
        @endif

        {{-- Examen Físico --}}
        @if($record->physical_examination)
        <div class="field-block">
          <div class="field-title">Examen Físico</div>
          <div class="field-text">{{ $record->physical_examination }}</div>
        </div>
        @endif

        {{-- Diagnóstico --}}
        @if($record->diagnosis)
        <div class="field-block">
          <div class="field-title" style="color: #1d4ed8;">Diagnóstico Clínico / CIE-10</div>
          <div class="field-text" style="font-weight: bold; color: #1e3a8a;">{{ $record->diagnosis }}</div>
        </div>
        @endif

        {{-- Procedimiento / Conducta --}}
        @if($record->treatment_performed)
        <div class="field-block">
          <div class="field-title">Procedimiento / Conducta Médica</div>
          <div class="field-text">{{ $record->treatment_performed }}</div>
        </div>
        @endif

        {{-- Prescripciones / Receta --}}
        @if(!empty($record->prescription_items) && is_array($record->prescription_items) && count($record->prescription_items) > 0)
        <div class="field-block">
          <div class="field-title">Plan Terapéutico y Farmacológico</div>
          @foreach($record->prescription_items as $item)
            <div style="font-size: 8px; color: #1e293b; margin-bottom: 2px;">
              • <strong>{{ $item['name'] ?? '' }}</strong> - {{ $item['dose'] ?? '' }} ({{ $item['frequency'] ?? '' }}) por {{ $item['duration'] ?? '' }}
              @if(!empty($item['instructions']))
                <span style="color: #64748b;">— {{ $item['instructions'] }}</span>
              @endif
            </div>
          @endforeach
        </div>
        @elseif($record->prescriptions)
        <div class="field-block">
          <div class="field-title">Plan Terapéutico y Farmacológico</div>
          <div class="field-text">{{ $record->prescriptions }}</div>
        </div>
        @endif

        {{-- Observaciones e Indicaciones --}}
        @if($record->observations || $record->next_visit_notes)
        <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 8px; color: #475569;">
          @if($record->observations)
            <span><strong>Indicaciones:</strong> {{ $record->observations }}</span>
          @endif
          @if($record->next_visit_notes)
            <span style="margin-left: 8px;"><strong>Próximo control:</strong> {{ $record->next_visit_notes }}</span>
          @endif
        </div>
        @endif

      </div>
    </div>
  @empty
    <div style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 4px;">
      No hay consultas médicas registradas para este paciente.
    </div>
  @endforelse

  {{-- ── 5. PIE DE PÁGINA ── --}}
  <div class="footer">
    {{ $tenant->name }} · Documento Médico Confidencial · Impreso el {{ now()->format('d/m/Y H:i') }} · ClinicasSoft
  </div>

</div>
</body>
</html>
