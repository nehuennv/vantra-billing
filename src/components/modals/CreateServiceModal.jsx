import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Tag, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';

export function CreateServiceModal({ isOpen, onClose, onConfirm, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        sku: '',
        description: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    price: initialData.price,
                    sku: initialData.sku || '',
                    description: initialData.description || '',
                });
            } else {
                setFormData({
                    name: '',
                    price: '',
                    sku: '',
                    description: '',
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (formData.name && formData.price) {
            onConfirm({
                ...formData,
                price: parseFloat(formData.price),
                id: initialData ? initialData.id : undefined
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 -mx-6 -mt-6 rounded-t-xl">
                    <DialogTitle className="font-heading font-bold text-lg text-slate-800">
                        {initialData ? 'Editar Producto del Catálogo' : 'Nuevo Producto en Catálogo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Nombre del Producto</label>
                        <input
                            type="text"
                            placeholder="Ej: Internet Fibra 300MB"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* SKU */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">SKU (Opcional)</label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="FIBRA-300"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">Precio Lista</label>
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
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Descripción</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <textarea
                                rows={3}
                                placeholder="Detalles técnicos..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            Nota: El icono y tipo de servicio (Recurrente) se infieren automáticamente del nombre.
                        </p>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 px-6 py-4 rounded-b-xl flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.price}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                        <Save className="h-4 w-4" /> {initialData ? 'Guardar Cambios' : 'Guardar Producto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
