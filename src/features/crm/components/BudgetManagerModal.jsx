import React, { useState } from 'react';
import { X, Plus, Trash2, Search, CheckCircle2, LayoutGrid, Package } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/Dialog';
import { mockServicesCatalog, mockBudgetTemplates } from '../../../data/mockData';

export function BudgetManagerModal({ isOpen, onClose, client, onSave }) {
    if (!isOpen) return null;

    const [activeServices, setActiveServices] = useState(client.activeServices || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'packages'

    // Filter available items
    const availableServices = mockServicesCatalog.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availablePackages = mockBudgetTemplates.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddService = (service) => {
        const newService = {
            id: Math.random(), // Temp ID
            serviceId: service.id,
            name: service.name,
            price: service.price,
            type: service.type,
            startDate: new Date().toISOString().split('T')[0]
        };
        setActiveServices([...activeServices, newService]);
    };

    const handleAddPackage = (pkg) => {
        const newItems = pkg.services.map(s => ({
            id: Math.random(),
            serviceId: s.id,
            name: s.name,
            price: s.price,
            type: s.type,
            startDate: new Date().toISOString().split('T')[0]
        }));
        setActiveServices([...activeServices, ...newItems]);
    };

    const handleRemoveService = (index) => {
        const newServices = [...activeServices];
        newServices.splice(index, 1);
        setActiveServices(newServices);
    };

    const totalBudget = activeServices.reduce((sum, s) => sum + s.price, 0);

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
                                    <LayoutGrid className="h-3 w-3" /> Servicios
                                </button>
                                <button
                                    onClick={() => setActiveTab('packages')}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'packages' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Package className="h-3 w-3" /> Paquetes
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'services' ? "Buscar servicio..." : "Buscar paquete..."}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activeTab === 'services' ? (
                                availableServices.map(service => (
                                    <div key={service.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{service.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-slate-600">${service.price.toLocaleString()}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${service.type === 'recurring' ? 'bg-primary/10 text-primary' : 'bg-sky-50 text-sky-600'}`}>
                                                    {service.type === 'recurring' ? 'Mensual' : 'Único'}
                                                </span>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-slate-50 hover:bg-primary hover:text-white" onClick={() => handleAddService(service)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                availablePackages.map(pkg => (
                                    <div key={pkg.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-primary/50 hover:shadow-sm transition-all flex justify-between items-center group">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{pkg.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-slate-600">${pkg.totalPrice.toLocaleString()}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    {pkg.services.length} servicios
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
                                activeServices.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 group hover:border-rose-200 transition-colors">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                            <p className="text-xs text-slate-500">${item.price.toLocaleString()} {item.type === 'recurring' && '/ mes'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveService(index)}
                                            className="text-slate-400 hover:text-rose-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
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
