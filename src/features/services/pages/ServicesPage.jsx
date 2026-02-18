// src/features/services/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { PageTransition } from "../../../components/common/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Zap, Repeat, Trash2, Edit, Search, Package, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield, LayoutGrid, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, PackageOpen, Download, Upload } from "lucide-react";
import { CreateServiceModal } from "../../../components/modals/CreateServiceModal";
import { EditServiceInstanceModal } from "../components/EditServiceInstanceModal";
import { CreatePackageModal } from "../components/CreatePackageModal";
import { ConfirmDeleteModal } from "../../../components/modals/ConfirmDeleteModal";
import { CatalogItemCard } from "../components/CatalogItemCard";
import { ComboItemCard } from "../components/ComboItemCard";

// API
import { catalogAPI, combosAPI, servicesAPI, request } from "../../../services/apiClient";
import { clientConfig } from "../../../config/client";
import { useToast } from '../../../hooks/useToast';
import { useClientLookup } from '../../../hooks/useClientLookup';
import { ServiceInstanceCard } from '../components/ServiceInstanceCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';

// ------------------- INFERENCE LOGIC -------------------
const inferIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('internet') || n.includes('wifi') || n.includes('fibra')) return 'Wifi';
    if (n.includes('tv') || n.includes('cable') || n.includes('canal')) return 'Monitor';
    if (n.includes('movil') || n.includes('celular') || n.includes('sim')) return 'Smartphone';
    if (n.includes('cloud') || n.includes('nube')) return 'Cloud';
    if (n.includes('hosting') || n.includes('servidor')) return 'Server';
    if (n.includes('seguridad') || n.includes('camara') || n.includes('alarma')) return 'Shield';
    return 'Zap'; // Default
};

const inferType = (name) => {
    // V2 API Catalog items are usually recurring unless specified otherwise in business logic.
    // For now, we assume everything in Catalog is a recurring service base.
    // If we needed to distinguish, we'd need metadata in description or a naming convention.
    return 'recurring';
};

// ------------------- ADAPTERS -------------------
// Catalog Item: API (snake_case) -> UI (camelCase)
const adaptCatalogItem = (apiData) => {
    return {
        id: apiData.id,
        name: apiData.name,
        description: apiData.description,
        price: Number(apiData.default_price) || 0, // V2 uses default_price
        sku: apiData.sku,
        isActive: apiData.is_active,
        // Inferred fields
        icon: inferIcon(apiData.name),
        type: inferType(apiData.name)
    };
};

// Combo: API (snake_case) -> UI (camelCase)
const adaptCombo = (apiData) => {
    return {
        id: apiData.id,
        name: apiData.name,
        items: apiData.items || [],
        price: Number(apiData.price || apiData.default_price) || 0,
        description: `${(apiData.items || []).length} ítems`,
        isActive: apiData.is_active !== false // Default to true if undefined, but respect false
    };
};


const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

import { useSearchParams } from 'react-router-dom';

// ...

export default function ServicesPage() {
    // View Mode: 'catalog' | 'combos' - synced with URL
    const { toast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'catalog';

    // Main Tab State: 'catalog' | 'subscriptions'
    const [activeTab, setActiveTab] = useState('catalog');

    const setViewMode = (mode) => {
        setSearchParams(prev => {
            prev.set('view', mode);
            return prev;
        }, { replace: true });
    };

    const [searchTerm, setSearchTerm] = useState("");

    // --- Options State ---
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [isComboModalOpen, setIsComboModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Editing / Deleting State
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null); // { id, type: 'catalog'|'combo', name }

    // Subscriptions Edit State
    const [isEditSubscriptionModalOpen, setIsEditSubscriptionModalOpen] = useState(false);
    const [subscriptionToEdit, setSubscriptionToEdit] = useState(null);

    // Data State
    // Data State
    const [catalogItems, setCatalogItems] = useState([]);
    const [combos, setCombos] = useState([]);

    // Subscriptions Data
    const [subscriptions, setSubscriptions] = useState([]);
    const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubscriptionsLoading, setIsSubscriptionsLoading] = useState(false);

    // Hooks
    const { getClientName, loading: loadingClients } = useClientLookup();

    // Fetch Subscriptions (Lazy load when tab is active)
    useEffect(() => {
        if (activeTab === 'subscriptions') {
            const fetchSubscriptions = async () => {
                setIsSubscriptionsLoading(true);
                try {
                    const response = await servicesAPI.getAll();
                    const list = Array.isArray(response) ? response : (response.data || []);
                    setSubscriptions(list);
                } catch (error) {
                    console.error("Error fetching subscriptions", error);
                    toast.error("Error al cargar suscripciones.");
                } finally {
                    setIsSubscriptionsLoading(false);
                }
            };
            fetchSubscriptions();
        }
    }, [activeTab]);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [catalogRes, combosRes] = await Promise.allSettled([
                catalogAPI.getAll({ limit: 100, is_custom: 'false' }), // Filter: Only standard items
                combosAPI.getAll()
            ]);

            // Handle Catalog
            if (catalogRes.status === 'fulfilled' && catalogRes.value?.data) {
                setCatalogItems(catalogRes.value.data.map(adaptCatalogItem));
            } else {
                setCatalogItems([]);
            }

            // Handle Combos
            if (combosRes.status === 'fulfilled' && combosRes.value?.data) {
                setCombos(combosRes.value.data.map(adaptCombo));
            } else {
                setCombos([]);
            }

        } catch (err) {
            console.error("Error loading data", err);
            toast.error("Error al cargar el catálogo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        refreshData();
    }, []);

    // --- Handlers ---

    // Save Catalog Item
    const handleSaveCatalogItem = async (formData) => {
        // formData: { name, price, description, sku, ... }
        // Map back to API V2 payload
        const payload = {
            name: formData.name,
            default_price: Number(formData.price),
            sku: formData.sku || formData.name.toUpperCase().replace(/\s+/g, '-').slice(0, 10), // Auto-SKU if missing
            description: formData.description
        };

        const promise = async () => {
            if (formData.id) {
                await catalogAPI.update(formData.id, payload);
            } else {
                await catalogAPI.create(payload);
            }
            await refreshData();
        };

        toast.promise(promise(), {
            loading: 'Guardando producto...',
            success: 'Catálogo actualizado',
            error: 'Error al guardar'
        });
        setIsServiceModalOpen(false);
        setItemToEdit(null);
    };

    // Save Combo
    const handleSaveCombo = async (formData) => {
        // formData: { id, name, items: [{ catalog_item_id, quantity }], price }

        // Prepare base payload
        let payload = {
            name: formData.name,
            items: formData.items,
            price: formData.price // Send price override (0 if automatic)
        };

        const promise = async () => {
            if (formData.id) {
                // Update: Merge with existing data to prevent data loss (PUT replaces resource)
                const existingCombo = combos.find(c => c.id === formData.id);
                if (existingCombo) {
                    payload = {
                        ...payload,
                        is_active: existingCombo.isActive // Map camelCase back to snake_case if needed, but API usually expects is_active
                    };
                }

                await combosAPI.update(formData.id, payload);
            } else {
                // Create
                await combosAPI.create(payload);
            }
            await refreshData();
        };

        toast.promise(promise(), {
            loading: formData.id ? 'Actualizando plan...' : 'Creando plan...',
            success: formData.id ? 'Plan actualizado' : 'Plan creado',
            error: 'Error al guardar plan'
        });
        setIsComboModalOpen(false);
        setItemToEdit(null);
    };

    // Delete
    const handleDeleteClick = (item, type) => {
        setItemToDelete({ id: item.id, type, name: item.name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const promise = async () => {
            if (itemToDelete.type === 'catalog') {
                await catalogAPI.delete(itemToDelete.id);
            } else {
                await combosAPI.delete(itemToDelete.id);
            }
            await refreshData();
        };

        toast.promise(promise(), {
            loading: 'Eliminando...',
            success: 'Eliminado correctamente',
            error: 'Error al eliminar'
        });
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // --- Subscriptions Handlers ---

    const handleEditSubscription = (service) => {
        setSubscriptionToEdit(service);
        setIsEditSubscriptionModalOpen(true);
    };

    const handleUpdateSubscription = async (updatedService) => {
        // CORRECTION: The backend blocks PATCH due to CORS.
        // We must use PUT /v1/services/client/:clientId/sync (Mirror)
        // This requires sending the FULL list of services to avoid deletion.

        const client_id = updatedService.client_id;
        if (!client_id) {
            toast.error("Error: No se pudo identificar al cliente.");
            return;
        }

        const promise = async () => {
            // 1. Fetch ALL active/inactive services for this client to ensure we don't lose anything
            // We need to be careful: if we only fetch active, we might delete inactive ones if the backend syncs everything.
            // The sync endpoint documentation says: "Services in DB not in array -> deleted".
            // So we MUST fetch everything. active_only=false is default? No, usually true.
            // Let's check apiClient.
            // getByClient usually returns what?
            // Let's use request directly or ensure getByClient supports params if needed.
            // actually servicesAPI.getByClient just does GET /v1/services/client/:id
            // We need to make sure we get ALL services.
            // Looking at API docs: GET /api/v1/services/client/:clientId?active_only=true (default)
            // We need active_only=false to be safe!

            const response = await request(`/v1/services/client/${client_id}?active_only=false`, 'GET');
            const currentServices = Array.isArray(response) ? response : (response.data || []);

            // 2. Modify the target service in the list and SANITIZE payload
            // The sync endpoint is strict: it likely rejects read-only fields like created_at, updated_at, display_code.
            // We must construct a clean objects list.
            const allowedFields = ['id', 'name', 'unit_price', 'quantity', 'service_type', 'is_active', 'icon', 'origin_plan_id', 'description', 'start_date'];

            const updatedList = currentServices.map(s => {
                let serviceToSync = { ...s };

                if (s.id === updatedService.id) {
                    serviceToSync = {
                        ...s,
                        name: updatedService.name,
                        unit_price: updatedService.unit_price,
                        quantity: updatedService.quantity,
                        description: updatedService.description
                    };
                }

                // Filter to only allowed fields AND ensure types
                const cleanService = {};
                allowedFields.forEach(field => {
                    if (serviceToSync[field] !== undefined) {
                        if (field === 'unit_price') {
                            cleanService[field] = Number(serviceToSync[field]);
                        } else if (field === 'quantity') {
                            cleanService[field] = Number(serviceToSync[field]);
                        } else {
                            cleanService[field] = serviceToSync[field];
                        }
                    }
                });

                return cleanService;
            });

            // 3. Sync
            await servicesAPI.sync(client_id, updatedList);

            // 4. Refresh local state
            const res = await servicesAPI.getAll();
            const list = Array.isArray(res) ? res : (res.data || []);
            setSubscriptions(list);
        };

        toast.promise(promise(), {
            loading: 'Sincronizando cambios...',
            success: 'Servicio actualizado correctamente',
            error: 'Error al sincronizar servicio'
        });
        setIsEditSubscriptionModalOpen(false);
        setSubscriptionToEdit(null);
    };



    // Filter Subscriptions
    const filteredSubscriptions = subscriptions.filter(sub => {
        const clientName = getClientName(sub.client_id) || '';
        const searchLower = subscriptionSearchTerm.toLowerCase();
        return (
            sub.name.toLowerCase().includes(searchLower) ||
            clientName.toLowerCase().includes(searchLower) ||
            (sub.display_code && sub.display_code.toLowerCase().includes(searchLower))
        );
    });


    // ...

    // ADDED: Render Helper for Combo Card Edit Button

    // --- RENDER HELPERS (Now using new components) ---
    // The previous renderComboCard and renderCatalogCard functions are replaced by the components.

    const filteredCatalog = catalogItems.filter(s => {
        if (s.isActive === false) return false; // Hide archived/deleted items
        if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    }).sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    const filteredCombos = combos.filter(c => {
        if (!c.isActive) return false; // Hide archived/deleted combos
        if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    }).sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    return (
        <PageTransition className="space-y-6">
            {/* Top Level Tabs - Navigation Style */}
            <div className="flex items-center space-x-8 border-b border-slate-200 mb-8">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'catalog'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Catálogo
                    {activeTab === 'catalog' && (
                        <motion.div
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ backgroundColor: clientConfig.colors.primary }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'subscriptions'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Suscripciones
                    {activeTab === 'subscriptions' && (
                        <motion.div
                            layoutId="activeTabUnderline"
                            className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ backgroundColor: clientConfig.colors.primary }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                </button>
            </div>

            {activeTab === 'catalog' ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {/* Header Unified */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900">
                                {viewMode === 'catalog' ? 'Catálogo de Productos' : 'Planes y Paquetes'}
                            </h2>
                            <span className="text-sm text-slate-500">
                                {viewMode === 'catalog' ? `${filteredCatalog.length} Ítems disponibles` : `${filteredCombos.length} Planes configurados`}
                            </span>
                        </div>

                        <div className="flex gap-4 items-center">
                            {/* Switcher */}
                            <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                                {['catalog', 'combos'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`relative px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 rounded-md ${viewMode === mode ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {viewMode === mode && (
                                            <motion.div
                                                layoutId="services-view-switch"
                                                className="absolute inset-0 bg-white rounded-md shadow-sm border border-slate-200/50"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {mode === 'catalog' ? <LayoutGrid className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                            {mode === 'catalog' ? 'Productos' : 'Planes'}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* NEW Button */}
                            <Button
                                onClick={() => viewMode === 'catalog' ? setIsServiceModalOpen(true) : setIsComboModalOpen(true)}
                                size="sm"
                                className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm h-9"
                            >
                                <Plus className="h-4 w-4" /> Crear
                            </Button>
                        </div>
                    </div>

                    {/* Search Bar - UNIFIED STYLE */}
                    <div className="flex justify-between items-center mb-6 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={viewMode === 'catalog' ? "Buscar productos en catálogo..." : "Buscar planes y combos..."}
                                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="text-slate-500 hover:text-slate-800">
                            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />} Orden
                        </Button>
                    </div>

                    {/* Modals */}
                    <CreateServiceModal
                        isOpen={isServiceModalOpen}
                        onClose={() => { setIsServiceModalOpen(false); setItemToEdit(null); }}
                        onConfirm={handleSaveCatalogItem}
                        initialData={itemToEdit}
                    />
                    <CreatePackageModal
                        isOpen={isComboModalOpen}
                        onClose={() => { setIsComboModalOpen(false); setItemToEdit(null); }}
                        onConfirm={handleSaveCombo}
                        catalogItems={catalogItems}
                        initialData={itemToEdit}
                    />
                    <ConfirmDeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleConfirmDelete}
                        entityName={itemToDelete?.name}
                        entityType={itemToDelete?.type === 'catalog' ? 'Ítem' : 'Plan'}
                    />


                    {/* Content Grid */}
                    {isLoading ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {viewMode === 'catalog' ? (
                                filteredCatalog.length > 0 ? filteredCatalog.map(item => (
                                    <CatalogItemCard
                                        key={item.id}
                                        item={item}
                                        onEdit={(i) => { setItemToEdit(i); setIsServiceModalOpen(true); }}
                                        onDelete={(i) => handleDeleteClick(i, 'catalog')}
                                    />
                                )) : (
                                    <div className="col-span-full"><EmptyState icon={PackageOpen} title="Catálogo Vacío" description="Define los productos o servicios base." actionLabel="Crear Primero" onAction={() => setIsServiceModalOpen(true)} /></div>
                                )
                            ) : (
                                filteredCombos.length > 0 ? filteredCombos.map(combo => (
                                    <ComboItemCard
                                        key={combo.id}
                                        combo={combo}
                                        catalogItems={catalogItems}
                                        onEdit={(c) => { setItemToEdit(c); setIsComboModalOpen(true); }}
                                        onDelete={(c) => handleDeleteClick(c, 'combo')}
                                    />
                                )) : (
                                    <div className="col-span-full"><EmptyState icon={Package} title="Sin Planes" description="Agrupa productos en paquetes atractivos." actionLabel="Crear Plan" onAction={() => setIsComboModalOpen(true)} /></div>
                                )
                            )}
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header Standardized */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900">Suscripciones Activas</h2>
                            <span className="text-sm text-slate-500">
                                {filteredSubscriptions.length} Servicios detectados
                            </span>
                        </div>

                        {/* Search Bar - Matching Style roughly, but kept compact as per initial design or new standard? 
                             Let's match the new standard but kept to the right side if preferred, or full width bar?
                             The request was to standardize. Let's make it look like the catalog one.
                         */}
                        <div className="relative w-full max-w-xs">
                            {/* Keep the floating style for now as it's cleaner for just search, or wrap in white?
                                 User said "formato de buscadores" (plural). Let's wrap it to match.
                             */}
                            <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                                <Search className="ml-2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente/servicio..."
                                    className="w-full pl-2 pr-4 py-1.5 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                    value={subscriptionSearchTerm}
                                    onChange={(e) => setSubscriptionSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {(isSubscriptionsLoading || loadingClients) ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
                        </div>
                    ) : filteredSubscriptions.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSubscriptions.map(service => (
                                <ServiceInstanceCard
                                    key={service.id}
                                    service={service}
                                    clientName={getClientName(service.client_id)}
                                    comboList={combos}
                                    onEdit={handleEditSubscription}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                            <EmptyState
                                icon={Zap}
                                title="Sin resultados"
                                description={subscriptionSearchTerm ? "No se encontraron servicios con esa búsqueda." : "No hay servicios activos registrados en el sistema."}
                                actionLabel={!subscriptionSearchTerm ? "Ir a Clientes" : null}
                                onAction={() => window.location.href = '/clients'}
                            />
                        </div>
                    )}

                    {/* Edit Modal */}
                    <EditServiceInstanceModal
                        isOpen={isEditSubscriptionModalOpen}
                        onClose={() => setIsEditSubscriptionModalOpen(false)}
                        onConfirm={handleUpdateSubscription}
                        service={subscriptionToEdit}
                    />
                </motion.div>
            )}
        </PageTransition>
    );
}
