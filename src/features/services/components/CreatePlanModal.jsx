import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Wifi, Upload, Download, Calendar, Activity } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';

export function CreatePlanModal({ isOpen, onClose, onConfirm, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        download_speed_mbps: '',
        upload_speed_mbps: '',
        billing_frequency: 'monthly',
        service_type: 'internet',
        is_active: true
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    price: initialData.price || '',
                    description: initialData.description || '',
                    download_speed_mbps: initialData.downloadSpeed || '',
                    upload_speed_mbps: initialData.uploadSpeed || '',
                    billing_frequency: initialData.billingCycle || 'monthly',
                    service_type: initialData.type || 'internet',
                    is_active: initialData.isActive ?? true
                });
            } else {
                setFormData({
                    name: '',
                    price: '',
                    description: '',
                    download_speed_mbps: '',
                    upload_speed_mbps: '',
                    billing_frequency: 'monthly',
                    service_type: 'internet',
                    is_active: true
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (formData.name && formData.price) {
            onConfirm({
                id: initialData ? initialData.id : undefined,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                downloadSpeed: Number(formData.download_speed_mbps),
                uploadSpeed: Number(formData.upload_speed_mbps),
                billingCycle: formData.billing_frequency,
                type: formData.service_type,
                isActive: formData.is_active
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[90vh] md:h-auto overflow-y-auto">
                <DialogHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 -mx-6 -mt-6 rounded-t-xl">
                    <DialogTitle className="font-heading font-bold text-lg text-slate-800">
                        {initialData ? 'Editar Plan' : 'Nuevo Plan'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 px-1">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Nombre del Plan</label>
                        <input
                            type="text"
                            placeholder="Ej: Fibra 300Mb"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Precio y Frecuencia */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Precio</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Ciclo de Facturación</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <select
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    value={formData.billing_frequency}
                                    onChange={(e) => setFormData({ ...formData, billing_frequency: e.target.value })}
                                >
                                    <option value="monthly">Mensual</option>
                                    <option value="bimonthly">Bimestral</option>
                                    <option value="quarterly">Trimestral</option>
                                    <option value="semiannual">Semestral</option>
                                    <option value="annual">Anual</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Velocidades */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Bajada (Mbps)</label>
                            <div className="relative">
                                <Download className="absolute left-3 top-3 h-4 w-4 text-sky-500" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.download_speed_mbps}
                                    onChange={(e) => setFormData({ ...formData, download_speed_mbps: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Subida (Mbps)</label>
                            <div className="relative">
                                <Upload className="absolute left-3 top-3 h-4 w-4 text-emerald-500" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.upload_speed_mbps}
                                    onChange={(e) => setFormData({ ...formData, upload_speed_mbps: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Descripción</label>
                        <textarea
                            rows={3}
                            placeholder="Detalles del plan..."
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 px-6 py-4 rounded-b-xl flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.price}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                        <Save className="h-4 w-4" /> {initialData ? 'Guardar Cambios' : 'Crear Plan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
