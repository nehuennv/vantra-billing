import React, { useState } from 'react';
import { X, Save, DollarSign, Wifi, Zap, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';

const ICONS = [
    { name: 'Wifi', component: Wifi },
    { name: 'Zap', component: Zap },
    { name: 'Globe', component: Globe },
    { name: 'Monitor', component: Monitor },
    { name: 'Smartphone', component: Smartphone },
    { name: 'Server', component: Server },
    { name: 'Database', component: Database },
    { name: 'Cloud', component: Cloud },
    { name: 'Shield', component: Shield },
];

export function CreateServiceModal({ isOpen, onClose, onConfirm, initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        type: 'recurring',
        icon: 'Wifi'
    });

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name,
                    price: initialData.price,
                    description: initialData.description || '',
                    type: initialData.type || 'recurring',
                    icon: initialData.icon || 'Wifi'
                });
            } else {
                setFormData({
                    name: '',
                    price: '',
                    description: '',
                    type: 'recurring',
                    icon: 'Wifi'
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
            <DialogContent className="sm:max-w-md h-[90vh] md:h-auto overflow-y-auto">
                <DialogHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 -mx-6 -mt-6 rounded-t-xl">
                    <DialogTitle className="font-heading font-bold text-lg text-slate-800">
                        {initialData ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Nombre del Servicio</label>
                        <input
                            type="text"
                            placeholder="Ej: Internet 300Mb"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Precio Base</label>
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
                        <label className="text-sm font-medium text-slate-600">Tipo de Cobro</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'recurring' })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'recurring' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
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
                        <label className="text-sm font-medium text-slate-600">Icono</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ICONS.map((iconData) => {
                                const Icon = iconData.component;
                                const isSelected = formData.icon === iconData.name;
                                return (
                                    <button
                                        key={iconData.name}
                                        onClick={() => setFormData({ ...formData, icon: iconData.name })}
                                        className={`p-2 flex items-center justify-center rounded-xl border transition-all ${isSelected ? 'bg-primary text-primary-foreground border-primary shadow-md transform scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50 hover:bg-slate-50'}`}
                                        title={iconData.name}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Descripción</label>
                        <textarea
                            rows={3}
                            placeholder="Detalles del servicio..."
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
                        <Save className="h-4 w-4" /> {initialData ? 'Guardar Cambios' : 'Guardar Servicio'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
