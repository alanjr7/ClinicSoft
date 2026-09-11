import { BarChart3, TrendingUp, Users, Calendar, BarChart2 } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MonthlyPoint   { month: string; revenue: number; appointments: number; }
interface PatientPoint   { month: string; count: number; }
interface TreatmentPoint { name: string; count: number; value: number; }
interface Stats {
  total_appointments: number;
  total_patients:     number;
  total_revenue:      number;
  avg_per_appt:       number;
}

interface Props {
  monthlyData:   MonthlyPoint[];
  newPatients:   PatientPoint[];
  topTreatments: TreatmentPoint[];
  stats:         Stats;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const COLORS = ['#0284C7', '#38BDF8', '#38BDF8', '#818CF8', '#A78BFA'];

function fmtCurrency(n: number) {
  return n.toLocaleString('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 });
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-[#9CA3AF]">
      <BarChart2 className="w-10 h-10 text-[#D1D5DB] dark:text-gray-600 mb-3" />
      <p className="text-sm dark:text-[#94A3B8]">{label}</p>
    </div>
  );
}

Reports.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;

export default function Reports({ monthlyData, newPatients, topTreatments, stats }: Props) {

  const statCards = [
    {
      title:     'Citas Totales',
      value:     stats.total_appointments.toLocaleString(),
      subtitle:  'Desde el inicio',
      icon:      Calendar,
      textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
      bgLight:   'bg-[#F0F9FF] dark:bg-sky-950/40',
    },
    {
      title:     'Pacientes Registrados',
      value:     stats.total_patients.toLocaleString(),
      subtitle:  'Total activos',
      icon:      Users,
      textColor: 'text-[#0369A1] dark:text-[#38BDF8]',
      bgLight:   'bg-[#BAE6FD] dark:bg-sky-900/40',
    },
    {
      title:     'Ingresos Totales',
      value:     fmtCurrency(stats.total_revenue),
      subtitle:  'Pagos recibidos',
      icon:      TrendingUp,
      textColor: 'text-[#0284C7] dark:text-[#38BDF8]',
      bgLight:   'bg-[#F0F9FF] dark:bg-sky-950/40',
    },
    {
      title:     'Promedio por Cita',
      value:     fmtCurrency(stats.avg_per_appt),
      subtitle:  'Ingreso / cita',
      icon:      BarChart3,
      textColor: 'text-[#075985] dark:text-[#38BDF8]',
      bgLight:   'bg-[#BAE6FD] dark:bg-sky-900/40',
    },
  ];

  const hasMonthly    = monthlyData.length > 0;
  const hasPatients   = newPatients.length > 0;
  const hasTreatments = topTreatments.length > 0;

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">Reportes</h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">Análisis y estadísticas del consultorio</p>
      </div>

      {/* Stats Grid — real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title} className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl ${stat.bgLight} flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">{stat.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-[#F8FAFC] mb-1">{stat.value}</p>
              <p className={`text-xs ${stat.textColor}`}>{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Monthly Revenue */}
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Ingresos Mensuales</CardTitle>
            <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">
              {hasMonthly ? 'Últimos 6 meses' : 'Sin datos aún'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMonthly ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" tickFormatter={(v) => `Bs. ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(v: number) => [fmtCurrency(v), 'Ingresos']}
                  />
                  <Bar dataKey="revenue" fill="#0284C7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Registra pagos para ver ingresos mensuales" />
            )}
          </CardContent>
        </Card>

        {/* Monthly Appointments */}
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Citas Realizadas</CardTitle>
            <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">
              {hasMonthly ? 'Total de citas por mes' : 'Sin datos aún'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasMonthly ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(v: number) => [v, 'Citas']}
                  />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#38BDF8"
                    strokeWidth={3}
                    dot={{ fill: '#38BDF8', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Registra citas para ver la evolución mensual" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Treatment Distribution Pie */}
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Tratamientos Más Frecuentes</CardTitle>
            <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">
              {hasTreatments ? 'Distribución por tipo' : 'Sin datos aún'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasTreatments ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topTreatments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="count"
                  >
                    {topTreatments.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(v: number) => [v, 'Realizados']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Agenda citas con tratamientos para ver distribución" />
            )}
          </CardContent>
        </Card>

        {/* New Patients */}
        <Card className="rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Nuevos Pacientes</CardTitle>
            <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">
              {hasPatients ? 'Crecimiento últimos 6 meses' : 'Sin datos aún'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPatients ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={newPatients}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(v: number) => [v, 'Pacientes']}
                  />
                  <Bar dataKey="count" fill="#7DD3FC" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Registra pacientes para ver el crecimiento" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Treatment summary table */}
      {hasTreatments && (
        <Card className="mt-6 rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#111827] dark:text-[#F8FAFC]">Resumen de Tratamientos</CardTitle>
            <CardDescription className="text-[#6B7280] dark:text-[#94A3B8]">Desglose por procedimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTreatments.map((t, idx) => (
                <div key={t.name} className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#111827] border border-transparent dark:border-[#1E293B]">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <div>
                      <p className="text-[#111827] dark:text-[#F8FAFC] font-medium">{t.name}</p>
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{t.count} procedimientos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#111827] dark:text-[#F8FAFC] font-semibold">{fmtCurrency(t.value)}</p>
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                      {t.count > 0 ? fmtCurrency(t.value / t.count) : '—'} promedio
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when clinic is brand new */}
      {!hasMonthly && !hasPatients && !hasTreatments && stats.total_appointments === 0 && (
        <Card className="mt-6 rounded-2xl bg-white dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B] shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-[#9CA3AF]">
            <BarChart2 className="w-14 h-14 text-[#D1D5DB] dark:text-gray-600 mb-4" />
            <p className="text-lg text-[#374151] dark:text-gray-200 mb-2 font-medium">Sin datos para reportes</p>
            <p className="text-sm text-center max-w-sm dark:text-[#94A3B8]">
              Los reportes se generarán automáticamente conforme registres pacientes, citas y pagos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
