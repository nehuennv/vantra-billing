import React, { useState, useEffect } from 'react';
import { X, Save, Search, Plus, Trash2, Package, Tag, Minus, Box, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/Dialog';

export function CreatePackageModal({ isOpen, onClose, onConfirm, catalogItems = [], initialData = null }) {
    const [formData, setFormData] = useState({
        name: '',
        items: [],
        price: 0 // Manual price override
    });
    const [isManualPrice, setIsManualPrice] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Reset / Hydrate
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                const uiItems = (initialData.items || []).map(it => {
                    const catItem = catalogItems.find(c => c.id === it.catalog_item_id);
                    return {
                        catalog_item_id: it.catalog_item_id,
                        quantity: it.quantity,
                        name: catItem?.name || 'Ítem desconocido',
                        price: catItem?.price || 0
                    };
                });

                const hasManualPrice = Number(initialData.price) > 0;

                setFormData({
                    name: initialData.name,
                    items: uiItems,
                    price: Number(initialData.price) || 0
                });
                setIsManualPrice(hasManualPrice);
            } else {
                setFormData({
                    name: '',
                    items: [],
                    price: 0
                });
                setIsManualPrice(false);
            }
        }
    }, [isOpen, initialData, catalogItems]);

    const availableServices = catalogItems.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddItem = (item) => {
        const exists = formData.items.find(i => i.catalog_item_id === item.id);
        if (exists) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.map(i => i.catalog_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            }));
        } else {
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
                    if (newQ <= 0) return null;
                    return { ...i, quantity: newQ };
                }
                return i;
            }).filter(Boolean)
        }));
    };

    // Calculate sum
    const servicesTotal = formData.items.reduce((sum, i) => sum + ((i.price || 0) * i.quantity), 0);

    const handleSubmit = () => {
        if (formData.name && formData.items.length > 0) {
            onConfirm({
                id: initialData?.id, // Pass ID if editing
                name: formData.name,
                items: formData.items.map(i => ({ catalog_item_id: i.catalog_item_id, quantity: i.quantity })),
                price: isManualPrice ? Number(formData.price) : 0 // Send 0 if calculated/automatic
            });
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Modal Container: Arc Style - Clean, rounded, soft shadow, no heavy borders */}
            <DialogContent className="sm:max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-0 shadow-2xl rounded-3xl bg-[#FCFCFD] text-slate-800 ring-1 ring-black/5">

                {/* Header: Arc Style - Minimal, blends with content, subtle blur */}
                <div className="bg-[#FCFCFD]/90 px-8 py-5 flex justify-between items-center z-20 border-b border-slate-100/50 backdrop-blur-md sticky top-0 supports-[backdrop-filter]:bg-[#FCFCFD]/60">
                    <div>
                        <DialogTitle className="font-sans font-bold text-xl tracking-tight text-slate-900 flex items-center gap-2">
                            {initialData ? 'Editar Plan' : 'Crear Nuevo Plan'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-0.5 text-sm font-medium">
                            {initialData ? 'Modifica la configuración de tu plan existente.' : 'Diseña un plan personalizado combinando servicios del catálogo.'}
                        </DialogDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN: Sidebar / Catalog - Arc Style: Distinct background (#F7F9FC) but soft */}
                    <div className="w-5/12 xl:w-1/3 border-r border-slate-100 flex flex-col bg-[#F7F9FC] relative">
                        {/* Search Header */}
                        <div className="p-5 pb-4 sticky top-0 z-10 bg-[#F7F9FC]/95 backdrop-blur-sm">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Buscar servicios..."
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border-none ring-1 ring-slate-200 bg-white shadow-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between px-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catálogo de Servicios</p>
                            </div>
                        </div>

                        {/* Items Grid/List */}
                        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
                            {availableServices.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-sm font-medium text-slate-400">No se encontraron servicios</p>
                                </div>
                            ) : (
                                availableServices.map(s => (
                                    <div
                                        key={s.id}
                                        className="group flex flex-col p-3 rounded-xl bg-transparent hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm cursor-pointer transition-all duration-200"
                                        onClick={() => handleAddItem(s)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-semibold text-slate-700 text-sm leading-tight group-hover:text-slate-900 transition-colors">{s.name}</h4>
                                            <div className="h-5 w-5 rounded-md bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all opacity-0 group-hover:opacity-100">
                                                <Plus className="h-3 w-3" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-slate-400 group-hover:text-slate-500">${(s.price || 0).toLocaleString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Builder - Arc Style: Clean white canvas */}
                    <div className="w-7/12 xl:w-2/3 flex flex-col bg-white overflow-hidden relative">
                        {/* Builder Content */}
                        <div className="flex-1 overflow-visible p-8 flex flex-col max-w-3xl mx-auto w-full">
                            {/* Name Input */}
                            <div className="mb-8 group">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 block ml-1 group-focus-within:text-emerald-600 transition-colors">Nombre del Paquete</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Plan Fibra + TV"
                                    className="w-full px-0 py-2 border-b-2 border-slate-100 bg-transparent text-slate-900 focus:border-slate-800 outline-none font-bold text-3xl placeholder:text-slate-200 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Selected Items */}
                            <div className="flex-1 bg-white rounded-2xl overflow-hidden flex flex-col relative mt-2">
                                {formData.items.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <Box className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">El paquete está vacío<br /><span className="text-xs font-normal">Agrega servicios desde el panel izquierdo</span></p>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
                                        {formData.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors duration-200">
                                                <div className="flex items-center gap-4">
                                                    {/* Quantity Control - Arc Style: Minimal pills */}
                                                    <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.catalog_item_id, -1); }}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-400 transition-all"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(item.catalog_item_id, 1); }}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-400 transition-all"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium">${(item.price || 0).toLocaleString()} c/u</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5">
                                                    <p className="text-sm font-bold text-slate-700">${((item.price || 0) * item.quantity).toLocaleString()}</p>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.catalog_item_id)}
                                                        className="h-8 w-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Pricing - Arc Style: Floating action bar feel */}
                        <div className="bg-white/80 backdrop-blur-md p-6 z-20 sticky bottom-0 border-t border-slate-50">
                            <div className="max-w-3xl mx-auto flex items-end justify-between gap-6">
                                {/* Price Toggle */}
                                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group transition-all duration-300 hover:border-slate-200 hover:shadow-sm">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {isManualPrice ? 'Precio Promocional' : 'Precio Regular'}
                                            </span>
                                            {isManualPrice && (
                                                <Info className="w-3 h-3 text-emerald-500" />
                                            )}
                                        </div>

                                        {isManualPrice ? (
                                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                                                <span className="text-lg font-bold text-slate-400">$</span>
                                                <input
                                                    type="number"
                                                    className="bg-transparent border-none p-0 text-lg font-bold w-24 focus:ring-0 text-emerald-600 placeholder-slate-300"
                                                    value={formData.price === 0 ? '' : formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                    autoFocus
                                                    placeholder="0"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-slate-800">
                                                ${servicesTotal.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                                    <button
                                        onClick={() => {
                                            const newVal = !isManualPrice;
                                            setIsManualPrice(newVal);
                                            // When toggling to manual, initialize with current total if 0
                                            if (!newVal) {
                                                setFormData(prev => ({ ...prev, price: 0 }));
                                            } else if (formData.price === 0) {
                                                setFormData(prev => ({ ...prev, price: servicesTotal }));
                                            }
                                        }}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border ${isManualPrice ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                                    >
                                        {isManualPrice ? 'Usar Suma Automática' : 'Definir Precio Promo'}
                                    </button>
                                </div>

                                {/* Action Buttons - Clean, no harsh gradients */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="h-auto py-2.5 px-5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-semibold rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!formData.name || formData.items.length === 0}
                                        className="h-auto py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {initialData ? 'Guardar Cambios' : 'Crear Plan'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
