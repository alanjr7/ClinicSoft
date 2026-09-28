import React, { useState, useMemo, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
  SmilePlus, Plus, Calendar, Clock, DollarSign, Search,
  ChevronLeft, ChevronRight, Check, X, Users, User,
  Stethoscope, TrendingUp, AlertCircle, CheckCircle2,
  Trash2, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import Layout from '../components/Layout';
import { toast } from 'sonner';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: string | number) {
  return 'Bs. ' + Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const SPANISH_WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEK_HEADERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// ── Types ────────────────────────────────────────────────────────────────────

interface OrthoAppointment {
  id: string;
  patient_id: string;
  dentist_id: string | null;
  orthodontic_plan_id: string;
  start_at: string;
  end_at: string | null;
  status: string;
  payment_status: 'pending' | 'paid';
  amount_due: number | null;
  reason: string | null;
  patient?: { id: string; first_name: string; last_name: string };
  dentist?: { id: string; first_name: string; last_name: string } | null;
}

interface OrthoPlanForm {
  patient_id: string;
  dentist_id: string;
  total_cost: string;
  initial_fee: string;
  installment_amount: string;
  duration: string;
  frequency: string;
  start_date: string;
  payment_method: string;
  general?: string;
}

interface Props {
  plans: Array<any>;
  orthoAppointments: OrthoAppointment[];
  patients: Array<any>;
  dentists: Array<any>;
}

Orthodontics.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

// ── Status helpers ───────────────────────────────────────────────────────────
const PLAN_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-[#F0FDFA] dark:bg-teal-950/40', text: 'text-[#14B8A6] dark:text-[#2DD4BF]', label: 'Activo' },
  completed: { bg: 'bg-green-50 dark:bg-green-950/40',  text: 'text-green-700 dark:text-green-300',  label: 'Completado' },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800',  text: 'text-gray-600 dark:text-gray-300',   label: 'Cancelado' },
};

// ════════════════════════════════════════════════════════════════════════════
// Main component
// ════════════════════════════════════════════════════════════════════════════

export default function Orthodontics({ plans, orthoAppointments: initialOrthoAppts, patients, dentists }: Props) {

  // ── shared state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('patients');

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1 — PATIENTS
  // ══════════════════════════════════════════════════════════════════════════
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Delete Plan state
  const [deleteModalPlan, setDeleteModalPlan] = useState<any | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);

  const handleDeletePlan = () => {
    if (!deleteModalPlan) return;
    setDeletingPlan(true);
    router.delete(`/orthodontics/${deleteModalPlan.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteModalPlan(null);
        if (expandedPlan === deleteModalPlan.id) {
          setExpandedPlan(null);
        }
      },
      onError: () => {
        toast.error('Error al eliminar el plan de ortodoncia');
      },
      onFinish: () => setDeletingPlan(false),
    });
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const name = `${plan.patient?.first_name} ${plan.patient?.last_name}`.toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || plan.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [plans, search, statusFilter]);

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2 — CALENDAR
  // ══════════════════════════════════════════════════════════════════════════
  const today = useMemo(() => startOfDay(new Date()), []);

  const [orthoAppointments, setOrthoAppointments] = useState<OrthoAppointment[]>(initialOrthoAppts);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date(today); d.setDate(1); return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(today));

  // Pay installment modal
  const [payModal, setPayModal] = useState<OrthoAppointment | null>(null);
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [paying, setPaying] = useState(false);

  const selectedDateKey = toLocalDateKey(selectedDate);
  const todayKey = toLocalDateKey(today);

  function prevMonth() {
    setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  function selectDay(day: number) {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(d);
    setWeekStart(startOfWeekMonday(d));
  }

  const monthDays = useMemo(() => {
    const year  = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const offsetSundayBased = first.getDay();
    const leadingBlanks = offsetSundayBased === 0 ? 6 : offsetSundayBased - 1;
    return { daysInMonth, leadingBlanks };
  }, [calendarMonth]);

  const monthCountsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of orthoAppointments) {
      const k = toLocalDateKey(new Date(a.start_at));
      if (
        new Date(a.start_at).getFullYear() === calendarMonth.getFullYear() &&
        new Date(a.start_at).getMonth() === calendarMonth.getMonth()
      ) {
        map.set(k, (map.get(k) ?? 0) + 1);
      }
    }
    return map;
  }, [orthoAppointments, calendarMonth]);

  const weekDaysSummary = useMemo(() => {
    const items: { date: Date; label: string; count: number; isSelected: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const k = toLocalDateKey(d);
      const count = orthoAppointments.filter(a => toLocalDateKey(new Date(a.start_at)) === k).length;
      const label = `${SPANISH_WEEKDAYS_LONG[d.getDay()].slice(0, 3)} ${String(d.getDate()).padStart(2, '0')}`;
      items.push({ date: d, label, count, isSelected: k === selectedDateKey });
    }
    return items;
  }, [weekStart, orthoAppointments, selectedDateKey]);

  const dayAppointments = useMemo(() => {
    return orthoAppointments
      .filter(a => toLocalDateKey(new Date(a.start_at)) === selectedDateKey)
      .sort((a, b) => a.start_at.localeCompare(b.start_at));
  }, [orthoAppointments, selectedDateKey]);

  const calendarHeaderLabel = `${SPANISH_MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const headerDateLabel = `${SPANISH_WEEKDAYS_LONG[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${SPANISH_MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  function handlePayInstallment() {
    if (!payModal) return;
    setPaying(true);
    router.post(`/orthodontics/appointments/${payModal.id}/pay`, { payment_method: payMethod }, {
      onSuccess: () => {
        setOrthoAppointments(prev =>
          prev.map(a => a.id === payModal.id ? { ...a, payment_status: 'paid', status: 'completed' } : a)
        );
        setPayModal(null);
        setPayMethod('cash');
      },
      onError: (errs) => {
        toast.error(errs.appointment || 'Error al procesar el cobro de la cuota');
      },
      onFinish: () => setPaying(false),
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3 — NUEVO PLAN
  // ══════════════════════════════════════════════════════════════════════════
  const [calcMode, setCalcMode] = useState<'total' | 'duration'>('total');

  const { data, setData, post, processing, errors, reset } = useForm<OrthoPlanForm>({
    patient_id: '',
    dentist_id: '',
    total_cost: '',
    initial_fee: '',
    installment_amount: '',
    duration: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  });

  const handleCalcModeChange = (mode: 'total' | 'duration') => {
    setCalcMode(mode);
    setData(prev => ({ ...prev, total_cost: '', installment_amount: '', duration: '' }));
  };

  useEffect(() => {
    const initFee = parseFloat(data.initial_fee) || 0;
    if (calcMode === 'duration') {
      const inst = parseFloat(data.installment_amount) || 0;
      const dur  = parseInt(data.duration) || 0;
      if (inst > 0 && dur > 0) {
        const total = initFee + (inst * dur);
        if (data.total_cost !== total.toString()) setData('total_cost', total.toString());
      }
    } else {
      const total = parseFloat(data.total_cost) || 0;
      const inst  = parseFloat(data.installment_amount) || 0;
      if (total > initFee && inst > 0) {
        const dur = Math.ceil((total - initFee) / inst);
        if (data.duration !== dur.toString()) setData('duration', dur.toString());
      }
    }
  }, [data.total_cost, data.initial_fee, data.installment_amount, data.duration, calcMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(data.duration) || 0;
    if (dur > 72) {
      toast.error(`El plan generaría ${dur} cuotas. El máximo permitido es de 72 cuotas (6 años). Aumenta el monto por cuota.`);
      return;
    }
    post('/orthodontics', {
      onSuccess: () => {
        reset();
        setActiveTab('patients');
      },
      onError: (errs) => {
        const msg = errs.general || errs.installment_amount || errs.total_cost || errs.patient_id || 'Error al crear el plan de ortodoncia';
        toast.error(msg);
      },
    });
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const statsActive    = plans.filter(p => p.status === 'active').length;
  const statsCompleted = plans.filter(p => p.status === 'completed').length;
  const statsPending   = orthoAppointments.filter(a => a.payment_status === 'pending').length;
  const statsRevenue   = orthoAppointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, a) => sum + (Number(a.amount_due) || 0), 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 min-h-full bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] max-w-[1400px] mx-auto transition-colors duration-200">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Ortodoncias</h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Gestión de planes, calendario y cobros</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#14B8A6]/10 dark:bg-[#14B8A6]/20 flex items-center justify-center flex-shrink-0">
              <SmilePlus className="w-5 h-5 text-[#14B8A6] dark:text-[#2DD4BF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827] dark:text-[#F8FAFC]">{statsActive}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Planes Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827] dark:text-[#F8FAFC]">{statsCompleted}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Completados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#111827] dark:text-[#F8FAFC]">{statsPending}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Cuotas Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#111827] dark:text-[#F8FAFC] leading-tight">{fmt(statsRevenue)}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Cobrado Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#F8FAFC] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] p-1 rounded-xl h-auto gap-1">
          <TabsTrigger
            value="patients"
            className="rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm data-[state=active]:text-[#14B8A6] dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] cursor-pointer transition-all"
          >
            <Users className="w-4 h-4 mr-2" />
            Pacientes ({plans.length})
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm data-[state=active]:text-[#14B8A6] dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] cursor-pointer transition-all"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger
            value="new-plan"
            className="rounded-lg px-5 py-2.5 text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#0F172A] data-[state=active]:shadow-sm data-[state=active]:text-[#14B8A6] dark:data-[state=active]:text-[#2DD4BF] text-[#6B7280] dark:text-[#94A3B8] cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — PACIENTES
        ═══════════════════════════════════════════════════════════════════*/}
        <TabsContent value="patients" className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                placeholder="Buscar paciente…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] placeholder:text-[#9CA3AF] dark:placeholder:text-[#64748B] focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="rounded-xl h-11 w-44 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center bg-white dark:bg-[#0F172A] rounded-3xl border border-[#E5E7EB] dark:border-[#1E293B]">
              <SmilePlus className="w-14 h-14 text-[#D1D5DB] dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-[#111827] dark:text-[#F8FAFC]">Sin planes registrados</h3>
              <p className="text-[#6B7280] dark:text-[#94A3B8] mt-1 text-sm">
                {search ? 'No se encontraron resultados.' : 'Crea un plan desde la pestaña "Nuevo Plan".'}
              </p>
              {!search && (
                <Button
                  onClick={() => setActiveTab('new-plan')}
                  className="mt-4 rounded-xl bg-[#14B8A6] hover:bg-[#0F766E] text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlans.map(plan => {
                const paidCount  = plan.appointments?.filter((a: any) => a.payment_status === 'paid').length ?? 0;
                const totalCount = plan.appointments?.length ?? 0;
                const progress   = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
                const style      = PLAN_STATUS_STYLES[plan.status] ?? PLAN_STATUS_STYLES.cancelled;
                const isExpanded = expandedPlan === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6]/50 transition-all overflow-hidden"
                  >
                    {/* Row */}
                    <button
                      type="button"
                      onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                      className="w-full text-left cursor-pointer"
                    >
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {plan.patient?.first_name?.[0]}{plan.patient?.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#111827] dark:text-[#F8FAFC] truncate">
                              {plan.patient?.first_name} {plan.patient?.last_name}
                            </p>
                            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] truncate">
                              Dr. {plan.dentist?.first_name} {plan.dentist?.last_name}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 text-center sm:text-right">
                          <div>
                            <p className="text-xs text-[#9CA3AF] mb-0.5">Total</p>
                            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">{fmt(plan.total_cost)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9CA3AF] mb-0.5">Cuota</p>
                            <p className="text-sm font-semibold text-[#14B8A6] dark:text-[#2DD4BF]">{fmt(plan.installment_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9CA3AF] mb-0.5">Progreso</p>
                            <p className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC]">{paidCount}/{totalCount}</p>
                          </div>
                        </div>

                        {/* Status + Delete + arrow */}
                        <div className="flex items-center gap-2">
                          <Badge className={`${style.bg} ${style.text} hover:${style.bg} text-xs border-0`}>
                            {style.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            title="Eliminar plan"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModalPlan(plan);
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className={`w-4 h-4 text-[#9CA3AF] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="px-5 pb-4">
                        <div className="w-full bg-[#E5E7EB] dark:bg-[#1E293B] rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-[#14B8A6] to-[#0F766E] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Expanded: cuotas list */}
                    {isExpanded && (
                      <div className="border-t border-[#F3F4F6] dark:border-[#1E293B] bg-[#FAFAFA] dark:bg-[#111827] p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wide">Detalle de cuotas</p>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setDeleteModalPlan(plan)}
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-7 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Eliminar Plan
                          </Button>
                        </div>
                        {plan.appointments && plan.appointments.length > 0 ? (
                          <div className="space-y-2">
                            {[...plan.appointments]
                              .sort((a: any, b: any) => a.start_at.localeCompare(b.start_at))
                              .map((appt: any, idx: number) => {
                                const apptDate = new Date(appt.start_at);
                                const isPaid   = appt.payment_status === 'paid';
                                return (
                                  <div key={appt.id} className={`flex items-center justify-between p-3 rounded-xl text-sm ${isPaid ? 'bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800/40' : 'bg-white dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#1E293B]'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isPaid ? 'bg-green-500 text-white' : 'bg-[#E5E7EB] dark:bg-[#1E293B] text-[#6B7280] dark:text-gray-300'}`}>
                                        {isPaid ? <Check className="w-3 h-3" /> : idx + 1}
                                      </div>
                                      <div>
                                        <p className="font-medium text-[#111827] dark:text-[#F8FAFC]">{appt.reason ?? `Cuota ${idx + 1}`}</p>
                                        <p className="text-xs text-[#9CA3AF]">
                                          {apptDate.toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`font-semibold ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-[#111827] dark:text-[#F8FAFC]'}`}>
                                        {fmt(appt.amount_due ?? 0)}
                                      </span>
                                      <Badge className={`border-0 ${isPaid ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'}`}>
                                        {isPaid ? 'Pagado' : 'Pendiente'}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-sm text-[#9CA3AF]">Sin cuotas generadas.</p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — CALENDARIO
        ═══════════════════════════════════════════════════════════════════*/}
        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: mini-calendar + week */}
            <div className="space-y-5">
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-base">{calendarHeaderLabel}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0 rounded-lg hover:bg-[#F0FDFA] dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 cursor-pointer">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0 rounded-lg hover:bg-[#F0FDFA] dark:hover:bg-[#1E293B] text-gray-700 dark:text-gray-200 cursor-pointer">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {WEEK_HEADERS.map((h, i) => (
                      <div key={i} className="text-xs text-[#9CA3AF] py-1">{h}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: monthDays.leadingBlanks }, (_, i) => (
                      <div key={`pad-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: monthDays.daysInMonth }, (_, i) => i + 1).map(day => {
                      const d   = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const key = toLocalDateKey(d);
                      const isSelected = key === selectedDateKey;
                      const isToday    = key === todayKey;
                      const count      = monthCountsByKey.get(key) ?? 0;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`relative aspect-square rounded-lg text-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/25 font-bold'
                              : isToday
                              ? 'bg-[#F0FDFA] dark:bg-[#14B8A6]/10 text-[#0F766E] dark:text-[#2DD4BF] border border-[#99F6E4] dark:border-[#14B8A6]/30 font-semibold'
                              : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]'
                          }`}
                        >
                          <span>{day}</span>
                          {count > 0 && (
                            <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#14B8A6] dark:bg-[#2DD4BF]'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Week summary */}
              <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#111827] dark:text-[#F8FAFC] text-base">Esta Semana</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5">
                  {weekDaysSummary.map(day => (
                    <button
                      key={day.label}
                      type="button"
                      onClick={() => setSelectedDate(startOfDay(day.date))}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                        day.isSelected
                          ? 'bg-[#F0FDFA] dark:bg-[#14B8A6]/10 border border-[#99F6E4] dark:border-[#14B8A6]/30'
                          : 'bg-[#F8FAFC] dark:bg-[#111827] hover:bg-[#F0FDFA] dark:hover:bg-[#1E293B] border border-transparent'
                      }`}
                    >
                      <span className={`text-sm ${day.isSelected ? 'text-[#0F766E] dark:text-[#2DD4BF] font-semibold' : 'text-[#374151] dark:text-gray-200'}`}>
                        {day.label}
                      </span>
                      <Badge className={`border-0 ${day.count > 0 ? 'bg-[#14B8A6] text-white hover:bg-[#14B8A6]' : 'bg-[#E5E7EB] dark:bg-[#1E293B] text-[#9CA3AF] dark:text-gray-400 hover:bg-[#E5E7EB]'}`}>
                        {day.count}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: appointments of selected day */}
            <Card className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
              <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Citas del Día</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                    <Calendar className="w-4 h-4 text-[#14B8A6] dark:text-[#2DD4BF]" />
                    {headerDateLabel}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {dayAppointments.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <Calendar className="w-12 h-12 text-[#D1D5DB] dark:text-gray-600 mb-3" />
                    <p className="font-medium text-[#374151] dark:text-gray-200">Sin citas de ortodoncia</p>
                    <p className="text-sm text-[#9CA3AF] mt-1">No hay citas programadas para este día.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayAppointments.map(appt => {
                      const isPaid    = appt.payment_status === 'paid';
                      const apptStart = new Date(appt.start_at);
                      const timeStr   = apptStart.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
                      return (
                        <div
                          key={appt.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isPaid
                              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40'
                              : 'bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] hover:border-[#14B8A6]/40 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              {/* Avatar */}
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isPaid ? 'bg-green-500' : 'bg-gradient-to-br from-[#14B8A6] to-[#0F766E]'}`}>
                                {appt.patient?.first_name?.[0]}{appt.patient?.last_name?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-[#111827] dark:text-[#F8FAFC]">
                                  {appt.patient?.first_name} {appt.patient?.last_name}
                                </p>
                                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{appt.reason ?? 'Control de Ortodoncia'}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#14B8A6] dark:text-[#2DD4BF]" /> {timeStr}
                                  </span>
                                  {appt.dentist && (
                                    <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                                      <Stethoscope className="w-3 h-3 text-[#14B8A6] dark:text-[#2DD4BF]" />
                                      Dr. {appt.dentist.first_name} {appt.dentist.last_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-base font-bold text-[#14B8A6] dark:text-[#2DD4BF]">
                                {fmt(appt.amount_due ?? 0)}
                              </span>
                              {isPaid ? (
                                <Badge className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 border-0 gap-1">
                                  <Check className="w-3 h-3" /> Cobrado
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => { setPayModal(appt); setPayMethod('cash'); }}
                                  className="rounded-lg bg-[#14B8A6] hover:bg-[#0F766E] text-white text-xs h-8 px-3 cursor-pointer"
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Cobrar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — NUEVO PLAN
        ═══════════════════════════════════════════════════════════════════*/}
        <TabsContent value="new-plan">
          <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] max-w-3xl mx-auto">
            <CardHeader className="border-b border-[#F3F4F6] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center shadow-md shadow-[#14B8A6]/20">
                  <SmilePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Registrar Nuevo Plan de Ortodoncia</CardTitle>
                  <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">Completa los datos para generar el plan y sus cuotas automáticamente.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {errors.general && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Error al procesar el plan</p>
                      <p className="text-xs mt-0.5">{errors.general}</p>
                    </div>
                  </div>
                )}

                {/* Paciente + Doctor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm text-[#374151] dark:text-gray-200"><User className="w-3.5 h-3.5" />Paciente <span className="text-red-500">*</span></Label>
                    <Select value={data.patient_id} onValueChange={v => setData('patient_id', v)}>
                      <SelectTrigger className={`rounded-xl h-11 bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] ${errors.patient_id ? 'border-red-500' : 'border-[#E5E7EB] dark:border-[#1E293B]'}`}>
                        <SelectValue placeholder="Seleccione un paciente" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                        {patients.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm text-[#374151] dark:text-gray-200"><Stethoscope className="w-3.5 h-3.5" />Doctor Asignado</Label>
                    <Select value={data.dentist_id} onValueChange={v => setData('dentist_id', v)}>
                      <SelectTrigger className={`rounded-xl h-11 bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC] ${errors.dentist_id ? 'border-red-500' : 'border-[#E5E7EB] dark:border-[#1E293B]'}`}>
                        <SelectValue placeholder="Seleccione el doctor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                        {dentists.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.first_name} {d.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.dentist_id && <p className="text-xs text-red-500">{errors.dentist_id}</p>}
                  </div>
                </div>

                {/* Cálculo financiero */}
                <div className="bg-[#F8FAFC] dark:bg-[#111827] p-5 rounded-2xl border border-[#E5E7EB] dark:border-[#1E293B] space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-[#111827] dark:text-[#F8FAFC] text-sm font-medium">Calcular en base a:</Label>
                    <div className="flex items-center gap-1 bg-white dark:bg-[#0F172A] rounded-lg p-1 border border-[#E5E7EB] dark:border-[#1E293B]">
                      <button
                        type="button"
                        onClick={() => handleCalcModeChange('total')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer ${calcMode === 'total' ? 'bg-[#14B8A6] text-white shadow-sm' : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
                      >
                        Costo Total
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCalcModeChange('duration')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer ${calcMode === 'duration' ? 'bg-[#14B8A6] text-white shadow-sm' : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'}`}
                      >
                        Nº de Cuotas
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-[#374151] dark:text-gray-200">Frecuencia de Pagos</Label>
                      <Select value={data.frequency} onValueChange={v => setData('frequency', v)}>
                        <SelectTrigger className="rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC]"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quincenal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[#374151] dark:text-gray-200">Cuota Inicial (Bs.)</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={data.initial_fee}
                        onChange={e => setData('initial_fee', e.target.value)}
                        className={`rounded-xl h-11 bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] ${
                          parseFloat(data.initial_fee) >= parseFloat(data.total_cost) && data.initial_fee && data.total_cost
                            ? 'border-red-400 ring-1 ring-red-400'
                            : 'border-[#E5E7EB] dark:border-[#1E293B]'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.initial_fee && <p className="text-xs text-red-500">{errors.initial_fee}</p>}
                      {parseFloat(data.initial_fee) >= parseFloat(data.total_cost) && data.initial_fee && data.total_cost && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          La cuota inicial no puede ser mayor o igual al costo total.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-[#374151] dark:text-gray-200">Monto por Cuota (Bs.)</Label>
                      <Input
                        type="number" min="1" step="0.01"
                        value={data.installment_amount}
                        onChange={e => setData('installment_amount', e.target.value)}
                        className="rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC]"
                        placeholder="Ej. 200"
                      />
                      {errors.installment_amount && <p className="text-xs text-red-500">{errors.installment_amount}</p>}
                    </div>

                    {calcMode === 'total' ? (
                      <div className="space-y-2">
                        <Label className="text-sm text-[#374151] dark:text-gray-200">Costo Total (Bs.)</Label>
                        <Input
                          type="number" min="1" step="0.01"
                          value={data.total_cost}
                          onChange={e => setData('total_cost', e.target.value)}
                          className="rounded-xl h-11 border-[#14B8A6] ring-1 ring-[#14B8A6] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC]"
                          placeholder="Ej. 5000"
                        />
                        {errors.total_cost && <p className="text-xs text-red-500">{errors.total_cost}</p>}
                        {data.duration && parseInt(data.duration) <= 72 && (
                          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">→ Generará ~{data.duration} cuotas</p>
                        )}
                        {data.duration && parseInt(data.duration) > 72 && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Generaría {data.duration} cuotas (máximo permitido: 72 cuotas / 6 años). Aumente el monto por cuota.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm text-[#374151] dark:text-gray-200">Cantidad de Cuotas</Label>
                        <Input
                          type="number" min="1" max="72"
                          value={data.duration}
                          onChange={e => setData('duration', e.target.value)}
                          className="rounded-xl h-11 border-[#14B8A6] ring-1 ring-[#14B8A6] bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC]"
                          placeholder="Ej. 24"
                        />
                        {data.total_cost && <p className="text-xs text-[#14B8A6] dark:text-[#2DD4BF] font-medium">Costo Total: Bs. {data.total_cost}</p>}
                        {data.duration && parseInt(data.duration) > 72 && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            El límite máximo permitido es de 72 cuotas.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fecha inicio + método de pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-[#374151] dark:text-gray-200">Fecha de Inicio (Primera Cita)</Label>
                    <Input
                      type="date"
                      value={data.start_date}
                      onChange={e => setData('start_date', e.target.value)}
                      className="rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-[#374151] dark:text-gray-200">Método de Pago (Cuota Inicial)</Label>
                    <Select value={data.payment_method} onValueChange={v => setData('payment_method', v)}>
                      <SelectTrigger className="rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="qr">QR</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Info banner */}
                <div className="bg-[#FEF9C3] dark:bg-amber-950/30 p-4 rounded-xl flex gap-3 text-[#A16207] dark:text-amber-300 border border-transparent dark:border-amber-800/40">
                  <Clock className="w-5 h-5 shrink-0 mt-0.5 text-[#A16207] dark:text-amber-400" />
                  <p className="text-sm">
                    Al crear el plan se cobrará la Cuota Inicial automáticamente y se agendarán todas las citas en la agenda del doctor. Las citas futuras quedarán con pago <strong>Pendiente</strong>.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => reset()} className="rounded-xl border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer">
                    Limpiar
                  </Button>
                  <Button type="submit" disabled={processing} className="rounded-xl bg-[#14B8A6] hover:bg-[#0F766E] text-white cursor-pointer shadow-md shadow-[#14B8A6]/20">
                    {processing ? 'Generando Plan…' : 'Crear Plan y Generar Cuotas'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          Pay Installment Modal
      ═══════════════════════════════════════════════════════════════════════*/}
      <Dialog open={!!payModal} onOpenChange={open => { if (!open) setPayModal(null); }}>
        <DialogContent className="rounded-2xl max-w-md bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center shadow-md shadow-[#14B8A6]/20">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-[#111827] dark:text-[#F8FAFC]">Cobrar Cuota</DialogTitle>
            </div>
          </DialogHeader>

          {payModal && (
            <div className="space-y-5 py-2">
              {/* Info */}
              <div className="bg-[#F8FAFC] dark:bg-[#111827] rounded-xl p-4 space-y-2 text-sm border border-gray-100 dark:border-[#1E293B]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">Paciente</span>
                  <span className="font-medium text-[#111827] dark:text-[#F8FAFC]">{payModal.patient?.first_name} {payModal.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">Concepto</span>
                  <span className="font-medium text-[#111827] dark:text-[#F8FAFC] text-right max-w-[60%]">{payModal.reason ?? 'Control de Ortodoncia'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">Monto</span>
                  <span className="font-bold text-[#14B8A6] dark:text-[#2DD4BF] text-base">{fmt(payModal.amount_due ?? 0)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-200">Método de Pago</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="rounded-xl h-11 border-[#E5E7EB] dark:border-[#1E293B] bg-white dark:bg-[#111827] text-[#111827] dark:text-[#F8FAFC]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#111827] border-[#E5E7EB] dark:border-[#1E293B] text-[#111827] dark:text-[#F8FAFC]">
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="qr">QR</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModal(null)} className="rounded-xl border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer">
              Cancelar
            </Button>
            <Button
              onClick={handlePayInstallment}
              disabled={paying}
              className="rounded-xl bg-[#14B8A6] hover:bg-[#0F766E] text-white cursor-pointer shadow-md shadow-[#14B8A6]/20"
            >
              {paying ? 'Procesando…' : 'Confirmar Cobro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteModalPlan} onOpenChange={(open) => !open && setDeleteModalPlan(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] border dark:border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Eliminar Plan de Ortodoncia
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 pt-2 text-sm">
              ¿Estás seguro de que deseas eliminar el plan de ortodoncia de{' '}
              <strong className="text-gray-900 dark:text-gray-200 font-semibold">
                {deleteModalPlan?.patient?.first_name} {deleteModalPlan?.patient?.last_name}
              </strong>?
              <br /><br />
              <span className="block bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 inline mr-1 -mt-0.5 text-amber-600 dark:text-amber-400" />
                Esta acción eliminará automáticamente las citas de control pendientes asociadas a este plan en el calendario. Las citas y pagos ya completados conservarán su historial clínico y contable.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              disabled={deletingPlan}
              onClick={() => setDeleteModalPlan(null)}
              className="border-gray-200 dark:border-[#1E293B] text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              disabled={deletingPlan}
              onClick={handleDeletePlan}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {deletingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Sí, eliminar plan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

