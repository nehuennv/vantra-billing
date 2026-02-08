import React, { useState, useEffect } from 'react';
import { X, Save, Search, Plus, Trash2, Package, Tag, DollarSign, Minus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/Dialog';

export function CreatePackageModal({ isOpen, onClose, onConfirm, catalogItems = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        items: [] // { catalog_item_id, quantity, name, price } - name/price for UI convenience
    });
    const [searchTerm, setSearchTerm] = useState("");

    // Reset
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                items: []
            });
        }
    }, [isOpen]);

    const availableServices = catalogItems.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddItem = (item) => {
        // Check if already exists
        const exists = formData.items.find(i => i.catalog_item_id === item.id);
        if (exists) {
            // Increment
            setFormData(prev => ({
                ...prev,
                items: prev.items.map(i => i.catalog_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            }));
        } else {
            // Add new
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, { catalog_item_id: item.id, quantity: 1, name: item.name, price: item.price }]
            }));
        }
    };

    const handleRemoveItem = (itemId) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(i => i.catalog_item_id !== itemId)
        }));
    };

    const handleUpdateQuantity = (itemId, delta) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(i => {
                if (i.catalog_item_id === itemId) {
                    const newQ = i.quantity + delta;
                    if (newQ <= 0) return null; // Remove if 0
                    return { ...i, quantity: newQ };
                }
                return i;
            }).filter(Boolean)
        }));
    };

    // Calculate sum of services for display (though Combo price might be different in V2, we show sum as reference)
    const servicesTotal = formData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const handleSubmit = () => {
        if (formData.name && formData.items.length > 0) {
            // Payload for API: { name, items: [{ catalog_item_id, quantity }] }
            onConfirm({
                name: formData.name,
                items: formData.items.map(i => ({ catalog_item_id: i.catalog_item_id, quantity: i.quantity }))
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl w-full h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-0">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="font-heading font-bold text-lg text-slate-800 text-left">
                            Nuevo Combo
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Combina productos del catálogo en un paquete.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN: Catalog */}
                    <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {availableServices.map(s => (
                                <div key={s.id} className="flex flex-col p-3 rounded-lg border border-slate-200 bg-white hover:border-primary/50 transition-all group shadow-sm hover:shadow-md cursor-pointer" onClick={() => handleAddItem(s)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-slate-700 text-sm line-clamp-1">{s.name}</span>
                                    </div>
                                    <div className="flex justify-between items-end mt-auto">
                                        <p className="text-xs font-bold text-slate-500">${s.price?.toLocaleString()}</p>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-full">
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Items Selected */}
                    <div className="w-2/3 flex flex-col p-6 overflow-hidden">
                        {/* 1. Name */}
                        <div className="space-y-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre del Combo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Pack Inicial + Wifi"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 2. Selected Services List */}
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 block">Ítems Incluidos ({formData.items.length})</label>
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-2 mb-4 custom-scrollbar">
                            {formData.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <Package className="h-10 w-10 mb-2 stroke-1" />
                                    <p className="text-sm font-medium">Selecciona productos a la izquierda</p>
                                </div>
                            ) : (
                                formData.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.catalog_item_id, -1); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500">
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-slate-700">{item.quantity}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.catalog_item_id, 1); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500">
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-500">${item.price?.toLocaleString()} c/u</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem(item.catalog_item_id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 3. Footer */}
                        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg shadow-primary/10 mt-auto">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Precio Referencia (Suma)</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold font-heading">
                                            ${servicesTotal.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.name || formData.items.length === 0}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                            >
                                <Save className="h-4 w-4 mr-2" /> Crear Combo
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
