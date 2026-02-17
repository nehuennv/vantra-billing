import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { catalogAPI } from '../../../services/apiClient';
import { cn } from '../../../components/ui/Button';

export function CatalogItemSelector({ onSelect, trigger }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open && items.length === 0) {
            setLoading(true);
            catalogAPI.getAll()
                .then(response => {
                    const list = Array.isArray(response) ? response : (response.data || []);
                    setItems(list);
                })
                .catch(err => console.error("Error fetching catalog", err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (item) => {
        onSelect(item);
        setOpen(false);
    };

    return (
        <>
            <div onClick={() => setOpen(true)} className="inline-block">
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Package className="h-4 w-4" />
                        Desde Catálogo
                    </Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Item del Catálogo</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No se encontraron items
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="p-3 rounded-lg border border-slate-100 hover:bg-primary/5 hover:border-primary/20 cursor-pointer transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <h4 className="font-medium text-slate-900 group-hover:text-primary">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                ${Number(item.default_price).toLocaleString('es-AR')}
                                            </p>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 group-hover:text-primary group-hover:bg-primary/10">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
