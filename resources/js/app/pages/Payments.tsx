import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DollarSign, CheckCircle, Clock, AlertCircle, Plus, Loader2, Trash2, Printer } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { downloadPdfDirect } from '../utils/downloadPdf';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PatientOption { id: string; first_name: string; last_name: string; national_id: string | null; }
interface AccountOption { id: string; code: string; name: string; }
interface TreatmentOption { id: string; name: string; base_price: number; }
interface PaymentItem { id?: string; description: string; quantity?: number; unit_price?: number; amount: number; }
interface PaymentRecord {
  id: string;
  patient_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string | null;
  created_at: string;
  notes: string | null;
  customer_name?: string | null;
  customer_ci?: string | null;
  patient?: { id: string; first_name: string; last_name: string; national_id: string | null; } | null;
  items?: PaymentItem[];
}

interface FormItem {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  amount: number;
}

interface Props {
  payments: PaymentRecord[];
  patients: PatientOption[];
  treatments?: TreatmentOption[];
  accounts: AccountOption[];
  flash?: { success?: string; new_payment_id?: string; };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount: number) {
  return amount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 });
}

function fmtDec(amount: number) {
  return amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  other: 'Otro',
};

Payments.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Payments({ payments, patients, treatments = [], accounts, flash }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState<PaymentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    patient_id: string;
    patient_name: string;
    patient_ci: string;
    payment_method: string;
    notes: string;
    account_id: string;
    items: FormItem[];
  }>({
    patient_id: '',
    patient_name: '',
    patient_ci: '',
    payment_method: 'cash',
    notes: '',
    account_id: '',
    items: [{ description: '', quantity: 1, unit_price: '', amount: 0 }]
  });

  async function handleDownloadPdf(id: string) {
    setDownloadingId(id);
    await downloadPdfDirect(`/payments/${id}/pdf`, `Recibo-Pago-${id.slice(0, 8)}.pdf`);
    setDownloadingId(null);
  }

  function handleDeletePayment() {
    if (!deleteConfirmPayment) return;
    setDeletingId(deleteConfirmPayment.id);
    router.delete(`/payments/${deleteConfirmPayment.id}`, {
      preserveScroll: true,
      onSuccess: () => setDeleteConfirmPayment(null),
      onFinish: () => setDeletingId(null),
    });
  }

  // Handle new payment auto download
  useEffect(() => {
    if (flash?.new_payment_id) {
      handleDownloadPdf(flash.new_payment_id);
    }
  }, [flash]);

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);

  // Cascading total calculation
  const currentTotal = form.items.reduce((s, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    return s + (qty * price);
  }, 0);

  const openModal = () => {
    setForm({
      patient_id: '', patient_name: '', patient_ci: '',
      payment_method: 'cash', notes: '', account_id: '',
      items: [{ description: '', quantity: 1, unit_price: '', amount: 0 }]
    });
    setSaveError(null);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setSaveError(null); };

  function handlePatientNameChange(val: string) {
    let newCi = form.patient_ci;
    let newId = form.patient_id;
    const found = patients.find(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(val.toLowerCase()) || p.first_name.toLowerCase().includes(val.toLowerCase()));
    if (found && val.length > 2) {
      newCi = found.national_id || '';
      newId = found.id;
    } else {
      newId = '';
    }
    setForm(f => ({ ...f, patient_name: val, patient_ci: newCi, patient_id: newId }));
  }

  function addItem() {
    setForm(f => ({
      ...f,
      items: [...f.items, { description: '', quantity: 1, unit_price: '', amount: 0 }]
    }));
  }

  function removeItem(index: number) {
    if (form.items.length === 1) return;
    setForm(f => {
      const newItems = [...f.items];
      newItems.splice(index, 1);
      return { ...f, items: newItems };
    });
  }

  function updateItem(index: number, field: keyof FormItem, value: any) {
    setForm(f => {
      const newItems = [...f.items];
      const item = { ...newItems[index], [field]: value };

      // Check if description matches a known treatment to auto-fill unit_price
      if (field === 'description' && treatments.length > 0) {
        const matched = treatments.find(t => t.name.toLowerCase() === String(value).trim().toLowerCase());
        if (matched && (!item.unit_price || Number(item.unit_price) === 0)) {
          item.unit_price = matched.base_price;
        }
      }

      // Cascade recalculation of item subtotal amount
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      item.amount = Math.round(qty * price * 100) / 100;

      newItems[index] = item;
      return { ...f, items: newItems };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_name) {
      setSaveError('Debe ingresar el nombre del paciente.');
      return;
    }

    const invalidItem = form.items.find(i => !i.description.trim() || Number(i.quantity) <= 0 || Number(i.unit_price) < 0);
    if (invalidItem) {
      setSaveError('Cada ítem debe tener procedimiento, cantidad mayor a 0 y precio unitario válido.');
      return;
    }

    setSaving(true);

    const formattedItems = form.items.map(i => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unit_price) || 0;
      return {
        description: i.description.trim(),
        quantity: qty,
        unit_price: price,
        amount: Math.round(qty * price * 100) / 100
      };
    });

    const payload = {
      ...form,
      patient_id: form.patient_id || null,
      account_id: form.account_id || null,
      amount: formattedItems.reduce((s, i) => s + i.amount, 0),
      items: formattedItems,
    };

    router.post('/payments', payload as any, {
      onSuccess: closeModal,
      onError: (errors) => {
        console.error("Validation errors:", errors);
        const errorMsg = Object.values(errors).join(', ');
        setSaveError('Revise los datos ingresados. ' + errorMsg);
      },
      onFinish: () => setSaving(false),
    });
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Cobros y Pagos</h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Control financiero del consultorio</p>
        </div>
        <Button
          onClick={openModal}
          className="h-11 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl shadow-lg shadow-[#0284C7]/20 px-6 gap-2 text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Registrar Pago
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#0284C7] dark:text-[#38BDF8]" />
            </div>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">Total Ingresos</p>
            <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">{fmt(totalCollected)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/40 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-[#F59E0B] dark:text-amber-400" />
            </div>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">Total de pagos registrados</p>
            <p className="text-3xl font-bold text-[#111827] dark:text-[#F8FAFC]">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Historial de Pagos</CardTitle>
          <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">Registro de todos los pagos y cobros</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#9CA3AF] dark:text-[#94A3B8]">
              <DollarSign className="w-12 h-12 text-[#D1D5DB] dark:text-gray-600 mb-3" />
              <p className="text-sm">No hay pagos registrados aún.</p>
              <Button size="sm" variant="ghost" onClick={openModal} className="mt-3 text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10">
                <Plus className="w-4 h-4 mr-1" /> Registrar primer pago
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#111827]">
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Paciente</TableHead>
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Conceptos</TableHead>
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Método</TableHead>
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC]">Fecha</TableHead>
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC] text-right">Monto</TableHead>
                    <TableHead className="text-[#111827] dark:text-[#F8FAFC] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const isWalkin = !payment.patient && Boolean(payment.customer_name);
                    const displayName = payment.patient
                      ? `${payment.patient.first_name} ${payment.patient.last_name}`.trim()
                      : (payment.customer_name || 'Cliente Mostrador');
                    const displayCi = payment.patient?.national_id ?? payment.customer_ci;
                    const initialsText = payment.patient
                      ? initials(payment.patient.first_name, payment.patient.last_name)
                      : (payment.customer_name ? payment.customer_name.substring(0, 2).toUpperCase() : 'CM');
                    const itemsDesc = payment.items && payment.items.length > 0
                      ? payment.items.map(i => {
                        const qty = i.quantity ? Number(i.quantity) : 1;
                        const unit = i.unit_price ? ` (Bs ${fmtDec(Number(i.unit_price))})` : '';
                        return qty > 1 ? `${qty}x ${i.description}${unit}` : `${i.description}${unit}`;
                      }).join(', ')
                      : 'Pago';
                    return (
                      <TableRow key={payment.id} className="border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 ${isWalkin
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                                : 'bg-gradient-to-br from-[#0284C7] to-[#075985] text-white'
                              }`}>
                              <span className="text-xs font-medium">{initialsText}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#111827] dark:text-[#F8FAFC] font-medium block">{displayName}</span>
                                {isWalkin && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/60">
                                    Mostrador
                                  </span>
                                )}
                              </div>
                              {displayCi && <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">CI: {displayCi}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#6B7280] dark:text-gray-300 max-w-[240px] truncate" title={itemsDesc}>
                          {itemsDesc}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-[#F3F4F6] dark:bg-[#1E293B] text-[#374151] dark:text-gray-200 border-0 hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B]">
                            {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#6B7280] dark:text-[#94A3B8]">
                          {fmtDate(payment.payment_date ?? payment.created_at)}
                        </TableCell>
                        <TableCell className="text-[#0284C7] dark:text-[#38BDF8] font-semibold text-right">
                          {fmt(Number(payment.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={downloadingId === payment.id}
                              onClick={() => handleDownloadPdf(payment.id)}
                              className="text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white"
                              title="Descargar comprobante PDF"
                            >
                              {downloadingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" />
                              ) : (
                                <Printer className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === payment.id}
                              onClick={() => setDeleteConfirmPayment(payment)}
                              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Eliminar pago"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatments datalist for autocomplete */}
      <datalist id="clinic-treatments-list">
        {treatments.map(t => (
          <option key={t.id} value={t.name}>
            Bs {fmtDec(Number(t.base_price))}
          </option>
        ))}
      </datalist>

      {/* Register Payment Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="w-[95vw] sm:max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC] text-xl font-bold">Registrar Pago</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {saveError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
              </div>
            )}

            {/* Patient Name & CI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Nombre del paciente *</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar o ingresar nuevo..."
                    value={form.patient_name}
                    onChange={(e) => handlePatientNameChange(e.target.value)}
                    className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                  />
                  {form.patient_name.length > 2 && !form.patient_id && (
                    <div className="absolute right-3 top-3 text-xs text-[#F59E0B] dark:text-amber-400 font-medium">Nuevo</div>
                  )}
                  {form.patient_id && (
                    <div className="absolute right-3 top-3 text-xs text-[#0284C7] dark:text-[#38BDF8] font-medium">Encontrado</div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Carnet de Identidad (CI)</Label>
                <Input
                  placeholder="Ej. 1234567"
                  value={form.patient_ci}
                  onChange={(e) => setForm(f => ({ ...f, patient_ci: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            {/* Procedures / Items Section */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-[#111827]/40 border border-gray-100 dark:border-[#1E293B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-[#111827] dark:text-[#F8FAFC] font-semibold text-sm">
                    Procedimientos / Motivos de cobro *
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-9 gap-1 text-[#0284C7] dark:text-[#38BDF8] border-[#0284C7]/40 dark:border-[#0284C7]/40 hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar procedimiento
                </Button>
              </div>

              {/* Column Headers */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] px-1 pt-2">
                <div className="col-span-5">Procedimiento</div>
                <div className="col-span-2 text-center">Cantidad</div>
                <div className="col-span-2 text-right">Monto Unitario (Bs.)</div>
                <div className="col-span-2 text-right">Subtotal (Bs.)</div>
                <div className="col-span-1 text-center"></div>
              </div>

              <div className="space-y-2.5">
                {form.items.map((item, index) => {
                  const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                  return (
                    <div key={index} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 items-center bg-white dark:bg-[#0F172A] p-2.5 sm:p-2 rounded-xl border border-gray-200/80 dark:border-[#1E293B] shadow-sm">
                      <div className="w-full col-span-5">
                        <label className="sm:hidden text-xs text-gray-500 font-medium mb-1 block">Procedimiento</label>
                        <Input
                          list="clinic-treatments-list"
                          placeholder="Ej. Limpieza dental"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className="rounded-xl h-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                        />
                      </div>
                      <div className="w-full col-span-2">
                        <label className="sm:hidden text-xs text-gray-500 font-medium mb-1 block">Cantidad</label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="rounded-xl h-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] text-center"
                        />
                      </div>
                      <div className="w-full col-span-2">
                        <label className="sm:hidden text-xs text-gray-500 font-medium mb-1 block">Monto Unitario (Bs.)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          className="rounded-xl h-10 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] text-right"
                        />
                      </div>
                      <div className="w-full col-span-2">
                        <label className="sm:hidden text-xs text-gray-500 font-medium mb-1 block">Subtotal</label>
                        <div className="h-10 flex items-center justify-end px-3 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] font-semibold text-xs text-[#0284C7] dark:text-[#38BDF8]">
                          Bs {fmtDec(lineSubtotal)}
                        </div>
                      </div>
                      <div className="w-full sm:w-auto col-span-1 flex justify-end sm:justify-center">
                        {form.items.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="w-10" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Monto Total</Label>
                <div className="h-11 flex items-center justify-between px-4 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#0284C7]/20 dark:border-[#0284C7]/30 font-bold text-lg text-[#0284C7] dark:text-[#38BDF8]">
                  <span>Total a pagar:</span>
                  <span>{fmt(currentTotal)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Método de pago</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    {Object.entries(METHOD_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Cuenta de destino (Caja / Banco)</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm(f => ({ ...f, account_id: v }))}>
                  <SelectTrigger className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]">
                    <SelectValue placeholder="Seleccionar Caja o Banco..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111827] border-[#D1D5DB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Notas (opcional)</Label>
                <Input
                  placeholder="Referencia, comentario..."
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

          </form>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeModal} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-xl">
              Cancelar
            </Button>
            <Button
              disabled={saving}
              className="bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl shadow-md shadow-[#0284C7]/20 px-6"
              onClick={handleSubmit as any}
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</> : 'Guardar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirmPayment} onOpenChange={(open) => !open && setDeleteConfirmPayment(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Eliminar Registro de Pago
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 pt-2">
              ¿Estás seguro de que deseas eliminar este pago de{' '}
              <strong className="text-gray-900 dark:text-gray-200 font-semibold">
                {deleteConfirmPayment ? fmt(Number(deleteConfirmPayment.amount)) : ''}
              </strong>
              {deleteConfirmPayment?.patient && ` perteneciente a ${deleteConfirmPayment.patient.first_name} ${deleteConfirmPayment.patient.last_name}`}?
              <br /><br />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Esta acción eliminará el comprobante y reversará los asientos contables asociados en el sistema.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              disabled={!!deletingId}
              onClick={() => setDeleteConfirmPayment(null)}
              className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              disabled={!!deletingId}
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {deletingId ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Eliminando...</> : 'Sí, eliminar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
