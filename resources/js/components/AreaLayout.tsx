import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, BarChart3, Building2, LogOut, Menu, X, Network, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { Toaster } from '../app/components/ui/sonner';
import { toast } from 'sonner';

interface MenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

const AREA_NAV_ITEMS: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard',             path: '/area' },
    { icon: BarChart3,       label: 'Reportes & KPIs',       path: '/area/reports' },
    { icon: Building2,       label: 'Consultorios',          path: '/area/clinics' },
];

export default function AreaLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { url, props } = usePage<{
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    }>();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    const isActive = (path: string) => {
        if (path === '/area') return url === '/area' || url === '/area/dashboard';
        return url.startsWith(path);
    };

    const areaDisplayName = user?.tenant_name || user?.first_name || 'Panel de Área';

    return (
        <div className="flex h-full bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
            {/* Mobile backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Area — elegant indigo/teal themed */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A1128] border-r border-[#1C2541] flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'
                }`}
            >
                {/* Logo & Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                            <Network className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate" title={areaDisplayName}>
                                {areaDisplayName}
                            </p>
                            <p className="text-sky-400 text-[11px] font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Red Médica
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <ThemeToggle className="hidden lg:flex text-gray-400 hover:text-white hover:bg-white/10" />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Menú de Área
                    </div>
                    {AREA_NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                                isActive(item.path)
                                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg shadow-sky-600/25 font-semibold'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-xs text-white font-bold tracking-wider">AR</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                                {user ? `${user.first_name} ${user.last_name}` : 'Administrador Área'}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{user?.email || 'Cuenta de Área'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile TopBar */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A1128] border-b border-[#1C2541] shrink-0 text-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shrink-0">
                            <Network className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-bold text-white block leading-tight truncate">
                                {areaDisplayName}
                            </span>
                            <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase block">
                                Panel de Área
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <ThemeToggle className="text-gray-300 hover:text-white hover:bg-white/10" />
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Viewport */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] dark:bg-[#0B1120]">
                    {children}
                </div>
            </main>

            <Toaster richColors position="top-right" />
        </div>
    );
}
