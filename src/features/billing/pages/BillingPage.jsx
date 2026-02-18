import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, FileText, Calendar, Plus, Trash2, Send, Download, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { cn } from "../../../lib/utils";
import { PageTransition } from "../../../components/common/PageTransition";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { toast } from 'sonner';
import { ClientSelector } from '../components/ClientSelector';
import { CatalogItemSelector } from '../components/CatalogItemSelector';
import { createInvoice } from '../services/invoiceService';
import { LoadingSteps, SuccessScreen, ErrorScreen } from '../components/BillingFeedback';
import { invoiceAPI } from '../../../services/apiClient';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../components/InvoicePDF';

const STEPS = [
    { id: 1, title: "Datos Generales", icon: FileText },
    { id: 2, title: "Items y Conceptos", icon: Plus },
    { id: 3, title: "Revisar y Emitir", icon: CheckCircle2 }
];

// Formateador de moneda reutilizable
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
};

export default function BillingPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(1); // For animation direction
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [selectedClient, setSelectedClient] = useState(null);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [items, setItems] = useState([
        { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }
    ]);

    // Flow State
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [loadingStep, setLoadingStep] = useState(0);
    const [createdInvoice, setCreatedInvoice] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Validation
    const validateStep = (step) => {
        if (step === 1) return !!selectedClient && !!period;
        if (step === 2) return items.some(i => i.description.trim() !== '' && i.unit_price > 0);
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setDirection(1);
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        } else {
            toast.error("Completa los campos obligatorios para continuar.");
        }
    };

    const prevStep = () => {
        setDirection(-1);
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // Item Handlers
    const handleAddItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1 && !items[0].description) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSelectCatalogItem = (catalogItem) => {
        setItems([
            ...items.filter(i => i.description.trim() !== ''), // Remove empty placeholder if any
            {
                id: crypto.randomUUID(),
                description: catalogItem.name,
                quantity: 1,
                unit_price: Number(catalogItem.default_price)
            }
        ]);
        toast.success("Item agregado del catálogo");
    };

    // Calculate Total
    const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    // Submission
    const handleEmit = async () => {
        setIsSubmitting(true);
        setStatus('submitting');
        setLoadingStep(0);

        // Simulate progress steps
        const stepInterval = setInterval(() => {
            setLoadingStep(prev => {
                if (prev < 4) return prev + 1;
                return prev;
            });
        }, 1200);

        try {
            const payload = {
                clientId: selectedClient.id,
                period,
                items: items.map(i => ({
                    description: i.description,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price)
                })),
                options: { notifyClient: false }
            };

            const response = await createInvoice(payload);

            clearInterval(stepInterval);
            setLoadingStep(4);

            setTimeout(() => {
                const invoiceData = response.data || response;
                setCreatedInvoice(invoiceData);
                setStatus('success');
                toast.success("Factura generada correctamente");
            }, 800);

        } catch (error) {
            clearInterval(stepInterval);
            console.error("Error creating invoice", error);
            setErrorMessage(error.message || "Error desconocido al procesar la factura.");
            setStatus('error');

            // Check for timeout specifically to warn
            const isTimeout = error.message?.includes('502') || error.message?.includes('504');
            if (isTimeout) {
                toast.warning("La respuesta demoró demasiado", {
                    description: "Es posible que la factura se haya creado. Verifica en el listado.",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!createdInvoice) return;

        const promise = async () => {
            try {
                // Try backend first
                const invoiceId = createdInvoice.invoice_id || createdInvoice.id;

                if (!invoiceId) throw new Error("ID de factura no encontrado");

                const response = await invoiceAPI.getPdf(invoiceId);
                const { blob, filename } = response;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename || `factura-${selectedClient.company_name?.replace(/\s+/g, '_') || 'cliente'}-${createdInvoice.invoice_number || createdInvoice.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (err) {
                // Fallback to client-side generation
                const blob = await pdf(
                    <InvoicePDF
                        client={selectedClient}
                        items={createdInvoice.items || items}
                        invoiceNumber={createdInvoice.invoice_number || createdInvoice.number}
                        issueDate={createdInvoice.date || new Date().toISOString()} // Fallback date
                        dueDate={createdInvoice.dueDate} // Might be undefined
                        invoiceType={createdInvoice.invoice_type || 'B'}
                    />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `factura-${createdInvoice.invoice_number || createdInvoice.number}.pdf`;
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

    // Animation Variants
    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 10 : -10,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction > 0 ? -10 : 10,
            opacity: 0
        })
    };

    return (
        <PageTransition className="h-full flex flex-col gap-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Nueva Factura</h2>
                    <p className="text-sm text-slate-500">
                        Asistente para la generación de comprobantes fiscales.
                    </p>
                </div>
            </div>

            {/* Wizard Container */}
            <div className="flex-1 w-full max-w-5xl mx-auto space-y-8">
                {/* Steps Indicator - Organic & Compact */}
                {status === 'idle' && (
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 relative">
                            {STEPS.map((step) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;

                                return (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "relative px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300",
                                            isActive ? "bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/20 ring-offset-2" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                                            isActive ? "border-transparent bg-white/20 text-white" :
                                                isCompleted ? "bg-emerald-100 text-emerald-600 border-emerald-100" : "border-slate-300 bg-transparent"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : step.id}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-semibold tracking-wide transition-all",
                                            isActive ? "opacity-100 max-w-[200px]" : "hidden sm:block opacity-100"
                                        )}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Wizard Content */}
                <Card className="h-[750px] flex flex-col shadow-2xl shadow-slate-200/50 border-slate-100 overflow-hidden relative bg-white/90 backdrop-blur-xl ring-1 ring-slate-900/5">
                    <CardContent className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                        {status !== 'idle' ? (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="h-full w-full flex flex-col items-center justify-center"
                            >
                                {status === 'submitting' && <LoadingSteps currentStep={loadingStep} />}
                                {status === 'success' && (
                                    <SuccessScreen
                                        invoice={createdInvoice}
                                        emailSent={false}
                                        onClose={() => {
                                            setStatus('idle');
                                            setCurrentStep(1);
                                            setSelectedClient(null);
                                            setItems([{ id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }]);
                                        }}
                                        onDownload={handleDownloadPDF}
                                        buttonsParams={{ closeText: "Nueva Factura" }}
                                    />
                                )}
                                {status === 'error' && (
                                    <ErrorScreen
                                        error={errorMessage}
                                        onRetry={handleEmit}
                                        onCancel={() => setStatus('idle')}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentStep}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="min-h-full"
                                >
                                    {/* STEP 1: CLIENT & PERIOD */}
                                    {currentStep === 1 && (
                                        <div className="space-y-8">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800 mb-6">Selecciona el Cliente</h2>
                                                <ClientSelector
                                                    selectedClientId={selectedClient?.id}
                                                    onSelect={setSelectedClient}
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {selectedClient && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-8 pt-8 border-t border-slate-200/60">
                                                            <div className="max-w-md">
                                                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                                    <Calendar className="h-5 w-5 text-slate-400" />
                                                                    Periodo a Facturar
                                                                </h2>
                                                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                                                    <Label className="text-base mb-2 block">Mes y Año</Label>
                                                                    <MonthYearPicker
                                                                        value={period}
                                                                        onChange={setPeriod}
                                                                        className="h-14 "
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* STEP 2: ITEMS */}
                                    {currentStep === 2 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-slate-800">Conceptos a Facturar</h2>
                                                    <p className="text-slate-500 text-sm">Agrega los items que compondrán la factura.</p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <CatalogItemSelector onSelect={handleSelectCatalogItem} />
                                                    <Button onClick={handleAddItem} variant="secondary" size="sm" className="gap-2 h-10 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
                                                        <Plus className="h-4 w-4" /> Manual
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-slate-50/80 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                                                        <tr>
                                                            <th className="px-6 py-4 w-[45%]">Descripción</th>
                                                            <th className="px-4 py-4 w-[15%] text-center">Cant.</th>
                                                            <th className="px-4 py-4 w-[20%] text-right">Precio Unit.</th>
                                                            <th className="px-6 py-4 w-[15%] text-right">Subtotal</th>
                                                            <th className="px-2 py-4 w-[5%]"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {items.map((item, idx) => (
                                                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                                <td className="p-3 pl-6">
                                                                    <Input
                                                                        value={item.description}
                                                                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                                        placeholder="Descripción del servicio..."
                                                                        className="border-transparent bg-transparent shadow-none px-0 h-auto py-2 focus:ring-0 font-medium text-slate-700 placeholder:text-slate-300 text-base"
                                                                    />
                                                                </td>
                                                                <td className="p-3">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                                        onFocus={(e) => e.target.select()}
                                                                        className="text-center border-slate-100 bg-slate-50 hover:bg-white focus:bg-white h-9 shadow-sm rounded-lg"
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
                                                                            step="0.01"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 pr-6 text-right font-bold text-slate-700 tabular-nums text-base">
                                                                    {formatCurrency(item.quantity * item.unit_price)}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        onClick={() => handleRemoveItem(idx)}
                                                                        className="text-slate-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-all"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <div className="text-right bg-slate-50/50 p-6 rounded-2xl border border-slate-100 min-w-[250px]">
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Estimado</p>
                                                    <p className="text-4xl font-bold text-slate-900 tracking-tight">{formatCurrency(total)}</p>
                                                    <p className="text-xs text-slate-400 mt-1">IVA Incluido</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: REVIEW */}
                                    {currentStep === 3 && (
                                        <div className="space-y-8 max-w-2xl mx-auto">
                                            <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                                    <FileText className="h-8 w-8" />
                                                </div>
                                                <h2 className="text-3xl font-bold text-slate-900">Resumen de Facturación</h2>
                                                <p className="text-slate-500 mt-2">Revisa todos los datos antes de emitir el comprobante.</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Cliente</p>
                                                    <p className="font-bold text-slate-900 text-xl">{selectedClient?.company_name}</p>
                                                    <p className="text-sm text-slate-500 font-mono mt-1">{selectedClient?.tax_id}</p>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Periodo</p>
                                                    <p className="font-bold text-slate-900 text-xl capitalize">
                                                        {new Date(period + '-10').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium w-fit">
                                                            Sin notificación email
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 space-y-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle del Comprobante</p>
                                                </div>
                                                <ul className="space-y-3">
                                                    {items.map((item, i) => (
                                                        <li key={i} className="flex justify-between text-base border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                            <span className="text-slate-700 font-medium truncate max-w-[70%]">
                                                                <span className="font-bold text-slate-400 mr-2">{item.quantity}x</span>
                                                                {item.description}
                                                            </span>
                                                            <span className="text-slate-900 font-bold tabular-nums">
                                                                {formatCurrency(item.quantity * item.unit_price)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="border-t border-dashed border-slate-300 pt-4 flex justify-between items-center mt-4">
                                                    <span className="font-bold text-slate-900 text-xl">Total Final</span>
                                                    <span className="font-bold text-slate-900 text-3xl tabular-nums tracking-tight">{formatCurrency(total)}</span>
                                                </div>
                                            </div>

                                            {/* Warnings */}
                                            <div className="flex items-start gap-3 p-4 bg-amber-50/50 text-amber-800 rounded-xl text-sm border border-amber-100/50">
                                                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                                                <p className="leading-relaxed"><span className="font-bold">Atención:</span> Una vez emitida, la factura se enviará a AFIP para su autorización (CAE). Esta operación es oficial y no se puede deshacer desde aquí.</p>
                                            </div>


                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </CardContent>

                    {/* Footer Navigation */}
                    {status === 'idle' && (
                        <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 rounded-b-2xl flex justify-between items-center mt-auto">
                            {currentStep < 3 ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={prevStep}
                                        disabled={currentStep === 1}
                                        className={cn("text-slate-500 hover:text-slate-900", currentStep === 1 ? "opacity-0 pointer-events-none" : "")}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                                    </Button>
                                    <Button onClick={nextStep} className="px-10 py-6 bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 font-semibold text-base rounded-xl transition-all hover:scale-105 active:scale-95">
                                        Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </>
                            ) : (
                                /* Step 4 Actions */
                                <div className="flex gap-4 w-full">
                                    <Button
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={isSubmitting}
                                        className="flex-1 py-7 text-base border-slate-200 hover:bg-slate-50"
                                    >
                                        Volver
                                    </Button>
                                    <Button
                                        onClick={handleEmit}
                                        disabled={isSubmitting}
                                        className="flex-[2] py-7 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 text-lg font-bold"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                                Confirmar y Emitir
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </PageTransition>
    );
}

