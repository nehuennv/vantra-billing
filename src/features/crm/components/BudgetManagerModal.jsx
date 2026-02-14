import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search, CheckCircle2, LayoutGrid, Package, Layers, ChevronRight, AlertCircle, Wifi, Zap, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { catalogAPI, combosAPI, servicesAPI } from '../../../services/apiClient';

const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

const inferIcon = (name) => {
    if (!name) return 'Zap';
    const n = name.toLowerCase();
    if (n.includes('internet') || n.includes('wifi') || n.includes('fibra')) return 'Wifi';
    if (n.includes('tv') || n.includes('cable') || n.includes('canal')) return 'Monitor';
    if (n.includes('movil') || n.includes('celular') || n.includes('sim')) return 'Smartphone';
    if (n.includes('cloud') || n.includes('nube')) return 'Cloud';
    if (n.includes('hosting') || n.includes('servidor')) return 'Server';
    if (n.includes('seguridad') || n.includes('camara') || n.includes('alarma')) return 'Shield';
    return 'Zap';
};

export function BudgetManagerModal({ isOpen, onClose, client, onSave }) {
    // State is now polymorphic:
    // Item = {
    //    type: 'single' | 'combo',
    //    id: string, // Real UUID or temp-ID
    //    catalog_item_id: string, // Real UUID if from catalog
    //    name: string,
    //    price: number,
    //    // ... specific fields
    //    shouldCreateInCatalog: boolean // NEW FLAG for custom items
    // }

    const [budgetItems, setBudgetItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false); // UI Block

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'packages'
    const [catalog, setCatalog] = useState([]);
    const [packages, setPackages] = useState([]);

    // New Custom Item State
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', price: '', quantity: 1 });

    // Accordion State for Packages (Catalog)
    const [expandedPackages, setExpandedPackages] = useState({});
    // Accordion State for Budget Items (Active Budget)
    const [expandedBudgetPackages, setExpandedBudgetPackages] = useState({});

    const togglePackage = (pkgId) => {
        setExpandedPackages(prev => ({ ...prev, [pkgId]: !prev[pkgId] }));
    };

    const toggleBudgetPackage = (id) => {
        setExpandedBudgetPackages(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Hydrate State on Open
    useEffect(() => {
        if (isOpen && client?.activeServices) {
            const rawServices = client.activeServices;
            const newBudgetItems = [];

            // Group by origin_plan_id
            const grouped = {}; // { planId: [services] }
            const singles = [];

            rawServices.forEach(s => {
                if (s.origin_plan_id) {
                    if (!grouped[s.origin_plan_id]) grouped[s.origin_plan_id] = [];
                    grouped[s.origin_plan_id].push(s);
                } else {
                    singles.push(s);
                }
            });

            // 1. Process Singles
            singles.forEach(s => {
                newBudgetItems.push({
                    type: 'single',
                    id: s.id,
                    catalog_item_id: s.catalog_item_id || s.origin_plan_id,
                    name: s.name,
                    price: Number(s.unit_price || s.price),
                    quantity: Number(s.quantity || 1),
                    icon: s.icon,
                    shouldCreateInCatalog: false
                });
            });

            // 2. Process Groups (Packages)
            // We need to wait for 'packages' (catalog) to be loaded to get the plan name if possible,
            // but we might not have it initially. We'll use the first service's data or look it up later.
            // Actually, we can just create the package object.

            Object.entries(grouped).forEach(([planId, items]) => {
                // Try to find plan name from items or catalog (mapped later if needed)
                // For now, use a placeholder or derived name.
                // In a perfect world, we'd look up planId in 'packages' state, but it might not be loaded yet.
                // We will handle "enrichment" when packages load or just use what we have.

                // Calculate total price of the *instance*
                const totalInstancePrice = items.reduce((sum, i) => sum + (Number(i.unit_price || i.price) * (i.quantity || 1)), 0);

                // Create the "Package" Item
                newBudgetItems.push({
                    type: 'package',
                    id: `pkg-inst-${planId}`, // Virtual ID for the group
                    origin_plan_id: planId,
                    name: "Plan Agrupado", // Will try to update this when packages load
                    price: totalInstancePrice, // Total price of the group
                    items: items.map(i => ({
                        // Standardize inner items
                        id: i.id, // Keep instance ID
                        catalog_item_id: i.catalog_item_id,
                        name: i.name,
                        price: Number(i.unit_price || i.price),
                        quantity: Number(i.quantity || 1),
                        icon: i.icon
                    })),
                    quantity: 1 // Packages themselves are usually qty 1
                });
            });

            setBudgetItems(newBudgetItems);

            // Fetch Data
            const loadData = async () => {
                try {
                    const [catRes, comboRes] = await Promise.all([
                        catalogAPI.getAll({ limit: 100, is_custom: 'false' }),
                        combosAPI.getAll()
                    ]);

                    const catalogData = catRes.data || [];
                    const packagesData = comboRes.data || [];

                    setCatalog(catalogData);
                    setPackages(packagesData);

                    // ENRICHMENT: Update names of grouped packages
                    setBudgetItems(currentItems => {
                        return currentItems.map(item => {
                            if (item.type === 'package' && item.name === "Plan Agrupado") {
                                const matchedPkg = packagesData.find(p => p.id === item.origin_plan_id);
                                if (matchedPkg) {
                                    return {
                                        ...item,
                                        name: matchedPkg.name,
                                        // Optional: Update price if we want to sync with current catalog, 
                                        // but for existing services we usually keep the instance price.
                                    };
                                }
                            }
                            return item;
                        });
                    });

                } catch (err) {
                    console.error("Error loading catalog/combos", err);
                }
            };
            loadData();
        }
    }, [isOpen, client]);

    // Filter available items
    const availableServices = catalog.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availablePackages = packages.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    // --- ACTIONS ---

    const handleAddService = (service) => {
        const newService = {
            id: `temp-${Math.random()}`,
            catalog_item_id: service.id, // Known ID
            name: service.name,
            price: Number(service.default_price),
            quantity: 1,
            type: 'single',
            icon: inferIcon(service.name),
            shouldCreateInCatalog: false
        };
        setBudgetItems(prev => [...prev, newService]);
    };

    const handleAddCustomItem = () => {
        if (!customItem.name || !customItem.price) return;

        const newService = {
            id: `temp-custom-${Math.random()}`,
            catalog_item_id: null, // Unknown yet
            name: customItem.name,
            price: Number(customItem.price),
            quantity: Number(customItem.quantity || 1),
            type: 'single',
            icon: inferIcon(customItem.name),
            shouldCreateInCatalog: true // Flag!
        };

        setBudgetItems(prev => [...prev, newService]);
        setCustomItem({ name: '', price: '', quantity: 1 });
        setShowCustomForm(false);
    };

    const handleAddPackage = (pkg) => {
        // 1. Calculate Price (Same logic as render)
        let finalPrice = 0;
        if (pkg.price && !isNaN(Number(pkg.price)) && Number(pkg.price) > 0) {
            finalPrice = Number(pkg.price);
        } else {
            // Fallback calculation
            finalPrice = (pkg.items || []).reduce((sum, item) => {
                const catItem = catalog.find(c => c.id === item.catalog_item_id);
                return sum + ((catItem?.default_price || 0) * (item.quantity || 1));
            }, 0);
        }

        // 2. Prepare Internal Items (Read-Only Snapshot)
        const packageItems = (pkg.items || []).map(pi => {
            const catItem = catalog.find(c => c.id === pi.catalog_item_id);
            if (!catItem) return null;
            return {
                catalog_item_id: pi.catalog_item_id, // Store ID
                name: catItem.name,
                price: Number(catItem.default_price),
                quantity: pi.quantity || 1, // Defined in package
                icon: inferIcon(catItem.name)
            };
        }).filter(Boolean);

        if (packageItems.length === 0) return;

        // 3. Add as SINGLE Atomic Block
        const newPackageItem = {
            id: `temp-pkg-${Math.random()}`,
            type: 'package', // ATOMIC TYPE
            origin_plan_id: pkg.id, // CRITICAL: The Link
            name: pkg.name,
            price: finalPrice,
            quantity: 1,
            items: packageItems // The content (Read-Only)
        };

        setBudgetItems(prev => [...prev, newPackageItem]);
    };

    const handleQuantityChange = (index, newQuantity) => {
        const qty = parseInt(newQuantity);
        if (isNaN(qty) || qty < 1) return;

        const newItems = [...budgetItems];
        newItems[index] = { ...newItems[index], quantity: qty };
        setBudgetItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...budgetItems];
        newItems.splice(index, 1);
        setBudgetItems(newItems);
    };

    // --- ORCHESTRATOR ---
    const handleSaveChanges = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // STEP 1: Creación Upstream (Items Custom)
            const itemsToCreate = budgetItems.filter(i => i.shouldCreateInCatalog);

            // Map of tempID -> realCatalogItemID
            const tempIdMap = {};

            if (itemsToCreate.length > 0) {
                // Execute sequentially or parallel. Parallel is faster.
                await Promise.all(itemsToCreate.map(async (item) => {
                    const payload = {
                        name: item.name,
                        default_price: item.price,
                        is_custom: true // STRICT REQUIREMENT
                    };

                    try {
                        const res = await catalogAPI.create(payload);
                        const newItem = res.data || res;
                        tempIdMap[item.id] = newItem.id;
                    } catch (err) {
                        console.error("Failed to create custom item", item, err);
                        throw new Error(`Error creando item: ${item.name}`);
                    }
                }));
            }

            // STEP 2: Mapeo de IDs y Preparación del Payload
            const finalPayload = budgetItems.flatMap(item => {
                // CASE A: Package (Atomic Block -> Explode to Items)
                if (item.type === 'package') {
                    return item.items.map(subItem => ({
                        // Package Items are new (or re-created) so we generally don't send ID unless we tracked it.
                        // Since we are "Read-Only" inside, we probably re-create them or lost the IDs in the grouping.
                        // If we grouped existing items, we should have kept their IDs.
                        // Improvment in Hydration needed? 
                        // In hydration: `items` mapped from `grouped`. `grouped` has `s.id`.
                        // Let's ensure hydration preserves `id` in `items`.

                        id: (subItem.id && !subItem.id.toString().startsWith('temp-')) ? subItem.id : undefined,
                        origin_plan_id: item.origin_plan_id, // CRITICAL: Link to Plan
                        catalog_item_id: subItem.catalog_item_id,
                        name: subItem.name,
                        unit_price: subItem.price,
                        quantity: (subItem.quantity || 1) * (item.quantity || 1),
                        service_type: 'recurring',
                        is_active: true
                    }));
                }

                // CASE B: Single Item
                let realCatalogId = item.catalog_item_id;

                // If it was a custom item, get the new ID
                if (item.shouldCreateInCatalog && tempIdMap[item.id]) {
                    realCatalogId = tempIdMap[item.id];
                }

                if (!realCatalogId) {
                    // Critical: If it's an existing item (has ID), we might forgive missing catalog_item_id 
                    // if the backend can handle it, but it's risky.
                    // Ideally, hydration should have fixed it. 
                    // We will allow existing items to pass to avoid data loss, but warn.
                    if (item.id && !item.id.toString().startsWith('temp-')) {
                        console.warn("Existing item missing catalog_item_id, sending anyway", item);
                        // proceed with realCatalogId as undefined/null
                    } else {
                        console.warn("New Item missing catalog_item_id", item);
                        return [];
                    }
                }

                return [{
                    // STRICT DOCS ADHERENCE: Include ID for existing items
                    id: (item.id && !item.id.toString().startsWith('temp-')) ? item.id : undefined,
                    origin_plan_id: null, // Single items are NOT part of a plan by default.

                    name: item.name,
                    unit_price: item.price,
                    quantity: item.quantity || 1,
                    service_type: 'recurring',
                    is_active: true,

                    // Legacy/Backup fields
                    catalog_item_id: realCatalogId,
                    price: item.price
                }];
            });

            console.log("Sync Payload:", finalPayload);

            // STEP 3: Sincronización Downstream
            await servicesAPI.sync(client.id, finalPayload);

            onSave(); // Refresh parent
            onClose(); // Close modal

        } catch (error) {
            console.error("Error saving budget:", error);
            // Optionally show error toast here or let parent handle
            alert("Error al guardar el presupuesto: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Total
    const totalBudget = budgetItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

    // --- RENDERING HELPERS ---

    const renderPackageItem = (item, index) => {
        const isExpanded = expandedBudgetPackages[item.id];
        return (
            <div key={item.id || index} className="mb-3 border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden group">
                <div
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleBudgetPackage(item.id)}
                >
                    {/* Left: Icon + Name */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                            <Package className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.items.length} servicios incluidos</p>
                        </div>
                    </div>

                    {/* Right: Price + Actions */}
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-sm">
                            ${item.price.toLocaleString()}
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(index); }}
                                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                title="Eliminar Plan Completo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 p-2 space-y-1">
                        {item.items.map((sub, idx) => {
                            const SubIcon = ICON_MAP[inferIcon(sub.name)] || Zap;
                            return (
                                <div key={idx} className="flex justify-between items-center p-2 rounded hover:bg-white hover:shadow-sm transition-all text-xs">
                                    <div className="flex items-center gap-2">
                                        <SubIcon className="h-3 w-3 text-slate-400" />
                                        <span className="text-slate-700">{sub.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                            x{sub.quantity}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderSingleItem = (item, index) => {
        const iconName = item.icon || inferIcon(item.name || '');
        const Icon = ICON_MAP[iconName] || Zap;
        const totalItemPrice = (item.price || 0) * (item.quantity || 1);

        return (
            <div key={item.id || index} className={`flex justify-between items-center p-3 rounded-lg border ${item.shouldCreateInCatalog ? 'border-primary/30 bg-primary/5' : 'border-slate-100 bg-white'} group hover:border-slate-300 transition-all mb-2 shadow-sm`}>
                <div className="flex items-center gap-3 flex-1">
                    <div className={`h-9 w-9 rounded-full border flex items-center justify-center ${item.shouldCreateInCatalog ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm flex items-center gap-2">
                            {item.name}
                            {item.shouldCreateInCatalog && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">NUEVO</span>}
                        </p>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>${(item.price || 0).toLocaleString()} c/u</span>
                            {item.type === 'recurring' && <span className="text-slate-400">/ mes</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white h-8">
                        <button
                            className="px-2 hover:bg-slate-50 text-slate-500 transition-colors"
                            onClick={() => handleQuantityChange(index, (item.quantity || 1) - 1)}
                            disabled={(item.quantity || 1) <= 1}
                        >
                            -
                        </button>
                        <input
                            type="text" // Use text to avoid spinner on some browsers, controlled by handler
                            className="w-8 text-center text-xs font-semibold text-slate-700 outline-none border-x border-slate-200 py-1"
                            value={item.quantity || 1}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                        <button
                            className="px-2 hover:bg-slate-50 text-slate-500 transition-colors"
                            onClick={() => handleQuantityChange(index, (item.quantity || 1) + 1)}
                        >
                            +
                        </button>
                    </div>

                    {/* Final Price */}
                    <div className="w-20 text-right">
                        <span className="font-bold text-slate-900 text-sm">
                            ${totalItemPrice.toLocaleString()}
                        </span>
                    </div>

                    {/* Delete */}
                    <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={isSubmitting ? () => { } : onClose}>
            <DialogContent className="sm:max-w-6xl w-full h-[80vh] p-0 overflow-hidden flex flex-col gap-0 border-0">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="font-heading font-bold text-lg text-slate-800 text-left">
                            Gestionar Presupuesto
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Cliente: {client.name || client.businessName}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Catalog */}
                    <div className="w-1/2 border-r border-slate-100 p-4 flex flex-col bg-slate-50/30">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-slate-700">Agregar Items</h4>
                            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('services')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <LayoutGrid className="h-3 w-3" /> Catálogo
                                </button>
                                <button
                                    onClick={() => setActiveTab('packages')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'packages' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Package className="h-3 w-3" /> Planes
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'services' ? "Buscar producto..." : "Buscar plan..."}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activeTab === 'services' ? (
                                availableServices.map(service => {
                                    const iconName = inferIcon(service.name);
                                    const Icon = ICON_MAP[iconName] || Zap;
                                    return (
                                        <div key={service.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{service.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-bold text-slate-600">${Number(service.default_price).toLocaleString()}</span>
                                                        {service.sku && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{service.sku}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 hover:bg-primary hover:text-white" onClick={() => handleAddService(service)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })
                            ) : (
                                availablePackages.map(pkg => {
                                    // Helper function to calculate price if not present
                                    const getPackagePrice = (p) => {
                                        if (p.price && !isNaN(Number(p.price)) && Number(p.price) > 0) return Number(p.price);
                                        // Fallback calculation
                                        return (p.items || []).reduce((sum, item) => {
                                            const catItem = catalog.find(c => c.id === item.catalog_item_id);
                                            return sum + ((catItem?.default_price || 0) * (item.quantity || 1));
                                        }, 0);
                                    };

                                    const pkgPrice = getPackagePrice(pkg);
                                    const isExpanded = expandedPackages[pkg.id];

                                    return (
                                        <div key={pkg.id} className={`bg-white rounded-lg border transition-all group overflow-hidden ${isExpanded ? 'border-primary/30 shadow-md ring-1 ring-primary/5' : 'border-slate-200 hover:border-primary/50 hover:shadow-sm'}`}>
                                            <div className="p-3 flex justify-between items-center cursor-pointer" onClick={() => togglePackage(pkg.id)}>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary'}`}>
                                                            <Layers className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800 text-sm">{pkg.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs font-bold text-slate-700">
                                                                    ${pkgPrice.toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                                    {(pkg.items?.length || 0)} servicios
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-md transition-all duration-200 ${isExpanded ? 'bg-slate-100 text-slate-600 rotate-180' : 'text-slate-400 hover:bg-slate-50'}`}>
                                                        <ChevronRight className="h-4 w-4 rotate-90" />
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 text-slate-600 hover:bg-primary hover:text-white" onClick={(e) => { e.stopPropagation(); handleAddPackage(pkg); }}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Accordion Content */}
                                            {isExpanded && (
                                                <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-200 fade-in">
                                                    <div className="bg-slate-50/80 rounded-lg p-2 space-y-1 border border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Contenido del Plan</p>
                                                        {(pkg.items || []).map((item, idx) => {
                                                            const catItem = catalog.find(c => c.id === item.catalog_item_id);
                                                            const itemIcon = inferIcon(catItem?.name);
                                                            const ItemIcon = ICON_MAP[itemIcon] || Zap;
                                                            return (
                                                                <div key={idx} className="flex justify-between items-center text-xs text-slate-700 p-2 rounded-md hover:bg-white hover:shadow-sm transition-all">
                                                                    <span className="flex items-center gap-2">
                                                                        <ItemIcon className="h-3 w-3 text-slate-400" />
                                                                        {catItem?.name || 'Item desconocido'}
                                                                    </span>
                                                                    <span className="font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">x{item.quantity}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Active Budget */}
                    <div className="w-1/2 p-4 flex flex-col bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-700">Presupuesto Actual</h4>
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-100">
                                Total: ${totalBudget.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-4">
                            {budgetItems.length > 0 ? (
                                <div>
                                    {budgetItems.map((item, index) =>
                                        item.type === 'package' ? renderPackageItem(item, index) : renderSingleItem(item, index)
                                    )}
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center p-8 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-sm">No hay servicios en el presupuesto.</p>
                                    <p className="text-xs mt-1">Agrega servicios o planes desde el panel izquierdo.</p>
                                </div>
                            )}
                        </div>

                        {/* CUSTOM ITEM FORM (Pinned to Bottom) */}
                        <div className="mt-auto border-t border-slate-100 pt-4">
                            {!showCustomForm ? (
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-slate-50"
                                    onClick={() => setShowCustomForm(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Agregar Item Manual
                                </Button>
                            ) : (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 animate-in slide-in-from-bottom-2 fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase">Nuevo Item Personalizado</p>
                                        <button onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                                            placeholder="Descripción (ej: Instalación Especial)"
                                            value={customItem.name}
                                            onChange={e => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <input
                                            type="number"
                                            className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                                            placeholder="Precio"
                                            value={customItem.price}
                                            onChange={e => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-slate-800 text-white hover:bg-slate-700"
                                        disabled={!customItem.name || !customItem.price}
                                        onClick={handleAddCustomItem}
                                    >
                                        Agregar al Listado
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-2 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button
                        onClick={handleSaveChanges}
                        disabled={isSubmitting}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <>Sincronizando...</>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" /> Confirmar Cambios
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
