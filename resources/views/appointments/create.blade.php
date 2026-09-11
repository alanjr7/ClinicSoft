<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva de Cita — {{ $tenant->name }}</title>
  <meta name="description" content="Reserve su cita médica en línea en {{ $tenant->name }}. Proceso rápido, seguro y sin complicaciones.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  @if($tenant->logo_url)
    <link rel="icon" type="image/png" href="{{ asset('storage/' . $tenant->logo_url) }}">
  @else
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏥</text></svg>">
  @endif
  <link rel="manifest" href="/manifest-book.json">
  <meta name="theme-color" content="#0284C7">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Reserva Citas">
  <link rel="stylesheet" href="{{ asset('css/appointments.css') }}?v={{ file_exists(public_path('css/appointments.css')) ? filemtime(public_path('css/appointments.css')) : time() }}">
  <style>
    .topbar {
      background: {{ $tenant->primary_color ?? 'linear-gradient(135deg, var(--navy-dk) 0%, var(--navy) 100%)' }} !important;
      color: {{ $tenant->header_text_color ?? '#ffffff' }} !important;
    }
    .wiz-snum.active, .wiz-snum.done {
      background: {{ $tenant->primary_color ?? 'var(--navy)' }} !important;
      border-color: {{ $tenant->primary_color ?? 'var(--navy)' }} !important;
    }
    .wiz-snum.active {
      box-shadow: 0 0 0 5px rgba(0,0,0,0.05) !important;
    }
    .wiz-sline.active {
      background: {{ $tenant->primary_color ?? 'var(--teal)' }} !important;
    }
    h1, .wiz-step-head-txt h2, .wiz-slbl.active {
      color: {{ $tenant->primary_color ?? 'var(--navy)' }} !important;
    }
    .slot.slot-occupied {
      background: #f1f5f9 !important;
      border-color: #e2e8f0 !important;
      color: #94a3b8 !important;
      cursor: not-allowed !important;
      opacity: 0.85;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 6px 4px !important;
      text-decoration: line-through;
      box-shadow: none !important;
    }
    .slot.slot-occupied:hover {
      background: #f1f5f9 !important;
      border-color: #e2e8f0 !important;
      color: #94a3b8 !important;
      box-shadow: none !important;
    }
    .slot-occ-lbl {
      font-size: 9px;
      font-weight: 700;
      color: #ef4444;
      text-decoration: none !important;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
    }
  </style>
  <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
  <div id="viewApp">

    <!-- ===== TOPBAR ===== -->
    <div class="topbar">
      <div class="brand">
        <div class="brand-icon">
          @if($tenant->logo_url)
            <img src="{{ asset('storage/' . $tenant->logo_url) }}" alt="{{ $tenant->name }}">
          @else
            <i class="fa-solid fa-hospital-user" style="font-size:22px;color:{{ $tenant->header_text_color ?? '#ffffff' }};"></i>
          @endif
        </div>
        <div>
          {{ $tenant->name }}
          <span class="brand-sub" style="color: {{ $tenant->header_text_color ?? '#ffffff' }}; opacity: 0.9;">Sistema de Reserva de Citas</span>
        </div>
      </div>
    </div>

    <main>
      <section id="secNueva">
        <div class="wizard-wrap">

          <!-- Stepper -->
          <div class="wiz-stepper" id="wizStepper">
            <div class="wiz-si">
              <div class="wiz-snum active" id="wsn1">1</div>
              <div class="wiz-slbl active" id="wsl1">Servicio / Consulta</div>
            </div>
            <div class="wiz-sline" id="wline1"></div>
            <div class="wiz-si">
              <div class="wiz-snum" id="wsn2">2</div>
              <div class="wiz-slbl" id="wsl2">Fecha y Hora</div>
            </div>
            <div class="wiz-sline" id="wline2"></div>
            <div class="wiz-si">
              <div class="wiz-snum" id="wsn3">3</div>
              <div class="wiz-slbl" id="wsl3">Confirmar y Pagar</div>
            </div>
          </div>

          <!-- Wizard card -->
          <div class="wiz-card">
            <div class="wiz-track" id="wizTrack">

              <!-- ===== PASO 1: SERVICIO / CONSULTA ===== -->
              <div class="wstep active" id="wStep1">
                <div class="wiz-step-head">
                  <div class="wiz-step-icon teal"><i class="fa-solid fa-stethoscope"></i></div>
                  <div class="wiz-step-head-txt">
                    <h2>Seleccione un Servicio o Consulta</h2>
                    <p>Elija el servicio o consulta médica que necesita</p>
                  </div>
                </div>
                <div class="tipos" id="tiposContainer">
                  <div class="empty-state" style="grid-column:1/-1">
                    <i class="fa-solid fa-spinner fa-spin" style="font-size:32px;color:var(--teal);"></i>
                    <p>Cargando servicios disponibles...</p>
                  </div>
                </div>
                <div id="wizErr1" class="wiz-err hidden">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  <span id="wizErr1Txt"></span>
                </div>
                <div class="wiz-foot" id="wizFoot1">
                  <div></div>
                  <button class="btn-wiz-next" id="wizNextBtn1" onclick="wizNext()">
                    Siguiente <i class="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              <!-- ===== PASO 2: FECHA Y HORA ===== -->
              <div class="wstep" id="wStep2">
                <div class="wiz-step-head">
                  <div class="wiz-step-icon amber"><i class="fa-regular fa-calendar-days"></i></div>
                  <div class="wiz-step-head-txt">
                    <h2>Fecha y Hora</h2>
                    <p>Seleccione cuándo desea su cita</p>
                  </div>
                </div>
                <div id="wiz2Body">
                  <div class="cal-head">
                    <span class="cal-month-label" id="pkTitulo"></span>
                    <div class="cal-nav-btns">
                      <button type="button" onclick="navPk(-1)" aria-label="Mes anterior"><i class="fa-solid fa-chevron-left"></i></button>
                      <button type="button" class="hoy" onclick="navPk(0)">Hoy</button>
                      <button type="button" onclick="navPk(1)" aria-label="Mes siguiente"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                  </div>
                  <div class="cal-grid pk" id="pkGrid"></div>
                  <div class="slots hidden" id="pkSlots"></div>
                  <div class="pk-sel hidden" id="pkSel"></div>
                  <div id="wizErr2" class="wiz-err hidden"><i class="fa-solid fa-circle-exclamation"></i> <span id="wizErr2Txt"></span></div>
                </div>
                <div class="wiz-foot">
                  <button class="btn-wiz-prev" id="wizPrevBtn2" onclick="wizPrev()">
                    <i class="fa-solid fa-arrow-left"></i> Anterior
                  </button>
                  <button class="btn-wiz-next" id="wizNextBtn2" onclick="wizNext()">
                    Siguiente <i class="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>

              <!-- ===== PASO 3: CONFIRMACIÓN Y PAGO ===== -->
              <div class="wstep" id="wStep3">
                <div class="wiz-step-head">
                  <div class="wiz-step-icon green"><i class="fa-solid fa-clipboard-check"></i></div>
                  <div class="wiz-step-head-txt">
                    <h2>Confirmar y Pagar</h2>
                    <p>Ingrese sus datos y adjunte el comprobante de pago</p>
                  </div>
                </div>
                <div id="wiz3Body">

                  <!-- Datos del paciente -->
                  <div class="grid2">
                    <div class="field">
                      <label for="fNombre"><i class="fa-solid fa-user"></i> Nombre Completo</label>
                      <input id="fNombre" type="text" placeholder="Ej: Juan Pérez" autocomplete="name">
                    </div>
                    <div class="field">
                      <label for="fTelefono"><i class="fa-solid fa-mobile-screen"></i> Celular / WhatsApp</label>
                      <input id="fTelefono" type="tel" placeholder="Ej: 71234567" autocomplete="tel">
                    </div>
                  </div>

                  <!-- Resumen + QR -->
                  <div class="step6-layout">
                    <div>
                      <div class="resumen-card" id="resumen"></div>
                      <div class="upload-zone" id="uploadBox">
                        <label id="reciboLabel" for="fRecibo">
                          <i class="fa-solid fa-paperclip"></i> Subir comprobante de pago
                        </label>
                        <input id="fRecibo" type="file" accept="image" onchange="cargarRecibo(this)">
                        <img id="reciboPrev" class="prev" alt="Vista previa del comprobante">
                        <p id="uploadHint" class="upload-hint">JPG, PNG, WebP · Sube la captura de tu transferencia o pago por QR</p>
                      </div>
                    </div>
                    <div class="qr-card">
                      <div class="qrbox" onclick="abrirQrModal()" title="Haz clic para ampliar el QR">
                        @if($tenant->payment_qr_path)
                          <img id="imgQrPago" src="{{ asset('storage/' . $tenant->payment_qr_path) }}" alt="QR de Pago">
                          <div class="qr-zoom-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> Ampliar QR</div>
                        @else
                          <div style="padding:32px;text-align:center;color:var(--ink-lt);background:var(--bg);border-radius:1px;font-size:13px;">
                            <i class="fa-regular fa-qrcode" style="font-size:40px;display:block;margin-bottom:10px;opacity:.4;"></i>
                            QR no configurado
                          </div>
                        @endif
                      </div>
                      <p class="qr-label">Paga con <strong>QR Simple</strong></p>
                      <p style="font-size:11px;color:var(--ink-lt);margin-top:4px;text-align:center;">Desde cualquier app de tu banco</p>
                      @if($tenant->phone)
                        <div class="qr-contact">
                          ¿Problemas?
                          <b><i class="fa-brands fa-whatsapp"></i> {{ $tenant->phone }}</b>
                        </div>
                      @endif
                    </div>
                  </div>

                  <div id="wizErr3" class="wiz-err hidden" style="margin:16px 0 0">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span id="wizErr3Txt"></span>
                  </div>
                </div>

                <div class="wiz-foot">
                  <button class="btn-wiz-prev" id="wizPrevBtn3" onclick="wizPrev()">
                    <i class="fa-solid fa-arrow-left"></i> Anterior
                  </button>
                  <button class="btn-wiz-next btn-wiz-confirm-style" id="wizNextBtn" onclick="wizNext()">
                    <i class="fa-solid fa-paper-plane"></i> Confirmar y Reservar
                  </button>
                </div>
              </div>

            </div><!-- /wiz-track -->
          </div><!-- /wiz-card -->

        </div><!-- /wizard-wrap -->
      </section>
    </main>
  </div>

  <div class="toast" id="toast"><i class="fa-solid fa-circle-check"></i> <span id="toastMsg"></span></div>

  <!-- Modal Zoom QR -->
  <div id="qrModal" class="qr-modal hidden" onclick="cerrarQrModal(event)">
    <div class="qr-modal-content" onclick="event.stopPropagation()">
      <button type="button" class="qr-modal-close" onclick="cerrarQrModal()" aria-label="Cerrar modal"><i class="fa-solid fa-xmark"></i></button>
      <div class="qr-modal-header">
        <i class="fa-solid fa-qrcode"></i>
        <div>
          <h3>QR de Pago Simple</h3>
          <p>{{ $tenant->name }}</p>
        </div>
      </div>
      <div class="qr-modal-img-wrap">
        <img id="qrModalImg" src="" alt="QR de Pago Ampliado">
      </div>
      <p class="qr-modal-foot"><i class="fa-solid fa-camera"></i> Escanea desde tu app bancaria</p>
    </div>
  </div>

  <script>
    window.TENANT_SLUG = "{{ $tenant->slug }}";
    window.TENANT_CURRENCY = "{{ $tenant->currency ?? 'Bs.' }}";

    function abrirQrModal() {
      const qrImg = document.getElementById('imgQrPago');
      if (!qrImg) return;
      const modal = document.getElementById('qrModal');
      const modalImg = document.getElementById('qrModalImg');
      if (modal && modalImg) {
        modalImg.src = qrImg.src;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    }

    function cerrarQrModal(e) {
      if (e && e.target && e.target.closest('.qr-modal-content')) return;
      const modal = document.getElementById('qrModal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }
  </script>
  <script src="{{ asset('js/appointments.js') }}?v={{ file_exists(public_path('js/appointments.js')) ? filemtime(public_path('js/appointments.js')) : time() }}"></script>
</body>
</html>
