import React, { useState } from 'react';
import { X, Save, DollarSign, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

export function CreateBudgetModal({ isOpen, onClose, onConfirm }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        type: 'recurring' // Default
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (formData.name && formData.price) {
            onConfirm({
                ...formData,
                price: parseFloat(formData.price),
                id: Date.now()
            });
            onClose();
            setFormData({ name: '', price: '', description: '', type: 'recurring' }); // Reset
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-heading font-bold text-lg text-slate-800">Nuevo Presupuesto</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Nombre del Presupuesto</label>
                        <input
                            type="text"
                            placeholder="Ej: Mantenimiento Mensual"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Monto</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Tipo de Cobro</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'recurring' })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'recurring' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                            >
                                Recurrente
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'unique' })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'unique' ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                            >
                                Único
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Descripción</label>
                        <textarea
                            rows={3}
                            placeholder="Detalles del servicio..."
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.price}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <Save className="h-4 w-4" /> Guardar Presupuesto
                    </Button>
                </div>
            </div>
        </div>
    );
}
