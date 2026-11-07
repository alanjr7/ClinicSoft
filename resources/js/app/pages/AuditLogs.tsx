import { useState, useTransition } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from '../components/Layout';
import {
  ClipboardList, Search, Filter, Download, RotateCcw,
  LogIn, LogOut, ShieldAlert, ShieldCheck, PlusCircle, Edit3, Trash2,
  Calendar, User, Globe, Laptop, Smartphone, Eye, ArrowUpDown, ChevronLeft, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../components/ui/dialog';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  role: string | null;
  action: string;
  module: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedLogs {
  data: AuditLogEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: PaginationLink[];
}

interface ClinicUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  logs: PaginatedLogs;
  stats: {
    total_events: number;
    total_logins: number;
    total_changes: number;
    total_security: number;
  };
  clinicUsers: ClinicUser[];
  filters: {
    search: string;
    action: string;
    module: string;
    user_id: string;
    date_from: string;
    date_to: string;
  };
}

export default function AuditLogs({ logs, stats, clinicUsers, filters }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedAction, setSelectedAction] = useState(filters.action || 'all');
  const [selectedModule, setSelectedModule] = useState(filters.module || 'all');
  const [selectedUser, setSelectedUser] = useState(filters.user_id || 'all');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startTransition(() => {
      router.get('/audit-logs', {
        search: searchTerm,
        action: selectedAction,
        module: selectedModule,
        user_id: selectedUser,
        date_from: dateFrom,
        date_to: dateTo,
      }, {
        preserveState: true,
        replace: true,
      });
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAction('all');
    setSelectedModule('all');
    setSelectedUser('all');
    setDateFrom('');
    setDateTo('');
    startTransition(() => {
      router.get('/audit-logs', {}, { preserveState: true, replace: true });
    });
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      search: searchTerm,
      action: selectedAction,
      module: selectedModule,
      user_id: selectedUser,
      date_from: dateFrom,
      date_to: dateTo,
    });
    window.location.href = `/audit-logs/export?${params.toString()}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-BO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <LogIn className="w-3 h-3" /> Inicio de Sesión
          </span>
        );
      case 'logout':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <LogOut className="w-3 h-3" /> Cierre de Sesión
          </span>
        );
      case 'login_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" /> Login Fallido
          </span>
        );
      case 'login_blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <ShieldAlert className="w-3 h-3" /> Bloqueo 20s
          </span>
        );
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <PlusCircle className="w-3 h-3" /> Creación
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Edit3 className="w-3 h-3" /> Modificación
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
            <Trash2 className="w-3 h-3" /> Eliminación
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {action}
          </span>
        );
    }
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      auth: 'Autenticación',
      pacientes: 'Pacientes',
      citas: 'Agenda y Citas',
      cirugias: 'Cirugías',
      historia_clinica: 'Historia Clínica',
      presupuestos: 'Presupuestos',
      caja: 'Caja y Pagos',
      facturacion: 'Facturación',
      gastos: 'Gastos',
      inventario: 'Farmacia e Insumos',
      contabilidad: 'Contabilidad',
      usuarios: 'Usuarios y Equipo',
      configuracion: 'Configuración',
    };
    return labels[module] || module;
  };

  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'CL';
  };

  return (
    <Layout>
      <Head title="Bitácora de Actividades y Accesos - ClinicSoft" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#0F766E] flex items-center justify-center text-white shadow-lg shadow-[#14B8A6]/25">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827] dark:text-white tracking-tight">
                Bitácora de Actividades
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8]">
                Registro cronológico seguro de inicios de sesión, cierres y cambios realizados en tu clínica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="rounded-xl border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-1.5 text-[#14B8A6]" /> Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilterSubmit}
              disabled={isPending}
              className="rounded-xl border-gray-300 dark:border-gray-700"
            >
              <RotateCcw className={`w-4 h-4 mr-1.5 ${isPending ? 'animate-spin' : ''}`} /> Actualizar
            </Button>
          </div>
        </div>

        {/* Tarjetas de Estadísticas (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0F172A]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total de Eventos</p>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                  {stats.total_events}
                </h3>
                <span className="text-[11px] text-teal-600 dark:text-teal-400">Registros de tu clínica</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <ClipboardList className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0F172A]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Inicios de Sesión</p>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                  {stats.total_logins}
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Accesos autorizados</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <LogIn className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0F172A]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cambios en el Sistema</p>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                  {stats.total_changes}
                </h3>
                <span className="text-[11px] text-blue-600 dark:text-blue-400">Altas, ediciones y bajas</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Edit3 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0F172A]">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Seguridad & Bloqueos</p>
                <h3 className="text-2xl font-extrabold text-[#111827] dark:text-white mt-1">
                  {stats.total_security}
                </h3>
                <span className="text-[11px] text-rose-600 dark:text-rose-400">Fallos y rate-limit 20s</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Filtros Avanzada */}
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-[#0F172A]">
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Búsqueda por texto */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar usuario, IP o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                />
              </div>

              {/* Filtro por Acción */}
              <div>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-[#111827] dark:text-[#F8FAFC] focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="all">Todas las acciones</option>
                  <option value="login">Inicios de Sesión</option>
                  <option value="logout">Cierres de Sesión</option>
                  <option value="login_failed">Intentos Fallidos</option>
                  <option value="login_blocked">Bloqueos de 20s</option>
                  <option value="create">Creaciones (Altas)</option>
                  <option value="update">Modificaciones</option>
                  <option value="delete">Eliminaciones</option>
                </select>
              </div>

              {/* Filtro por Módulo */}
              <div>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-[#111827] dark:text-[#F8FAFC] focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="all">Todos los módulos</option>
                  <option value="auth">Autenticación / Sesión</option>
                  <option value="pacientes">Pacientes</option>
                  <option value="citas">Agenda y Citas</option>
                  <option value="cirugias">Cirugías</option>
                  <option value="historia_clinica">Historia Clínica</option>
                  <option value="presupuestos">Presupuestos</option>
                  <option value="caja">Caja y Pagos</option>
                  <option value="inventario">Farmacia e Insumos</option>
                  <option value="contabilidad">Contabilidad</option>
                  <option value="usuarios">Equipo y Usuarios</option>
                  <option value="configuracion">Configuración Clínica</option>
                </select>
              </div>

              {/* Filtro por Usuario */}
              <div>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-[#111827] dark:text-[#F8FAFC] focus:ring-1 focus:ring-[#14B8A6]"
                >
                  <option value="all">Todos los usuarios</option>
                  {clinicUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Aplicar / Reset */}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 h-10 bg-[#14B8A6] hover:bg-[#0F766E] text-white rounded-xl text-xs font-semibold"
                >
                  <Filter className="w-3.5 h-3.5 mr-1" /> Filtrar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  title="Limpiar filtros"
                  className="h-10 px-3 rounded-xl border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tabla de Registros */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Descripción del Evento</th>
                  <th className="py-3 px-4">Origen / IP</th>
                  <th className="py-3 px-4 text-center">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                {logs.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium">No se encontraron eventos en la bitácora</p>
                        <p className="text-xs text-gray-400">Intenta cambiar los filtros seleccionados o realiza nuevas operaciones.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.data.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors"
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </td>

                      {/* Usuario */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-bold flex items-center justify-center text-[10px] shrink-0 shadow-sm">
                            {getUserInitials(log.user_name, log.user_email)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                              {log.user_name || 'Usuario desconocido'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {log.user_email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Acción */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Módulo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          {getModuleLabel(log.module)}
                        </span>
                      </td>

                      {/* Descripción */}
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 max-w-md">
                        <p className="line-clamp-2" title={log.description}>
                          {log.description}
                        </p>
                      </td>

                      {/* IP y Navegador */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <span>{log.ip_address || 'Local / Interna'}</span>
                        </div>
                      </td>

                      {/* Botón Ver Detalles */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400"
                          title="Inspeccionar detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {logs.total > 0 && (
            <div className="py-3 px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div>
                Mostrando <span className="font-semibold text-gray-900 dark:text-gray-200">{logs.from || 0}</span> a{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-200">{logs.to || 0}</span> de{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-200">{logs.total}</span> registros en esta clínica
              </div>

              <div className="flex items-center gap-1">
                {logs.links.map((link, idx) => {
                  if (link.label.includes('&laquo;') || link.label.toLowerCase().includes('anterior')) {
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                        className="h-8 px-2 rounded-lg border-gray-300 dark:border-gray-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    );
                  }
                  if (link.label.includes('&raquo;') || link.label.toLowerCase().includes('siguiente')) {
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                        className="h-8 px-2 rounded-lg border-gray-300 dark:border-gray-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    );
                  }
                  return (
                    <Button
                      key={idx}
                      variant={link.active ? 'default' : 'outline'}
                      size="sm"
                      disabled={!link.url}
                      onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                      className={`h-8 w-8 p-0 rounded-lg text-xs font-semibold ${
                        link.active
                          ? 'bg-[#14B8A6] hover:bg-[#0F766E] text-white border-transparent'
                          : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle / Inspección del Log */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0F172A] border-gray-200 dark:border-gray-800">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#14B8A6]" />
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Detalle del Registro de Bitácora
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500">
              ID de Auditoría: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              {/* Resumen Metadatos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Fecha y Hora</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">
                    {formatDate(selectedLog.created_at)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Usuario</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {selectedLog.user_name || 'Desconocido'}
                  </p>
                  <p className="text-[10px] text-gray-500">{selectedLog.user_email || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Rol del Usuario</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5 capitalize">
                    {selectedLog.role || 'Regular'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Acción</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Módulo</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {getModuleLabel(selectedLog.module)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Dirección IP</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5 font-mono">
                    {selectedLog.ip_address || 'No registrada'}
                  </p>
                </div>
              </div>

              {/* Descripción completa */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Descripción:</span>
                <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-950 dark:text-teal-200 font-medium">
                  {selectedLog.description}
                </div>
              </div>

              {/* Telemetría / Navegador */}
              {selectedLog.user_agent && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Navegador / Cliente:</span>
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-mono text-[10px] break-all">
                    {selectedLog.user_agent}
                  </div>
                </div>
              )}

              {/* Comparativa de Cambios (Old vs New Values) */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-[#14B8A6]" /> Atributos Modificados
                  </h4>

                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                          <th className="p-2.5 font-semibold">Campo / Atributo</th>
                          {selectedLog.old_values && <th className="p-2.5 font-semibold text-rose-600 dark:text-rose-400">Valor Anterior</th>}
                          {selectedLog.new_values && <th className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">Valor Nuevo</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                        {Array.from(new Set([
                          ...Object.keys(selectedLog.old_values || {}),
                          ...Object.keys(selectedLog.new_values || {})
                        ])).map((key) => {
                          const oldVal = selectedLog.old_values ? selectedLog.old_values[key] : null;
                          const newVal = selectedLog.new_values ? selectedLog.new_values[key] : null;
                          return (
                            <tr key={key} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                              <td className="p-2.5 font-semibold text-gray-800 dark:text-gray-200">{key}</td>
                              {selectedLog.old_values && (
                                <td className="p-2.5 text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/20 break-all">
                                  {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? '-')}
                                </td>
                              )}
                              {selectedLog.new_values && (
                                <td className="p-2.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20 break-all">
                                  {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? '-')}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

