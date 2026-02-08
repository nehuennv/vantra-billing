import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_COLUMNS } from '../data/constants';
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Plus, Search, Eye, UserX, LayoutGrid, List } from "lucide-react";
import { ClientKanbanBoard } from "../components/ClientKanbanBoard";
import { clientAPI } from "../../../services/apiClient";
import { adaptClient, adaptClientForApi } from "../../../utils/adapters";
import { CreateClientModal } from "../components/CreateClientModal";
import { toast } from 'sonner';
import { Skeleton } from "../../../components/ui/Skeleton";



export default function CRMPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

    // Lifted State
    const [clients, setClients] = useState([]);
    const [columns, setColumns] = useState(DEFAULT_COLUMNS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [showInactive, setShowInactive] = useState(false); // Switch: false = Active Only, true = All

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 40,
        total: 0,
        totalPages: 1
    });

    // Load Clients (Server-Side)
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const params = {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: debouncedSearch,
                    _t: Date.now() // Cache buster
                };

                // Filter by UI Status (Backend Categoria)
                if (filterStatus !== 'all') {
                    params.categoria = filterStatus;
                }

                // Backend ignores is_active parameter (returns mixed always).
                // So we fetch everything and filter client-side.

                const response = await clientAPI.getAll(params);

                const rawList = Array.isArray(response) ? response : response.data || [];
                const adapted = rawList.map(adaptClient);
                setClients(adapted);

                if (response.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.pagination.total,
                        totalPages: response.pagination.totalPages
                    }));
                }

                // Dynamic Column Generation (Only adds from loaded, but better than nothing)
                const usedStatuses = [...new Set(adapted.map(c => c.status))];
                setColumns(prev => {
                    const newCols = [...prev];
                    usedStatuses.forEach(s => {
                        if (s && !newCols.find(c => c.id === s)) {
                            newCols.push({
                                id: s,
                                title: s.toUpperCase().replace(/_/g, ' ')
                            });
                        }
                    });
                    return newCols;
                });

            } catch (error) {
                console.error("Error loading clients", error);
                toast.error("Error al cargar los clientes");
            } finally {
                setIsLoading(false);
            }
        };

        // Reset page when filters change
        load();
    }, [pagination.page, pagination.limit, debouncedSearch, filterStatus]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [debouncedSearch, filterStatus, showInactive]);

    // Handlers
    const handleAddClient = async (clientData) => {
        const { id, ...dataToSave } = clientData;

        const promise = async () => {
            const apiBody = adaptClientForApi(dataToSave);
            const response = await clientAPI.create(apiBody);
            // La API devuelve el objeto creado, posiblemente en response.data
            const created = response.data || response;
            const newClient = adaptClient(created);

            // Optimistic update: Add to top of list
            setClients(prev => [newClient, ...prev]);
            return newClient;
        };

        toast.promise(promise(), {
            loading: 'Creando cliente...',
            success: (data) => `Cliente ${data.name} creado exitosamente`,
            error: (err) => err.message || 'Error al crear el cliente'
        });
    };

    const handleTasksChange = async (taskId, newStatus) => {
        // Optimistic Update
        const originalClients = [...clients];
        const client = clients.find(c => c.id === taskId);

        if (!client) return;

        // Local Update
        setClients(prev => prev.map(c =>
            c.id === taskId ? { ...c, status: newStatus, category: newStatus } : c
        ));

        // API Call
        try {
            // WORKAROUND: Send FULL payload to prevent data loss
            const apiBody = adaptClientForApi(client);

            // Override status fields
            apiBody.status = newStatus;
            apiBody.categoria = newStatus;
            apiBody.internal_code = newStatus;

            await clientAPI.update(taskId, apiBody);

            toast.success(`Estado actualizado a "${newStatus.replace(/_/g, ' ').toUpperCase()}"`);
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Error al mover el cliente");
            // Revert on error
            setClients(originalClients);
        }
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

    // Client-side filtering for is_active
    // Switch OFF (showInactive=false) -> Show only active
    // Switch ON (showInactive=true) -> Show ALL
    const filteredClients = clients.filter(client => {
        if (!showInactive && !client.is_active) return false;
        return true;
    });

    // SKELETONS
    const renderListSkeleton = () => (
        <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Cliente / Empresa</th>
                            <th className="px-6 py-4">Servicio (Matriz)</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Deuda</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i}>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </td>
                                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                <td className="px-6 py-4 text-right"><Skeleton className="h-5 w-16 ml-auto" /></td>
                                <td className="px-6 py-4 flex justify-center"><Skeleton className="h-9 w-9 rounded-full" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            {/* --- FIXED HEADER SECTION --- */}
            <div className="flex-none space-y-6">
                {/* HEADER TITLE & ACTIONS */}
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
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, empresa, CUIT, teléfono..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all outline-none"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filters */}
                        <div className="flex items-center gap-4">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 outline-none"
                            >
                                <option value="all">Todos los Estados</option>
                                {columns.map(col => (
                                    <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                            </select>
                            <div className="h-4 w-px bg-slate-200"></div>

                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                />
                                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ms-3 text-sm font-medium text-slate-600 select-none">Mostrar Inactivos</span>
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- SCROLLABLE CONTENT SECTION --- */}
            <div className="flex-1 min-h-0 relative">
                {isLoading ? (
                    renderListSkeleton()
                ) : (
                    <>
                        {/* VISTA: LISTA */}
                        {viewMode === 'list' && (
                            <div className="h-full flex flex-col">
                                <Card className="flex-1 overflow-hidden border-slate-200 shadow-sm bg-white animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col">
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-sm text-left relative">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
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

                                    {/* PAGINATION CONTROLS (Floating inside Card or Fixed at bottom) */}
                                    {/* Moving inside the card footer to prevent scrolling issues */}
                                    {!isLoading && pagination.total > 0 && (
                                        <div className="flex-none border-t border-slate-200 bg-white p-3">
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <span>Mostrar</span>
                                                    <select
                                                        value={pagination.limit}
                                                        onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                                                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-1.5 outline-none"
                                                    >
                                                        <option value={20}>20</option>
                                                        <option value={40}>40</option>
                                                        <option value={60}>60</option>
                                                        <option value={100}>100</option>
                                                    </select>
                                                    <span className="hidden sm:inline">por página</span>
                                                </div>

                                                <div className="text-sm text-slate-500 hidden sm:block">
                                                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                                        disabled={pagination.page === 1}
                                                        className="text-slate-600"
                                                    >
                                                        Anterior
                                                    </Button>
                                                    <span className="text-sm font-medium text-slate-700 px-2 sm:hidden">
                                                        {pagination.page}/{pagination.totalPages}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                                        disabled={pagination.page >= pagination.totalPages}
                                                        className="text-slate-600"
                                                    >
                                                        Siguiente
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* VISTA: KANBAN (BOARD) */}
                        {viewMode === 'kanban' && (
                            <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    </>
                )}
            </div>

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                columns={columns}
                onCreate={handleAddClient}
                onAddColumn={handleAddColumn}
            />
        </div>
    );
}