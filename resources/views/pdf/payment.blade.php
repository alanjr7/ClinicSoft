<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Recibo de Pago {{ strtoupper(substr($payment->id, 0, 8)) }}</title>
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
    border-bottom: 2.5px solid #167d72;
    padding-bottom: 12px;
    margin-bottom: 14px;
  }

  .clinic-col {
    width: 58%;
    vertical-align: top;
  }

  .doc-col {
    width: 42%;
    vertical-align: top;
    text-align: right;
  }

  .clinic-title {
    font-size: 18px;
    font-weight: bold;
    color: #167d72;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .clinic-subtitle {
    font-size: 9px;
    color: #718087;
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
    font-size: 20px;
    font-weight: bold;
    color: #26363c;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .doc-folio {
    font-size: 12px;
    font-weight: bold;
    color: #167d72;
    margin-bottom: 4px;
  }

  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 8.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  /* ─── Tarjeta de Datos ─── */
  .info-card {
    width: 100%;
    border-collapse: collapse;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #167d72;
    border-radius: 4px;
    margin-bottom: 14px;
  }

  .info-card td {
    padding: 10px 12px;
    vertical-align: top;
  }

  .card-label {
    font-size: 7.5px;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 2px;
  }

  .card-value {
    font-size: 10px;
    color: #0f172a;
  }

  .card-value-bold {
    font-size: 11px;
    color: #0f172a;
    font-weight: bold;
  }

  /* ─── Tabla de Ítems ─── */
  .section-heading {
    font-size: 9px;
    font-weight: bold;
    color: #167d72;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
    padding-bottom: 2px;
    border-bottom: 1px solid #cbd5e1;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }

  .items-table th {
    background: #167d72;
    color: #ffffff;
    font-size: 8px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    padding: 7px 10px;
    text-align: left;
  }

  .items-table th.right { text-align: right; }

  .items-table td {
    padding: 8px 10px;
    font-size: 9.5px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: middle;
  }

  .items-table td.right { text-align: right; }

  .items-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .total-card {
    width: 100%;
    border-collapse: collapse;
    background: #F0F9FF;
    border: 1.5px solid #167d72;
    border-radius: 4px;
    margin-bottom: 14px;
  }

  .total-card td {
    padding: 9px 14px;
  }

  .total-card .lbl {
    font-size: 11px;
    font-weight: bold;
    color: #167d72;
    text-transform: uppercase;
  }

  .total-card .val {
    font-size: 15px;
    font-weight: bold;
    color: #167d72;
    text-align: right;
  }

  /* ─── Observaciones ─── */
  .notes-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #167d72;
    padding: 8px 10px;
    font-size: 8.5px;
    color: #334155;
    border-radius: 3px;
    margin-bottom: 14px;
  }

  .notes-box strong {
    color: #167d72;
    display: block;
    margin-bottom: 2px;
    text-transform: uppercase;
    font-size: 7.5px;
    letter-spacing: 0.5px;
  }

  /* ─── Firmas ─── */
  .signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    margin-bottom: 12px;
  }

  .sig-col {
    width: 45%;
    text-align: center;
    vertical-align: bottom;
    padding: 0 10px;
  }

  .sig-spacer {
    width: 10%;
  }

  .sig-line {
    border-top: 1px solid #7b898d;
    margin-top: 36px;
    margin-bottom: 4px;
  }

  .sig-title {
    font-size: 8.5px;
    font-weight: bold;
    color: #26363c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sig-subtitle {
    font-size: 7.5px;
    color: #64748b;
  }

  /* ─── Pie de Página ─── */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 10px;
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
        <div class="clinic-subtitle">Comprobante Oficial de Pago</div>
        <div class="clinic-meta">
          @if($tenant->address){{ $tenant->address }}@endif
          @if($tenant->city), {{ $tenant->city }}@endif
          @if($tenant->phone) · Tel: {{ $tenant->phone }}@endif
          <br>
          {{ $tenant->email ?? 'contacto@clinica.com' }}
        </div>
      </td>
      <td class="doc-col">
        <div class="doc-main-title">Recibo de Pago</div>
        <div class="doc-folio">REC-{{ strtoupper(substr($payment->id, 0, 8)) }}</div>
        <span class="badge">Pagado</span>
      </td>
    </tr>
  </table>

  {{-- ── 2. DATOS DEL PAGO Y PACIENTE ── --}}
  <table class="info-card">
    <tr>
      <td style="width: 45%;">
        <div class="card-label">Paciente</div>
        <div class="card-value-bold">
          @if($payment->patient)
            {{ $payment->patient->first_name }} {{ $payment->patient->last_name }}
          @else
            Paciente General / Web
          @endif
        </div>
        @if($payment->patient && $payment->patient->national_id)
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">
            CI / Documento: {{ $payment->patient->national_id }}
          </div>
        @endif
        @if($payment->patient && $payment->patient->phone)
          <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
            Tel: {{ $payment->patient->phone }}
          </div>
        @endif
      </td>
      <td style="width: 25%;">
        <div class="card-label">Fecha de Pago</div>
        <div class="card-value">
          {{ \Carbon\Carbon::parse($payment->payment_date ?? $payment->created_at)->format('d/m/Y') }}
        </div>
      </td>
      <td style="width: 30%; text-align: right;">
        <div class="card-label">Método de Pago</div>
        <div class="card-value-bold" style="color: #167d72;">
          @switch($payment->payment_method)
            @case('cash') Efectivo @break
            @case('card') Tarjeta @break
            @case('transfer') QR / Transferencia @break
            @case('check') Cheque @break
            @default {{ ucfirst($payment->payment_method ?? 'Transferencia / QR') }}
          @endswitch
        </div>
      </td>
    </tr>
  </table>

  {{-- ── 3. DETALLE DE CONCEPTOS COBRADOS ── --}}
  <div class="section-heading">Detalle de Procedimientos y Conceptos</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 46%;">Procedimiento / Concepto</th>
        <th style="width: 14%; text-align: center;">Cantidad</th>
        <th style="width: 20%;" class="right">P. Unitario (Bs.)</th>
        <th style="width: 20%;" class="right">Subtotal (Bs.)</th>
      </tr>
    </thead>
    <tbody>
      @forelse($payment->items as $item)
      @php
        $qty = $item->quantity ?: 1;
        $unitPrice = $item->unit_price > 0 ? $item->unit_price : ($item->amount / max($qty, 1));
      @endphp
      <tr>
        <td><strong>{{ $item->description }}</strong></td>
        <td style="text-align: center;">{{ (float)$qty == (int)$qty ? (int)$qty : number_format($qty, 2) }}</td>
        <td class="right">Bs. {{ number_format($unitPrice, 2) }}</td>
        <td class="right" style="font-weight: 600;">Bs. {{ number_format($item->amount, 2) }}</td>
      </tr>
      @empty
      <tr>
        <td>
          <strong>
            {{ $payment->notes ?: 'Pago por servicios odontológicos' }}
          </strong>
        </td>
        <td style="text-align: center;">1</td>
        <td class="right">Bs. {{ number_format($payment->amount, 2) }}</td>
        <td class="right" style="font-weight: 600;">Bs. {{ number_format($payment->amount, 2) }}</td>
      </tr>
      @endforelse
    </tbody>
  </table>

  {{-- ── 4. TOTAL PAGADO ── --}}
  <table class="total-card">
    <tr>
      <td class="lbl">Total Pagado:</td>
      <td class="val">Bs. {{ number_format($payment->amount, 2) }}</td>
    </tr>
  </table>

  @if($payment->notes)
  <div class="notes-box">
    <strong>Observaciones:</strong>
    {{ $payment->notes }}
  </div>
  @endif

  {{-- ── 5. FIRMAS ── --}}
  <table class="signatures-table">
    <tr>
      <td class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Entregué Conforme</div>
        <div class="sig-subtitle">
          @if($payment->patient)
            {{ $payment->patient->first_name }} {{ $payment->patient->last_name }}
          @else
            Firma del Paciente
          @endif
        </div>
      </td>
      <td class="sig-spacer"></td>
      <td class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Recibí Conforme / Caja</div>
        <div class="sig-subtitle">Firma y Sello</div>
      </td>
    </tr>
  </table>

  {{-- ── 6. PIE DE PÁGINA ── --}}
  <div class="footer">
    {{ $tenant->name }} · Recibo emitido el {{ now()->format('d/m/Y H:i') }} · Sistema ClinicSoft
  </div>

</div>
</body>
</html>
