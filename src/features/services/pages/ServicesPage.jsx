// src/features/services/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Zap, Repeat, Trash2, Edit, Search, Package, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield, Layers, LayoutGrid, Filter, ArrowUpDown, SlidersHorizontal, ArrowUp, ArrowDown, X, PackageOpen, Download, Upload } from "lucide-react";
import { CreateServiceModal } from "../../../components/modals/CreateServiceModal";
import { CreatePlanModal } from "../components/CreatePlanModal";
import { ConfirmDeleteModal } from "../../../components/modals/ConfirmDeleteModal";

// API & SERVICES
import { servicesAPI, plansAPI } from "../../../services/apiClient";
import { mockBackend } from "../../../services/mockBackend";
import { toast } from 'sonner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';

// ------------------- ADAPTERS -------------------
// Services: API (snake_case) -> UI (camelCase)
const adaptService = (apiData) => {
    return {
        id: apiData.id,
        name: apiData.name,
        description: apiData.description,
        price: Number(apiData.unit_price) || 0,
        type: apiData.service_type,
        isActive: apiData.is_active,
        icon: apiData.icon || 'Zap'
    };
};

// Services: UI (camelCase) -> API (snake_case)
const adaptServiceToApi = (uiData) => {
    return {
        name: uiData.name,
        description: uiData.description,
        unit_price: Number(uiData.price),
        service_type: uiData.type,
        is_active: uiData.isActive ?? true,
        icon: uiData.icon
    };
};

// Plans: API (snake_case) -> UI (camelCase)
const adaptPlan = (apiPlan) => {
    return {
        id: apiPlan.id,
        name: apiPlan.name,
        description: apiPlan.description,
        price: Number(apiPlan.price),
        downloadSpeed: apiPlan.download_speed_mbps,
        uploadSpeed: apiPlan.upload_speed_mbps,
        billingCycle: apiPlan.billing_frequency,
        type: apiPlan.service_type,
        isActive: apiPlan.is_active,
    };
};

// Plans: UI (camelCase) -> API (snake_case)
const adaptPlanToApi = (uiData) => {
    return {
        name: uiData.name,
        description: uiData.description,
        price: Number(uiData.price),
        download_speed_mbps: Number(uiData.downloadSpeed),
        upload_speed_mbps: Number(uiData.uploadSpeed),
        billing_frequency: uiData.billingCycle,
        service_type: uiData.type,
        is_active: uiData.isActive ?? true
    };
};

const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

export default function ServicesPage() {
    const [viewMode, setViewMode] = useState('services'); // 'services' | 'plans'
    const [searchTerm, setSearchTerm] = useState("");

    // --- Options State ---
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterType, setFilterType] = useState('all');
    const [isGrouped, setIsGrouped] = useState(false);

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Editing / Deleting State
    const [planToEdit, setPlanToEdit] = useState(null);
    const [serviceToEdit, setServiceToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null); // { id, type: 'service'|'plan', name }

    // Data State
    const [services, setServices] = useState([]);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Parallel fetch
                const [servicesRes, plansRes] = await Promise.allSettled([
                    servicesAPI.getAll({ limit: 100 }),
                    plansAPI.getAll({ limit: 100 })
                ]);

                // Handle Services
                if (servicesRes.status === 'fulfilled' && servicesRes.value?.data) {
                    setServices(servicesRes.value.data.map(adaptService));
                } else {
                    setServices([]);
                }

                // Handle Plans
                if (plansRes.status === 'fulfilled' && plansRes.value?.data) {
                    setPlans(plansRes.value.data.map(adaptPlan));
                } else {
                    setPlans([]);
                }

            } catch (err) {
                console.error("Error loading data", err);
                toast.error("Error al cargar datos.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // --- Service Handlers ---
    const handleSaveService = async (serviceData) => {
        const payload = adaptServiceToApi(serviceData);
        const promise = async () => {
            if (serviceData.id && services.some(s => s.id === serviceData.id)) {
                // EDIT
                await servicesAPI.update(serviceData.id, payload);
                setServices(prev => prev.map(s => s.id === serviceData.id ? { ...s, ...serviceData } : s));
            } else {
                // CREATE
                const response = await servicesAPI.create(payload);
                const newSvc = response && response.data ? adaptService(response.data) : { ...serviceData, id: 'temp-' + Date.now() };
                setServices(prev => [...prev, newSvc]);
            }
        };

        toast.promise(promise(), {
            loading: 'Guardando servicio...',
            success: 'Servicio guardado',
            error: 'Error al guardar'
        });
        setIsServiceModalOpen(false);
        setServiceToEdit(null);
    };

    // --- Plan Handlers ---
    const handleSavePlan = async (planData) => {
        // planData comes from modal in camelCase (uiData format)
        // We need to convert it to API format for the request
        const payload = adaptPlanToApi(planData);

        const promise = async () => {
            if (planData.id && plans.some(p => p.id === planData.id)) {
                // EDIT
                await plansAPI.update(planData.id, payload);
                // Update local state with the uiData (planData already has the fields)
                // We restart fetch or update manually. Let's update manually for speed.
                setPlans(prev => prev.map(p => p.id === planData.id ? { ...p, ...planData } : p));
            } else {
                // CREATE
                const response = await plansAPI.create(payload);
                const newPlan = response && response.data ? adaptPlan(response.data) : { ...planData, id: 'temp-' + Date.now() };
                setPlans(prev => [...prev, newPlan]);
            }
        };

        toast.promise(promise(), {
            loading: 'Guardando plan...',
            success: 'Plan guardado',
            error: 'Error al guardar plan'
        });
        setIsPlanModalOpen(false);
        setPlanToEdit(null);
    };

    const handleDeleteClick = (item, type) => {
        setItemToDelete({ id: item.id, type, name: item.name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const promise = async () => {
            if (itemToDelete.type === 'service') {
                await servicesAPI.delete(itemToDelete.id, true); // Hard delete for now as per previous logic
                setServices(prev => prev.filter(s => s.id !== itemToDelete.id));
            } else {
                await plansAPI.delete(itemToDelete.id, true);
                setPlans(prev => prev.filter(p => p.id !== itemToDelete.id));
            }
        };

        toast.promise(promise(), {
            loading: 'Eliminando...',
            success: 'Elemento eliminado',
            error: 'Error al eliminar'
        });
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // --- Render Helpers ---
    const renderServiceCard = (service, index) => {
        const IconComponent = ICON_MAP[service.icon] || (service.type === 'recurring' ? Repeat : Zap);
        return (
            <Card key={service.id || index} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden">
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
                                <p className="text-2xl font-bold text-slate-900 font-heading">${service.price?.toLocaleString()}</p>
                                {service.type === 'recurring' && <span className="text-xs text-slate-400 font-medium">/mes</span>}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setServiceToEdit(service); setIsServiceModalOpen(true); }} className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(service, 'service')} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderPlanCard = (plan, index) => {
        return (
            <Card key={plan.id || index} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 pt-5 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Wifi className="h-6 w-6" />
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none shadow-none">{plan.billingCycle === 'monthly' ? 'Mensual' : plan.billingCycle}</Badge>
                    </div>
                    <CardTitle className="text-xl text-slate-800">{plan.name}</CardTitle>
                    <p className="text-sm text-slate-500 line-clamp-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                            <Download className="h-4 w-4 text-sky-500" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Bajada</p>
                                <p className="text-sm font-bold text-slate-700">{plan.downloadSpeed} Mega</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-2">
                            <Upload className="h-4 w-4 text-emerald-500" />
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Subida</p>
                                <p className="text-sm font-bold text-slate-700">{plan.uploadSpeed} Mega</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio Final</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-slate-900 font-heading text-primary">
                                    ${plan.price?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary" onClick={() => { setPlanToEdit(plan); setIsPlanModalOpen(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600" onClick={() => handleDeleteClick(plan, 'plan')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Filter Logic
    const filteredServices = services.filter(s => {
        if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterType !== 'all' && s.type !== filterType) return false;
        return true;
    }).sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    const filteredPlans = plans.filter(p => {
        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    }).sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {viewMode === 'services' ? 'Catálogo de Servicios' : 'Catálogo de Planes'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {viewMode === 'services' ? 'Gestiona tus productos o ítems adicionales.' : 'Gestiona tus planes de internet.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                        <button onClick={() => setViewMode('services')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <LayoutGrid className="h-4 w-4" /> Servicios
                        </button>
                        <button onClick={() => setViewMode('plans')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'plans' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Wifi className="h-4 w-4" /> Planes
                        </button>
                    </div>
                    <Button
                        onClick={() => viewMode === 'services' ? setIsServiceModalOpen(true) : setIsPlanModalOpen(true)}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-95 transition-all w-[220px] justify-center"
                    >
                        <Plus className="h-4 w-4" /> {viewMode === 'services' ? 'Nuevo Servicio' : 'Nuevo Plan'}
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <CreateServiceModal isOpen={isServiceModalOpen} onClose={() => { setIsServiceModalOpen(false); setServiceToEdit(null); }} onConfirm={handleSaveService} initialData={serviceToEdit} />
            <CreatePlanModal isOpen={isPlanModalOpen} onClose={() => { setIsPlanModalOpen(false); setPlanToEdit(null); }} onConfirm={handleSavePlan} initialData={planToEdit} />
            <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} entityName={itemToDelete?.name} entityType={itemToDelete?.type === 'service' ? 'Servicio' : 'Plan'} />

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur border border-slate-200/50">
                <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full lg:w-1/3">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 items-center">
                        {/* Common Sort */}
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <Button variant="ghost" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="h-8 px-2 text-slate-500 hover:text-slate-800">
                                {sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                        {viewMode === 'services' && (
                            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200 px-3">
                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                <select className="bg-transparent border-none text-sm text-slate-600 font-medium focus:ring-0 cursor-pointer py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="all">Todos</option>
                                    <option value="recurring">Recurrentes</option>
                                    <option value="unique">Únicos</option>
                                </select>
                            </div>
                        )}
                        {(searchTerm || filterType !== 'all') && (
                            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 h-10">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {viewMode === 'services' ? (
                        filteredServices.length > 0 ? filteredServices.map((s, i) => renderServiceCard(s, i)) : (
                            <div className="col-span-full"><EmptyState icon={PackageOpen} title="No hay servicios" description="Crea nuevos servicios para tu catálogo." actionLabel="Nuevo Servicio" onAction={() => setIsServiceModalOpen(true)} /></div>
                        )
                    ) : (
                        filteredPlans.length > 0 ? filteredPlans.map((p, i) => renderPlanCard(p, i)) : (
                            <div className="col-span-full"><EmptyState icon={Wifi} title="No hay planes" description="Configura tus planes de internet." actionLabel="Nuevo Plan" onAction={() => setIsPlanModalOpen(true)} /></div>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
