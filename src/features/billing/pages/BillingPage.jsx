import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, FileText, Calendar, Plus, Trash2, Send, Download, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { PageTransition } from "../../../components/common/PageTransition";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { toast } from 'sonner';
import { ClientSelector } from '../components/ClientSelector';
import { CatalogItemSelector } from '../components/CatalogItemSelector';
import { createInvoice } from '../services/invoiceService';

const STEPS = [
    { id: 1, title: "Seleccionar Cliente", icon: FileText },
    { id: 2, title: "Datos de Facturación", icon: Calendar },
    { id: 3, title: "Items y Conceptos", icon: Plus },
    { id: 4, title: "Revisar y Emitir", icon: CheckCircle2 }
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
    const [notifyClient, setNotifyClient] = useState(false);
    const [items, setItems] = useState([
        { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }
    ]);

    // Validation
    const validateStep = (step) => {
        if (step === 1) return !!selectedClient;
        if (step === 2) return !!period;
        if (step === 3) return items.some(i => i.description.trim() !== '' && i.unit_price > 0);
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
        try {
            const payload = {
                clientId: selectedClient.id,
                period,
                items: items.map(i => ({
                    description: i.description,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price)
                })),
                options: { notifyClient }
            };

            const response = await createInvoice(payload);

            toast.success("Factura Emitida con Éxito", {
                description: `Comprobante ${response.data?.invoice_number || ''} generado.`,
                icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
            });

            // Reset Form (Navigate back to Step 1 or generic success state)
            setSelectedClient(null);
            setItems([{ id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }]);
            setCurrentStep(1);

        } catch (error) {
            console.error("Error creating invoice", error);
            const isTimeout = error.message?.includes('502') || error.message?.includes('504');
            if (isTimeout) {
                toast.warning("La respuesta demoró demasiado", {
                    description: "Es posible que la factura se haya creado. Verifica en el listado.",
                });
            } else {
                toast.error("Error al emitir factura", {
                    description: error.message || "Ocurrió un error inesperado."
                });
            }
        } finally {
            setIsSubmitting(false);
        }
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
                {/* Steps Indicator */}
                <div className="flex items-center justify-between relative px-4 md:px-12">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 rounded-full" />
                    <div className="absolute left-0 top-1/2 h-0.5 bg-primary -z-10 rounded-full transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />

                    {STEPS.map((step) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-xl">
                                <div
                                    className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                                        isActive ? "border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-110" :
                                            isCompleted ? "border-primary bg-white text-primary" :
                                                "border-slate-200 bg-white text-slate-300"
                                    )}
                                >
                                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold absolute -bottom-8 whitespace-nowrap transition-colors tracking-wide",
                                    isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-slate-400"
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Main Wizard Content */}
                <Card className="h-[650px] flex flex-col shadow-xl shadow-slate-200/50 border-slate-100 overflow-hidden relative bg-white/80 backdrop-blur-sm">
                    <CardContent className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
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
                                {/* STEP 1: CLIENT SELECTION */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-slate-800 mb-8">Selecciona el Cliente</h2>
                                        <ClientSelector
                                            selectedClientId={selectedClient?.id}
                                            onSelect={setSelectedClient}
                                        />
                                        {selectedClient && (
                                            <div className="mt-6 p-5 bg-primary/5 border border-primary/10 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-lg">
                                                    {selectedClient.company_name?.[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-lg">Cliente Seleccionado: <span className="font-bold text-primary">{selectedClient.company_name}</span></p>
                                                    <p className="text-sm text-slate-500 font-mono">CUIT: {selectedClient.cuit || "---"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 2: BILLING DATA */}
                                {currentStep === 2 && (
                                    <div className="space-y-8 max-w-lg mx-auto py-4">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Datos de Facturación</h2>
                                            <p className="text-slate-500">Configura el periodo y las opciones de envío.</p>
                                        </div>

                                        <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            <div className="space-y-3">
                                                <Label className="text-base">Periodo a Facturar</Label>
                                                <Input
                                                    type="month"
                                                    value={period}
                                                    onChange={(e) => setPeriod(e.target.value)}
                                                    className="h-14 text-lg bg-white shadow-sm border-slate-200 focus:border-primary focus:ring-primary/20"
                                                />
                                                <p className="text-xs text-slate-400 pl-1">Mes y año correspondientes al servicio.</p>
                                            </div>

                                            <div onClick={() => setNotifyClient(!notifyClient)}
                                                className={cn(
                                                    "cursor-pointer flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 shadow-sm",
                                                    notifyClient ? "bg-primary/5 border-primary/30 shadow-primary/5" : "bg-white border-slate-200 hover:border-primary/30"
                                                )}>
                                                <div className={cn(
                                                    "h-6 w-6 rounded-md border flex items-center justify-center mt-0.5 transition-colors",
                                                    notifyClient ? "bg-primary border-primary" : "border-slate-300 bg-white"
                                                )}>
                                                    {notifyClient && <CheckCircle2 className="h-4 w-4 text-white" />}
                                                </div>
                                                <div>
                                                    <h4 className={cn("font-bold text-base", notifyClient ? "text-primary" : "text-slate-700")}>Enviar notificación por email</h4>
                                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">Si se activa, el sistema generará el PDF y lo enviará automáticamente al email del cliente.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: ITEMS */}
                                {currentStep === 3 && (
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

                                {/* STEP 4: REVIEW */}
                                {currentStep === 4 && (
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
                                                <p className="text-sm text-slate-500 font-mono mt-1">{selectedClient?.cuit}</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Periodo</p>
                                                <p className="font-bold text-slate-900 text-xl capitalize">
                                                    {new Date(period + '-10').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    {notifyClient ? (
                                                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold flex items-center gap-1.5 w-fit">
                                                            <Send className="h-3 w-3" /> Email activado
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium w-fit">
                                                            Sin email
                                                        </span>
                                                    )}
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
                    </CardContent>

                    {/* Footer Navigation */}
                    <div className="p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 rounded-b-2xl flex justify-between items-center mt-auto">
                        {currentStep < 4 ? (
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
                </Card>
            </div>
        </PageTransition>
    );
}

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}