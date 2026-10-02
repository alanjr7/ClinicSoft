import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
    PlayCircle,
    X,
    Send,
    Search,
    ChevronRight,
    RotateCcw,
    Users,
    Calendar,
    Activity,
    Stethoscope,
    Scan,
    FileSpreadsheet,
    CreditCard,
    Package,
    BookOpen,
    BarChart3,
    Globe,
    Settings,
    LayoutDashboard,
    ArrowUpRight,
    CheckCircle2
} from 'lucide-react';

export interface TutorialTopic {
    id: string;
    title: string;
    section: string;
    path: string;
    videoUrl: string;
    timestampSeconds: number;
    timestampLabel: string;
    icon: React.ElementType;
    keywords: string[];
    summary: string;
    steps: string[];
    suggestedQuestions: string[];
}

export const TUTORIAL_TOPICS: TutorialTopic[] = [
    {
        id: 'dashboard',
        title: 'Panel Principal (Dashboard)',
        section: 'Dashboard',
        path: '/',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=0',
        timestampSeconds: 0,
        timestampLabel: '0:00',
        icon: LayoutDashboard,
        keywords: ['dashboard', 'inicio', 'panel', 'resumen', 'metricas', 'hoy', 'citas de hoy', 'ingresos hoy', 'general'],
        summary: 'El Dashboard te brinda un resumen visual en tiempo real de pacientes del día, ingresos, próximas citas y alertas del centro médico.',
        steps: [
            'Ingresa al menú "Dashboard" en la barra lateral izquierda.',
            'Visualiza las tarjetas de resumen: pacientes en espera, ingresos del día y citas programadas.',
            'Revisa los gráficos de rendimiento y accesos rápidos a las funciones operativas.'
        ],
        suggestedQuestions: [
            '¿Qué información veo en el Dashboard?',
            '¿Cómo ver las citas del día en el inicio?'
        ]
    },
    {
        id: 'pacientes',
        title: 'Gestión y Registro de Pacientes',
        section: 'Pacientes',
        path: '/patients',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=33',
        timestampSeconds: 33,
        timestampLabel: '0:33',
        icon: Users,
        keywords: ['paciente', 'pacientes', 'añadir paciente', 'crear paciente', 'nuevo paciente', 'registrar paciente', 'historia', 'cedula', 'expediente', 'telefono', 'contacto', 'añado un usuario paciente', 'agregar paciente', 'alta paciente'],
        summary: 'En el módulo de Pacientes puedes dar de alta nuevos clientes, buscar expedientes, actualizar datos de contacto y acceder a sus historias clínicas.',
        steps: [
            'Haz clic en "Pacientes" en el menú de navegación.',
            'Presiona el botón "+ Nuevo Paciente" en la esquina superior derecha.',
            'Completa el formulario: Nombres, Apellidos, Cédula / DNI, Teléfono y Correo.',
            'Guarda los cambios para generar automáticamente su historial clínico.'
        ],
        suggestedQuestions: [
            '¿Cómo añado o registro un nuevo paciente?',
            '¿Dónde busco el historial de un paciente?'
        ]
    },
    {
        id: 'agenda',
        title: 'Agenda, Calendario y Citas',
        section: 'Agenda y citas',
        path: '/appointments',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=130',
        timestampSeconds: 130,
        timestampLabel: '2:10',
        icon: Calendar,
        keywords: ['agenda', 'citas', 'cita', 'reservas', 'calendario', 'programar cita', 'agendar', 'turnos', 'horario', 'reprogramar', 'cancelar cita', 'recordatorio'],
        summary: 'Programa citas por doctor, sillón o especialidad. Organiza el calendario diario/semanal y gestiona los estados de atención.',
        steps: [
            'Ingresa a "Agenda y Citas" desde el menú lateral.',
            'Haz clic sobre el horario deseado en el calendario o en "+ Nueva Cita".',
            'Selecciona el paciente, el doctor tratante, motivo de consulta y duración.',
            'Guarda la cita para que se refleje inmediatamente en el cronograma.'
        ],
        suggestedQuestions: [
            '¿Cómo programar o agendar una cita?',
            '¿Cómo ver el calendario de un doctor específico?'
        ]
    },
    {
        id: 'cirugias',
        title: 'Cirugías y Quirófano',
        section: 'Cirugías',
        path: '/surgeries',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=270',
        timestampSeconds: 270,
        timestampLabel: '4:30',
        icon: Activity,
        keywords: ['cirugia', 'cirugias', 'quirofano', 'operacion', 'procedimiento quirurgico', 'anestesia', 'consentimiento', 'protocolo operatorio'],
        summary: 'Control integral de procedimientos quirúrgicos, programación de quirófanos, equipo médico asignado y consentimiento informado.',
        steps: [
            'Ve al módulo "Cirugías y Quirófano".',
            'Haz clic en "+ Programar Cirugía".',
            'Elige paciente, cirujano, tipo de intervención y quirófano.',
            'Adjunta los consentimientos y llena el protocolo postoperatorio.'
        ],
        suggestedQuestions: [
            '¿Cómo programar una cirugía?',
            '¿Dónde se registran los consentimientos quirúrgicos?'
        ]
    },
    {
        id: 'historial',
        title: 'Historial Clínico y Consultas',
        section: 'Historial clínico',
        path: '/clinical-history',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=394',
        timestampSeconds: 394,
        timestampLabel: '6:34',
        icon: Stethoscope,
        keywords: ['historial', 'historial clinico', 'consulta', 'anamnesis', 'diagnostico', 'odontograma', 'evolucion', 'receta', 'tratamiento', 'notas medicas'],
        summary: 'Registro de consultas médicas, evolución del paciente, diagnósticos CIE, planes de tratamiento y generación de recetas médicas.',
        steps: [
            'Accede a "Consultas Médicas / Historial Clínico".',
            'Busca y selecciona el paciente en atención.',
            'Registra el motivo de consulta, examen físico, diagnóstico y evolución.',
            'Emite recetas o indicaciones con firma profesional.'
        ],
        suggestedQuestions: [
            '¿Cómo crear una nota de evolución o consulta médica?',
            '¿Cómo emitir una receta médica?'
        ]
    },
    {
        id: 'radiografias',
        title: 'Radiografías, Estudios e Imágenes',
        section: 'Radiografías e imágenes',
        path: '/radiographs',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=500',
        timestampSeconds: 500,
        timestampLabel: '8:20',
        icon: Scan,
        keywords: ['radiografia', 'radiografias', 'imagenes', 'estudios', 'rayos x', 'tomografia', 'dicom', 'fotos clinicas', 'adjuntar imagen'],
        summary: 'Almacena y visualiza estudios diagnósticos, radiografías panorámicas, periapicales y fotografías clínicas comparativas.',
        steps: [
            'Entra a "Estudios Diagnósticos / Radiografías".',
            'Selecciona el paciente y presiona "Subir Estudio / Imagen".',
            'Arrastra los archivos o capturas clínicas y asigna la fecha y categoría.',
            'Usa el visor integrado para contrastar imágenes antes y después.'
        ],
        suggestedQuestions: [
            '¿Cómo subir radiografías o fotos de un paciente?',
            '¿Dónde ver los estudios diagnósticos guardados?'
        ]
    },
    {
        id: 'presupuestos',
        title: 'Proformas y Presupuestos',
        section: 'Proformas o presupuestos',
        path: '/budgets',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=585',
        timestampSeconds: 585,
        timestampLabel: '9:45',
        icon: FileSpreadsheet,
        keywords: ['presupuesto', 'presupuestos', 'proforma', 'proformas', 'cotizacion', 'costo tratamiento', 'descuento', 'plan de pago'],
        summary: 'Crea propuestas económicas detalladas de tratamientos para pacientes, con opciones de descuento y aprobación formal.',
        steps: [
            'Dirígete a "Presupuestos / Proformas".',
            'Haz clic en "+ Nuevo Presupuesto" y selecciona el paciente.',
            'Agrega los procedimientos con sus tarifas oficiales o personalizadas.',
            'Imprime o envía el PDF por WhatsApp/Email al paciente.'
        ],
        suggestedQuestions: [
            '¿Cómo crear una proforma o presupuesto de tratamiento?',
            '¿Cómo aplicar descuentos en un presupuesto?'
        ]
    },
    {
        id: 'pagos',
        title: 'Cobros, Pagos y Caja',
        section: 'Cobros y pagos',
        path: '/payments',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=676',
        timestampSeconds: 676,
        timestampLabel: '11:16',
        icon: CreditCard,
        keywords: ['cobro', 'cobros', 'pago', 'pagos', 'caja', 'arqueo', 'factura', 'recibo', 'efectivo', 'tarjeta', 'transferencia', 'abono', 'saldo pendiente'],
        summary: 'Control de cobros por servicios médicos, abonos a presupuestos, arqueo de caja diaria y emisión de recibos/comprobantes.',
        steps: [
            'Ingresa al módulo "Pagos y Caja".',
            'Haz clic en "+ Registrar Cobro / Pago".',
            'Elige el paciente o presupuesto pendiente y selecciona el método de pago (Efectivo, Tarjeta, QR, Transferencia).',
            'Genera el comprobante de pago e imprímelo o envíalo digitalmente.'
        ],
        suggestedQuestions: [
            '¿Cómo registrar un pago o cobro a un paciente?',
            '¿Cómo realizar el cierre o arqueo de caja diario?'
        ]
    },
    {
        id: 'farmacia',
        title: 'Farmacia, Insumos y Venta POS',
        section: 'Farmacia y venta POS',
        path: '/inventory',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=814',
        timestampSeconds: 814,
        timestampLabel: '13:34',
        icon: Package,
        keywords: ['farmacia', 'venta pos', 'pos', 'inventario', 'insumos', 'medicamentos', 'stock', 'productos', 'vender producto', 'salida de stock'],
        summary: 'Administración de stock de medicamentos e insumos médicos, punto de venta directo (POS) y alertas de reposición.',
        steps: [
            'Accede a "Farmacia e Insumos / Inventario".',
            'Usa la pestaña "Venta Rápida POS" para cobrar medicamentos y productos de mostrador.',
            'Para agregar stock, usa "Registrar Entrada de Lote".',
            'Revisa las alertas de stock mínimo para reposición.'
        ],
        suggestedQuestions: [
            '¿Cómo realizar una venta en farmacia / POS?',
            '¿Cómo agregar stock o nuevos insumos?'
        ]
    },
    {
        id: 'contabilidad',
        title: 'Contabilidad y Egresos',
        section: 'Contabilidad',
        path: '/accounting',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=1073',
        timestampSeconds: 1073,
        timestampLabel: '17:53',
        icon: BookOpen,
        keywords: ['contabilidad', 'gastos', 'egresos', 'flujo de caja', 'cuentas por pagar', 'compras', 'balance', 'finanzas'],
        summary: 'Registro de egresos operativos (alquiler, nómina, insumos), conciliación de flujo de caja y balance financiero de la clínica.',
        steps: [
            'Ingresa a "Contabilidad" en el menú principal.',
            'Haz clic en "+ Registrar Gasto / Egreso".',
            'Categoriza el concepto (Servicios, Nómina, Proveedores) y monto.',
            'Consulta el balance mensual de ingresos vs egresos.'
        ],
        suggestedQuestions: [
            '¿Cómo registrar un gasto o egreso contable?',
            '¿Dónde ver el balance financiero de la clínica?'
        ]
    },
    {
        id: 'reportes',
        title: 'Reportes y Métricas KPI',
        section: 'Reportes y KPI',
        path: '/reports',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=1150',
        timestampSeconds: 1150,
        timestampLabel: '19:10',
        icon: BarChart3,
        keywords: ['reportes', 'kpi', 'metricas', 'estadisticas', 'graficos', 'analisis', 'exportar excel', 'desempeño doctores', 'productividad'],
        summary: 'Estadísticas avanzadas sobre rendimiento clínico, pacientes atendidos por médico, ingresos mensuales y tasas de conversión.',
        steps: [
            'Dirígete al módulo "Reportes".',
            'Filtra por rango de fechas, sucursal o profesional de salud.',
            'Analiza los gráficos interactivos de productividad y finanzas.',
            'Exporta los reportes en PDF o Excel según tus necesidades.'
        ],
        suggestedQuestions: [
            '¿Cómo generar un reporte de ingresos por fecha?',
            '¿Cómo medir la productividad de los doctores?'
        ]
    },
    {
        id: 'vista_publica',
        title: 'Vista Pública y Portal de Reservas',
        section: 'Vista pública',
        path: '/public-view',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=1204',
        timestampSeconds: 1204,
        timestampLabel: '20:04',
        icon: Globe,
        keywords: ['vista publica', 'portal publico', 'reservas online', 'pagina web', 'link citas', 'paciente online', 'whatsapp reservas', 'perfil publico'],
        summary: 'Enlace público personalizado para que los pacientes puedan agendar sus citas por internet de forma autónoma las 24 horas.',
        steps: [
            'Entra a "Portal de Reservas / Vista Pública".',
            'Copia tu link personalizado de reservas para redes sociales y WhatsApp.',
            'Configura los servicios visibles y horarios disponibles para reserva pública.',
            'Las citas solicitadas por pacientes llegarán directamente a tu agenda.'
        ],
        suggestedQuestions: [
            '¿Cómo compartir el link de citas online con mis pacientes?',
            '¿Cómo configurar los horarios del portal web?'
        ]
    },
    {
        id: 'configuracion',
        title: 'Configuración, Usuarios y Roles',
        section: 'Configuración y usuarios',
        path: '/settings',
        videoUrl: 'https://youtu.be/F_g2erS_fXI?t=1486',
        timestampSeconds: 1486,
        timestampLabel: '24:46',
        icon: Settings,
        keywords: [
            'configuracion', 'usuarios', 'usuario', 'crear usuario', 'añadir usuario', 'nuevo usuario', 'agregar usuario',
            'añado un usuario', 'como creo un usuario', 'como anado un usuario', 'roles', 'permisos', 'doctores', 'asistentes', 'datos de clinica',
            'logo', 'seguridad', 'personal'
        ],
        summary: 'Administra los usuarios del sistema (doctores, secretarias, administradores), define roles con permisos específicos y personaliza los datos de tu clínica.',
        steps: [
            'Haz clic en "Configuración" al final de la barra lateral.',
            'Accede a la pestaña "Usuarios y Permisos" (o Personal).',
            'Presiona "+ Nuevo Usuario" para invitar o crear credenciales de un doctor o asistente.',
            'Asigna el rol correspondiente (Doctor, Administrador, Staff) y guarda los cambios.'
        ],
        suggestedQuestions: [
            '¿Cómo añado o creo un usuario en el sistema?',
            '¿Cómo cambiar permisos y roles de los usuarios?',
            '¿Cómo cambiar el logo y datos de la clínica?'
        ]
    }
];

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    topic?: TutorialTopic;
    timestamp: string;
}

function normalizeString(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();
}

function findBestTopic(query: string): TutorialTopic | null {
    const normalized = normalizeString(query);
    if (!normalized) return null;

    const queryTokens = normalized.split(/\s+/).filter((t) => t.length > 2);
    if (queryTokens.length === 0) return null;

    let bestTopic: TutorialTopic | null = null;
    let maxScore = 0;

    for (const topic of TUTORIAL_TOPICS) {
        let score = 0;

        // Direct phrase match in title or section
        const normTitle = normalizeString(topic.title);
        const normSection = normalizeString(topic.section);
        if (normTitle.includes(normalized) || normSection.includes(normalized)) {
            score += 25;
        }

        // Keywords scoring
        for (const kw of topic.keywords) {
            const normKw = normalizeString(kw);
            if (normalized.includes(normKw)) {
                score += 20;
            } else {
                for (const token of queryTokens) {
                    if (normKw.includes(token)) {
                        score += 5;
                    }
                }
            }
        }

        // Suggested questions match
        for (const sq of topic.suggestedQuestions) {
            const normSq = normalizeString(sq);
            if (normSq.includes(normalized) || normalized.includes(normSq)) {
                score += 30;
            }
            for (const token of queryTokens) {
                if (normSq.includes(token)) {
                    score += 3;
                }
            }
        }

        // Special semantic weight for common queries like "añadir usuario" vs "añadir paciente"
        if (normalized.includes('usuario') && topic.id === 'configuracion') {
            score += 35;
        }
        if (normalized.includes('paciente') && topic.id === 'pacientes') {
            score += 35;
        }

        if (score > maxScore) {
            maxScore = score;
            bestTopic = topic;
        }
    }

    return maxScore >= 8 ? bestTopic : null;
}

interface HelpTutorialAssistantProps {
    isOpen?: boolean;
    onClose?: () => void;
    showFloatingButton?: boolean;
}

export function HelpTutorialAssistant({
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    showFloatingButton = true
}: HelpTutorialAssistantProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = (val: boolean) => {
        if (controlledIsOpen !== undefined) {
            if (!val && controlledOnClose) controlledOnClose();
        } else {
            setInternalIsOpen(val);
        }
    };

    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        {
            id: 'welcome',
            sender: 'assistant',
            text: '¡Hola! Soy tu **Guía Operativa y de Tutoriales** de ClinicSoft. Pregúntame cómo realizar cualquier acción en el sistema (ej. *"¿Cómo añado un paciente?"* o *"¿Cómo creo un usuario?"*) y te mostraré el paso a paso junto con el video tutorial en su minuto exacto.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen, messages, isTyping]);

    const handleSendQuery = (queryText: string) => {
        const cleanQuery = queryText.trim();
        if (!cleanQuery) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: cleanQuery,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            const matched = findBestTopic(cleanQuery);
            let botMsg: ChatMessage;

            if (matched) {
                botMsg = {
                    id: `bot-${Date.now()}`,
                    sender: 'assistant',
                    text: `Así se realiza en la sección **${matched.section}** (${matched.title}):\n\n${matched.summary}`,
                    topic: matched,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            } else {
                botMsg = {
                    id: `bot-${Date.now()}`,
                    sender: 'assistant',
                    text: `No encontré una sección exacta para "${cleanQuery}", pero aquí tienes todos los módulos y tutoriales disponibles. Selecciona el que necesitas:`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 300);
    };

    const handleSelectTopicDirectly = (topic: TutorialTopic) => {
        handleSendQuery(`¿Cómo funciona ${topic.title}?`);
    };

    const handleResetChat = () => {
        setMessages([
            {
                id: 'welcome-reset',
                sender: 'assistant',
                text: 'Chat reiniciado. ¿En qué sección o proceso de ClinicSoft necesitas ayuda o ver el video tutorial?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    return (
        <>
            {/* Floating Action Button */}
            {showFloatingButton && (
                <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white rounded-full shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-medium text-sm border border-white/20"
                        title="Abrir Chat Guía y Tutoriales"
                        aria-label="Abrir Chat Guía"
                    >
                        <div className="relative">
                            <PlayCircle className="w-5 h-5 text-white animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                            </span>
                        </div>
                        <span className="font-semibold tracking-wide">Chat Guía</span>
                    </button>
                </div>
            )}

            {/* Chat Drawer / Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/40 backdrop-blur-xs transition-opacity"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div className="w-full sm:w-[480px] sm:max-w-[95vw] h-[85vh] max-h-[720px] bg-white dark:bg-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-[#0A1128] via-[#101F42] to-[#0A1128] text-white border-b border-white/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 p-0.5 flex items-center justify-center shadow-md">
                                    <div className="w-full h-full bg-[#0A1128]/80 rounded-[14px] flex items-center justify-center">
                                        <PlayCircle className="w-5 h-5 text-teal-300" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
                                        Chat Guía
                                        <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-full font-medium border border-teal-400/30">
                                            Tutoriales
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-gray-300">
                                        Respuestas guiadas con minutos exactos de video
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleResetChat}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                    title="Reiniciar conversación"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                    title="Cerrar ventana"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Quick category pills */}
                        <div className="px-3 py-2 bg-gray-50 dark:bg-slate-900/90 border-b border-gray-100 dark:border-slate-800 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
                            {TUTORIAL_TOPICS.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectTopicDirectly(t)}
                                    className="px-2.5 py-1 text-xs whitespace-nowrap rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-teal-500 dark:hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-medium cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                                >
                                    <t.icon className="w-3 h-3 text-teal-500" />
                                    <span>{t.section}</span>
                                </button>
                            ))}
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]/60 dark:bg-[#0B1120]/60">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[92%] rounded-2xl p-3.5 text-sm shadow-xs ${
                                            msg.sender === 'user'
                                                ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-br-xs'
                                                : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700/60 rounded-bl-xs'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                                        {/* Structured Tutorial Card if topic matched */}
                                        {msg.topic && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/80 space-y-3">
                                                {/* Steps list */}
                                                <div className="bg-sky-50/70 dark:bg-slate-900/70 rounded-xl p-2.5 border border-sky-100 dark:border-slate-700/50">
                                                    <p className="text-xs font-bold text-sky-900 dark:text-sky-300 mb-1.5 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                                                        Paso a paso:
                                                    </p>
                                                    <ol className="text-xs space-y-1 text-gray-700 dark:text-gray-300 list-decimal list-inside pl-1">
                                                        {msg.topic.steps.map((st, idx) => (
                                                            <li key={idx} className="leading-snug">
                                                                {st}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Video Card with Timestamp */}
                                                <div className="bg-gradient-to-r from-red-900/10 via-rose-900/10 to-teal-900/10 dark:from-red-950/40 dark:to-slate-900 rounded-xl p-3 border border-red-200/60 dark:border-red-900/40 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                                                                <PlayCircle className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                                                                    Video Tutorial Oficial
                                                                </span>
                                                                <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                                                                    Minuto exacto: {msg.topic.timestampLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-1">
                                                        <a
                                                            href={msg.topic.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                                                        >
                                                            <PlayCircle className="w-3.5 h-3.5" />
                                                            <span>Ver en YouTube ({msg.topic.timestampLabel})</span>
                                                            <ArrowUpRight className="w-3 h-3 opacity-80" />
                                                        </a>
                                                        <Link
                                                            href={msg.topic.path}
                                                            onClick={() => setIsOpen(false)}
                                                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
                                                        >
                                                            <span>Ir a {msg.topic.section}</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* If no topic matched, show all available sections table/list */}
                                        {!msg.topic && msg.sender === 'assistant' && msg.id !== 'welcome' && (
                                            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700/80 space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                                {TUTORIAL_TOPICS.map((t) => (
                                                    <div
                                                        key={t.id}
                                                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-900/60 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800 text-xs"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <t.icon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                                                            <span className="font-semibold truncate text-gray-800 dark:text-gray-200">
                                                                {t.section}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <a
                                                                href={t.videoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-red-600 dark:text-red-400 hover:underline font-bold text-[11px] flex items-center gap-0.5"
                                                            >
                                                                <span>{t.timestampLabel}</span>
                                                                <ArrowUpRight className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-700/60 w-20 shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.15s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.3s]"></span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <div className="p-3 bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-slate-800 shrink-0">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendQuery(inputValue);
                                }}
                                className="flex items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ej: ¿Cómo añado un usuario o paciente?"
                                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="p-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                                    title="Enviar consulta"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                                Motor de tutoriales offline con marcas de tiempo directas a YouTube.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default HelpTutorialAssistant;
