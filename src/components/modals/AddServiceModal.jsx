import React, { useState } from 'react';
import { X, Zap, Repeat, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { mockServicesCatalog } from '../../data/mockData';

export function AddServiceModal({ isOpen, onClose, onConfirm }) {
    const [selectedServiceId, setSelectedServiceId] = useState("");

    if (!isOpen) return null;

    const selectedService = mockServicesCatalog.find(s => s.id === parseInt(selectedServiceId));

    const handleSubmit = () => {
        if (selectedService) {
            onConfirm(selectedService);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-heading font-bold text-lg text-slate-800">Asignar Presupuesto/Servicio</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Seleccionar del Catálogo</label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                        >
                            <option value="" disabled>Elegir servicio...</option>
                            {mockServicesCatalog.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} — ${service.price.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Previsualización de la Acción */}
                    {selectedService && (
                        <div className={`p-4 rounded-xl border ${selectedService.type === 'recurring' ? 'bg-indigo-50 border-indigo-100' : 'bg-sky-50 border-sky-100'} transition-all duration-300`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${selectedService.type === 'recurring' ? 'bg-white text-indigo-600' : 'bg-white text-sky-600'}`}>
                                    {selectedService.type === 'recurring' ? <Repeat className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${selectedService.type === 'recurring' ? 'text-indigo-900' : 'text-sky-900'}`}>
                                        {selectedService.type === 'recurring' ? 'Suscripción Mensual' : 'Cobro Único'}
                                    </h4>
                                    <p className={`text-xs mt-1 ${selectedService.type === 'recurring' ? 'text-indigo-700' : 'text-sky-700'}`}>
                                        {selectedService.type === 'recurring'
                                            ? "Se agregará al ciclo de facturación mensual (del 1 al 5)."
                                            : "Se generará una factura inmediata por este monto."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        disabled={!selectedService}
                        onClick={handleSubmit}
                        className={selectedService?.type === 'unique' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                    >
                        {selectedService?.type === 'unique' ? (
                            <span className="flex items-center gap-2"><Zap className="h-4 w-4" /> Facturar Ahora</span>
                        ) : (
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Suscribir Cliente</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}