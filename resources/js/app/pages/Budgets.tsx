import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Trash2, FileText, Download, History, X, Printer,
  Search, Building2, Phone, MapPin, CalendarDays, CheckCircle2,
  Clock, AlertCircle, ChevronRight, Loader2,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import Layout from "../components/Layout";
import { downloadPdfDirect } from "../utils/downloadPdf";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Treatment {
  id: string;
  name: string;
  base_price: number;
}

interface BudgetLineItem {
  id: string;        // temp key
  treatmentId: string | null;
  treatment: string;
  quantity: number;
  unitPrice: number; // editable, in Bs.
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface BudgetItem {
  id: string;
  treatment_id: string;
  treatment?: { name: string };
  quantity: number;
  unit_price: number;
  total: number;
}

interface Budget {
  id: string;
  budget_number: string;
  status: string;
  subtotal: number;
  total: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  patient?: { id: string; first_name: string; last_name: string };
  items: BudgetItem[];
}

interface Clinic {
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
}

interface PageProps {
  budgets: Budget[];
  patients: Patient[];
  treatments: Treatment[];
  clinic: Clinic;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmtBs = (n: number) =>
  `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:    { label: "Borrador",  color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",     icon: Clock },
  sent:     { label: "Enviada",   color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",         icon: ChevronRight },
  approved: { label: "Aprobada",  color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40",           icon: AlertCircle },
};

/* ─── Autocomplete component ─────────────────────────────────────────────── */

interface AutocompleteProps {
  treatments: Treatment[];
  onSelect: (t: Treatment) => void;
  value: string;
  onChange: (v: string) => void;
}

function ProcedureAutocomplete({ treatments, onSelect, value, onChange }: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length > 0
    ? treatments.filter((t) =>
        t.name.toLowerCase().includes(value.trim().toLowerCase())
      )
    : treatments;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#BAE6FD] dark:bg-[#0284C7]/30 text-[#075985] dark:text-[#38BDF8] rounded px-0.5 not-italic font-semibold">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === "ArrowDown") setOpen(true); return; }
    if (e.key === "ArrowDown") setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    else if (e.key === "ArrowUp") setActiveIdx((i) => Math.max(i - 1, 0));
    else if (e.key === "Enter" && filtered[activeIdx]) {
      onSelect(filtered[activeIdx]);
      setOpen(false);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Escribe el procedimiento… ej. limpieza"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-[#0284C7] transition-all"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-[#0F172A] rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
          <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] px-4 pt-3 pb-1">
            Procedimientos sugeridos
          </p>
          <ul className="max-h-56 overflow-y-auto pb-2">
            {filtered.map((t, i) => (
              <li
                key={t.id}
                onMouseDown={() => { onSelect(t); setOpen(false); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  i === activeIdx ? "bg-[#F0F9FF] dark:bg-[#0284C7]/15" : "hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
                }`}
              >
                <span className="text-sm text-[#111827] dark:text-[#F8FAFC]">
                  {highlight(t.name, value)}
                </span>
                <span className="text-xs text-[#0284C7] dark:text-[#38BDF8] font-medium ml-4 shrink-0">
                  {fmtBs(t.base_price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── History Panel ──────────────────────────────────────────────────────── */

interface HistoryPanelProps {
  budgets: Budget[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

function HistoryPanel({ budgets, onClose, onDelete }: HistoryPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-[#0F172A] z-50 shadow-2xl flex flex-col animate-slide-in-right border-l dark:border-[#1E293B]">
        <div className="flex items-center justify-between p-6 border-b border-[#F3F4F6] dark:border-[#1E293B]">
          <div>
            <h2 className="text-xl font-semibold text-[#111827] dark:text-[#F8FAFC]">Cotizaciones anteriores</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{budgets.length} cotización{budgets.length !== 1 ? "es" : ""} registrada{budgets.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <FileText className="w-16 h-16 text-[#E5E7EB] dark:text-gray-700 mb-4" />
              <p className="text-[#9CA3AF] dark:text-[#94A3B8] text-sm">Aún no hay cotizaciones registradas</p>
            </div>
          ) : (
            budgets.map((b) => {
              const st = statusConfig[b.status] ?? statusConfig.draft;
              const Icon = st.icon;
              const patientName = b.patient
                ? `${b.patient.first_name} ${b.patient.last_name}`
                : "Sin paciente";
              const date = b.valid_until
                ? new Date(b.valid_until).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
                : null;

              return (
                <div
                  key={b.id}
                  className="bg-[#F8FAFC] dark:bg-[#111827] rounded-2xl p-4 border border-[#F3F4F6] dark:border-[#1E293B] hover:border-[#0284C7]/30 dark:hover:border-[#0284C7]/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] text-sm">{b.budget_number}</p>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{patientName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${st.color}`}>
                      <Icon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-[#0284C7] dark:text-[#38BDF8]">{fmtBs(b.total ?? 0)}</p>
                      {date && (
                        <p className="text-[10px] text-[#9CA3AF] dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" /> Válida hasta {date}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadPdfDirect(`/budgets/${b.id}/pdf`, `Presupuesto-${b.budget_number || b.id.slice(0, 8)}.pdf`)}
                        title="Descargar PDF"
                        className="p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0284C7] dark:hover:text-[#38BDF8] hover:border-[#0284C7] dark:hover:border-[#0284C7] transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(b.id)}
                        title="Eliminar cotización"
                        className="p-2 rounded-xl bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B] text-[#6B7280] dark:text-[#94A3B8] hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

Budgets.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Budgets() {
  const { budgets, patients, treatments, clinic } = usePage<{ props: PageProps } & { props: any }>().props as unknown as PageProps;

  /* Form state */
  const [lines, setLines] = useState<BudgetLineItem[]>([]);
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  /* Quotation meta */
  const [patientName, setPatientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  /* UI state */
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  /* Select a treatment from autocomplete */
  const handleSelectTreatment = (t: Treatment) => {
    setSelectedTreatment(t);
    setSearch(t.name);
    setUnitPrice(t.base_price);
  };

  /* Add line item */
  const addLine = () => {
    const procedureName = selectedTreatment ? selectedTreatment.name : search.trim();
    if (!procedureName || unitPrice <= 0) return;
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        treatmentId: selectedTreatment?.id || null,
        treatment: procedureName,
        quantity,
        unitPrice,
      },
    ]);
    setSearch("");
    setSelectedTreatment(null);
    setQuantity(1);
    setUnitPrice(0);
  };

  /* Remove line item */
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));

  /* Totals */
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = subtotal; // Bolivia: sin IVA en servicios dentales

  /* Save budget */
  const handleSave = useCallback(() => {
    if (lines.length === 0) return;

    setSaving(true);
    router.post(
      "/budgets",
      {
        patient_id: null,
        patient_name: patientName.trim() || "Paciente Nuevo",
        valid_until: validUntil || null,
        notes: notes || null,
        status: "draft",
        tax_rate: 0,
        discount_amount: 0,
        items: lines.map((l) => ({
          treatment_id: l.treatmentId,
          description: l.treatment,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          discount_amount: 0,
        })),
      },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          const flash = page.props.flash as any;
          if (flash?.new_budget_id) {
            downloadPdfDirect(`/budgets/${flash.new_budget_id}/pdf`, `Presupuesto-${flash.new_budget_id.slice(0, 8)}.pdf`);
          }
          setLines([]);
          setPatientName("");
          setValidUntil("");
          setNotes("");
          setSaving(false);
        },
        onError: () => setSaving(false),
      }
    );
  }, [lines, validUntil, notes, patients]);

  /* Delete budget */
  const handleDelete = (id: string) => {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    router.delete(`/budgets/${id}`, { preserveScroll: true });
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* ── Clinic Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt="Logo clínica" className="h-14 w-14 object-contain rounded-xl border border-[#F3F4F6] dark:border-[#1E293B]" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] leading-tight">
                {clinic?.name ?? "Clínica Dental"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {clinic?.address && (
                  <span className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    <MapPin className="w-3 h-3" /> {clinic.address}
                  </span>
                )}
                {clinic?.phone && (
                  <span className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    <Phone className="w-3 h-3" /> {clinic.phone}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#9CA3AF] dark:text-gray-400 mt-0.5">Nueva cotización de tratamiento</p>
            </div>
          </div>

          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#374151] dark:text-gray-200 hover:border-[#0284C7] dark:hover:border-[#0284C7] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-all shadow-sm text-sm font-medium"
          >
            <History className="w-4 h-4" />
            <span>Cotizaciones anteriores</span>
            {budgets.length > 0 && (
              <span className="bg-[#0284C7] text-white text-xs rounded w-5 h-5 flex items-center justify-center font-bold">
                {budgets.length > 99 ? "99+" : budgets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column — form + table */}
        <div className="xl:col-span-2 space-y-5">

          {/* Add procedure card */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-lg">Agregar procedimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Procedure autocomplete */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Procedimiento</Label>
                <ProcedureAutocomplete
                  treatments={treatments}
                  value={search}
                  onChange={(v) => { setSearch(v); if (!v) { setSelectedTreatment(null); setUnitPrice(0); } }}
                  onSelect={handleSelectTreatment}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-[#0284C7]"
                  />
                </div>
                {/* Unit price */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                    Precio unitario <span className="text-[#0284C7] dark:text-[#38BDF8] font-semibold">(Bs.)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280] dark:text-[#94A3B8] font-medium pointer-events-none">Bs.</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={unitPrice || ""}
                      placeholder="0.00"
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="h-12 pl-10 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-[#0284C7]"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={addLine}
                disabled={(!selectedTreatment && !search.trim()) || unitPrice <= 0}
                className="w-full h-12 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar al presupuesto
              </Button>
            </CardContent>
          </Card>

          {/* Items table */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-lg">Detalle del presupuesto</CardTitle>
                {lines.length > 0 && (
                  <span className="text-xs text-[#6B7280] dark:text-gray-300 bg-[#F3F4F6] dark:bg-[#1E293B] px-2.5 py-1 rounded">
                    {lines.length} ítem{lines.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#0284C7] dark:text-[#38BDF8]" />
                  </div>
                  <p className="text-[#374151] dark:text-gray-200 font-medium text-sm">Sin procedimientos aún</p>
                  <p className="text-[#9CA3AF] dark:text-gray-400 text-xs mt-1">Busca y agrega tratamientos arriba</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC] dark:bg-[#111827] hover:bg-[#F8FAFC] dark:hover:bg-[#111827] border-b border-[#F3F4F6] dark:border-[#1E293B]">
                        <TableHead className="text-[#374151] dark:text-gray-200 font-semibold text-xs uppercase tracking-wide">Procedimiento</TableHead>
                        <TableHead className="text-[#374151] dark:text-gray-200 font-semibold text-xs uppercase tracking-wide text-center">Cant.</TableHead>
                        <TableHead className="text-[#374151] dark:text-gray-200 font-semibold text-xs uppercase tracking-wide text-right">Precio unit.</TableHead>
                        <TableHead className="text-[#374151] dark:text-gray-200 font-semibold text-xs uppercase tracking-wide text-right">Subtotal</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((l) => (
                        <TableRow key={l.id} className="border-b border-[#F3F4F6] dark:border-[#1E293B] hover:bg-[#FAFAFA] dark:hover:bg-[#1E293B]/60 transition-colors">
                          <TableCell className="text-[#111827] dark:text-[#F8FAFC] font-medium text-sm py-3">{l.treatment}</TableCell>
                          <TableCell className="text-[#6B7280] dark:text-gray-300 text-center text-sm">{l.quantity}</TableCell>
                          <TableCell className="text-[#6B7280] dark:text-gray-300 text-right text-sm">{fmtBs(l.unitPrice)}</TableCell>
                          <TableCell className="text-[#111827] dark:text-[#F8FAFC] text-right font-semibold text-sm">{fmtBs(l.unitPrice * l.quantity)}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => removeLine(l.id)}
                              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — patient info + summary */}
        <div className="space-y-5">

          {/* Patient & meta */}
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border border-[#F3F4F6] dark:border-[#1E293B] shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-lg">Datos del paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Nombre del paciente</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ej. Juan Pérez García"
                  className="h-12 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-[#0284C7]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                    Válida hasta
                  </span>
                </Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-12 rounded-xl border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:border-[#0284C7] focus:ring-[#0284C7]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Notas (opcional)</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones, condiciones, etc."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-sm text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] resize-none focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-[#0284C7] transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="rounded-2xl border border-[#F3F4F6] dark:border-[#1E293B] bg-gradient-to-br from-[#F0F9FF] to-white dark:from-[#0F172A] dark:to-[#111827] shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#E0F2FE] dark:border-[#1E293B]">
                <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Subtotal</span>
                <span className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">{fmtBs(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-base font-bold text-[#111827] dark:text-[#F8FAFC]">TOTAL</span>
                <span className="text-2xl font-extrabold text-[#0284C7] dark:text-[#38BDF8]">{fmtBs(total)}</span>
              </div>

              <p className="text-[10px] text-[#9CA3AF] dark:text-gray-400 text-center pt-1">
                Precios en Bolivianos (Bs.) • Sin IVA
              </p>

              {validUntil && (
                <div className="flex items-center gap-2 bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-800 rounded-xl px-3 py-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Válida hasta {new Date(validUntil + "T12:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={lines.length === 0 || saving}
                  className="w-full h-12 bg-[#0284C7] hover:bg-[#075985] text-white rounded-xl font-semibold shadow-lg shadow-[#0284C7]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Guardando…
                    </span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Generar cotización
                    </>
                  )}
                </Button>

                {savedId && (
                  <button
                    type="button"
                    onClick={() => downloadPdfDirect(`/budgets/${savedId}/pdf`, `Presupuesto-${savedId.slice(0, 8)}.pdf`)}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#0284C7] dark:border-[#0284C7] text-[#0284C7] dark:text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#0284C7]/10 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── History panel ──────────────────────────────────────────────── */}
      {historyOpen && (
        <HistoryPanel
          budgets={budgets}
          onClose={() => setHistoryOpen(false)}
          onDelete={handleDelete}
        />
      )}

      {/* ── Slide-in animation ─────────────────────────────────────────── */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}
