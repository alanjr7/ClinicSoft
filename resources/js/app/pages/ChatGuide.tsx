import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import Layout from '../components/Layout';
import {
    Sparkles,
    Send,
    PlayCircle,
    ArrowUpRight,
    ChevronRight,
    RotateCcw,
    Bot,
    User,
    CheckCircle2,
    Copy,
    Check
} from 'lucide-react';
import { TUTORIAL_TOPICS, TutorialTopic } from '../components/HelpTutorialAssistant';

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

        const normTitle = normalizeString(topic.title);
        const normSection = normalizeString(topic.section);
        if (normTitle.includes(normalized) || normSection.includes(normalized)) {
            score += 25;
        }

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

        if (normalized.includes('usuario') && topic.id === 'configuracion') score += 35;
        if (normalized.includes('paciente') && topic.id === 'pacientes') score += 35;
        if (normalized.includes('gasto') && topic.id === 'contabilidad') score += 35;
        if (normalized.includes('pos') && topic.id === 'farmacia') score += 35;

        if (score > maxScore) {
            maxScore = score;
            bestTopic = topic;
        }
    }

    return maxScore >= 8 ? bestTopic : null;
}

export default function ChatGuide() {
    const [inputValue, setInputValue] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            sender: 'assistant',
            text: '¡Hola! ¿En qué necesitas ayuda hoy?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        const cleanQuery = inputValue.trim();
        if (!cleanQuery || isTyping) return;

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
                    text: `Para gestionar esto en el módulo de **${matched.section}**:\n\n${matched.summary}`,
                    topic: matched,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            } else {
                botMsg = {
                    id: `bot-${Date.now()}`,
                    sender: 'assistant',
                    text: `No encontré una guía específica para tu consulta. Puedes preguntarme sobre módulos como *Pacientes*, *Citas*, *Cirugías*, *Historial Clínico*, *Cobros y Caja*, *Farmacia*, *Contabilidad* o *Configuración*.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 350);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleResetChat = () => {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: 'assistant',
                text: '¡Hola! ¿En qué necesitas ayuda hoy?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="h-[calc(100vh-65px)] lg:h-screen flex flex-col bg-white dark:bg-[#0B1120] text-gray-900 dark:text-gray-100">
            {/* Header simple y limpio */}
            <header className="px-6 py-3 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Chat Guía</h1>
                        <p className="text-[11px] text-gray-400">Asistente de ayuda del sistema</p>
                    </div>
                </div>

                <button
                    onClick={handleResetChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Nuevo chat"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Nuevo chat</span>
                </button>
            </header>

            {/* Conversation Stream */}
            <main className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-5">
                    {messages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`flex gap-2.5 ${
                                        isUser
                                            ? 'flex-row-reverse items-end max-w-[85%] sm:max-w-[75%]'
                                            : 'items-start max-w-[92%] sm:max-w-[85%]'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                                            isUser
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-teal-200/70 dark:border-slate-700 shadow-2xs'
                                        }`}
                                    >
                                        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    {/* Bubble */}
                                    <div
                                        className={`rounded-2xl p-4 text-sm shadow-xs ${
                                            isUser
                                                ? 'bg-sky-600 dark:bg-sky-500 text-white rounded-br-xs'
                                                : 'bg-white dark:bg-[#1E293B] text-gray-800 dark:text-gray-100 border border-gray-200/90 dark:border-slate-700/80 rounded-tl-xs shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-1">
                                            <span
                                                className={`text-[11px] font-bold ${
                                                    isUser ? 'text-sky-100' : 'text-teal-600 dark:text-teal-400'
                                                }`}
                                            >
                                                {isUser ? 'Tú' : 'Chat Guía ClinicSoft'}
                                            </span>
                                            <span
                                                className={`text-[10px] ${
                                                    isUser ? 'text-sky-200' : 'text-gray-400'
                                                }`}
                                            >
                                                {msg.timestamp}
                                            </span>
                                        </div>

                                        <p className="whitespace-pre-line leading-relaxed font-normal">
                                            {msg.text}
                                        </p>

                                        {/* Tarjeta de pasos y video si hay coincidencia */}
                                        {msg.topic && (
                                            <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-slate-700/80 space-y-3">
                                                {/* Pasos a seguir */}
                                                <div className="bg-sky-50/70 dark:bg-slate-900/80 rounded-xl p-3 border border-sky-100 dark:border-slate-700/60">
                                                    <p className="text-xs font-bold text-sky-950 dark:text-sky-300 mb-1.5 flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                                                        Pasos a seguir:
                                                    </p>
                                                    <ol className="text-xs space-y-1 text-gray-700 dark:text-gray-300 list-decimal list-inside pl-1">
                                                        {msg.topic.steps.map((st, idx) => (
                                                            <li key={idx} className="leading-snug">
                                                                {st}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Botones de acción */}
                                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                                    <a
                                                        href={msg.topic.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        <PlayCircle className="w-3.5 h-3.5" />
                                                        <span>Ver tutorial ({msg.topic.timestampLabel})</span>
                                                        <ArrowUpRight className="w-3 h-3 opacity-80" />
                                                    </a>
                                                    <Link
                                                        href={msg.topic.path}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                                                    >
                                                        <span>Abrir {msg.topic.section}</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        {!isUser && msg.id !== 'welcome' && (
                                            <div className="mt-2 pt-1.5 flex items-center justify-end">
                                                <button
                                                    onClick={() => handleCopy(msg.id, msg.text)}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                                    title="Copiar respuesta"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <Check className="w-3 h-3 text-teal-500" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                    <span className="text-[10px]">
                                                        {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isTyping && (
                        <div className="flex justify-start w-full">
                            <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-teal-50 dark:bg-slate-800 text-teal-500 border border-teal-200/70 dark:border-slate-700 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-1.5 py-2.5 px-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 shadow-xs">
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></span>
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.15s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.3s]"></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Bar centrada al estilo ChatGPT */}
            <footer className="p-4 border-t border-gray-100 dark:border-slate-800/80 shrink-0">
                <div className="max-w-3xl mx-auto">
                    <div className="relative flex items-center bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-500 transition-all p-2">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="Escribe tu mensaje aquí..."
                            className="w-full bg-transparent resize-none border-0 focus:outline-none focus:ring-0 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 px-2 py-1 max-h-32"
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isTyping}
                            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 ml-1"
                            title="Enviar mensaje"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-2">
                        Presiona Enter para enviar. Chat Guía te explicará el procedimiento y el video oficial.
                    </p>
                </div>
            </footer>
        </div>
    );
}

ChatGuide.layout = (page: React.ReactNode) => <Layout>{page}</Layout>;
