import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Search, Eye, UserX, LayoutGrid, List } from "lucide-react";
import { ClientKanbanBoard } from "../components/ClientKanbanBoard";
import { mockBackend } from "../../../services/mockBackend";
import { CreateClientModal } from "../components/CreateClientModal";

const DEFAULT_COLUMNS = [
    { id: 'potential', title: 'POTENCIAL' },
    { id: 'contacted', title: 'CONTACTADO' },
    { id: 'budgeted', title: 'PRESUPUESTADO' },
    { id: 'to_bill', title: 'A FACTURAR' },
    { id: 'billed', title: 'FACTURADO' },
];

export default function CRMPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

    // Lifted State
    const [clients, setClients] = useState([]);
    const [columns, setColumns] = useState(DEFAULT_COLUMNS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Load Clients
    useEffect(() => {
        const load = async () => {
            try {
                const data = await mockBackend.getClients();
                setClients(data);
            } catch (error) {
                console.error("Error loading clients", error);
            }
        };
        load();
    }, []);

    // Handlers
    const handleAddClient = async (clientData) => {
        // clientData comes with a temporary ID from modal, strip it to let backend generate one
        const { id, ...dataToSave } = clientData;
        try {
            const newClient = await mockBackend.createClient(dataToSave);
            setClients(prev => [...prev, newClient]);
        } catch (error) {
            console.error("Error creating client", error);
        }
    };

    const handleTasksChange = (updatedTasks) => {
        // In a real app, this would be an API call
        // Here we just update the local state which serves both List and Kanban
        setClients(updatedTasks);
        // TODO: Persist status changes to backend if needed
    };

    const handleAddColumn = (newColumn) => {
        setColumns(prev => [...prev, newColumn]);
    };

    const handleDeleteColumn = (columnId) => {
        if (confirm("¿Eliminar esta columna? Las tareas pasarán a 'POTENCIAL'.")) {
            setColumns(prev => prev.filter(c => c.id !== columnId));
            setClients(prev => prev.map(t => t.status === columnId ? { ...t, status: 'potential' } : t));
        }
    };

    const handleEditColumn = (column) => {
        const newTitle = prompt("Nuevo nombre:", column.title);
        if (newTitle) {
            setColumns(prev => prev.map(c => c.id === column.id ? { ...c, title: newTitle.toUpperCase() } : c));
        }
    };

    // Filter based on search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cuit.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clientes</h1>
                    <p className="text-slate-500 mt-1">Base de datos de abonados y prospectos.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <List className="h-4 w-4" /> Lista
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="h-4 w-4" /> Tablero
                        </button>
                    </div>

                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 w-[220px] justify-center"
                    >
                        <Plus className="h-4 w-4" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur border border-slate-200/50">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, empresa o CUIT..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* VISTA: LISTA */}
            {viewMode === 'list' && (
                <Card className="overflow-hidden border-slate-200 shadow-sm bg-white animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold tracking-wide">Cliente / Empresa</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide">Servicio (Matriz)</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide">Estado</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-right">Deuda</th>
                                    <th className="px-6 py-4 font-semibold tracking-wide text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map((client) => {
                                        // Resolve Status Label
                                        const statusCol = columns.find(c => c.id === client.status);
                                        const statusLabel = statusCol ? statusCol.title : client.status;

                                        return (
                                            <tr key={client.id} className="group hover:bg-slate-50/80 transition-colors duration-200">
                                                {/* COLUMNA NOMBRE (CLICKABLE) */}
                                                <td className="px-6 py-4">
                                                    <Link to={`/crm/clients/${client.id}`} className="block group-hover:translate-x-1 transition-transform duration-200">
                                                        <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                            {client.name}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                                                            {client.cuit}
                                                            {client.businessName && <span className="text-slate-300">• {client.businessName}</span>}
                                                        </div>
                                                    </Link>
                                                </td>

                                                <td className="px-6 py-4 text-slate-600 font-medium">
                                                    {client.servicePlan}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-slate-50">
                                                        {statusLabel}
                                                    </Badge>
                                                </td>

                                                <td className="px-6 py-4 text-right font-bold">
                                                    {client.debt > 0 ? (
                                                        <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                                                            ${client.debt.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>

                                                {/* COLUMNA ACCIONES */}
                                                <td className="px-6 py-4 text-center">
                                                    <Link to={`/crm/clients/${client.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">Ver detalle</span>
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    // EMPTY STATE (Cuando no encuentra nada)
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                                    <UserX className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <p className="font-medium text-slate-600">No se encontraron clientes</p>
                                                <p className="text-sm">Prueba con otro nombre o CUIT.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* VISTA: KANBAN (BOARD) */}
            {viewMode === 'kanban' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ClientKanbanBoard
                        columns={columns}
                        tasks={filteredClients}
                        onTasksChange={handleTasksChange}
                        onAddColumn={handleAddColumn}
                        onDeleteColumn={handleDeleteColumn}
                        onEditColumn={handleEditColumn}
                    />
                </div>
            )}

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                columns={columns}
                onAddClient={handleAddClient}
                onAddColumn={handleAddColumn}
            />
        </div>
    );
}