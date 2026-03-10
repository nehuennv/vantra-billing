import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Edit, Save, CheckCircle2, ChevronRight, Calculator, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/Dialog';
import { useQuotes } from '../../../hooks/useQuotes';
import { useToast } from '../../../hooks/useToast';

const IVA_OPTIONS = [
    { value: -1, label: 'No gravado' },
    { value: 0, label: '0%' },
    { value: 10.5, label: '10.5%' },
    { value: 21, label: '21%' },
    { value: 27, label: '27%' },
];

const STATUS_OPTIONS = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'GENERATED', label: 'Generado / PDF' },
    { value: 'SENT', label: 'Enviado' },
    { value: 'ACCEPTED', label: 'Aceptado' },
    { value: 'REJECTED', label: 'Rechazado' },
];

export function EditQuoteModal({ isOpen, onClose, quoteId, onSaved }) {
    const { getQuote, updateQuote } = useQuotes();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [status, setStatus] = useState('DRAFT');
    const [commercialConditions, setCommercialConditions] = useState('');
    const [globalIva, setGlobalIva] = useState(21);
    const [items, setItems] = useState([]);

    const loadQuote = async () => {
        if (!quoteId || !isOpen) return;
        setIsLoading(true);
        try {
            const data = await getQuote(quoteId);
            setStatus(data.status || 'DRAFT');
            setCommercialConditions(data.commercial_conditions || '');
            setGlobalIva(data.iva_percentage ?? 21);

            // Map items
            if (data.items && Array.isArray(data.items)) {
                setItems(data.items.map((item, idx) => ({
                    id: item.id || `temp-${idx}`,
                    display_code: item.display_code || '',
                    description: item.description || '',
                    quantity: Number(item.quantity || 1),
                    unit_price: Number(item.unit_price || 0),
                    iva_percentage: item.iva_percentage ?? 21
                })));
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error(error);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadQuote();
    }, [quoteId, isOpen]);

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            {
                id: `new-${Math.random()}`,
                display_code: '',
                description: '',
                quantity: 1,
                unit_price: 0,
                iva_percentage: 21
            }
        ]);
    };

    const handleRemoveItem = (index) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems.splice(index, 1);
            return newItems;
        });
    };

    const handleItemChange = (index, field, value) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const payload = {
                status,
                commercial_conditions: commercialConditions,
                iva_percentage: globalIva,
                items: items.map(i => ({
                    display_code: i.display_code,
                    description: i.description,
                    quantity: Number(i.quantity),
                    unit_price: Number(i.unit_price),
                    iva_percentage: Number(i.iva_percentage)
                }))
            };

            const success = await updateQuote(quoteId, payload);
            if (success) {
                if (onSaved) onSaved();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar presupuesto");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculations
    const totalSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalIva = items.reduce((sum, item) => {
        if (item.iva_percentage > 0) {
            return sum + (item.quantity * item.unit_price) * (item.iva_percentage / 100);
        }
        return sum;
    }, 0);
    const totalAmount = totalSubtotal + totalIva;

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={isSaving ? () => { } : onClose}>
            <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col border-0">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 shadow-sm">
                            <Edit className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="font-heading font-bold text-lg text-slate-800 text-left">
                                Editar Presupuesto
                            </DialogTitle>
                            <DialogDescription className="text-left py-1">
                                Modifica los detalles, ítems y condiciones del presupuesto
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
                        <div className="space-y-6">

                            {/* General Info Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Información General
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Estado</label>
                                        <select
                                            value={status}
                                            onChange={e => setStatus(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">IVA Global (Opcional si es general)</label>
                                        <select
                                            value={globalIva}
                                            onChange={e => setGlobalIva(Number(e.target.value))}
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                                        >
                                            {IVA_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">Condiciones Comerciales</label>
                                        <textarea
                                            value={commercialConditions}
                                            onChange={e => setCommercialConditions(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white resize-none"
                                            placeholder="Ingresa las condiciones, tiempos de entrega, validez..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Items Card */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Calculator className="h-4 w-4" /> Detalles de Ítems
                                    </h3>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddItem}
                                        className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Añadir Ítem
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {items.length === 0 ? (
                                        <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            No hay ítems registrados. Añade uno para comenzar.
                                        </div>
                                    ) : (
                                        items.map((item, index) => (
                                            <div key={item.id} className="flex gap-3 items-start p-3 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors group">

                                                <div className="flex-1 grid grid-cols-12 gap-3">
                                                    {/* Code */}
                                                    <div className="col-span-12 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Cód.</label>
                                                        <input
                                                            type="text"
                                                            value={item.display_code}
                                                            onChange={e => handleItemChange(index, 'display_code', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs rounded border border-slate-200"
                                                            placeholder="Código"
                                                        />
                                                    </div>

                                                    {/* Description */}
                                                    <div className="col-span-12 sm:col-span-4">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs rounded border border-slate-200"
                                                            placeholder="Descripción del servicio/producto"
                                                        />
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="col-span-12 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Cant.</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs rounded border border-slate-200 text-center"
                                                        />
                                                    </div>

                                                    {/* Unit Price */}
                                                    <div className="col-span-12 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Precio Unit.</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                                                            className="w-full h-8 px-2 text-xs rounded border border-slate-200 text-right"
                                                        />
                                                    </div>

                                                    {/* IVA */}
                                                    <div className="col-span-12 sm:col-span-2">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">IVA</label>
                                                        <select
                                                            value={item.iva_percentage}
                                                            onChange={e => handleItemChange(index, 'iva_percentage', Number(e.target.value))}
                                                            className="w-full h-8 px-1 text-xs rounded border border-slate-200 bg-white"
                                                        >
                                                            {IVA_OPTIONS.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="mt-6 h-8 w-8 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Eliminar Ítem"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>

                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Totals calculation display */}
                                {items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                        <div className="w-64 space-y-2 text-sm">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Subtotal</span>
                                                <span className="font-medium">${totalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500">
                                                <span>IVA</span>
                                                <span className="font-medium">${totalIva.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="pt-2 flex justify-between font-bold text-slate-900 border-t border-slate-100">
                                                <span>Total</span>
                                                <span className="text-indigo-600">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
                    <Button
                        variant="ghost"
                        className="h-10 px-5 text-slate-500 hover:text-slate-800"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
                        disabled={isSaving || items.length === 0}
                        onClick={handleSave}
                    >
                        {isSaving ? 'Guardando...' : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
