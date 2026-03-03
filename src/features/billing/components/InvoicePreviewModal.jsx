import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download, Calendar, Send, Loader2, AlertCircle, FileText, CheckCircle2, XCircle, ChevronRight, Check, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { createInvoice } from '../services/invoiceService';
import { invoiceAPI } from '../../../services/apiClient';
import { getPrimaryColor } from '../../../config/client';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { MonthYearPicker } from './MonthYearPicker';
import { clientConfig } from '../../../config/client';

// --- SUB-COMPONENTS FOR ANIMATION ---

const LoadingSteps = ({ currentStep }) => {
    const steps = [
        "Validando datos...",
        "Conectando con servicio de facturación...",
        "Negociando con ARCA/AFIP...",
        "Generando comprobante fiscal (CAE)...",
        "Firmando digitalmente el PDF...",
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto">
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

const SuccessScreen = ({ invoice, onClose, onDownload, emailSent }) => {
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
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 text-base border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
                >
                    Cerrar
                </Button>
                <Button
                    onClick={onDownload}
                    className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 rounded-xl font-semibold transition-all hover:-translate-y-0.5"
                >
                    <Download className="h-5 w-5 mr-2" />
                    Descargar PDF
                </Button>
            </motion.div>
        </div>
    );
};

const ErrorScreen = ({ error, onRetry, onCancel }) => {
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
                <Button variant="outline" onClick={onCancel} className="flex-1 h-11">
                    Cancelar
                </Button>
                <Button onClick={onRetry} className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">
                    Reintentar
                </Button>
            </div>
        </div>
    );
};

// Formateador de moneda reutilizable
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
};

export function InvoicePreviewModal({ open, onOpenChange, client, items: initialItems = [], initialData = null, readOnly = false, onInvoiceCreated }) {
    if (!open) return null;

    // State
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [items, setItems] = useState([]);
    const [notifyClient, setNotifyClient] = useState(false);
    const [ivaPercentage, setIvaPercentage] = useState(21);

    // Flow State
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [loadingStep, setLoadingStep] = useState(0);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Initialize state
    useEffect(() => {
        if (open) {
            // Reset flow state on open
            if (status !== 'success') { // Don't reset if we are just looking at the success screen, but usually open=true resets
                setStatus('idle');
                setLoadingStep(0);
                setErrorMessage(null);
                setCreatedInvoice(null);
            }

            if (initialData) {
                setPeriod(initialData.period || new Date().toISOString().slice(0, 7));
                setItems(initialData.items || []);
                setNotifyClient(initialData.options?.notifyClient || false);
                setIvaPercentage(initialData.iva_percentage || 21);
            } else {
                if (initialItems && initialItems.length > 0) {
                    const mappedItems = initialItems.map(svc => ({
                        id: crypto.randomUUID(),
                        description: svc.name,
                        quantity: 1,
                        unit_price: Number(svc.price) || 0
                    }));
                    setItems(mappedItems);
                } else {
                    setItems([{ id: crypto.randomUUID(), description: "Servicio de Facturación", quantity: 1, unit_price: 0 }]);
                }
                setPeriod(new Date().toISOString().slice(0, 7));
                setNotifyClient(false);

                try {
                    const stored = JSON.parse(localStorage.getItem('vantra_settings') || '{}');
                    const defaultTax = stored?.billing?.taxRate;
                    setIvaPercentage(defaultTax === 10.5 ? 10.5 : 21);
                } catch {
                    setIvaPercentage(21);
                }
            }
        }
    }, [open, initialItems, initialData, client]);

    // Handlers
    const handleItemChange = (index, field, value) => {
        if (status === 'submitting') return;
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        if (status === 'submitting') return;
        setItems([
            ...items,
            { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }
        ]);
    };

    const handleRemoveItem = (index) => {
        if (status === 'submitting') return;
        if (items.length === 1 && !items[0].description) return;
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Calculations
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    const handleSubmit = async () => {
        // Validation
        if (!period) {
            toast.error("Falta el periodo", { description: "Por favor selecciona un mes de facturación." });
            return;
        }
        if (items.length === 0 || items.some(i => !i.description || i.description.trim() === '')) {
            toast.error("Items incompletos", { description: "La factura debe tener al menos un item con descripción." });
            return;
        }

        setStatus('submitting');
        setLoadingStep(0);

        // Simulate progress steps
        const stepInterval = setInterval(() => {
            setLoadingStep(prev => {
                if (prev < 4) return prev + 1;
                return prev;
            });
        }, 1200); // Change step every 1.2s

        try {
            const payload = {
                clientId: client?.id,
                period,
                iva_percentage: ivaPercentage,
                items: items.map(i => ({
                    description: i.description,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price)
                })),
                options: {
                    notifyClient
                }
            };

            const response = await createInvoice(payload);

            clearInterval(stepInterval);
            setLoadingStep(4); // Finish steps

            // Wait a small bit for the last step animation
            setTimeout(() => {
                const invoiceData = response.data || response;
                setCreatedInvoice(invoiceData);
                setStatus('success');
                toast.success("Factura generada correctamente");
                if (onInvoiceCreated) onInvoiceCreated(invoiceData);
            }, 800);

        } catch (error) {
            clearInterval(stepInterval);
            console.error("Error creating invoice", error);
            setErrorMessage(error.message || "Error desconocido al procesar la factura.");
            setStatus('error');
        }
    };

    const handleDownloadPDF = async () => {
        if (!createdInvoice) return;

        const promise = async () => {
            try {
                // Try backend first
                // FIX: Use invoice_id from the response, fallback to id if not present
                const invoiceId = createdInvoice.invoice_id || createdInvoice.id;

                if (!invoiceId) throw new Error("ID de factura no encontrado");

                const response = await invoiceAPI.getPdf(invoiceId);
                const { blob, filename } = response;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                // Use backend filename, or fallback if missing (though apiClient provides a fallback)
                link.download = filename || `factura-${client.company_name?.replace(/\s+/g, '_') || 'cliente'}-${createdInvoice.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (err) {
                // Fallback to client-side generation
                const blob = await pdf(
                    <InvoicePDF
                        client={client}
                        items={createdInvoice.items || items}
                        invoiceNumber={createdInvoice.number}
                        issueDate={createdInvoice.issueDate}
                        dueDate={createdInvoice.dueDate}
                        invoiceType={createdInvoice.invoiceType}
                    />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `factura-${createdInvoice.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        };

        toast.promise(promise(), {
            loading: 'Descargando...',
            success: 'Descarga iniciada',
            error: 'No se pudo descargar el PDF'
        });
    };

    const FormContent = () => (
        <div className="flex flex-col h-full">
            {/* Header Premium */}
            <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-start justify-between z-20 shrink-0">
                <div>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
                            <FileText className="h-6 w-6" />
                        </div>
                        Nueva Factura
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1 ml-[3.25rem]">
                        El backend calculará impuestos y comprobante automáticamente.
                    </p>
                </div>
                {/* Badge de Cliente */}
                {client && (
                    <div className="hidden md:block text-right bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cliente</p>
                        <p className="font-bold text-slate-800 text-sm">{client?.company_name || client?.businessName}</p>
                        <p className="text-xs text-slate-500 font-mono">{client?.cuit || "Consumidor Final"}</p>
                    </div>
                )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-hidden relative">
                <div className="flex flex-col md:grid md:grid-cols-12 gap-0 h-full overflow-hidden">
                    {/* Columna Izquierda: Configuración */}
                    <div className="w-full md:col-span-4 bg-slate-50/50 border-r border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 md:h-full max-h-[40vh] md:max-h-full border-b md:border-b-0">

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Configuración General</Label>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-medium">Periodo de Facturación</Label>
                                    <div className="relative group">
                                        <MonthYearPicker
                                            value={period}
                                            onChange={setPeriod}
                                            className={cn(
                                                "h-11 bg-slate-50 border-slate-200 transition-all rounded-xl",
                                                !readOnly && "hover:bg-white hover:border-primary/40 hover:shadow-sm"
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-medium">IVA</Label>
                                    <select
                                        value={ivaPercentage}
                                        onChange={(e) => setIvaPercentage(Number(e.target.value))}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50 hover:bg-white focus:bg-white text-slate-700 font-medium"
                                        disabled={readOnly}
                                    >
                                        <option value={21}>21%</option>
                                        <option value={10.5}>10.5%</option>
                                    </select>
                                </div>

                                {!readOnly && (
                                    <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${notifyClient ? 'bg-primary/10 border-primary/30 shadow-inner' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <div className="flex items-center h-5 mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={notifyClient}
                                                onChange={(e) => setNotifyClient(e.target.checked)}
                                                className="h-5 w-5 rounded-md border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-semibold text-sm ${notifyClient ? 'text-primary' : 'text-slate-700'}`}>
                                                Enviar por Email
                                            </span>
                                            <span className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                Si activas esto, el cliente recibirá el PDF automáticamente.
                                            </span>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-slate-50 p-6 rounded-2xl shadow-xl shadow-slate-900/10 mt-auto relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign className="w-24 h-24 -mr-8 -mt-8" />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Estimado</p>
                            <p className="text-4xl font-bold tracking-tight text-primary/70 truncate">{formatCurrency(total)}</p>
                            <p className="text-slate-500 text-xs mt-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                IVA incluido en precios finales
                            </p>
                        </div>
                    </div>

                    {/* Columna Derecha: Items */}
                    <div className="w-full md:col-span-8 bg-white flex flex-col h-full overflow-hidden flex-1">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white z-10">
                            <h3 className="text-base font-bold text-slate-800">Conceptos a Facturar</h3>
                            {!readOnly && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAddItem}
                                    className="h-9 text-primary hover:text-primary/80 hover:bg-primary/10 px-4 rounded-lg font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Agregar Item
                                </Button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 w-[45%]">Descripción</th>
                                        <th className="px-4 py-4 w-[15%] text-center">Cant.</th>
                                        <th className="px-4 py-4 w-[20%] text-right">Precio Unit.</th>
                                        <th className="px-6 py-4 w-[15%] text-right">Subtotal</th>
                                        {!readOnly && <th className="px-2 py-4 w-[5%]"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="p-3 pl-6">
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                    placeholder="Descripción del servicio..."
                                                    className="border-transparent bg-transparent shadow-none px-0 h-auto py-2 focus:ring-0 placeholder:text-slate-300 font-medium text-slate-700 text-base"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                    onFocus={(e) => e.target.select()}
                                                    className="text-center border-slate-100 bg-slate-50 hover:bg-white focus:bg-white h-9 shadow-sm rounded-lg"
                                                    readOnly={readOnly}
                                                    min="1"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                                        onFocus={(e) => e.target.select()}
                                                        className="text-right pl-6 border-slate-100 bg-slate-50 hover:bg-white focus:bg-white h-9 shadow-sm rounded-lg"
                                                        readOnly={readOnly}
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-3 pr-6 text-right font-bold text-slate-700 tabular-nums text-base">
                                                {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                                            </td>
                                            {!readOnly && (
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-slate-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                                        tabIndex={-1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-3 bg-slate-100 rounded-full">
                                                        <Plus className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                    <p>Agrega items para comenzar la factura</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <DialogFooter className="bg-white p-4 border-t border-slate-100 shrink-0 z-20 gap-3">
                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-11 px-6 border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-xl"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    className="h-11 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 rounded-xl font-semibold transition-all hover:scale-[1.02]"
                >
                    {notifyClient ? <Send className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    {readOnly ? 'Cerrar' : 'Emitir Factura'}
                </Button>
            </DialogFooter>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={status === 'submitting' ? undefined : onOpenChange}>
            {/* Agregamos una altura fija: h-[85vh] o similar */}
            <DialogContent className="sm:max-w-6xl w-[95vw] h-[85vh] p-0 gap-0 bg-white rounded-3xl overflow-hidden shadow-2xl border-0 ring-1 ring-slate-900/5">
                <AnimatePresence mode="wait">
                    {status === 'idle' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full w-full"
                        >
                            <FormContent />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="status-screen"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="h-full w-full p-10 flex flex-col items-center justify-center bg-slate-50/50"
                        >
                            {status === 'submitting' && <LoadingSteps currentStep={loadingStep} />}
                            {status === 'success' && (
                                <SuccessScreen
                                    invoice={createdInvoice}
                                    emailSent={notifyClient}
                                    onClose={() => onOpenChange(false)}
                                    onDownload={handleDownloadPDF}
                                />
                            )}
                            {status === 'error' && (
                                <ErrorScreen
                                    error={errorMessage}
                                    onRetry={handleSubmit}
                                    onCancel={() => setStatus('idle')}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}