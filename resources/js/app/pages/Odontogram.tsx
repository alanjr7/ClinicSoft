import { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
  Printer,
  Save,
  User,
  Smile,
  ChevronDown,
  Pencil,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import Layout from "../components/Layout";
import { Badge } from "../components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient { id: string; first_name: string; last_name: string; }
interface Snapshot { id: string; snapshot_data: Record<string, string>; notes: string | null; created_at: string; }
interface Props { patients: Patient[]; snapshot: Snapshot | null; patient_id: string | null; }

// ─── Tooth conditions ─────────────────────────────────────────────────────────
const CONDITIONS = [
  { value: "healthy",     label: "Sano",        fill: "#ECFDF5", stroke: "#10B981", text: "#065F46" },
  { value: "cavity",      label: "Caries",      fill: "#FEE2E2", stroke: "#EF4444", text: "#991B1B" },
  { value: "crown",       label: "Corona",      fill: "#FEF9C3", stroke: "#EAB308", text: "#713F12" },
  { value: "extraction",  label: "Extracción",  fill: "#F3F4F6", stroke: "#9CA3AF", text: "#374151" },
  { value: "implant",     label: "Implante",    fill: "#DBEAFE", stroke: "#3B82F6", text: "#1E40AF" },
  { value: "endodontics", label: "Endodoncia",  fill: "#EDE9FE", stroke: "#8B5CF6", text: "#4C1D95" },
  { value: "filled",      label: "Obturado",    fill: "#D1FAE5", stroke: "#059669", text: "#064E3B" },
  { value: "missing",     label: "Ausente",     fill: "#F9FAFB", stroke: "#D1D5DB", text: "#9CA3AF" },
];

const TOOTH_NAMES: Record<number, string> = {
  11:"Inc. Central", 12:"Inc. Lateral", 13:"Canino",
  14:"Premolar 1",   15:"Premolar 2",   16:"Molar 1",    17:"Molar 2",    18:"Molar 3",
  21:"Inc. Central", 22:"Inc. Lateral", 23:"Canino",
  24:"Premolar 1",   25:"Premolar 2",   26:"Molar 1",    27:"Molar 2",    28:"Molar 3",
  31:"Inc. Central", 32:"Inc. Lateral", 33:"Canino",
  34:"Premolar 1",   35:"Premolar 2",   36:"Molar 1",    37:"Molar 2",    38:"Molar 3",
  41:"Inc. Central", 42:"Inc. Lateral", 43:"Canino",
  44:"Premolar 1",   45:"Premolar 2",   46:"Molar 1",    47:"Molar 2",    48:"Molar 3",
};

// ─── Pre-calculated tooth positions ──────────────────────────────────────────
type ToothPos = { num: number; x: number; y: number; rot: number; };

const UPPER_TEETH: ToothPos[] = [
  { num: 18, x: 83,  y: 220, rot: -45 },
  { num: 17, x: 132, y: 175, rot: -41 },
  { num: 16, x: 181, y: 136, rot: -36 },
  { num: 15, x: 230, y: 103, rot: -31 },
  { num: 14, x: 279, y: 78,  rot: -25 },
  { num: 13, x: 328, y: 58,  rot: -18 },
  { num: 12, x: 377, y: 45,  rot: -11 },
  { num: 11, x: 426, y: 39,  rot: -4  },
  { num: 21, x: 474, y: 39,  rot:  4  },
  { num: 22, x: 523, y: 45,  rot:  11 },
  { num: 23, x: 572, y: 58,  rot:  18 },
  { num: 24, x: 621, y: 78,  rot:  25 },
  { num: 25, x: 670, y: 103, rot:  31 },
  { num: 26, x: 719, y: 136, rot:  36 },
  { num: 27, x: 768, y: 175, rot:  41 },
  { num: 28, x: 817, y: 220, rot:  45 },
];

const LOWER_TEETH: ToothPos[] = [
  { num: 48, x: 83,  y: 408, rot: 135 },
  { num: 47, x: 132, y: 453, rot: 139 },
  { num: 46, x: 181, y: 492, rot: 144 },
  { num: 45, x: 230, y: 525, rot: 149 },
  { num: 44, x: 279, y: 550, rot: 155 },
  { num: 43, x: 328, y: 570, rot: 162 },
  { num: 42, x: 377, y: 583, rot: 169 },
  { num: 41, x: 426, y: 589, rot: 176 },
  { num: 31, x: 474, y: 589, rot: 184 },
  { num: 32, x: 523, y: 583, rot: 191 },
  { num: 33, x: 572, y: 570, rot: 198 },
  { num: 34, x: 621, y: 550, rot: 205 },
  { num: 35, x: 670, y: 525, rot: 211 },
  { num: 36, x: 719, y: 492, rot: 216 },
  { num: 37, x: 768, y: 453, rot: 221 },
  { num: 38, x: 817, y: 408, rot: 225 },
];

function toothSize(num: number): [number, number] {
  const p = num % 10;
  if (p <= 2) return [32, 26];
  if (p === 3) return [34, 34];
  if (p <= 5) return [36, 32];
  return [44, 42];
}

function getToothPath(p: number, w: number, h: number) {
  if (p <= 2) {
    return `M ${-w*0.45} ${-h*0.2} Q ${-w*0.45} ${-h*0.5} 0 ${-h*0.5} Q ${w*0.45} ${-h*0.5} ${w*0.45} ${-h*0.2} Q ${w*0.35} ${h*0.5} 0 ${h*0.5} Q ${-w*0.35} ${h*0.5} ${-w*0.45} ${-h*0.2} Z`;
  }
  if (p === 3) {
    return `M 0 ${-h*0.5} Q ${w*0.5} ${-h*0.2} ${w*0.45} ${h*0.1} Q ${w*0.3} ${h*0.5} 0 ${h*0.5} Q ${-w*0.3} ${h*0.5} ${-w*0.45} ${h*0.1} Q ${-w*0.5} ${-h*0.2} 0 ${-h*0.5} Z`;
  }
  if (p <= 5) {
    return `M ${-w*0.3} ${-h*0.5} Q ${w*0.3} ${-h*0.5} ${w*0.45} ${-h*0.15} Q ${w*0.45} ${h*0.15} ${w*0.3} ${h*0.5} Q ${-w*0.3} ${h*0.5} ${-w*0.45} ${h*0.15} Q ${-w*0.45} ${-h*0.15} ${-w*0.3} ${-h*0.5} Z`;
  }
  return `M ${-w*0.4} ${-h*0.5} Q ${w*0.4} ${-h*0.5} ${w*0.5} ${-h*0.2} Q ${w*0.5} ${h*0.2} ${w*0.4} ${h*0.5} Q ${-w*0.4} ${h*0.5} ${-w*0.5} ${h*0.2} Q ${-w*0.5} ${-h*0.2} ${-w*0.4} ${-h*0.5} Z`;
}

Odontogram.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Odontogram({ patients, snapshot, patient_id }: Props) {
  const [selectedPatient, setSelectedPatient] = useState(patient_id || "");
  const [teethStatus, setTeethStatus] = useState<Record<string, string>>(
    snapshot?.snapshot_data || {}
  );
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState("cavity");
  const [notes, setNotes] = useState(snapshot?.notes || "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successFlash, setSuccessFlash] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Sync state when snapshot or patient changes
  useEffect(() => {
    setTeethStatus(snapshot?.snapshot_data || {});
    setNotes(snapshot?.notes || "");
    setIsEditing(!snapshot && !!selectedPatient);
    setSelectedTooth(null);
  }, [snapshot, selectedPatient]);

  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    router.get("/odontogram", { patient_id: patientId }, { preserveState: false });
  };

  const handleToothClick = (num: number) => {
    setSelectedTooth(num);
    if (isEditing) {
      setTeethStatus(prev => ({ ...prev, [String(num)]: selectedCondition }));
    }
  };

  const getCond = (num: number) =>
    CONDITIONS.find(c => c.value === (teethStatus[String(num)] || "healthy")) ?? CONDITIONS[0];

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTeethStatus(snapshot?.snapshot_data || {});
    setNotes(snapshot?.notes || "");
    setIsEditing(false);
  };

  const flashSuccess = (msg: string) => {
    setSuccessFlash(msg);
    window.setTimeout(() => setSuccessFlash(null), 3000);
  };

  const handleSave = () => {
    if (!selectedPatient) return;
    setSaving(true);
    router.post(
      "/odontogram",
      {
        patient_id: selectedPatient,
        snapshot_data: teethStatus,
        notes,
      },
      {
        onSuccess: () => {
          flashSuccess("Odontograma guardado exitosamente.");
          setIsEditing(false);
        },
        onFinish: () => setSaving(false),
      }
    );
  };

  const selectedPatientObj = patients.find(p => p.id === selectedPatient);

  // ─── Render a single tooth in the SVG ──────────────────────────────────────
  const renderTooth = (tp: ToothPos) => {
    const cond = getCond(tp.num);
    const isSelected = selectedTooth === tp.num;
    const isMissing = teethStatus[String(tp.num)] === "missing" || teethStatus[String(tp.num)] === "extraction";
    const [w, h] = toothSize(tp.num);
    const p = tp.num % 10;
    const isMolar = p >= 6;
    const isPremolar = p === 4 || p === 5;

    return (
      <g
        key={tp.num}
        transform={`translate(${tp.x},${tp.y}) rotate(${tp.rot})`}
        onClick={() => handleToothClick(tp.num)}
        style={{ cursor: "pointer" }}
      >
        {/* Tooth crown (occlusal shape) */}
        <path
          d={getToothPath(p, w, h)}
          fill={cond.fill}
          stroke={isSelected ? "#0284C7" : cond.stroke}
          strokeWidth={isSelected ? 2.5 : 1.5}
          style={isSelected ? { filter: "drop-shadow(0 0 6px rgba(20,184,166,0.8))" } : undefined}
        />
        {/* Molar fissures */}
        {isMolar && (
          <path
            d={`M ${-w*0.25} 0 Q 0 ${h*0.15} ${w*0.25} 0 M 0 ${-h*0.25} Q ${w*0.15} 0 0 ${h*0.25}`}
            stroke={cond.stroke} strokeWidth={1.5} fill="none" opacity={0.6}
          />
        )}
        {/* Premolar fissure */}
        {isPremolar && (
          <path
            d={`M ${-w*0.2} 0 Q 0 ${h*0.1} ${w*0.2} 0`}
            stroke={cond.stroke} strokeWidth={1.5} fill="none" opacity={0.6}
          />
        )}
        {/* X mark for missing/extracted */}
        {isMissing && (
          <path d={`M ${-w*0.4} ${-h*0.4} L ${w*0.4} ${h*0.4} M ${w*0.4} ${-h*0.4} L ${-w*0.4} ${h*0.4}`}
            stroke="#9CA3AF" strokeWidth={2} fill="none" />
        )}
        {/* Tooth number */}
        <g transform={`translate(0, ${-h*0.5 - 14}) rotate(${-tp.rot})`}>
          <text
            x={0} y={0}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontWeight={700}
            className="fill-[#4B5563] dark:fill-[#94A3B8]"
          >
            {tp.num}
          </text>
        </g>
      </g>
    );
  };

  return (
    <>
      <style>{`
        @media print {
          * {
            visibility: hidden !important;
            overflow: visible !important;
          }
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          #app-root {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          #app-sidebar {
            display: none !important;
          }
          #app-main {
            display: block !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-content {
            visibility: visible !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 20px !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: visible !important;
          }
          .print-content * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          svg {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200 print-content">

        {/* ── HEADER ── */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] flex items-center gap-2">
                <Smile className="w-7 h-7 text-[#0284C7] dark:text-[#38BDF8]" />
                Odontograma
              </h1>
              {selectedPatient && (
                <Badge className={isEditing ? "bg-[#0284C7] text-white text-xs font-semibold" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-none text-xs"}>
                  {isEditing ? "Modo Edición" : "Modo Lectura"}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8]">
              Diagrama dental interactivo — Numeración FDI/ISO
            </p>
          </div>

          {/* Action Buttons: Imprimir, Editar, Cancelar, Guardar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              disabled={!selectedPatient}
              className="no-print flex items-center gap-2 border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#1E293B] cursor-pointer transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              Imprimir
            </button>

            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                disabled={!selectedPatient}
                className="no-print flex items-center gap-2 bg-[#0284C7] hover:bg-[#075985] text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-md shadow-[#0284C7]/20 transition-all hover:scale-[1.02]"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="no-print flex items-center gap-1.5 border border-gray-300 dark:border-[#334155] bg-white dark:bg-[#0F172A] text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#1E293B] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedPatient}
                  className="no-print flex items-center gap-2 bg-[#0284C7] hover:bg-[#075985] text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-md shadow-[#0284C7]/20 transition-all hover:scale-[1.02]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Flash Message */}
        {successFlash && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-[#0284C7]/30 text-[#075985] dark:text-[#38BDF8] text-sm flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200 no-print">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{successFlash}</span>
          </div>
        )}

        {/* ── PATIENT SELECTOR ── */}
        <div className="mb-6 no-print">
          <div className="relative inline-flex items-center gap-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] px-4 py-2.5 shadow-sm">
            <User className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] shrink-0" />
            <select
              className="text-sm font-medium text-[#111827] dark:text-[#F8FAFC] bg-transparent border-none outline-none cursor-pointer pr-8 appearance-none dark:bg-[#0F172A]"
              value={selectedPatient}
              onChange={e => handlePatientChange(e.target.value)}
            >
              <option value="" className="dark:bg-[#0F172A]">— Seleccionar paciente —</option>
              {patients.map(p => {
                const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                return (
                  <option key={p.id} value={p.id} className="dark:bg-[#0F172A]">
                    {fullName || 'Sin nombre'}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3 pointer-events-none" />
          </div>
        </div>

        {/* Print header */}
        <div className="print-only mb-4 text-center border-b pb-3">
          <h2 className="text-lg font-bold">ODONTOGRAMA CLÍNICO — Numeración FDI</h2>
          {selectedPatientObj && (
            <p className="text-sm mt-1">
              Paciente: <strong>{`${selectedPatientObj.first_name || ''} ${selectedPatientObj.last_name || ''}`.trim()}</strong>
              &nbsp; · &nbsp;
              Fecha: {new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── MAIN SVG ODONTOGRAM ── */}
          <div className="flex-1 bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm p-4 sm:p-6" ref={printRef}>
            
            {/* Banner de Modo Edición */}
            {isEditing && (
              <div className="mb-4 p-3 rounded-xl bg-[#F0F9FF] dark:bg-[#0284C7]/10 border border-[#BAE6FD] dark:border-[#0284C7]/30 text-xs text-[#075985] dark:text-[#38BDF8] flex items-center justify-between no-print">
                <span className="font-semibold flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Modo Edición activo: Haz clic en un diente para asignarle el estado seleccionado.
                </span>
                <span className="opacity-80">Guarda los cambios al finalizar</span>
              </div>
            )}

            <svg
              viewBox="0 0 900 660"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block" }}
            >
              {/* ──────── UPPER ARCH GUIDE CURVE ──────── */}
              <path
                d="M 83 230 Q 450 -70 817 230"
                fill="none" stroke="#E5E7EB" strokeWidth={1.5} strokeDasharray="5 4"
                className="stroke-[#E5E7EB] dark:stroke-[#334155]"
              />

              {/* PALATE label */}
              <text x={450} y={160} textAnchor="middle" fontSize={28} fontWeight={800}
                className="fill-[#F3F4F6] dark:fill-[#1E293B]" letterSpacing={6}>PALADAR</text>

              {/* Quadrant labels — upper */}
              <text x={260} y={315} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight={600}>
                Superior Derecha
              </text>
              <text x={640} y={315} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight={600}>
                Superior Izquierda
              </text>

              {/* Upper teeth */}
              {UPPER_TEETH.map(renderTooth)}

              {/* ──────── DIVIDER ──────── */}
              {/* Vertical center line */}
              <line x1={450} y1={0} x2={450} y2={660}
                stroke="#D1D5DB" strokeWidth={1} strokeDasharray="5 4"
                className="stroke-[#D1D5DB] dark:stroke-[#334155]" />

              {/* Horizontal divider line */}
              <line x1={20} y1={330} x2={880} y2={330} stroke="#374151" strokeWidth={2}
                className="stroke-[#374151] dark:stroke-[#64748B]" />

              {/* Quadrant labels — lower */}
              <text x={260} y={350} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight={600}>
                Inferior Derecha
              </text>
              <text x={640} y={350} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight={600}>
                Inferior Izquierda
              </text>

              {/* ──────── LOWER ARCH GUIDE CURVE ──────── */}
              <path
                d="M 83 400 Q 450 730 817 400"
                fill="none" stroke="#E5E7EB" strokeWidth={1.5} strokeDasharray="5 4"
                className="stroke-[#E5E7EB] dark:stroke-[#334155]"
              />

              {/* Lower teeth */}
              {LOWER_TEETH.map(renderTooth)}

              {/* TONGUE label */}
              <text x={450} y={500} textAnchor="middle" fontSize={28} fontWeight={800}
                className="fill-[#F3F4F6] dark:fill-[#1E293B]" letterSpacing={6}>LENGUA</text>
            </svg>

            {/* ── LEGEND ── */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1E293B] flex flex-wrap gap-3 justify-center">
              {CONDITIONS.map(c => (
                <div key={c.value} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded border-2 flex-shrink-0"
                    style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{c.label}</span>
                </div>
              ))}
            </div>

            {/* ── NOTES ── */}
            <div className="mt-6 no-print">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Observaciones clínicas
              </label>
              <textarea
                rows={3}
                disabled={!isEditing}
                className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none resize-none transition-colors ${
                  isEditing
                    ? "border-gray-300 dark:border-[#334155] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] focus:ring-2 focus:ring-[#0284C7]"
                    : "border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#1E293B]/40 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                }`}
                placeholder={isEditing ? "Ej: Paciente con bruxismo nocturno, revisar pieza 36..." : "Sin observaciones registradas."}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            {notes && (
              <div className="mt-2 print-only border border-gray-200 rounded p-2 text-sm text-gray-700">
                <strong>Observaciones:</strong> {notes}
              </div>
            )}
          </div>

          {/* ── SIDE PANEL ── */}
          <div className="xl:w-64 space-y-4 no-print">

            {/* Selected tooth info */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Pieza Seleccionada
              </h3>
              {selectedTooth ? (
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#075985] flex items-center justify-center shadow-md shadow-[#0284C7]/20">
                    <span className="text-xl font-bold text-white">{selectedTooth}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">{TOOTH_NAMES[selectedTooth]}</p>
                  <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: getCond(selectedTooth).fill,
                      color: getCond(selectedTooth).text,
                      border: `1.5px solid ${getCond(selectedTooth).stroke}`
                    }}>
                    {getCond(selectedTooth).label}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-5">
                  Haz clic en un diente para seleccionarlo
                </p>
              )}
            </div>

            {/* Condition picker */}
            <div className={`bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm p-4 ${
              !isEditing ? "opacity-75" : ""
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Estado a Aplicar
                </h3>
                {!isEditing && (
                  <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">Lectura</Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    disabled={!isEditing}
                    onClick={() => {
                      setSelectedCondition(c.value);
                      if (selectedTooth && isEditing) {
                        setTeethStatus(prev => ({ ...prev, [String(selectedTooth)]: c.value }));
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left text-xs font-medium transition-all ${
                      !isEditing
                        ? "cursor-not-allowed opacity-60 border-gray-100 dark:border-[#1E293B]"
                        : selectedCondition === c.value
                          ? "cursor-pointer border-[#0284C7] bg-[#F0F9FF] dark:bg-[#0284C7]/10 text-[#075985] dark:text-[#38BDF8]"
                          : "cursor-pointer border-gray-100 dark:border-[#1E293B] text-gray-600 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1E293B]/60"
                    }`}
                  >
                    <span className="w-4 h-4 rounded border flex-shrink-0"
                      style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {Object.keys(teethStatus).length > 0 && (
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm p-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Resumen Dental</h3>
                <div className="space-y-2">
                  {CONDITIONS.filter(c => c.value !== "healthy").map(c => {
                    const count = Object.values(teethStatus).filter(v => v === c.value).length;
                    if (count === 0) return null;
                    return (
                      <div key={c.value} className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <span className="w-3 h-3 rounded-sm border"
                            style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
                          {c.label}
                        </span>
                        <span className="font-bold" style={{ color: c.text }}>{count}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-100 dark:border-[#1E293B] pt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Total piezas registradas</span>
                    <span className="font-bold text-[#111827] dark:text-[#F8FAFC]">{Object.keys(teethStatus).length}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
