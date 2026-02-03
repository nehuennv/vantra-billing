import React, { useState, useEffect } from 'react';
import { X, Save, Search, Plus, Trash2, Package, Tag, DollarSign } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { mockServicesCatalog } from '../../../data/mockData';

export function CreatePackageModal({ isOpen, onClose, onConfirm, packageToEdit }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        services: [],
        isCustomPrice: false,
        customPriceValue: 0
    });
    const [searchTerm, setSearchTerm] = useState("");

    // Initialize or Reset
    useEffect(() => {
        if (packageToEdit) {
            setFormData({
                name: packageToEdit.name,
                description: packageToEdit.description,
                services: packageToEdit.services,
                isCustomPrice: !!packageToEdit.isCustomPrice,
                customPriceValue: packageToEdit.customPriceValue || packageToEdit.totalPrice
            });
        } else {
            setFormData({
                name: '',
                description: '',
                services: [],
                isCustomPrice: false,
                customPriceValue: 0
            });
        }
    }, [packageToEdit, isOpen]);

    const availableServices = mockServicesCatalog.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddService = (service) => {
        setFormData({
            ...formData,
            services: [...formData.services, service]
        });
    };

    const handleRemoveService = (index) => {
        const updated = [...formData.services];
        updated.splice(index, 1);
        setFormData({ ...formData, services: updated });
    };

    // Calculate sum of services
    const servicesTotal = formData.services.reduce((sum, s) => sum + s.price, 0);
    // Final price logic
    const finalPrice = formData.isCustomPrice ? Number(formData.customPriceValue) : servicesTotal;

    const handleSubmit = () => {
        if (formData.name && formData.services.length > 0) {
            onConfirm({
                ...formData,
                totalPrice: finalPrice,
                // Ensure we pass the flags to save custom pricing state
                isCustomPrice: formData.isCustomPrice,
                customPriceValue: Number(formData.customPriceValue),
                id: packageToEdit ? packageToEdit.id : Date.now()
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden border border-slate-200 flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-heading font-bold text-lg text-slate-800">
                            {packageToEdit ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                        </h3>
                        <p className="text-sm text-slate-500">
                            {packageToEdit ? `Editando: ${formData.name}` : 'Crea un paquete de servicios'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body - Unified View */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT COLUMN: Catalog */}
                    <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar servicio..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {availableServices.map(s => (
                                <div key={s.id} className="flex flex-col p-3 rounded-lg border border-slate-200 bg-white hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-slate-700 text-sm">{s.name}</span>
                                        <BadgeCustom type={s.type} />
                                    </div>
                                    <div className="flex justify-between items-end mt-auto">
                                        <p className="text-sm font-bold text-slate-900">${s.price.toLocaleString()}</p>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-full" onClick={() => handleAddService(s)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Budget Details */}
                    <div className="w-2/3 flex flex-col p-6 overflow-hidden">

                        {/* 1. Basic Info */}
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nombre del Presupuesto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Plan Full PyME"
                                        className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Descripción (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Breve descripción..."
                                        className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Selected Services List */}
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 block">Servicios Incluidos ({formData.services.length})</label>
                        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-2 mb-4 custom-scrollbar">
                            {formData.services.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <Package className="h-10 w-10 mb-2 stroke-1" />
                                    <p className="text-sm font-medium">No has seleccionado servicios</p>
                                    <p className="text-xs">Usa el panel izquierdo para agregar</p>
                                </div>
                            ) : (
                                formData.services.map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm border border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <span className="text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                                                <p className="text-xs text-slate-500">${s.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveService(idx)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 3. Pricing Section */}
                        <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg shadow-primary/10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Resumen de Costos</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold font-heading">
                                            ${finalPrice.toLocaleString()}
                                        </span>
                                        {formData.isCustomPrice && (
                                            <span className="text-sm text-slate-500 line-through decoration-slate-500">
                                                ${servicesTotal.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.isCustomPrice ? 'bg-primary border-primary' : 'border-slate-600 bg-transparent'}`}>
                                            {formData.isCustomPrice && <DollarSign className="h-3 w-3 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.isCustomPrice}
                                            onChange={(e) => setFormData({ ...formData, isCustomPrice: e.target.checked })}
                                        />
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Precio Manual / Promo</span>
                                    </label>

                                    {formData.isCustomPrice && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <span className="text-sm text-primary-foreground/70">Nuevo Precio: $</span>
                                            <input
                                                type="number"
                                                value={formData.customPriceValue}
                                                onChange={(e) => setFormData({ ...formData, customPriceValue: e.target.value })}
                                                className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.name || formData.services.length === 0}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                            >
                                <Save className="h-4 w-4 mr-2" /> Guardar Presupuesto
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper simple badge
function BadgeCustom({ type }) {
    const isRecurring = type === 'recurring';
    return (
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${isRecurring
            ? 'text-primary bg-primary/10 border-primary/20'
            : 'text-sky-600 bg-sky-50 border-sky-100'
            }`}>
            {isRecurring ? 'Mensual' : 'Único'}
        </span>
    );
}
