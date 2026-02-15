import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download, Calendar, Send, Loader2, AlertCircle } from 'lucide-react';
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
    "Generando comprobante fiscal...",
    "Firmando digitalmente...",
    "Finalizando operación..."
];

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
                        id: svc.id || Math.random(),
                        description: svc.name,
                        quantity: 1,
                        unit_price: Number(svc.price) || 0
                    }));
                    setItems(mappedItems);
                } else {
                    setItems([{ id: Math.random(), description: "Servicio de Facturación", quantity: 1, unit_price: 0 }]);
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
            }, 2000); // Change message every 2s
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
            { id: Math.random(), description: "", quantity: 1, unit_price: 0 }
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
        // Basic validation
        if (!period) {
            toast.error("Por favor selecciona un periodo de facturación");
            return;
        }
        if (items.length === 0 || items.some(i => !i.description || i.description.trim() === '')) {
            toast.error("La factura debe tener al menos un item con descripción");
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

            console.log("Submitting Invoice Payload:", payload); // DEBUG

            const response = await createInvoice(payload);

            toast.success("Factura creada exitosamente", {
                description: `Comprobante generado correctamente para ${client?.company_name || 'el cliente'}.`
            });

            if (onInvoiceCreated) {
                onInvoiceCreated(response);
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating invoice", error);
            // Non-blocking error: Keep modal open so user can retry/fix
            toast.error("Error al crear la factura", {
                description: error.message || "Ocurrió un error inesperado al comunicarse con el servidor."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-5xl md:max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
                        <Download className="h-5 w-5 text-indigo-600" />
                        Nueva Factura
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Completa los detalles para generar la factura. Los impuestos se calcularán automáticamente.
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Period & settings */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Periodo de Facturación</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="month"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="pl-9"
                                    readOnly={readOnly || isSubmitting}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {!readOnly && (
                            <div className={`flex items-center gap-2 pt-2 transition-opacity ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                    type="checkbox"
                                    id="notify-client"
                                    checked={notifyClient}
                                    onChange={(e) => setNotifyClient(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    disabled={isSubmitting}
                                />
                                <Label htmlFor="notify-client" className="font-normal text-slate-700 cursor-pointer">
                                    Enviar por email al cliente
                                </Label>
                            </div>
                        )}
                    </div>

                    {/* Client Info (Read Only) */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-xs text-slate-500 mb-2 uppercase tracking-wide">Cliente</h4>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div>
                                <p className="font-semibold text-slate-900 text-base">{client?.company_name || client?.name || "Cliente S/N"}</p>
                                <p className="text-sm text-slate-600">CUIT: {client?.cuit || client?.tax_id || "-"}</p>
                            </div>
                            <div className="text-sm text-slate-600">
                                <p>{client?.address || "Sin dirección"}</p>
                                <p className="text-indigo-600">{client?.email || client?.email_billing || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className={`border rounded-lg overflow-hidden mb-6 bg-white transition-opacity ${isSubmitting ? 'opacity-75 pointer-events-none' : ''}`}>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 font-medium">
                            <tr>
                                <th className="p-3 w-[50%]">Descripción</th>
                                <th className="p-3 w-[15%] text-center">Cant.</th>
                                <th className="p-3 w-[20%] text-right">Precio Unit.</th>
                                <th className="p-3 w-[15%] text-right">Total</th>
                                {!readOnly && <th className="p-3 w-[5%]"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={item.id} className="group hover:bg-slate-50">
                                    <td className="p-2">
                                        <Input
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                            placeholder="Descripción del servicio"
                                            className={`border-transparent bg-transparent h-9 px-2 shadow-none ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500'}`}
                                            readOnly={readOnly || isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                            className={`text-center border-transparent bg-transparent h-9 px-1 shadow-none ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500'}`}
                                            readOnly={readOnly || isSubmitting}
                                            disabled={isSubmitting}
                                            min="1"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                            className={`text-right border-transparent bg-transparent h-9 px-1 shadow-none ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-500'}`}
                                            readOnly={readOnly || isSubmitting}
                                            disabled={isSubmitting}
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-900">
                                        ${(item.quantity * item.unit_price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                    {!readOnly && (
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => handleRemoveItem(idx)}
                                                disabled={isSubmitting}
                                                className="text-slate-400 hover:text-rose-500 p-1.5 rounded-full hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
                                                title="Eliminar item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!readOnly && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddItem}
                                disabled={isSubmitting}
                                className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 w-full justify-start sticky left-0 disabled:text-slate-400"
                            >
                                <Plus className="h-4 w-4" /> Agregar Item
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t pt-4">
                    <div className="text-xs text-slate-500 italic max-w-xs">
                        * Los precios ingresados son finales. La factura (A/B) y el IVA se determinarán al procesar.
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span className="text-slate-600 font-medium">Total Estimado</span>
                        <span className="text-xl font-bold text-indigo-600">
                            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex-col sm:flex-row gap-3 sm:gap-2">
                    <AnimatePresence mode="wait">
                        {isSubmitting ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 flex items-center justify-center sm:justify-end gap-3 text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-md"
                            >
                                <motion.span
                                    key={loadingMsgIndex}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className="text-sm"
                                >
                                    {LOADING_MESSAGES[loadingMsgIndex]}
                                </motion.span>
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex w-full justify-end gap-2"
                            >
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md shadow-indigo-200"
                                >
                                    {notifyClient ? <Send className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                                    {readOnly ? 'Cerrar' : 'Generar Factura'}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
