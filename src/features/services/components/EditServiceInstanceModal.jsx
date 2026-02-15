import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Tag, FileText, Hash } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';

export function EditServiceInstanceModal({ isOpen, onClose, onConfirm, service }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        quantity: 1,
        description: '',
    });

    useEffect(() => {
        if (isOpen && service) {
            setFormData({
                name: service.name || '',
                price: service.unit_price !== undefined ? service.unit_price : '',
                quantity: service.quantity || 1,
                description: service.description || '',
            });
        }
    }, [isOpen, service]);

    const handleSubmit = () => {
        if (formData.name && formData.price) {
            onConfirm({
                ...service, // Keep original ID and other fields
                name: formData.name,
                unit_price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity, 10),
                description: formData.description
            });
            onClose();
        }
    };

    if (!service) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="border-b border-border bg-muted/50 px-6 py-4 -mx-6 -mt-6 rounded-t-xl">
                    <DialogTitle className="font-heading font-bold text-lg text-foreground">
                        Ajustar Servicio Activo
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 px-1">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nombre del Servicio</label>
                        <input
                            type="text"
                            placeholder="Ej: Internet Fibra 300MB"
                            className="w-full p-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Precio Unitario</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Cantidad</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Descripción (Opcional)</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <textarea
                                rows={3}
                                placeholder="Detalles adicionales..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/30 border-t border-border/50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.price}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                        <Save className="h-4 w-4" /> Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
