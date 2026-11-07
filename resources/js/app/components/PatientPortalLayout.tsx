import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Clock, CalendarPlus, Settings, LogOut, Menu, X, Shield, User
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';

interface MenuItem {
    icon: React.ElementType;
    label: string;
    path: string;
}

const MENU_ITEMS: MenuItem[] = [
    { icon: Clock,        label: 'Mi Historial',           path: '/portal/historial' },
    { icon: CalendarPlus, label: 'Reservar Cita Médica',   path: '/portal/reservar-cita' },
    { icon: Settings,     label: 'Configuración',          path: '/portal/configuracion' },
];

export default function PatientPortalLayout({ children }: { children: React.ReactNode }) {
    const { url, props } = usePage<{
        auth?: {
            user?: {
                id: string;
                first_name: string;
                last_name: string;
                email: string;
                tenant_name?: string;
            };
        };
        patient?: {
            first_name: string;
            last_name: string;
        };
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    }>();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const user = props.auth?.user;
    const patientName = props.patient
        ? `${props.patient.first_name} ${props.patient.last_name}`.trim()
        : `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Paciente';

    const tenantName = user?.tenant_name || 'ClinicSoft';

    // Flash notifications
    useEffect(() => {
        if (props?.flash?.success) {
            toast.success(props.flash.success);
        }
        if (props?.flash?.error) {
            toast.error(props.flash.error);
        }
    }, [props?.flash]);

    // Close mobile menu on navigate
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [url]);

    const isActive = (path: string) => url.startsWith(path);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] overflow-hidden transition-colors duration-200">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-[#1E293B] flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo / Header */}
                <div className="p-5 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 shadow-md border border-gray-100 dark:border-slate-700/60">
                            <img src="/images/logo.png" alt="ClinicSoft Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-bold text-[#111827] dark:text-white block leading-snug truncate">
                                {tenantName}
                            </span>
                            <span className="text-[10px] text-[#0284C7] dark:text-[#38BDF8] font-semibold tracking-wider uppercase block">
                                Portal del Paciente
                            </span>
                        </div>
                    </div>
                    <button
                        className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 cursor-pointer"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 overflow-y-auto space-y-1.5">
                    {MENU_ITEMS.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                                    active
                                        ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                                        : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] hover:text-[#0F172A] dark:hover:text-white'
                                }`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Footer */}
                <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer text-sm font-semibold"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header Bar matching user's layout: "paciente : {$nombre}" */}
                <header className="h-16 px-6 bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            className="lg:hidden text-gray-600 dark:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm md:text-base font-semibold text-[#0F172A] dark:text-white capitalize">
                                paciente : <span className="text-sky-600 dark:text-sky-400">{patientName}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                    </div>
                </header>

                {/* Content Page Container */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    );
}

