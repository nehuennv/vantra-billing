import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, CheckCircle2, LayoutGrid, Package, Wifi, Zap, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { catalogAPI, combosAPI } from '../../../services/apiClient';

const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

// Logic duplicated from ServicesPage for consistency (or could be moved to utils)
const inferIcon = (name) => {
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
    // Hooks must be called unconditionally
    const [activeServices, setActiveServices] = useState(client?.activeServices || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'packages'
    const [catalog, setCatalog] = useState([]);
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // Reset/Sync state when opening
            setActiveServices(client?.activeServices || []);

            // Fetch Catalog & Combos
            const loadData = async () => {
                try {
                    const [catRes, comboRes] = await Promise.all([
                        catalogAPI.getAll({ limit: 100 }),
                        combosAPI.getAll()
                    ]);
                    setCatalog(catRes.data || []);
                    setPackages(comboRes.data || []);
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

    const handleAddService = (service) => {
        const newService = {
            id: `temp-${Math.random()}`, // Temp ID for UI
            // Map for backend
            catalog_item_id: service.id, // Store Catalog ID
            name: service.name,
            price: Number(service.default_price),
            type: 'recurring', // Defaulting for V2
            icon: inferIcon(service.name),
            startDate: new Date().toISOString().split('T')[0]
        };
        setActiveServices([...activeServices, newService]);
    };

    const handleAddPackage = (pkg) => {
        // Expand Combo items
        // Note: pkg.items usually has { catalog_item_id, quantity }
        // We need to resolve names/prices from Catalog if not in pkg items
        // Only if pkg items lack details.
        // Assuming V2 combo.items might refer to catalog items.
        // For simplicity in this view, if we don't have full details in `pkg.items`,
        // we might fail to show nice names.
        // We can cross-reference `catalog`.

        const newItems = [];
        if (pkg.items && Array.isArray(pkg.items)) {
            pkg.items.forEach(comboItem => {
                const catalogItem = catalog.find(c => c.id === comboItem.catalog_item_id);
                if (catalogItem) {
                    for (let i = 0; i < (comboItem.quantity || 1); i++) {
                        newItems.push({
                            id: `temp-combo-${Math.random()}`,
                            catalog_item_id: catalogItem.id,
                            name: catalogItem.name,
                            price: Number(catalogItem.default_price),
                            type: 'recurring',
                            icon: inferIcon(catalogItem.name),
                            startDate: new Date().toISOString().split('T')[0]
                        });
                    }
                }
            });
        }

        setActiveServices([...activeServices, ...newItems]);
    };

    const handleRemoveService = (index) => {
        const newServices = [...activeServices];
        newServices.splice(index, 1);
        setActiveServices(newServices);
    };

    const totalBudget = activeServices.reduce((sum, s) => sum + (s.price || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl w-full h-[80vh] p-0 overflow-hidden flex flex-col gap-0 border-0">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="font-heading font-bold text-lg text-slate-800 text-left">
                            Gestionar Presupuesto
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Cliente: {client.name}
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
                                            <p className="font-medium text-slate-800 text-sm">{pkg.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {pkg.items?.length || 0} ítems
                                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 hover:bg-primary hover:text-white" onClick={() => handleAddPackage(pkg)}>
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

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activeServices.length > 0 ? (
                                activeServices.map((item, index) => {
                                    const iconName = item.icon || inferIcon(item.name || '');
                                    const Icon = ICON_MAP[iconName] || Zap;
                                    return (
                                        <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 group hover:border-rose-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                                    <p className="text-xs text-slate-500">${(item.price || 0).toLocaleString()} {item.type === 'recurring' && '/ mes'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveService(index)}
                                                className="text-slate-400 hover:text-rose-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })
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
                        onClick={() => onSave(activeServices)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20"
                    >
                        <CheckCircle2 className="h-4 w-4" /> Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
