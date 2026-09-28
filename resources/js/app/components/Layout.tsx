import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard, Users, Calendar, FileText, Scan,
    FileSpreadsheet, CreditCard, Package, BarChart3, Settings, LogOut, BookOpen, Menu, X, Globe, Sparkles, Network, ArrowLeft, Stethoscope, Activity
} from 'lucide-react';
import { useAuth, type AppModule } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';

interface MenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
    module?: AppModule;
}

const ALL_MENU_ITEMS: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard',             path: '/' },
    { icon: Users,           label: 'Pacientes',             path: '/patients',         module: 'patients' },
    { icon: Calendar,        label: 'Agenda y Citas',        path: '/appointments',     module: 'appointments' },
    { icon: Activity,        label: 'Cirugías y Quirófano',  path: '/surgeries',        module: 'surgeries' },
    { icon: Stethoscope,     label: 'Consultas Médicas',     path: '/clinical-history', module: 'clinical' },
    { icon: Scan,            label: 'Estudios Diagnósticos', path: '/radiographs',      module: 'clinical' },
    { icon: FileSpreadsheet, label: 'Presupuestos',          path: '/budgets',          module: 'budgets' },
    { icon: CreditCard,      label: 'Pagos y Caja',          path: '/payments',         module: 'payments' },
    { icon: Package,         label: 'Farmacia e Insumos',    path: '/inventory',        module: 'inventory' },
    { icon: BookOpen,        label: 'Contabilidad',          path: '/accounting',       module: 'accounting' },
    { icon: BarChart3,       label: 'Reportes',              path: '/reports',          module: 'reports' },
    { icon: Globe,           label: 'Portal de Reservas',    path: '/public-view',      module: 'appointments' },
    { icon: Settings,        label: 'Configuración',         path: '/settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout, hasModule } = useAuth();
    const { url, props } = usePage<{
        is_demo_mode?: boolean;
        area_impersonation?: {
            is_active?: boolean;
            tenant_name?: string;
            area_name?: string;
        };
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    }>();
    const isDemoMode = Boolean(props?.is_demo_mode);
    const isAreaImpersonating = Boolean(props?.area_impersonation?.is_active);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Notificaciones automáticas de flash y errores generales
    useEffect(() => {
        if (props?.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props?.flash?.error) {
            toast.error(props.flash.error);
        }
        if (props?.errors?.general) {
            toast.error(props.errors.general);
        }
    }, [props?.flash, props?.errors]);

    // Cierra el menú móvil cuando cambia la ruta
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    const visibleItems = ALL_MENU_ITEMS.filter(
        (item) => !item.module || hasModule(item.module)
    );

    const initials = user
        ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || user.first_name?.[1] || ''}`.toUpperCase() || 'U'
        : 'U';
    const fullName = user ? `${user.first_name} ${user.last_name}` : '';
    const rolLabel: Record<string, string> = {
        doctor: 'Doctor',
        admin: 'Administrador',
        staff: 'Asistente',
        owner: 'Director Médico',
    };

    const isActive = (path: string) => {
        if (path === '/') return url === '/';
        return url.startsWith(path);
    };

    return (
        <div id="app-root" className="flex h-full bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                id="app-sidebar" 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0F172A] border-r border-[#F3F4F6] dark:border-[#1E293B] flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo and Mobile Close */}
                <div className="p-5 border-b border-[#F3F4F6] dark:border-[#1E293B] flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 text-white">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-bold text-[#111827] dark:text-white block leading-snug truncate" title={user?.tenant_name || 'ClinicasSoft'}>
                                {user?.tenant_name || 'ClinicasSoft'}
                            </span>
                            <span className="text-[10px] text-[#0284C7] dark:text-[#38BDF8] font-semibold tracking-wider uppercase block">
                                ClinicasSoft SaaS
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <ThemeToggle className="hidden lg:flex" />
                        <button 
                            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 cursor-pointer"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {visibleItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-lg shadow-sky-600/20 font-medium'
                                            : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] hover:text-[#111827] dark:hover:text-white'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User & Theme & Logout */}
                <div className="p-4 border-t border-[#F3F4F6] dark:border-[#1E293B]">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B]">
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 font-bold">
                            <span className="text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#111827] dark:text-[#F8FAFC] truncate font-semibold">{fullName}</p>
                            <p className="text-xs text-sky-600 dark:text-sky-400 truncate font-medium">
                                {user?.role ? rolLabel[user.role] ?? user.role : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/30 transition-colors cursor-pointer text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main id="app-main" className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Area Impersonation Top Banner */}
                {isAreaImpersonating && (
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-800 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md z-30 shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <Network className="w-3 h-3" /> Red Médica
                            </span>
                            <span className="font-medium text-white/95 truncate">
                                Supervisando el centro médico <strong>{props?.area_impersonation?.tenant_name || user?.tenant_name}</strong>
                                {props?.area_impersonation?.area_name ? ` (${props.area_impersonation.area_name})` : ''}.
                            </span>
                        </div>
                        <button
                            onClick={() => router.post('/area/exit-impersonation')}
                            className="bg-white text-indigo-900 hover:bg-sky-50 font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm text-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Volver a Red Médica</span>
                        </button>
                    </div>
                )}

                {/* Demo Mode Top Ribbon Banner */}
                {isDemoMode && (
                    <div className="bg-gradient-to-r from-sky-700 via-sky-700 to-sky-800 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-30 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Modo Demostración
                            </span>
                            <span className="font-medium text-white/95">
                                Estás navegando en un entorno de prueba interactivo de ClinicasSoft.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href={`https://wa.me/59172651615?text=${encodeURIComponent(`Hola, estoy probando la demo de ClinicasSoft${user?.first_name ? ` (Soy ${user.first_name} ${user.last_name})` : ''} y deseo contratar el servicio para mi clínica médica.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-white text-sky-800 hover:bg-sky-50 font-bold px-3 py-1 rounded-lg transition-colors shadow-sm text-xs cursor-pointer inline-flex items-center gap-1.5"
                            >
                                ⭐ Contratar ClinicasSoft
                            </a>
                            <button
                                onClick={logout}
                                className="text-white/80 hover:text-white underline text-xs cursor-pointer"
                            >
                                Salir del Modo Demo
                            </button>
                        </div>
                    </div>
                )}

                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0F172A] border-b border-[#F3F4F6] dark:border-[#1E293B] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4" />
                        </div>
                        <span className="text-base font-semibold text-[#111827] dark:text-white truncate max-w-[180px]">
                            {user?.tenant_name || 'ClinicasSoft'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0B1120]">
                    {children}
                </div>
            </main>

            <Toaster richColors position="top-right" />
        </div>
    );
}
