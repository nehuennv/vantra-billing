import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, XCircle, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { getPrimaryColor } from '../../../config/client';

export const LoadingSteps = ({ currentStep }) => {
    const steps = [
        "Validando datos...",
        "Conectando con servicio de facturación...",
        "Negociando con ARCA/AFIP...",
        "Generando comprobante fiscal (CAE)...",
        "Firmando digitalmente el PDF...",
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto py-12">
            {/* Animated Sphere Loader */}
            <div className="relative mb-12">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-24 w-24 rounded-full border-[3px] border-slate-100 border-t-primary border-r-primary"
                />
                <motion.div
                    animate={{ rotate: -180 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-[3px] border-slate-100 border-b-primary/70 border-l-primary/70 opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-primary tabular-nums">
                        {Math.round(((currentStep + 1) / steps.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Steps Container */}
            <div className="w-full space-y-4 px-4 relative">
                {/* Progress Bar Background */}
                <div className="absolute left-[31px] top-2 bottom-2 w-0.5 bg-slate-100 rounded-full" />

                {/* Progress Line */}
                <motion.div
                    className="absolute left-[31px] top-2 w-0.5 bg-primary rounded-full origin-top"
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {steps.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isCompleted = idx < currentStep;

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{
                                opacity: isActive || isCompleted ? 1 : 0.4,
                                x: 0,
                                scale: isActive ? 1.02 : 1
                            }}
                            className={`relative flex items-center gap-4 text-base transition-colors duration-300 pl-2 ${isActive ? 'text-primary font-semibold' : 'text-slate-500'}`}
                        >
                            <div className="relative z-10 flex items-center justify-center w-6 h-6 shrink-0">
                                <motion.div
                                    animate={{
                                        scale: isActive ? [1, 1.2, 1] : 1,
                                        backgroundColor: isCompleted || isActive ? (getPrimaryColor()) : '#e2e8f0',
                                        borderColor: isActive ? (getPrimaryColor()) + '33' : 'transparent'
                                    }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-4 w-4 rounded-full border-2 shadow-sm ${isActive ? 'ring-4 ring-primary/20' : ''}`}
                                />
                            </div>

                            <span className="truncate">{step}</span>

                            {isCompleted && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="ml-auto"
                                >
                                    <Check className="h-5 w-5 text-primary" />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export const SuccessScreen = ({ invoice, onClose, onDownload, emailSent, buttonsParams = {} }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center w-full max-w-2xl mx-auto">
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="h-28 w-28 bg-primary/15 rounded-full flex items-center justify-center mb-8 shadow-inner ring-8 ring-primary/10 backdrop-blur-sm"
            >
                <CheckCircle2 className="h-14 w-14 text-primary" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="space-y-2 mb-10"
            >
                <h3 className="text-4xl font-bold text-slate-800 tracking-tight">¡Factura Emitida!</h3>
                <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
                    {emailSent
                        ? "El comprobante se ha generado y enviado por correo correctamente."
                        : "El comprobante se ha generado correctamente."}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-3xl p-8 w-full max-w-[500px] border border-slate-100 mb-10 grid grid-cols-2 gap-8 shadow-2xl shadow-primary/5 relative overflow-hidden group"
            >
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-700" />

                <div className="text-left relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Comprobante</p>
                    <p className="font-mono text-slate-700 font-bold text-xl tracking-tight">
                        {invoice?.invoice_number || invoice?.number || "0000-00000000"}
                    </p>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Final</p>
                    <p className="text-3xl font-bold text-primary tracking-tighter">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(invoice?.total_amount || invoice?.amount || invoice?.total || 0)}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 w-full max-w-[500px]"
            >
                {onClose && (
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 text-base border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                    >
                        {buttonsParams.closeText || "Cerrar"}
                    </Button>
                )}
                {onDownload && (
                    <Button
                        onClick={onDownload}
                        className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Descargar PDF
                    </Button>
                )}
            </motion.div>
        </div>
    );
};

export const ErrorScreen = ({ error, onRetry, onCancel }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="h-24 w-24 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-sm ring-8 ring-rose-50/50">
                <XCircle className="h-12 w-12 text-rose-600" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">Error al Emitir</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                {error || "Hubo un problema al comunicarse con el servicio de facturación. Por favor intenta nuevamente."}
            </p>

            <div className="flex gap-4 w-full max-w-xs">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} className="flex-1 h-11">
                        Cancelar
                    </Button>
                )}
                {onRetry && (
                    <Button onClick={onRetry} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">
                        Reintentar
                    </Button>
                )}
            </div>
        </div>
    );
};
