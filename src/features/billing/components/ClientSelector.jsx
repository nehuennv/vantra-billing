import React, { useState, useEffect } from 'react';
import { Search, User, Check, Loader2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { clientAPI } from '../../../services/apiClient';
import { cn } from '../../../components/ui/Button';

export function ClientSelector({ onSelect, selectedClientId }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await clientAPI.getAll();
                // Handle response format variations (array vs object with data property)
                const clientList = Array.isArray(response) ? response : (response.data || []);
                // Filter active clients only
                setClients(clientList.filter(c => c.is_active !== false));
            } catch (error) {
                console.error("Error fetching clients:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const filteredClients = clients.filter(client =>
        client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.tax_id?.includes(searchTerm) ||
        client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Cargando clientes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nombre, empresa o CUIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white"
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-slate-400">
                        No se encontraron clientes
                    </div>
                ) : (
                    filteredClients.map((client) => {
                        const isSelected = selectedClientId === client.id;
                        return (
                            <div
                                key={client.id}
                                onClick={() => onSelect(client)}
                                className={cn(
                                    "cursor-pointer group relative p-4 rounded-xl border-2 transition-all duration-300 ease-in-out",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0",
                                            isSelected ? "bg-primary text-white" : "bg-white text-slate-500 border border-slate-100 group-hover:border-primary/20 group-hover:text-primary"
                                        )}>
                                            {client.company_name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className={cn("font-medium text-sm truncate", isSelected ? "text-primary" : "text-slate-900")}>
                                                {client.company_name}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                                                {client.tax_id || "Sin CUIT"}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center animate-in zoom-in-50 shrink-0">
                                            <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div >
    );
}
