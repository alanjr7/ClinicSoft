import { Link, usePage } from '@inertiajs/react';
import { Building2, LayoutDashboard, LogOut, Sparkles, Menu, X, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard',  path: '/superadmin' },
    { icon: Building2,       label: 'Clínicas',   path: '/superadmin/clinics' },
    { icon: Network,         label: 'Áreas',      path: '/superadmin/areas' },
    { icon: Sparkles,        label: 'Leads Demo', path: '/superadmin/demo-leads' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { url } = usePage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Cierra el menú móvil al navegar a otra ruta
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    const isActive = (path: string) => {
        if (path === '/superadmin') return url === '/superadmin';
        return url.startsWith(path);
    };

    return (
        <div className="flex h-full bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
            {/* Mobile backdrop overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar SuperAdmin — dark theme to differentiate from ERP */}
            <aside 
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'
                }`}
            >
                {/* Logo & Mobile Close */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src="/images/logo.png" alt="DentalSoft Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">DentalSoft</p>
                            <p className="text-[#94A3B8] text-[11px] truncate">Panel SuperAdmin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <ThemeToggle className="hidden lg:flex text-gray-400 hover:text-white hover:bg-white/10" />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                            aria-label="Cerrar menú"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                                isActive(item.path)
                                    ? 'bg-[#0284C7] text-white shadow-lg shadow-[#0284C7]/25'
                                    : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
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
                        <div className="w-9 h-9 rounded-xl bg-[#0284C7] flex items-center justify-center shrink-0 shadow-sm">
                            <span className="text-xs text-white font-bold tracking-wider">SA</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                                {user ? `${user.first_name} ${user.last_name}` : 'SuperAdmin'}
                            </p>
                            <p className="text-[11px] text-[#94A3B8] truncate">Superadministrador</p>
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

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile TopBar */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-[#1E293B] shrink-0 text-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <img src="/images/logo.png" alt="DentalSoft Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-bold text-white block leading-tight truncate">DentalSoft</span>
                            <span className="text-[10px] text-[#0284C7] font-semibold tracking-wider uppercase block">SuperAdmin</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <ThemeToggle className="text-gray-300 hover:text-white hover:bg-white/10" />
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                            aria-label="Abrir menú de navegación"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Page Viewport */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] dark:bg-[#0B1120]">
                    {children}
                </div>
            </main>
        </div>
    );
}
