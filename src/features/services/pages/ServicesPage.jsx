// src/features/services/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Zap, Repeat, Trash2, Edit, Search, Package, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield, Layers, LayoutGrid, Filter, ArrowUpDown, SlidersHorizontal, ArrowUp, ArrowDown, X, PackageOpen } from "lucide-react";
import { mockServicesCatalog, mockBudgetTemplates } from "../../../data/mockData";
import { CreateServiceModal } from "../../../components/modals/CreateServiceModal";
import { CreatePackageModal } from "../components/CreatePackageModal";
import { ConfirmDeleteModal } from "../../../components/modals/ConfirmDeleteModal";
import { mockBackend } from "../../../services/mockBackend";
import { toast } from 'sonner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';

// Mapa de iconos...
const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

export default function ServicesPage() {
    const [viewMode, setViewMode] = useState('services'); // 'services' | 'budgets'
    const [searchTerm, setSearchTerm] = useState("");

    // --- Options State ---
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'price'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const [filterType, setFilterType] = useState('all'); // 'all' | 'recurring' | 'one_time'
    const [isGrouped, setIsGrouped] = useState(false);

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Editing / Deleting State
    const [packageToEdit, setPackageToEdit] = useState(null);
    const [serviceToEdit, setServiceToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null); // { id, type: 'service'|'package', name }

    // Data State
    const [services, setServices] = useState([]);
    const [budgets, setBudgets] = useState(mockBudgetTemplates || []);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                const catalog = await mockBackend.getCatalog();
                if (catalog && catalog.length > 0) {
                    setServices(catalog);
                } else {
                    // Seed if empty for demo
                    setServices(mockServicesCatalog);
                }
            } catch (err) {
                console.error("Error loading catalog", err);
                setServices(mockServicesCatalog); // Fallback
                toast.error("Error al cargar el catálogo de servicios");
            } finally {
                setIsLoading(false);
            }
        };
        // Simulated delay for Skeleton demo anywhere between 500-1000ms
        setTimeout(load, 800);
    }, []);

    // --- Service Handlers ---
    const handleSaveService = async (serviceData) => {
        const promise = async () => {
            if (serviceData.id && services.some(s => s.id === serviceData.id)) {
                // EDIT

                // If it's a seed item (string ID from mockData) vs uuid from backend
                // If backend has it, we update backend. If it's local only (seed), we just update local state
                try {
                    await mockBackend.updateService(serviceData.id, serviceData);
                } catch (e) {
                    console.warn("Backend update failed (maybe seed data):", e);
                }

                setServices(prev => prev.map(s => s.id === serviceData.id ? { ...s, ...serviceData } : s));
            } else {
                // CREATE
                const newSvc = await mockBackend.createService(serviceData);
                setServices(prev => [...prev, newSvc]);
            }
        };

        toast.promise(promise(), {
            loading: 'Guardando servicio...',
            success: 'Servicio guardado correctamente',
            error: 'Error al guardar el servicio'
        });

        setIsServiceModalOpen(false);
        setServiceToEdit(null);
    };

    const handleEditService = (service) => {
        setServiceToEdit(service);
        setIsServiceModalOpen(true);
    };

    const handleDeleteClick = (item, type) => {
        setItemToDelete({ id: item.id, type, name: item.name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const promise = async () => {
            if (itemToDelete.type === 'service') {
                try {
                    await mockBackend.deleteService(itemToDelete.id);
                } catch (e) {
                    console.warn("Backend delete warn:", e);
                }
                setServices(prev => prev.filter(s => s.id !== itemToDelete.id));
            } else {
                // Budget/Package deletion
                setBudgets(prev => prev.filter(b => b.id !== itemToDelete.id));
            }
        };

        toast.promise(promise(), {
            loading: 'Eliminando...',
            success: `${itemToDelete.type === 'service' ? 'Servicio' : 'Presupuesto'} eliminado`,
            error: 'Error al eliminar'
        });

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // --- Package Handlers ---
    const handleSavePackage = (savedPackage) => {
        // Local only for now as per previous code structure
        const exists = budgets.find(b => b.id === savedPackage.id);

        if (exists) {
            setBudgets(budgets.map(b => b.id === savedPackage.id ? savedPackage : b));
            toast.success("Presupuesto actualizado");
        } else {
            setBudgets([...budgets, savedPackage]);
            toast.success("Presupuesto creado");
        }
        setIsPackageModalOpen(false);
        setPackageToEdit(null);
    };

    const handleEditPackage = (pkg) => {
        setPackageToEdit(pkg);
        setIsPackageModalOpen(true);
    };

    const handleOpenNewPackage = () => {
        setPackageToEdit(null);
        setIsPackageModalOpen(true);
    };

    const handleOpenNewService = () => {
        setServiceToEdit(null);
        setIsServiceModalOpen(true);
    };

    // --- Processing Logic (Filter/Sort) ---
    const processData = (data, type) => {
        let result = [...data];

        // 1. Search
        if (searchTerm) {
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filter
        if (type === 'services' && filterType !== 'all') {
            result = result.filter(item => item.type === filterType);
        }

        // 3. Sort
        result.sort((a, b) => {
            const valA = sortBy === 'name' ? a.name : (type === 'services' ? a.price : a.totalPrice);
            const valB = sortBy === 'name' ? b.name : (type === 'services' ? b.price : b.totalPrice);

            if (sortBy === 'name') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
        });

        return result;
    };

    const processedServices = processData(services, 'services');
    const processedBudgets = processData(budgets, 'budgets');

    // Grouping helper
    const getGroupedServices = () => {
        return {
            recurring: processedServices.filter(s => s.type === 'recurring'),
            one_time: processedServices.filter(s => s.type === 'unique')
        };
    };

    const toggleSortOrder = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    // Reset Filters Utility
    const clearFilters = () => {
        setSearchTerm("");
        setSortBy('name');
        setSortOrder('asc');
        setFilterType('all');
        setIsGrouped(false);
    };

    // --- RENDER HELPERS ---
    const renderServiceCard = (service, index) => {
        const IconComponent = ICON_MAP[service.icon] || (service.type === 'recurring' ? Repeat : Zap);
        return (
            <Card key={service.id ? service.id.toString() : `svc-${index}`} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden">
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
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditService(service)}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                title="Editar"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(service, 'service')}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Eliminar"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Skeleton Render
    const renderSkeletons = () => (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-6 bg-white space-y-4">
                    <div className="flex justify-between items-start">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <Skeleton className="h-8 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                            onClick={() => { setViewMode('services'); setIsGrouped(false); }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="h-4 w-4" /> Servicios
                        </button>
                        <button
                            onClick={() => { setViewMode('budgets'); setIsGrouped(false); }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'budgets' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers className="h-4 w-4" /> Presupuestos
                        </button>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => viewMode === 'services' ? handleOpenNewService() : handleOpenNewPackage()}
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
                onConfirm={handleSaveService}
                initialData={serviceToEdit}
            />
            <CreatePackageModal
                isOpen={isPackageModalOpen}
                onClose={() => { setIsPackageModalOpen(false); setPackageToEdit(null); }}
                onConfirm={handleSavePackage}
                packageToEdit={packageToEdit}
            />
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                entityName={itemToDelete?.name}
                entityType={itemToDelete?.type === 'service' ? 'Servicio' : 'Presupuesto'}
            />

            {/* --- TOOLBAR: SEARCH & FILTERS --- */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur border border-slate-200/50">
                <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center">

                    {/* Search */}
                    <div className="relative w-full lg:w-1/3">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={viewMode === 'services' ? "Buscar servicio..." : "Buscar presupuesto..."}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filters & Sort */}
                    <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 items-center">
                        {/* Sort */}
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSortOrder}
                                className="h-8 px-2 text-slate-500 hover:text-slate-800"
                            >
                                {sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                            </Button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <select
                                className="bg-transparent border-none text-sm text-slate-600 font-medium focus:ring-0 cursor-pointer py-1 pl-1 pr-6"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="name">Nombre</option>
                                <option value="price">Precio</option>
                            </select>
                        </div>

                        {/* Filter (Only Services) */}
                        {viewMode === 'services' && (
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200 px-3">
                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                <select
                                    className="bg-transparent border-none text-sm text-slate-600 font-medium focus:ring-0 cursor-pointer py-1"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Todos los Tipos</option>
                                    <option value="recurring">Recurrentes</option>
                                    <option value="unique">Pago Único</option>
                                </select>
                            </div>
                        )}

                        {/* Group Toggle (Only Services) */}
                        {viewMode === 'services' && (
                            <Button
                                variant={isGrouped ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setIsGrouped(!isGrouped)}
                                className={`gap-2 h-10 border ${isGrouped ? 'bg-primary/10 text-primary border-primary/20' : 'border-slate-200 text-slate-500'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span className="hidden sm:inline">Agrupar</span>
                            </Button>
                        )}

                        {(searchTerm || filterType !== 'all' || isGrouped || sortBy !== 'name' || sortOrder !== 'asc') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 h-10"
                                title="Limpiar Filtros"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* --- CONTENT GRID --- */}
            {isLoading ? (
                renderSkeletons()
            ) : viewMode === 'services' ? (
                isGrouped ? (
                    // GROUPED VIEW
                    <div className="space-y-8">
                        {/* Recurring Section */}
                        {getGroupedServices().recurring.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
                                    <Repeat className="h-5 w-5 text-primary" /> Suscripciones Recurrentes
                                    <Badge variant="secondary" className="ml-auto">{getGroupedServices().recurring.length}</Badge>
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {getGroupedServices().recurring.map((s, i) => renderServiceCard(s, i))}
                                </div>
                            </div>
                        )}

                        {/* One Time Section */}
                        {getGroupedServices().one_time.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
                                    <Zap className="h-5 w-5 text-sky-500" /> Pagos Únicos
                                    <Badge variant="secondary" className="ml-auto">{getGroupedServices().one_time.length}</Badge>
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {getGroupedServices().one_time.map((s, i) => renderServiceCard(s, i))}
                                </div>
                            </div>
                        )}

                        {getGroupedServices().recurring.length === 0 && getGroupedServices().one_time.length === 0 && (
                            <EmptyState
                                icon={PackageOpen}
                                title="No se encontraron servicios"
                                description="No hay servicios que coincidan con los filtros seleccionados."
                                actionLabel="Limpiar Filtros"
                                onAction={clearFilters}
                            />
                        )}
                    </div>
                ) : (
                    // NORMAL GRID VIEW
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {processedServices.length > 0 ? (
                            processedServices.map((s, i) => renderServiceCard(s, i))
                        ) : (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={PackageOpen}
                                    title="No se encontraron servicios"
                                    description={searchTerm ? "Intenta con otra búsqueda o limpia los filtros." : "Aún no has creado servicios en el catálogo."}
                                    actionLabel={searchTerm ? "Limpiar Filtros" : "Crear Nuevo Servicio"}
                                    onAction={searchTerm ? clearFilters : handleOpenNewService}
                                />
                            </div>
                        )}
                    </div>
                )
            ) : (
                // BUDGETS VIEW
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {processedBudgets.length > 0 ? (
                        processedBudgets.map((budget) => (
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
                                                onClick={() => handleDeleteClick(budget, 'presupuesto')}
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
                        <div className="col-span-full">
                            <EmptyState
                                icon={Layers}
                                title="No hay presupuestos creados"
                                description="Crea paquetes de servicios predefinidos para agilizar tus propuestas."
                                actionLabel="Crear mi primer presupuesto"
                                onAction={handleOpenNewPackage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
