/* ========== ESTADO ========== */
let tratamientos = [];
let tratamientoSel = null;
let fechaSel = null;
let horaSel = null;
let reciboFile = null;
let pasoActual = 1;
let bookingSchedule = null;
let busySlots = [];

const fmt = n => (window.TENANT_CURRENCY || 'Bs') + ' ' + Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2 });
const $ = id => document.getElementById(id);

/* ========== INICIALIZACIÓN ========== */
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const res = await fetch(`/api/book/${window.TENANT_SLUG}/data`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        tratamientos = (data.treatments || []).filter(t => t.is_active !== false);
        bookingSchedule = data.booking_schedule || data.booking_hours || null;
        busySlots = data.busy_slots || [];
        renderTratamientos();
    } catch (e) {
        console.error(e);
        $('tiposContainer').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>No se pudieron cargar los tratamientos. Por favor recargue la página.</p>
            </div>`;
    }
}

/* ========== PASO 1: TRATAMIENTOS ========== */
function renderTratamientos() {
    const cont = $('tiposContainer');
    if (!tratamientos.length) {
        cont.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-face-meh"></i>
                <p>No hay tratamientos disponibles por el momento.</p>
            </div>`;
        return;
    }

    cont.innerHTML = tratamientos.map(t => {
        const isSelected = tratamientoSel?.id === t.id;
        const imgHtml = t.image_path
            ? `<img src="/storage/${t.image_path}" alt="${esc(t.name)}" class="tipo-img" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'tipo-img-placeholder\\'><i class=\\'fa-solid fa-tooth\\'></i></div>'">`
            : `<div class="tipo-img-placeholder"><i class="fa-solid fa-tooth"></i></div>`;
        return `
        <button type="button" class="tipo${isSelected ? ' sel' : ''}" onclick="selTratamiento('${t.id}')" id="tipo-${t.id}">
            ${imgHtml}
            <div class="check-icon"><i class="fa-solid fa-check"></i></div>
            <div class="tipo-body">
                <div class="tn">${esc(t.name)}</div>
                <div class="tp">${fmt(t.base_price)}</div>
                <div class="td"><i class="fa-regular fa-clock"></i> ${t.duration_minutes ?? 30} min${t.description ? ' · ' + esc(t.description) : ''}</div>
            </div>
        </button>`;
    }).join('');
}

function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function selTratamiento(id) {
    tratamientoSel = tratamientos.find(t => t.id == id) || null;
    $('wizErr1').classList.add('hidden');
    renderTratamientos();
}

/* ========== PASO 2: CALENDARIO ========== */
let currentDate = new Date();

function renderCal() {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    $('pkTitulo').textContent = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(currentDate);

    const d1 = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const start = d1 === 0 ? 6 : d1 - 1;

    let html = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="cd">${d}</div>`).join('');
    for (let i = 0; i < start; i++) html += `<div></div>`;

    for (let d = 1; d <= days; d++) {
        const tDate = new Date(y, m, d);
        const isPast = tDate < hoy;
        const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let cls = 'cdi';
        if (isPast) cls += ' dis';
        if (fechaSel === dStr) cls += ' sel';
        html += `<div class="${cls}" ${!isPast ? `onclick="selFecha('${dStr}')"` : ''}>${d}</div>`;
    }
    $('pkGrid').innerHTML = html;
    renderSlots();
}

function navPk(dir) {
    if (dir === 0) currentDate = new Date();
    else currentDate.setMonth(currentDate.getMonth() + dir);
    renderCal();
}

function selFecha(dStr) {
    fechaSel = dStr;
    horaSel = null;
    $('wizErr2').classList.add('hidden');
    renderCal();
}

function renderSlots() {
    const slots = $('pkSlots');
    const pkSel = $('pkSel');

    if (!fechaSel) {
        slots.classList.add('hidden');
        pkSel.classList.add('hidden');
        return;
    }

    // Determine Day of Week for fechaSel
    const dParts = fechaSel.split('-').map(Number);
    const dateObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dateObj.getDay()];

    const dayConfig = (bookingSchedule && bookingSchedule[dayKey]) ? bookingSchedule[dayKey] : {
        enabled: true,
        start: '08:00',
        end: (dayKey === 'saturday' || dayKey === 'sunday') ? '16:00' : '19:00',
        lunch_enabled: false,
        lunch_start: null,
        lunch_end: null
    };

    if (!dayConfig.enabled) {
        slots.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 24px 12px;">
                <i class="fa-regular fa-calendar-xmark" style="font-size:28px;color:#94a3b8;margin-bottom:8px;"></i>
                <p style="font-size:14px;color:#64748b;margin:0;">La clínica no atiende en este día de la semana.</p>
            </div>
        `;
        slots.classList.remove('hidden');
        pkSel.classList.add('hidden');
        horaSel = null;
        return;
    }

    // Parse business hours into comparable minutes-since-midnight
    const toMinutes = (t) => {
        const [h, m] = (t || '').split(':').map(Number);
        return isNaN(h) ? null : h * 60 + (m || 0);
    };
    const bhStart    = toMinutes(dayConfig.start) ?? (8 * 60);
    const bhEnd      = toMinutes(dayConfig.end)   ?? (19 * 60);
    const lunchStart = dayConfig.lunch_enabled ? toMinutes(dayConfig.lunch_start) : null;
    const lunchEnd   = dayConfig.lunch_enabled ? toMinutes(dayConfig.lunch_end)   : null;

    const isBlocked = (h, mm) => {
        const t = h * 60 + mm;
        if (t < bhStart || t >= bhEnd) return true;
        if (lunchStart !== null && lunchEnd !== null && t >= lunchStart && t < lunchEnd) return true;
        return false;
    };

    const isOccupied = (h, mm) => {
        const duration = (tratamientoSel && tratamientoSel.duration_minutes) ? Number(tratamientoSel.duration_minutes) : 30;
        const slotStart = h * 60 + mm;
        const slotEnd   = slotStart + duration;

        const dayBusy = (busySlots || []).filter(b => b.date === fechaSel);
        for (const b of dayBusy) {
            const bStart = toMinutes(b.start);
            const bEnd   = toMinutes(b.end);
            if (bStart !== null && bEnd !== null) {
                // Solapamiento de intervalos: (slotStart < bEnd && slotEnd > bStart)
                if (slotStart < bEnd && slotEnd > bStart) {
                    return true;
                }
            }
        }
        return false;
    };

    let sh = '';
    // Show hours around tenant's range
    const startHour = Math.max(6, Math.min(8, Math.floor(bhStart / 60)));
    const endHour = Math.min(22, Math.max(17, Math.ceil(bhEnd / 60)));

    for (let h = startHour; h <= endHour; h++) {
        for (let mm of [0, 30]) {
            const tMinutes = h * 60 + mm;
            // Only generate slots up to the end of attention
            if (tMinutes < bhStart - 60 || tMinutes > bhEnd + 30) continue;

            const timeStr = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
            const blocked = isBlocked(h, mm);
            const occupied = !blocked && isOccupied(h, mm);

            if (blocked) {
                sh += `<button class="slot slot-disabled" disabled aria-disabled="true" title="Fuera del horario de atención">${timeStr}</button>`;
            } else if (occupied) {
                sh += `<button class="slot slot-occupied" disabled aria-disabled="true" title="Horario no disponible (Ya reservado)">${timeStr} <span class="slot-occ-lbl">Ocupado</span></button>`;
            } else {
                const cls = timeStr === horaSel ? 'slot sel' : 'slot';
                sh += `<button class="${cls}" onclick="selHora('${timeStr}')">${timeStr}</button>`;
            }
        }
    }
    slots.innerHTML = sh || `<div class="empty-state" style="grid-column: 1 / -1;"><p>No hay turnos disponibles para este día.</p></div>`;
    slots.classList.remove('hidden');

    if (horaSel) {
        const dateFormatted = dateObj.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
        pkSel.innerHTML = `<i class="fa-solid fa-calendar-check"></i> <b>${dateFormatted}</b> a las <b>${horaSel}</b>`;
        pkSel.classList.remove('hidden');
    } else {
        pkSel.classList.add('hidden');
    }
}

function selHora(h) {
    horaSel = h;
    $('wizErr2').classList.add('hidden');
    renderSlots();
}

/* ========== PASO 3: RESUMEN ========== */
function renderResumen() {
    if (!tratamientoSel || !fechaSel || !horaSel) return;
    const dateFormatted = new Date(fechaSel + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('resumen').innerHTML = `
        <div class="resumen-row"><span>Tratamiento</span><strong>${esc(tratamientoSel.name)}</strong></div>
        <div class="resumen-row"><span>Duración</span><strong>${tratamientoSel.duration_minutes ?? 30} min</strong></div>
        <div class="resumen-row"><span>Fecha</span><strong>${dateFormatted}</strong></div>
        <div class="resumen-row"><span>Hora</span><strong>${horaSel}</strong></div>
        <div class="resumen-row total"><span>Total a pagar</span><strong>${fmt(tratamientoSel.base_price)}</strong></div>
    `;
}

function cargarRecibo(input) {
    const file = input.files[0];
    if (!file) return;
    reciboFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        $('reciboPrev').src = e.target.result;
        $('reciboPrev').style.display = 'block';
        $('reciboLabel').innerHTML = '<i class="fa-solid fa-check"></i> Comprobante cargado correctamente';
        $('reciboLabel').style.color = 'var(--green-dk)';
        $('uploadHint').textContent = file.name;
    };
    reader.readAsDataURL(file);
}

/* ========== NAVEGACIÓN WIZARD ========== */
function wizPrev() {
    if (pasoActual > 1) goToStep(pasoActual - 1);
}

function wizNext() {
    if (pasoActual === 1) {
        if (!tratamientoSel) {
            showErr(1, 'Por favor seleccione un tratamiento para continuar.');
            return;
        }
        goToStep(2);
    } else if (pasoActual === 2) {
        if (!fechaSel) {
            showErr(2, 'Por favor seleccione una fecha.');
            return;
        }
        if (!horaSel) {
            showErr(2, 'Por favor seleccione un horario disponible.');
            return;
        }
        goToStep(3);
    } else if (pasoActual === 3) {
        enviarReserva();
    }
}

function showErr(paso, msg) {
    $(`wizErr${paso}Txt`).textContent = msg;
    $(`wizErr${paso}`).classList.remove('hidden');
    $(`wizErr${paso}`).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function goToStep(p) {
    // Hide current step
    $(`wStep${pasoActual}`).classList.remove('active');
    pasoActual = p;
    // Show new step
    $(`wStep${pasoActual}`).classList.add('active');

    // Update stepper indicators
    [1, 2, 3].forEach(i => {
        const numEl = $(`wsn${i}`);
        const lblEl = $(`wsl${i}`);
        if (i < p) {
            numEl.classList.remove('active');
            numEl.classList.add('done');
            numEl.innerHTML = '<i class="fa-solid fa-check"></i>';
            lblEl.classList.remove('active');
            lblEl.classList.add('done');
            if (i < 3) $(`wline${i}`)?.classList.add('active');
        } else if (i === p) {
            numEl.classList.add('active');
            numEl.classList.remove('done');
            numEl.textContent = i;
            lblEl.classList.add('active');
            lblEl.classList.remove('done');
        } else {
            numEl.classList.remove('active', 'done');
            numEl.textContent = i;
            lblEl.classList.remove('active', 'done');
        }
    });

    if (p === 2) renderCal();
    if (p === 3) renderResumen();

    // Scroll to top of wizard card
    $('wizStepper').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/* ========== ENVÍO ========== */
async function enviarReserva() {
    const nombre = $('fNombre').value.trim();
    const tel = $('fTelefono').value.trim();

    if (!nombre) { showErr(3, 'Por favor ingrese su nombre completo.'); return; }
    if (!tel) { showErr(3, 'Por favor ingrese su número de celular.'); return; }

    const btn = $('wizNextBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    $('wizErr3').classList.add('hidden');

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const formData = new FormData();
        formData.append('treatment_id', tratamientoSel.id);
        formData.append('date', fechaSel);
        formData.append('time', horaSel);
        formData.append('patient_name', nombre);
        formData.append('patient_phone', tel);
        if (reciboFile) formData.append('receipt', reciboFile);

        const res = await fetch(`/book/${window.TENANT_SLUG}`, {
            method: 'POST',
            headers: { 
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: formData
        });

        const contentType = res.headers.get('content-type') || '';
        let data = {};

        if (contentType.includes('application/json')) {
            try {
                data = await res.json();
            } catch (jsonErr) {
                console.error('Non-valid JSON received despite header:', jsonErr);
                throw new Error(`El servidor respondió con un error (Código ${res.status}). Por favor intente más tarde.`);
            }
        } else {
            const text = await res.text();
            console.error('Non-JSON response received:', text);
            throw new Error(`El servidor respondió con un error (Código ${res.status}). Por favor intente más tarde.`);
        }

        if (res.ok && data.success) {
            mostrarExito();
        } else {
            const msgs = data.errors 
                ? Object.values(data.errors).flat().join(' ') 
                : (data.message || 'Error al procesar la reserva.');
            showErr(3, msgs);
        }
    } catch (e) {
        console.error(e);
        showErr(3, e.message || 'Error de conexión. Verifique su internet e intente nuevamente.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirmar y Reservar';
    }
}

function mostrarExito() {
    $('secNueva').innerHTML = `
        <div class="success-screen">
            <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
            <h2>¡Reserva Confirmada!</h2>
            <p>Hemos recibido su solicitud de cita correctamente.</p>
            <div class="success-details">
                <div class="sd-row"><i class="fa-solid fa-tooth"></i> <span>${esc(tratamientoSel.name)}</span></div>
                <div class="sd-row"><i class="fa-regular fa-calendar"></i> <span>${new Date(fechaSel + 'T00:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${horaSel}</span></div>
            </div>
            <p class="success-sub">Pronto recibirá confirmación. Si tiene alguna consulta, contáctenos por WhatsApp.</p>
            <button onclick="location.reload()" class="btn-wiz-next" style="margin-top:24px; width:100%; justify-content:center;">
                <i class="fa-solid fa-plus"></i> Hacer otra reserva
            </button>
        </div>`;
}

function showToast(msg) {
    const t = $('toast');
    $('toastMsg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}

/* ========== MODAL QR ZOOM ========== */
function abrirQrModal() {
    const qrImg = $('imgQrPago');
    if (!qrImg) return;
    const modal = $('qrModal');
    const modalImg = $('qrModalImg');
    if (modal && modalImg) {
        modalImg.src = qrImg.src;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarQrModal(e) {
    if (e && e.target && e.target.closest('.qr-modal-content')) return;
    const modal = $('qrModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

window.abrirQrModal = abrirQrModal;
window.cerrarQrModal = cerrarQrModal;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarQrModal();
});
