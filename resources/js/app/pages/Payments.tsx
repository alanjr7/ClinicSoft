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
interface PatientOption  { id: string; first_name: string; last_name: string; national_id: string | null; }
interface AccountOption  { id: string; code: string; name: string; }
interface PaymentItem    { id?: string; description: string; amount: number; }
interface PaymentRecord  {
  id: string;
  patient_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string | null;
  created_at: string;
  notes: string | null;
  patient?:  { id: string; first_name: string; last_name: string; national_id: string | null; } | null;
  items?: PaymentItem[];
}

interface Props {
  payments:  PaymentRecord[];
  patients:  PatientOption[];
  accounts:  AccountOption[];
  flash?:    { success?: string; new_payment_id?: string; };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount: number) {
  return amount.toLocaleString('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

const METHOD_LABELS: Record<string, string> = {
  cash:         'Efectivo',
  card:         'Tarjeta',
  transfer:     'Transferencia',
  check:        'Cheque',
  other:        'Otro',
};

Payments.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Payments({ payments, patients, accounts, flash }: Props) {
  const [showModal, setShowModal]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirmPayment, setDeleteConfirmPayment] = useState<PaymentRecord | null>(null);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  
  const [form, setForm] = useState({
    patient_id:     '',
    patient_name:   '',
    patient_ci:     '',
    payment_method: 'cash',
    notes:          '',
    account_id:     '',
    items:          [{ description: '', amount: '' }]
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
  const currentTotal = form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const openModal = () => { 
    setForm({ 
      patient_id: '', patient_name: '', patient_ci: '', 
      payment_method: 'cash', notes: '', account_id: '',
      items: [{ description: '', amount: '' }] 
    }); 
    setSaveError(null); 
    setShowModal(true); 
  };
  const closeModal = () => { setShowModal(false); setSaveError(null); };

  function handlePatientNameChange(val: string) {
    let newCi = form.patient_ci;
    let newId = form.patient_id;
    // Basic search
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
    setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }));
  }

  function removeItem(index: number) {
    if (form.items.length === 1) return;
    setForm(f => {
      const newItems = [...f.items];
      newItems.splice(index, 1);
      return { ...f, items: newItems };
    });
  }

  function updateItem(index: number, field: 'description' | 'amount', value: string) {
    setForm(f => {
      const newItems = [...f.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...f, items: newItems };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_name || form.items.some(i => !i.description || !i.amount)) {
      setSaveError('Falta información del paciente o de los ítems de cobro.');
      return;
    }
    setSaving(true);
    
    const payload = {
      ...form,
      patient_id: form.patient_id || null,
      account_id: form.account_id || null,
      amount: form.items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
    };

    router.post('/payments', payload as any, {
      onSuccess: closeModal,
      onError:   (errors) => {
        console.error("Validation errors:", errors);
        const errorMsg = Object.values(errors).join(', ');
        setSaveError('Revise los datos ingresados. ' + errorMsg);
      },
      onFinish:  () => setSaving(false),
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
                    const firstName = payment.patient?.first_name ?? '?';
                    const lastName  = payment.patient?.last_name  ?? '';
                    const itemsDesc = payment.items?.map(i => i.description).join(', ') || 'Pago';
                    return (
                      <TableRow key={payment.id} className="border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/60 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-white font-medium">{initials(firstName, lastName)}</span>
                            </div>
                            <div>
                              <span className="text-[#111827] dark:text-[#F8FAFC] font-medium block">{firstName} {lastName}</span>
                              {payment.patient?.national_id && <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">CI: {payment.patient.national_id}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#6B7280] dark:text-gray-300 max-w-[200px] truncate" title={itemsDesc}>
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

      {/* Register Payment Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Registrar Pago</DialogTitle>
            <DialogDescription className="hidden">Registrar un nuevo pago para un paciente</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {saveError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {saveError}
              </div>
            )}

            {/* Patient Name & CI */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Nombre del paciente *</Label>
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
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Carnet de Identidad (CI)</Label>
                <Input
                  placeholder="Ej. 1234567"
                  value={form.patient_ci}
                  onChange={(e) => setForm(f => ({ ...f, patient_ci: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Procedimiento / Motivo de cobro *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1 text-[#0284C7] dark:text-[#38BDF8] border-[#0284C7] dark:border-[#0284C7] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10">
                  <Plus className="w-3.5 h-3.5" /> Agregar ítem
                </Button>
              </div>
              
              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Ej. Limpieza dental"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] flex-1"
                    />
                    <Input
                      type="number" min="0" step="0.01"
                      placeholder="Monto"
                      value={item.amount}
                      onChange={(e) => updateItem(index, 'amount', e.target.value)}
                      className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] w-32"
                    />
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" onClick={() => removeItem(index)} className="h-11 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Monto Total</Label>
                <div className="h-11 flex items-center px-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] font-bold text-[#111827] dark:text-[#F8FAFC]">
                  {fmt(currentTotal)}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Método de pago</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Cuenta de destino (Caja / Banco)</Label>
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
                <Label className="text-[#111827] dark:text-[#F8FAFC]">Notas (opcional)</Label>
                <Input
                  placeholder="Referencia, comentario..."
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="rounded-xl h-11 border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

          </form>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B]">Cancelar</Button>
            <Button
              disabled={saving}
              className="bg-[#0284C7] hover:bg-[#075985] text-white"
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
              className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              disabled={!!deletingId}
              onClick={handleDeletePayment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Eliminando...</> : 'Sí, eliminar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
