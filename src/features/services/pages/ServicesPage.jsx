// src/features/services/pages/ServicesPage.jsx
import React, { useState, useEffect } from 'react';
import { PageTransition } from "../../../components/common/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Zap, Repeat, Trash2, Edit, Search, Package, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield, LayoutGrid, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, PackageOpen, Download, Upload } from "lucide-react";
import { CreateServiceModal } from "../../../components/modals/CreateServiceModal";
import { CreatePackageModal } from "../components/CreatePackageModal";
import { ConfirmDeleteModal } from "../../../components/modals/ConfirmDeleteModal";

// API
import { catalogAPI, combosAPI } from "../../../services/apiClient";
import { toast } from 'sonner';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const viewMode = searchParams.get('view') || 'catalog';

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

    // Data State
    const [catalogItems, setCatalogItems] = useState([]);
    const [combos, setCombos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const [catalogRes, combosRes] = await Promise.allSettled([
                catalogAPI.getAll({ limit: 100 }),
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
        const payload = {
            name: formData.name,
            items: formData.items,
            price: formData.price // Send price override (0 if automatic)
        };

        const promise = async () => {
            if (formData.id) {
                // Update
                await combosAPI.update(formData.id, payload);
            } else {
                // Create
                await combosAPI.create(payload);
            }
            await refreshData();
        };

        toast.promise(promise(), {
            loading: formData.id ? 'Actualizando combo...' : 'Creando combo...',
            success: formData.id ? 'Combo actualizado' : 'Combo creado',
            error: 'Error al guardar combo'
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
            success: 'Elemento eliminado',
            error: 'Error al eliminar'
        });
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // ...

    // ADDED: Render Helper for Combo Card Edit Button

    const renderComboCard = (combo) => {
        // Calculate effective price: Use override if > 0, else sum items
        const effectivePrice = combo.price > 0
            ? combo.price
            : combo.items?.reduce((sum, it) => {
                const catItem = catalogItems.find(c => c.id === it.catalog_item_id);
                return sum + ((catItem?.price || 0) * (it.quantity || 1));
            }, 0);

        return (
            <Card key={combo.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between space-y-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Package className="h-6 w-6" />
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-primary transition-colors">{combo.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Incluye {combo.items?.length || 0} ítems
                    </p>

                    {/* List Preview */}
                    <div className="space-y-1 mb-4">
                        {combo.items?.slice(0, 3).map((it, idx) => {
                            const catalogItem = catalogItems.find(c => c.id === it.catalog_item_id);
                            return (
                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="w-1 h-1 rounded-full bg-primary/60" />
                                    <span>{it.quantity}x {catalogItem?.name || 'Ítem desconocido'}</span>
                                </div>
                            );
                        })}
                        {(combo.items?.length || 0) > 3 && <p className="text-xs text-slate-400 pl-3">...</p>}
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-100 pt-4 mt-auto">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Paquete</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-bold text-slate-900 font-heading">${effectivePrice.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setItemToEdit(combo); setIsComboModalOpen(true); }} className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(combo, 'combo')} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ...

    const renderCatalogCard = (item) => {
        const IconComponent = ICON_MAP[item.icon] || Zap;
        return (
            <Card key={item.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 overflow-hidden">
                <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between space-y-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <IconComponent className="h-6 w-6" />
                    </div>
                    {item.sku && (
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-500 font-mono tracking-wider">
                            {item.sku}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-1 group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2 leading-relaxed">{item.description}</p>

                    <div className="flex items-end justify-between border-t border-slate-100 pt-4 mt-auto">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio de Lista</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-bold text-slate-900 font-heading">${item.price?.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setItemToEdit(item); setIsServiceModalOpen(true); }} className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item, 'catalog')} className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Administrador de Catálogo
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {viewMode === 'catalog' ? 'Define tus productos y precios base.' : 'Crea paquetes de productos.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                        <button onClick={() => setViewMode('catalog')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'catalog' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <LayoutGrid className="h-4 w-4" /> Productos
                        </button>
                        <button onClick={() => setViewMode('combos')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'combos' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Package className="h-4 w-4" /> Combos
                        </button>
                    </div>
                    <Button
                        onClick={() => viewMode === 'catalog' ? setIsServiceModalOpen(true) : setIsComboModalOpen(true)}
                        className={`gap-2 text-white shadow-lg active:scale-95 transition-all w-[200px] justify-center bg-primary hover:bg-primary/90 shadow-primary/20`}
                    >
                        <Plus className="h-4 w-4" /> {viewMode === 'catalog' ? 'Nuevo Ítem' : 'Nuevo Combo'}
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <CreateServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => { setIsServiceModalOpen(false); setItemToEdit(null); }}
                onConfirm={handleSaveCatalogItem}
                initialData={itemToEdit}
            />
            {/* We will refactor CreatePackageModal to be CreateComboModal */}
            <CreatePackageModal
                isOpen={isComboModalOpen}
                onClose={() => { setIsComboModalOpen(false); setItemToEdit(null); }}
                onConfirm={handleSaveCombo}
                // We pass catalog items so the modal can show the checklist
                catalogItems={catalogItems}
                initialData={itemToEdit}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                entityName={itemToDelete?.name}
                entityType={itemToDelete?.type === 'catalog' ? 'Ítem' : 'Combo'}
            />

            {/* Filters */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur border border-slate-200/50">
                <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full lg:w-1/3">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder={viewMode === 'catalog' ? "Buscar productos..." : "Buscar combos..."} className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-3 items-center">
                        <Button variant="ghost" size="sm" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="h-9 px-3 text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200">
                            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />} Orden
                        </Button>
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
                    {viewMode === 'catalog' ? (
                        filteredCatalog.length > 0 ? filteredCatalog.map(item => renderCatalogCard(item)) : (
                            <div className="col-span-full"><EmptyState icon={PackageOpen} title="Catálogo Vacío" description="Define los productos o servicios base." actionLabel="Crear Primero" onAction={() => setIsServiceModalOpen(true)} /></div>
                        )
                    ) : (
                        filteredCombos.length > 0 ? filteredCombos.map(combo => renderComboCard(combo)) : (
                            <div className="col-span-full"><EmptyState icon={Package} title="Sin Combos" description="Agrupa productos en paquetes atractivos." actionLabel="Crear Combo" onAction={() => setIsComboModalOpen(true)} /></div>
                        )
                    )}
                </div>
            )}
        </PageTransition>
    );
}
