<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Factura {{ $invoice->invoice_number }}</title>
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
    color: #2d3748;
    background: #ffffff;
    line-height: 1.4;
    padding: 40px 50px;
  }

  .page-container {
    width: 100%;
  }

  /* ─── 1. Barra Superior con Logo ─── */
  .top-banner {
    background-color: #a7d7c5;
    border-radius: 4px;
    padding: 10px 16px;
    text-align: center;
    margin-bottom: 22px;
  }

  .top-banner-title {
    font-size: 13px;
    font-weight: bold;
    color: #1a3c30;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .top-banner-sub {
    font-size: 8px;
    color: #2c5947;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ─── 2. Encabezado Título + Número ─── */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }

  .header-table td {
    vertical-align: middle;
  }

  .doc-title {
    font-size: 28px;
    font-weight: bold;
    color: #2d3748;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .number-box {
    border: 1.5px solid #a7d7c5;
    background-color: #f2f9f6;
    border-radius: 4px;
    padding: 8px 14px;
    text-align: center;
    width: 180px;
    float: right;
  }

  .number-box-lbl {
    font-size: 8px;
    font-weight: bold;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 3px;
  }

  .number-box-val {
    font-size: 14px;
    font-weight: bold;
    color: #1a3c30;
    letter-spacing: 0.5px;
  }

  .divider-line {
    border-top: 1.5px solid #a7d7c5;
    margin-bottom: 18px;
  }

  /* ─── 3. Datos del Paciente y Clínica (2 Columnas) ─── */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  .info-col {
    width: 50%;
    vertical-align: top;
    padding-right: 15px;
  }

  .info-col:last-child {
    padding-right: 0;
    padding-left: 15px;
  }

  .info-heading {
    font-size: 9px;
    font-weight: bold;
    color: #2d3748;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }

  .info-row {
    font-size: 9.5px;
    color: #4a5568;
    line-height: 1.5;
  }

  .info-row strong {
    color: #2d3748;
  }

  .date-pill {
    background-color: #a7d7c5;
    color: #1a3c30;
    padding: 4px 10px;
    border-radius: 3px;
    display: inline-block;
    font-size: 8.5px;
    font-weight: bold;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-top: 8px;
  }

  /* ─── 4. Tabla de Ítems ─── */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #a7d7c5;
    margin-bottom: 16px;
  }

  .items-table th {
    background-color: #a7d7c5;
    color: #1a3c30;
    font-size: 8.5px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 8px 10px;
    border: 1px solid #93cbba;
    text-align: left;
  }

  .items-table th.center { text-align: center; }
  .items-table th.right  { text-align: right; }

  .items-table td {
    padding: 9px 10px;
    font-size: 9.5px;
    color: #2d3748;
    border: 1px solid #d5ece4;
    vertical-align: middle;
  }

  .items-table td.center { text-align: center; }
  .items-table td.right  { text-align: right; }

  .items-table tr:nth-child(even) td {
    background-color: #f8fcfb;
  }

  /* ─── 5. Totales ─── */
  .totals-table-wrap {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }

  .totals-table {
    width: 220px;
    border-collapse: collapse;
    border: 1px solid #a7d7c5;
    float: right;
  }

  .totals-table td {
    padding: 6px 12px;
    font-size: 9.5px;
    border: 1px solid #d5ece4;
  }

  .totals-table td.lbl {
    color: #4a5568;
    text-align: left;
    background-color: #f8fcfb;
  }

  .totals-table td.val {
    color: #2d3748;
    text-align: right;
    font-weight: 600;
  }

  .totals-table tr.grand-total td {
    background-color: #e6f5ef;
    font-weight: bold;
    color: #1a3c30;
    font-size: 11px;
    border-top: 1.5px solid #a7d7c5;
  }

  /* ─── 6. Caja de Notas ─── */
  .note-box {
    width: 100%;
    border: 1px solid #a7d7c5;
    background-color: #f2f9f6;
    border-radius: 4px;
    padding: 10px 12px;
    margin-top: 14px;
    margin-bottom: 22px;
    clear: both;
  }

  .note-title {
    font-size: 9px;
    font-weight: bold;
    color: #1a3c30;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 4px;
  }

  .note-content {
    font-size: 8.5px;
    color: #4a5568;
    line-height: 1.45;
  }

  /* ─── 7. Firmas ─── */
  .signatures-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
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
    border-top: 1px solid #718096;
    margin-top: 36px;
    margin-bottom: 4px;
  }

  .sig-title {
    font-size: 8.5px;
    font-weight: bold;
    color: #2d3748;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sig-subtitle {
    font-size: 7.5px;
    color: #718096;
  }

  /* ─── 8. Pie de Página y Agradecimiento ─── */
  .thanks-pill {
    background-color: #a7d7c5;
    color: #1a3c30;
    padding: 6px 18px;
    border-radius: 20px;
    display: block;
    width: 240px;
    margin: 0 auto 10px auto;
    font-size: 9px;
    font-weight: bold;
    letter-spacing: 1px;
    text-align: center;
    text-transform: uppercase;
  }

  .footer-contact {
    text-align: center;
    font-size: 8.5px;
    color: #4a5568;
    margin-top: 4px;
  }
</style>
</head>
<body>
<div class="page-container">

  {{-- ── 1. BANNER SUPERIOR ── --}}
  <div class="top-banner">
    <div class="top-banner-title">{{ $tenant->name }}</div>
    <div class="top-banner-sub">Factura de Servicios Odontológicos</div>
  </div>

  {{-- ── 2. TÍTULO Y FOLIO ── --}}
  <table class="header-table">
    <tr>
      <td>
        <div class="doc-title">Factura</div>
      </td>
      <td>
        <div class="number-box">
          <div class="number-box-lbl">Factura Número</div>
          <div class="number-box-val">{{ $invoice->invoice_number }}</div>
        </div>
      </td>
    </tr>
  </table>

  <div class="divider-line"></div>

  {{-- ── 3. DATOS DEL CLIENTE Y CLÍNICA ── --}}
  <table class="info-table">
    <tr>
      <td class="info-col">
        <div class="info-heading">Datos del Cliente / Paciente</div>
        <div class="info-row">
          <strong>Paciente:</strong> {{ $invoice->patient->first_name }} {{ $invoice->patient->last_name }}
        </div>
        @if($invoice->patient->national_id)
        <div class="info-row">
          <strong>CI / NIT:</strong> {{ $invoice->patient->national_id }}
        </div>
        @endif
        @if($invoice->patient->phone)
        <div class="info-row">
          <strong>Teléfono:</strong> {{ $invoice->patient->phone }}
        </div>
        @endif
        @if($invoice->patient->email)
        <div class="info-row">
          <strong>Email:</strong> {{ $invoice->patient->email }}
        </div>
        @endif

        <div class="date-pill">
          Fecha: {{ $invoice->created_at->format('d/m/Y') }}
        </div>
      </td>

      <td class="info-col">
        <div class="info-heading">Datos del Emisor</div>
        <div class="info-row">
          <strong>Razón Social:</strong> {{ $tenant->name }}
        </div>
        @if($tenant->address)
        <div class="info-row">
          <strong>Dirección:</strong> {{ $tenant->address }}@if($tenant->city), {{ $tenant->city }}@endif
        </div>
        @endif
        @if($tenant->phone)
        <div class="info-row">
          <strong>Teléfono:</strong> {{ $tenant->phone }}
        </div>
        @endif
        <div class="info-row">
          <strong>Email:</strong> {{ $tenant->email ?? 'contacto@clinica.com' }}
        </div>
        @if($invoice->due_date)
        <div class="info-row" style="margin-top: 6px; color: #1a3c30; font-weight: bold;">
          <strong>Vencimiento:</strong> {{ $invoice->due_date->format('d/m/Y') }}
        </div>
        @endif
      </td>
    </tr>
  </table>

  {{-- ── 4. TABLA DE CONCEPTOS ── --}}
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 50%;">Descripción / Concepto</th>
        <th style="width: 12%;" class="center">Cantidad</th>
        <th style="width: 18%;" class="right">Precio Unitario</th>
        <th style="width: 20%;" class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      @forelse($invoice->items as $item)
      <tr>
        <td>
          <strong>
            @if($item->treatment)
              {{ $item->treatment->name }}
            @else
              {{ $item->description ?: 'Servicio Dental' }}
            @endif
          </strong>
        </td>
        <td class="center">{{ $item->quantity }}</td>
        <td class="right">{{ number_format($item->unit_price, 2) }} Bs.</td>
        <td class="right" style="font-weight: bold;">{{ number_format($item->total, 2) }} Bs.</td>
      </tr>
      @empty
      <tr>
        <td colspan="4" style="text-align: center; color: #718096; padding: 14px;">
          Sin conceptos registrados
        </td>
      </tr>
      @endforelse
    </tbody>
  </table>

  {{-- ── 5. TOTALES ── --}}
  <table class="totals-table-wrap">
    <tr>
      <td>
        <table class="totals-table">
          <tr>
            <td class="lbl">Sub Total:</td>
            <td class="val">{{ number_format($invoice->subtotal, 2) }} Bs.</td>
          </tr>
          @if($invoice->discount_amount > 0)
          <tr>
            <td class="lbl">Descuento:</td>
            <td class="val" style="color: #b91c1c;">- {{ number_format($invoice->discount_amount, 2) }} Bs.</td>
          </tr>
          @endif
          @if($invoice->tax_rate > 0)
          <tr>
            <td class="lbl">IVA ({{ round($invoice->tax_rate * 100, 0) }}%):</td>
            <td class="val">{{ number_format($invoice->tax_amount, 2) }} Bs.</td>
          </tr>
          @endif
          <tr class="grand-total">
            <td class="lbl" style="background-color: #e6f5ef; color: #1a3c30; font-weight: bold;">Total:</td>
            <td class="val" style="background-color: #e6f5ef; color: #1a3c30; font-weight: bold; font-size: 11px;">
              {{ number_format($invoice->total, 2) }} Bs.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  {{-- ── 6. NOTA / OBSERVACIONES ── --}}
  @if($invoice->notes)
  <div class="note-box">
    <div class="note-title">Nota:</div>
    <div class="note-content">
      {{ $invoice->notes }}
    </div>
  </div>
  @endif

  {{-- ── 7. FIRMAS ── --}}
  <table class="signatures-table">
    <tr>
      <td class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Firma del Cliente</div>
        <div class="sig-subtitle">Conformidad</div>
      </td>
      <td class="sig-spacer"></td>
      <td class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-title">Emisor Autorizado</div>
        <div class="sig-subtitle">Firma y Sello</div>
      </td>
    </tr>
  </table>

  {{-- ── 8. AGRADECIMIENTO Y FOOTER ── --}}
  <div class="thanks-pill">
    ¡Muchas Gracias!
  </div>

  <div class="footer-contact">
    {{ $tenant->email ?? 'contacto@clinica.com' }} @if($tenant->phone) · Tel: {{ $tenant->phone }} @endif
  </div>

</div>
</body>
</html>
