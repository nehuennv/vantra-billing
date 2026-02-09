import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Search, CheckCircle2, LayoutGrid, Package, Layers, ChevronRight, AlertCircle, Wifi, Zap, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { catalogAPI, combosAPI } from '../../../services/apiClient';

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
    // Item = { type: 'single', service: ServiceData } 
    //      | { type: 'combo', id: string, name: string, price: number, items: ServiceData[] }
    const [budgetItems, setBudgetItems] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'packages'
    const [catalog, setCatalog] = useState([]);
    const [packages, setPackages] = useState([]);

    // Hydrate State on Open
    useEffect(() => {
        if (isOpen && client?.activeServices) {
            const rawServices = client.activeServices;
            const newBudgetItems = [];
            const comboGroups = {}; // Map<origin_combo_id, { items: [] }>

            // 1. Group by origin_combo_id
            rawServices.forEach(svc => {
                if (svc.origin_combo_id) {
                    if (!comboGroups[svc.origin_combo_id]) {
                        comboGroups[svc.origin_combo_id] = {
                            id: svc.origin_combo_id,
                            items: []
                        };
                    }
                    comboGroups[svc.origin_combo_id].items.push(svc);
                } else {
                    newBudgetItems.push({ type: 'single', service: svc });
                }
            });

            // 2. Process Groups into Combo Items
            Object.values(comboGroups).forEach(group => {
                // Calculate total from items as initial state
                const total = group.items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

                newBudgetItems.push({
                    type: 'combo',
                    id: group.id, // This is the origin_combo_id (UUID or whatever ID used)
                    name: 'Pack de Servicios', // Placeholder, will update with package match if possible
                    price: total,
                    items: group.items
                });
            });

            setBudgetItems(newBudgetItems);

            // Fetch Data
            const loadData = async () => {
                try {
                    const [catRes, comboRes] = await Promise.all([
                        catalogAPI.getAll({ limit: 100 }),
                        combosAPI.getAll()
                    ]);

                    const catalogData = catRes.data || [];
                    const packagesData = comboRes.data || [];

                    setCatalog(catalogData);

                    // Enrich packages: If price is missing/0/NaN, calculate from items
                    const enrichedPackages = packagesData.map(pkg => {
                        let finalPrice = Number(pkg.price);

                        // If invalid price, sum up components
                        if (isNaN(finalPrice) || finalPrice === 0) {
                            finalPrice = (pkg.items || []).reduce((sum, item) => {
                                const catItem = catalogData.find(c => c.id === item.catalog_item_id);
                                return sum + ((Number(catItem?.default_price) || 0) * (Number(item.quantity) || 1));
                            }, 0);
                        }

                        return { ...pkg, price: finalPrice };
                    });

                    setPackages(enrichedPackages);

                    // Update Combo Names in budgetItems if we can match origin_combo_id
                    setBudgetItems(prev => prev.map(item => {
                        if (item.type === 'combo') {
                            const foundPkg = enrichedPackages.find(p => p.id === item.id);
                            if (foundPkg) {
                                return { ...item, name: foundPkg.name };
                            }
                        }
                        return item;
                    }));

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
            catalog_item_id: service.id,
            name: service.name,
            price: Number(service.default_price),
            type: 'recurring',
            icon: inferIcon(service.name),
            startDate: new Date().toISOString().split('T')[0],
            origin_combo_id: null
        };
        setBudgetItems(prev => [...prev, { type: 'single', service: newService }]);
    };

    const handleAddPackage = (pkg) => {
        // 1. Expand Items from Catalog
        const rawItems = (pkg.items || []).map(pi => {
            const catItem = catalog.find(c => c.id === pi.catalog_item_id);
            if (!catItem) return null;
            return {
                ...catItem,
                quantity: pi.quantity || 1
            };
        }).filter(Boolean);

        if (rawItems.length === 0) return;

        // 2. Expand Quantities
        const expandedItems = [];
        rawItems.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                expandedItems.push({ ...item }); // Clone
            }
        });

        // 3. Price Distribution Logic
        const targetTotal = Number(pkg.price);
        const originalTotal = expandedItems.reduce((sum, item) => sum + Number(item.default_price), 0);

        const finalItems = expandedItems.map(item => {
            let info = {
                id: `temp-combo-item-${Math.random()}`,
                catalog_item_id: item.id,
                name: item.name,
                icon: inferIcon(item.name),
                type: 'recurring',
                startDate: new Date().toISOString().split('T')[0],
                // Temporary price, will adjust below
                price: Number(item.default_price)
            };

            // Calculate Prorated Price
            if (originalTotal > 0) {
                const ratio = Number(item.default_price) / originalTotal;
                const prorated = targetTotal * ratio;
                // Round to 2 decimals floor to avoid overshooting, we add remainder later
                info.price = Math.floor(prorated * 100) / 100;
            } else {
                // Determine price if original total is 0?
                // Split evenly
                info.price = Math.floor((targetTotal / expandedItems.length) * 100) / 100;
            }
            return info;
        });

        // 4. Distribute Remainder (Cent adjustment)
        const currentSum = finalItems.reduce((sum, i) => sum + i.price, 0);
        let remainder = targetTotal - currentSum;

        // Fix floating point epsilon
        remainder = Math.round(remainder * 100) / 100;

        if (finalItems.length > 0 && Math.abs(remainder) > 0) {
            // Add remainder to first item
            finalItems[0].price = Number((finalItems[0].price + remainder).toFixed(2));
        }

        // 5. Create Combo Entry
        // We use the Bundle Definition ID as the 'origin_combo_id'
        const newCombo = {
            type: 'combo',
            id: pkg.id, // Bundle Definition ID as origin_combo_id
            name: pkg.name,
            price: targetTotal,
            items: finalItems
        };

        setBudgetItems(prev => [...prev, newCombo]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...budgetItems];
        newItems.splice(index, 1);
        setBudgetItems(newItems);
    };

    const handleSaveInternal = () => {
        // Flatten Structure
        const flatServices = [];

        budgetItems.forEach(item => {
            if (item.type === 'single') {
                flatServices.push({
                    ...item.service,
                    origin_combo_id: null
                });
            } else if (item.type === 'combo') {
                item.items.forEach(subItem => {
                    flatServices.push({
                        ...subItem,
                        origin_combo_id: item.id // Critical: Link to Combo
                    });
                });
            }
        });

        onSave(flatServices);
    };

    // Calculate Total
    const totalBudget = budgetItems.reduce((sum, item) => {
        if (item.type === 'single') return sum + (item.service.price || 0);
        if (item.type === 'combo') return sum + (item.price || 0);
        return sum;
    }, 0);


    // --- RENDERING HELPERS ---

    const renderSingleItem = (item, index) => {
        const { service } = item;
        const iconName = service.icon || inferIcon(service.name || '');
        const Icon = ICON_MAP[iconName] || Zap;

        return (
            <div key={`single-${index}`} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-white group hover:border-slate-300 transition-all mb-2 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800 text-sm">{service.name}</p>
                        <p className="text-xs text-slate-500">${(service.price || 0).toLocaleString()} {service.type === 'recurring' && '/ mes'}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-slate-400 hover:text-rose-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        );
    };

    const renderComboItem = (item, index) => {
        return (
            <div key={`combo-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden mb-3 transition-all hover:border-slate-300 hover:shadow-sm group">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-100/50 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 text-sm">
                            ${(item.price || 0).toLocaleString()}
                        </span>
                        <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                            title="Eliminar Pack Completo"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Body (Items) */}
                <ul className="p-3 space-y-1">
                    {item.items.map((sub, idx) => {
                        const iconName = sub.icon || inferIcon(sub.name || '');
                        const Icon = ICON_MAP[iconName] || Zap;
                        return (
                            <li key={idx} className="flex items-center justify-between text-sm py-1 px-1 rounded hover:bg-slate-100">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <Icon className="h-3 w-3 text-slate-400" />
                                    <span>{sub.name}</span>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">
                                    ${sub.price.toLocaleString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                    <Package className="h-3 w-3" /> Combos
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'services' ? "Buscar producto..." : "Buscar combo..."}
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
                                availablePackages.map(pkg => (
                                    <div key={pkg.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-indigo-500" />
                                                <p className="font-medium text-slate-800 text-sm">{pkg.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    ${Number(pkg.price).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {(pkg.items?.length || 0)} ítems
                                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white" onClick={() => handleAddPackage(pkg)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
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

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {budgetItems.length > 0 ? (
                                <div>
                                    {budgetItems.map((item, index) => {
                                        if (item.type === 'combo') return renderComboItem(item, index);
                                        return renderSingleItem(item, index);
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-sm">No hay servicios en el presupuesto.</p>
                                    <p className="text-xs mt-1">Agrega servicios o paquetes desde el panel izquierdo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-2 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)] z-10">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSaveInternal}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20"
                    >
                        <CheckCircle2 className="h-4 w-4" /> Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
