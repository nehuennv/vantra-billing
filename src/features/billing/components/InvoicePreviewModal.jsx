import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download, Calendar, Send, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { createInvoice } from '../services/invoiceService';

const LOADING_MESSAGES = [
    "Validando datos...",
    "Conectando con servicio de facturación...",
    "Negociando con ARCA/AFIP...",
    "Generando comprobante fiscal (CAE)...",
    "Firmando digitalmente el PDF...",
    "Finalizando operación..."
];

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

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

    // Initialize state
    useEffect(() => {
        if (open) {
            if (initialData) {
                setPeriod(initialData.period || new Date().toISOString().slice(0, 7));
                setItems(initialData.items || []);
                setNotifyClient(initialData.options?.notifyClient || false);
            } else {
                if (initialItems && initialItems.length > 0) {
                    const mappedItems = initialItems.map(svc => ({
                        id: crypto.randomUUID(), // Mejor que Math.random()
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
            }
            setIsSubmitting(false);
            setLoadingMsgIndex(0);
        }
    }, [open, initialItems, initialData, client]);

    // Rotating Loading Messages
    useEffect(() => {
        let interval;
        if (isSubmitting) {
            interval = setInterval(() => {
                setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 3500); // Un poco más lento para que se lea bien
        }
        return () => clearInterval(interval);
    }, [isSubmitting]);

    // Handlers
    const handleItemChange = (index, field, value) => {
        if (isSubmitting) return;
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        if (isSubmitting) return;
        setItems([
            ...items,
            { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0 }
        ]);
    };

    const handleRemoveItem = (index) => {
        if (isSubmitting) return;
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

        setIsSubmitting(true);
        setLoadingMsgIndex(0);

        try {
            const payload = {
                clientId: client?.id,
                period,
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

            toast.success("Factura Emitida", {
                description: `Comprobante generado correctamente para ${client?.company_name || 'el cliente'}.`,
                icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
            });

            if (onInvoiceCreated) onInvoiceCreated(response);
            onOpenChange(false);

        } catch (error) {
            console.error("Error creating invoice", error);

            // MANEJO INTELIGENTE DE TIMEOUTS (Por si el Vite Config falla)
            const isTimeout = error.message?.includes('502') || error.message?.includes('504');

            if (isTimeout) {
                toast.warning("La respuesta demoró demasiado", {
                    description: "Es posible que la factura se haya creado. Por favor revisa la lista antes de intentar de nuevo.",
                    duration: 8000,
                });
                // Opcional: Cerrar el modal para forzar al usuario a revisar
                // onOpenChange(false); 
                // if (onInvoiceCreated) onInvoiceCreated(); 
            } else {
                toast.error("Error al emitir", {
                    description: error.message || "La AFIP rechazó la operación o hubo un error de conexión."
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-5xl md:max-w-6xl w-full max-h-[95vh] overflow-y-auto rounded-3xl p-0 gap-0 bg-slate-50">

                {/* Header Premium */}
                <div className="bg-white px-6 py-5 border-b border-slate-100 flex items-start justify-between rounded-t-3xl">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-slate-800">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            Nueva Factura
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1 ml-11">
                            El backend calculará impuestos y tipo de factura (A/B) automáticamente.
                        </p>
                    </div>
                    {/* Badge de Cliente */}
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Facturar a</p>
                        <p className="font-semibold text-slate-900">{client?.company_name || "Consumidor Final"}</p>
                        <p className="text-xs text-slate-500 font-mono">{client?.cuit || "Sin CUIT"}</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Grid de Configuración */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Columna Izquierda: Periodo y Opciones */}
                        <div className="md:col-span-4 space-y-5">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">Configuración</Label>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Periodo de Servicio</Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <Input
                                                type="month"
                                                value={period}
                                                onChange={(e) => setPeriod(e.target.value)}
                                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                                readOnly={readOnly || isSubmitting}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {!readOnly && (
                                        <div className={`flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 transition-all ${notifyClient ? 'bg-indigo-50/50 border-indigo-100' : ''}`}>
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    id="notify-client"
                                                    checked={notifyClient}
                                                    onChange={(e) => setNotifyClient(e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <Label htmlFor="notify-client" className="font-medium text-slate-700 cursor-pointer text-sm">
                                                    Enviar por Email
                                                </Label>
                                                <span className="text-xs text-slate-500">
                                                    Se enviará el PDF adjunto al cliente.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Tabla de Items */}
                        <div className="md:col-span-8">
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-slate-700">Detalle de Conceptos</h3>
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAddItem}
                                            disabled={isSubmitting}
                                            className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar Item
                                        </Button>
                                    )}
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3 w-[45%]">Descripción</th>
                                                <th className="px-4 py-3 w-[15%] text-center">Cant.</th>
                                                <th className="px-4 py-3 w-[20%] text-right">Precio Unit.</th>
                                                <th className="px-4 py-3 w-[15%] text-right">Subtotal</th>
                                                {!readOnly && <th className="px-2 py-3 w-[5%]"></th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-2 pl-4">
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                            placeholder="Ej: Abono Internet..."
                                                            className="border-transparent bg-transparent shadow-none px-0 h-auto py-1 focus:ring-0 placeholder:text-slate-300 font-medium text-slate-700"
                                                            readOnly={readOnly || isSubmitting}
                                                            disabled={isSubmitting}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()} // UX: Seleccionar todo al clickear
                                                            className="text-center border-transparent bg-slate-100/50 hover:bg-white focus:bg-white h-8 shadow-none"
                                                            readOnly={readOnly || isSubmitting}
                                                            disabled={isSubmitting}
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs">$</span>
                                                            <Input
                                                                type="number"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                                                onFocus={(e) => e.target.select()} // UX: Seleccionar todo al clickear
                                                                className="text-right pl-5 border-transparent bg-slate-100/50 hover:bg-white focus:bg-white h-8 shadow-none"
                                                                readOnly={readOnly || isSubmitting}
                                                                disabled={isSubmitting}
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2 pr-4 text-right font-semibold text-slate-700 tabular-nums">
                                                        {formatCurrency(item.quantity * item.unit_price)}
                                                    </td>
                                                    {!readOnly && (
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => handleRemoveItem(idx)}
                                                                disabled={isSubmitting}
                                                                className="text-slate-300 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition-all"
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
                                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                                                        Agrega items para comenzar la factura
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer de Totales */}
                                <div className="mt-auto bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
                                    <div className="text-xs text-slate-500 max-w-[200px] leading-tight">
                                        <AlertCircle className="h-3 w-3 inline mr-1 text-slate-400" />
                                        Precios finales (IVA incluido).
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total a Facturar</p>
                                        <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                                            {formatCurrency(total)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-white p-4 border-t border-slate-100">
                    <AnimatePresence mode="wait">
                        {isSubmitting ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                    <div className="flex flex-col">
                                        <span className="text-indigo-900 font-semibold text-sm">Procesando Factura</span>
                                        <motion.span
                                            key={loadingMsgIndex}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-xs text-indigo-600/80"
                                        >
                                            {LOADING_MESSAGES[loadingMsgIndex]}
                                        </motion.span>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-indigo-400">
                                    NO CIERRES ESTA VENTANA
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="actions"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex w-full justify-end gap-3"
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    className="border-slate-200 hover:bg-slate-50 text-slate-600"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6"
                                >
                                    {notifyClient ? <Send className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                                    {readOnly ? 'Cerrar' : 'Emitir Factura'}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}