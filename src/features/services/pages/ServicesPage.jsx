// src/features/services/pages/ServicesPage.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Zap, Repeat, Trash2, Edit, Search, Package, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield, Layers, LayoutGrid } from "lucide-react";
import { mockServicesCatalog, mockBudgetTemplates } from "../../../data/mockData";
import { CreateServiceModal } from "../../../components/modals/CreateServiceModal";
import { CreatePackageModal } from "../components/CreatePackageModal";

// Mapa de iconos...
const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

export default function ServicesPage() {
    const [viewMode, setViewMode] = useState('services'); // 'services' | 'budgets'
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [packageToEdit, setPackageToEdit] = useState(null); // Estado para editar

    // Data State
    const [services, setServices] = useState(mockServicesCatalog);
    const [budgets, setBudgets] = useState(mockBudgetTemplates || []);

    // --- Handlers ---
    const handleCreateService = (newService) => setServices([...services, newService]);

    // Unificamos crear/editar Presupuesto
    const handleSavePackage = (savedPackage) => {
        const exists = budgets.find(b => b.id === savedPackage.id);
        if (exists) {
            // Update
            setBudgets(budgets.map(b => b.id === savedPackage.id ? savedPackage : b));
        } else {
            // Create
            setBudgets([...budgets, savedPackage]);
        }
        setIsPackageModalOpen(false);
        setPackageToEdit(null); // Limpiar
    };

    const handleEditPackage = (pkg) => {
        setPackageToEdit(pkg);
        setIsPackageModalOpen(true);
    };

    const handleDeletePackage = (id) => {
        if (window.confirm("¿Estás seguro de eliminar este presupuesto?")) {
            setBudgets(budgets.filter(b => b.id !== id));
        }
    };

    const handleOpenNewPackage = () => {
        setPackageToEdit(null); // Asegurar que es nuevo
        setIsPackageModalOpen(true);
    };

    // --- Filter Logic ---
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredBudgets = budgets.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            {/* Header Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {viewMode === 'services' ? 'Catálogo de Servicios' : 'Gestión de Presupuestos'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {viewMode === 'services' ? 'Gestiona tus productos individuales.' : 'Crea conjuntos de servicios predefinidos.'}
                    </p>
                </div>

                <div className="flex gap-3">
                    {/* View Switcher */}
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                        <button
                            onClick={() => setViewMode('services')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="h-4 w-4" /> Servicios
                        </button>
                        <button
                            onClick={() => setViewMode('budgets')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'budgets' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="h-4 w-4" /> Presupuestos
                        </button>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => viewMode === 'services' ? setIsServiceModalOpen(true) : handleOpenNewPackage()}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all w-[220px] justify-center"
                    >
                        <Plus className="h-4 w-4" /> {viewMode === 'services' ? 'Nuevo Servicio' : 'Nuevo Presupuesto'}
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <CreateServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onConfirm={handleCreateService}
            />
            <CreatePackageModal
                isOpen={isPackageModalOpen}
                onClose={() => { setIsPackageModalOpen(false); setPackageToEdit(null); }}
                onConfirm={handleSavePackage}
                packageToEdit={packageToEdit}
            />

            {/* Search Bar */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur border border-slate-200/50">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={viewMode === 'services' ? "Buscar servicio..." : "Buscar presupuesto..."}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* --- CONTENT GRID --- */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* 1. VIEW MODE: SERVICES */}
                {viewMode === 'services' && (
                    filteredServices.length > 0 ? (
                        filteredServices.map((service) => {
                            const IconComponent = ICON_MAP[service.icon] || (service.type === 'recurring' ? Repeat : Zap);
                            return (
                                <Card key={service.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden">
                                    <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between space-y-0">
                                        <div className={`p-2.5 rounded-xl transition-colors ${service.type === 'recurring' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground' : 'bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white'}`}>
                                            <IconComponent className="h-6 w-6" />
                                        </div>
                                        <Badge variant="outline" className={`font-medium ${service.type === 'recurring' ? 'border-primary/20 text-primary bg-primary/5' : 'border-sky-100 text-sky-700 bg-sky-50/50'}`}>
                                            {service.type === 'recurring' ? 'Suscripción' : 'Pago Único'}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <h3 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-primary transition-colors">{service.name}</h3>
                                        <p className="text-sm text-slate-500 mb-6 h-10 line-clamp-2 leading-relaxed">{service.description}</p>
                                        <div className="flex items-end justify-between border-t border-slate-100 pt-4 mt-auto">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Base</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-2xl font-bold text-slate-900 font-heading">${service.price.toLocaleString()}</p>
                                                    {service.type === 'recurring' && <span className="text-xs text-slate-400 font-medium">/mes</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Package className="h-8 w-8 text-slate-300" /></div>
                            <p className="text-lg font-medium text-slate-600">No se encontraron servicios</p>
                        </div>
                    )
                )}

                {/* 2. VIEW MODE: BUDGETS (PACKS) */}
                {viewMode === 'budgets' && (
                    filteredBudgets.length > 0 ? (
                        filteredBudgets.map((budget) => (
                            <Card key={budget.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden flex flex-col">
                                <CardHeader className="pb-3 pt-5 bg-slate-50/50 border-b border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <Badge className="bg-primary text-primary-foreground border-none shadow-sm shadow-primary/20">Presupuesto</Badge>
                                    </div>
                                    <CardTitle className="text-xl text-slate-800">{budget.name}</CardTitle>
                                    <p className="text-sm text-slate-500 line-clamp-1">{budget.description}</p>
                                </CardHeader>

                                <CardContent className="pt-4 flex-1 flex flex-col">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Incluye:</p>
                                    <div className="space-y-2 mb-4">
                                        {/* Mostramos solo los primeros 3 */}
                                        {budget.services.slice(0, 3).map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                <Zap className="h-3 w-3 text-primary" />
                                                <span className="truncate">{s.name}</span>
                                            </div>
                                        ))}
                                        {/* Indicador de más items */}
                                        {budget.services.length > 3 && (
                                            <div className="text-xs font-medium text-slate-500 text-center bg-slate-100 py-1.5 rounded-lg">
                                                +{budget.services.length - 3} servicios más...
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                            {budget.isCustomPrice && (
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <Badge className="bg-rose-100 text-rose-600 border-none px-1.5 py-0 text-[10px]">Promo</Badge>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-2xl font-bold text-slate-900 font-heading text-primary">
                                                    ${budget.totalPrice.toLocaleString()}
                                                </p>
                                                {budget.isCustomPrice && (
                                                    <span className="text-xs text-slate-400 line-through">
                                                        ${budget.services.reduce((sum, s) => sum + s.price, 0).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-rose-600"
                                                onClick={() => handleDeletePackage(budget.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-400 hover:text-primary"
                                                onClick={() => handleEditPackage(budget)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Layers className="h-8 w-8 text-slate-300" /></div>
                            <p className="text-lg font-medium text-slate-600">No hay presupuestos creados</p>
                            <Button variant="link" onClick={() => handleOpenNewPackage()} className="text-primary">Crear mi primer presupuesto</Button>
                        </div>
                    )
                )}

            </div>
        </div>
    );
}