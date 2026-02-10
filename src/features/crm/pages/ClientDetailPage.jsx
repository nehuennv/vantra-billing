import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, User, Mail, Building, FileSpreadsheet, MapPin, CheckCircle, RotateCcw, Download, Plus, X, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { clientAPI, servicesAPI, invoiceAPI, catalogAPI } from "../../../services/apiClient";
import { adaptClient, adaptClientForApi } from "../../../utils/adapters";
import { DEFAULT_COLUMNS } from '../data/constants';
import { Input } from "../../../components/ui/Input";
import { BudgetManagerModal } from "../components/BudgetManagerModal";
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../../billing/components/InvoicePDF';
import { InvoicePreviewModal } from '../../billing/components/InvoicePreviewModal';
import { CreateClientModal } from '../components/CreateClientModal';

import { useToast } from '../../../hooks/useToast';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { CreateServiceModal } from '../../../components/modals/CreateServiceModal';

import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Repeat, Zap, FileX2, Trash, Ban, CheckCircle as CheckCircleIcon, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from 'lucide-react';
import { PageTransition } from "../../../components/common/PageTransition";

const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

export default function ClientDetailPage() {
    const { toast } = useToast();
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [services, setServices] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // New: State for viewing an existing invoice
    const [viewInvoice, setViewInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // New: State for Editing Client
    const [isEditClientOpen, setIsEditClientOpen] = useState(false);

    // Quick Status Update
    const [isAddingStatus, setIsAddingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState("");
    const [statusList, setStatusList] = useState(DEFAULT_COLUMNS);

    // Enhance Initial Status logic to include current if not in default
    useEffect(() => {
        if (client && client.status) {
            const exists = statusList.find(c => c.id === client.status);
            if (!exists) {
                setStatusList(prev => [...prev, { id: client.status, title: client.status.toUpperCase().replace(/_/g, ' ') }]);
            }
        }
    }, [client]);

    const handleQuickStatusChange = async (e) => {
        const newStatus = e.target.value;
        const oldStatus = client.status;
        const wasInactive = !client.is_active;
        const willBeActive = newStatus !== 'inactive';

        // Optimistic Update
        const updatedClientState = {
            ...client,
            status: newStatus,
            is_active: willBeActive
        };
        setClient(updatedClientState);

        try {
            // Case 1: Reactivation (Inactive -> Active Status)
            // Separate requests to ensure both operations succeed without interference.
            if (wasInactive && willBeActive) {
                // First: Reactivate
                await clientAPI.update(id, { is_active: true });
                // Small buffer to ensure backend state consistency if needed
                // await new Promise(r => setTimeout(r, 100)); 
            }

            // Case 2: Status Update (Partial Update Only)
            // WORKAROUND: Send FULL payload to prevent data loss due to destructive PATCH
            const apiBody = adaptClientForApi(updatedClientState);

            // Ensure status fields are correct
            apiBody.status = newStatus;
            apiBody.categoria = newStatus;
            apiBody.internal_code = newStatus;

            await clientAPI.update(id, apiBody);

            toast.success("Estado actualizado correctamente");

        } catch (err) {
            console.error(err);
            toast.error("Error al actualizar el estado");
            // Revert optimistic update
            setClient(prev => ({ ...prev, status: oldStatus, is_active: !wasInactive }));
        }
    };

    const handleCreateNewStatus = async () => {
        if (!newStatusName.trim()) return;
        const newId = newStatusName.trim().toLowerCase().replace(/\s+/g, '_');
        const newTitle = newStatusName.trim().toUpperCase();

        // Add to list
        const newCol = { id: newId, title: newTitle };
        setStatusList(prev => [...prev, newCol]);

        // Update Client
        setClient(prev => ({ ...prev, status: newId }));

        try {
            // WORKAROUND: Send FULL payload
            const updatedClient = { ...client, status: newId };
            const apiBody = adaptClientForApi(updatedClient);

            apiBody.status = newId;
            apiBody.categoria = newId;
            apiBody.internal_code = newId;

            await clientAPI.update(id, apiBody);

            toast.success(`Estado "${newTitle}" creado y asignado`);
            setIsAddingStatus(false);
            setNewStatusName("");
        } catch (err) {
            console.error(err);
            toast.error("Error creando estado");
        }
    };

    // New: State for Deleting/Disabling Client
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        type: null // 'soft' | 'hard'
    });


    // New: State for Deleting Combo
    const [comboToDelete, setComboToDelete] = useState(null);


    // New: State for Editing/Deleting Service
    const [serviceToEdit, setServiceToEdit] = useState(null);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Resolve Client
                const clientResponse = await clientAPI.getOne(id);
                // Handle response.data or direct response
                const clientData = clientResponse.data || clientResponse;
                setClient(adaptClient(clientData));

                if (clientData) {
                    // 2. Load Services (Instances)
                    const svcResponse = await servicesAPI.getByClient(clientData.id);

                    // Parse Services from V2 Response (Grouped + Individual)
                    let rawServices = [];
                    if (Array.isArray(svcResponse)) {
                        rawServices = svcResponse;
                    } else if (svcResponse && typeof svcResponse === 'object') {
                        // Extract from grouped_services (Combos)
                        const fromGroups = (svcResponse.grouped_services || []).flatMap(g =>
                            (g.items || []).map(item => ({
                                ...item,
                                _comboData: {
                                    id: g.combo_id,
                                    name: g.combo_name
                                }
                            }))
                        );
                        // Extract individual_services
                        const individuals = svcResponse.individual_services || [];
                        rawServices = [...fromGroups, ...individuals];
                    }

                    // Adapt Service Instances
                    const adaptedServices = rawServices.map(s => ({
                        id: s.id,
                        catalog_item_id: s.catalog_item_id,
                        name: s.name,
                        price: Number(s.unit_price || s.price), // V2 uses unit_price
                        type: 'recurring', // Default
                        icon: s.icon || 'Wifi',
                        icon: s.icon || 'Wifi',
                        origin_combo_id: s.origin_combo_id, // Keep track of origin
                        _comboData: s._comboData // Pass through combo metadata
                    }));
                    setServices(adaptedServices);

                    // 3. Load Invoices
                    const invResponse = await invoiceAPI.getAll({ client_id: clientData.id });
                    setInvoices(invResponse.data || []);
                }

                // 4. Load Statuses (Columns) - For now mocked or specific API if exists
                // const cols = await mockBackend.getStatuses(); 
                // We'll keep a default list if API doesn't support dynamic columns yet
                setStatuses([{ id: 'active', title: 'ACTIVO' }, { id: 'inactive', title: 'INACTIVO' }]);

            } catch (error) {
                console.error("Error loading client details", error);
                toast.error("Error al cargar los datos del cliente");
            }
        };

        load();
    }, [id]);

    // Handle Budget Changes (Smart Save: Add/Delete)
    const handleSaveBudget = async (newActiveServices) => {
        console.log("handleSaveBudget CALLED", newActiveServices);
        if (!client) return;

        const promise = async () => {
            // 1. Identify Added Items (Items with temp ID like 'temp-...')
            const added = newActiveServices.filter(n => n.id.toString().startsWith('temp-'));
            console.log("Items identified as ADDED:", added);

            // 2. Identify Deleted Items (Items present in old 'services' but missing in 'newActiveServices')
            const deleted = services.filter(o => !newActiveServices.find(n => n.id === o.id));
            console.log("Items identified as DELETED:", deleted);

            // Process Adds - Grouped Logic for Combos
            const addedGroups = {};
            const addedSingles = [];

            added.forEach(item => {
                if (item.origin_combo_id) {
                    if (!addedGroups[item.origin_combo_id]) {
                        addedGroups[item.origin_combo_id] = [];
                    }
                    addedGroups[item.origin_combo_id].push(item);
                } else {
                    addedSingles.push(item);
                }
            });

            // 1. Process Combo Groups (Use /bundle endpoint)
            for (const [comboId, items] of Object.entries(addedGroups)) {
                console.log(`Processing Combo Add: ${comboId} (${items.length} items)`);
                // Use specific endpoint to ensure backend links items to combo
                await servicesAPI.assignComboToClient(client.id, comboId);
            }

            // 2. Process Singles (Use /single endpoint)
            for (const item of addedSingles) {
                console.log("Processing Single Add:", item);
                await servicesAPI.assignToClient(client.id, item.catalog_item_id, {
                    price: item.price,
                    origin_combo_id: null
                });
            }

            // Process Deletes
            for (const item of deleted) {
                console.log("Processing Delete:", item.id);
                await servicesAPI.remove(item.id);
            }

            // Reload to sync - ROBUST PARSING FOR V1/V2
            const svcResponse = await servicesAPI.getByClient(client.id);

            let rawServices = [];
            if (Array.isArray(svcResponse)) {
                rawServices = svcResponse;
            } else if (svcResponse && typeof svcResponse === 'object') {
                // Extract from grouped_services (Combos)
                const fromGroups = (svcResponse.grouped_services || []).flatMap(g =>
                    (g.items || []).map(item => ({
                        ...item,
                        _comboData: {
                            id: g.combo_id,
                            name: g.combo_name
                        }
                    }))
                );
                // Extract individual_services
                const individuals = svcResponse.individual_services || [];
                rawServices = [...fromGroups, ...individuals];
            }

            const adaptedServices = rawServices.map(s => ({
                id: s.id,
                catalog_item_id: s.catalog_item_id,
                name: s.name,
                price: Number(s.unit_price || s.price),
                type: 'recurring',
                icon: s.icon || 'Wifi',
                icon: s.icon || 'Wifi',
                origin_combo_id: s.origin_combo_id,
                _comboData: s._comboData
            }));
            setServices(adaptedServices);
            setIsBudgetManagerOpen(false);
        };

        toast.promise(promise(), {
            loading: 'Actualizando presupuesto...',
            success: 'Presupuesto actualizado correctamente',
            error: 'Error al actualizar el presupuesto'
        });
    };

    const handleOpenPreview = () => {
        setIsPreviewOpen(true);
    };

    const handleViewInvoice = (invoice) => {
        setViewInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDownloadInvoice = async (invoiceData) => {
        const promise = async () => {
            try {
                // 1. Intentar descarga desde el Backend (Blob real)
                const blob = await invoiceAPI.getPdf(invoiceData.id);

                // Crear URL del Blob y descargar
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `factura-${client.company_name?.replace(/\s+/g, '_') || 'cliente'}-${invoiceData.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Fallo descarga backend:", err);
                toast.error(`Error en servidor (500). Generando copia local...`);

                // 2. Fallback: Generación Cliente-side (si falla backend)
                // Primero intentamos buscar el detalle completo de la factura para tener los items
                let fullInvoice = invoiceData;
                try {
                    const detail = await invoiceAPI.getOne(invoiceData.id);
                    if (detail && detail.items && detail.items.length > 0) {
                        // A veces el backend devuelve items con estructura diferente, normalizamos
                        const normalizedItems = detail.items.map(i => ({
                            description: i.description || i.name || 'Servicio',
                            quantity: Number(i.quantity || 1),
                            unit_price: Number(i.unit_price || i.price || 0),
                            total_price: Number(i.total_price || (i.price * (i.quantity || 1)) || 0)
                        }));
                        fullInvoice = { ...invoiceData, items: normalizedItems };
                    } else {
                        console.warn("La factura no tiene items en el detalle, usando datos de lista.");
                    }
                } catch (fetchErr) {
                    console.warn("No se pudo obtener detalle para fallback, usando datos de lista", fetchErr);
                }

                const blob = await pdf(
                    <InvoicePDF
                        client={client}
                        items={fullInvoice.items || []}
                        invoiceNumber={invoiceData.number}
                        issueDate={invoiceData.issueDate}
                        dueDate={invoiceData.dueDate}
                        invoiceType={invoiceData.invoiceType}
                    />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `factura-${client.company_name?.replace(/\s+/g, '_') || 'cliente'}-${invoiceData.number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        };

        toast.promise(promise(), {
            loading: 'Obteniendo factura...',
            success: 'Factura descargada',
            error: 'Error al descargar la factura'
        });
    };

    const handleConfirmInvoice = async (invoiceDataArg) => {
        setIsGenerating(true);
        const promise = async () => {
            // 1. Save to Backend (Mock)
            const invoiceData = {
                number: invoiceDataArg.number,
                issueDate: invoiceDataArg.issueDate,
                dueDate: invoiceDataArg.dueDate,
                items: invoiceDataArg.items,
                amount: invoiceDataArg.total, // Map total to amount for compatibility
                status: 'pending',
                description: `Factura ${invoiceDataArg.number}`, // Add description for UI
                invoiceType: invoiceDataArg.invoiceType // Ensure type is passed
            };

            // 1. Save to Backend
            // We need to adapt data to what API expects.
            // API expects: { client_id, items: [...], ... }
            await invoiceAPI.create(client.id, invoiceData);

            // 2. Refresh Invoices
            const invResponse = await invoiceAPI.getAll({ client_id: client.id });
            setInvoices(invResponse.data || []);

            // Refresh Client Data (optional)
            const clientData = await clientAPI.getOne(id);
            setClient(clientData);

            // 3. Generate PDF
            const blob = await pdf(
                <InvoicePDF
                    client={client}
                    items={invoiceData.items}
                    invoiceNumber={invoiceData.number}
                    issueDate={invoiceData.issueDate}
                    dueDate={invoiceData.dueDate}
                    invoiceType={invoiceData.invoiceType} // Pass type
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `factura-${client.company_name?.replace(/\s+/g, '_') || 'cliente'}-${invoiceData.number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        toast.promise(promise(), {
            loading: 'Generando factura...',
            success: 'Factura generada exitosamente',
            error: 'Error al generar la factura',
            finally: () => setIsGenerating(false)
        });
    };

    const handleToggleStatus = async (e, invoice) => {
        e.stopPropagation(); // Prevent row click
        const newStatus = invoice.status === 'pending' ? 'paid' : 'pending';

        // Optimistic Update
        const oldInvoices = [...invoices];
        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: newStatus } : inv));

        const promise = invoiceAPI.updateStatus(invoice.id, newStatus);

        toast.promise(promise, {
            loading: 'Actualizando estado...',
            success: 'Estado actualizado',
            error: (err) => {
                // Revert on error
                setInvoices(oldInvoices);
                return 'Error al actualizar el estado';
            }
        });
    };

    const handleUpdateClient = async (updatedData) => {
        const promise = async () => {
            // UpdatedData comes from Modal with ID inside
            const apiBody = adaptClientForApi(updatedData);
            const response = await clientAPI.update(client.id, apiBody);
            const saved = response.data || response;
            setClient(adaptClient(saved));
        };

        toast.promise(promise(), {
            loading: 'Guardando cambios...',
            success: 'Cliente actualizado correctamente',
            error: 'Error al actualizar el cliente'
        });
    };

    // Monitor client state (Clean JSON for User)
    useEffect(() => {
        if (client) {
            console.log(client);
        }
    }, [client]);

    const handleStatusChange = async () => {
        const isReactivating = deleteModal.type === 'reactivate';

        const promise = async () => {
            if (isReactivating) {
                await clientAPI.reactivate(client.id);
                // Update local state: Just flip is_active check
                setClient(prev => ({ ...prev, is_active: true }));
            } else {
                await clientAPI.softDelete(client.id);
                // Update local state: Just flip is_active check
                setClient(prev => ({ ...prev, is_active: false }));
            }
        };

        toast.promise(promise(), {
            loading: isReactivating ? 'Reactivando cliente...' : 'Deshabilitando cliente...',
            success: isReactivating ? 'Cliente reactivado exitosamente' : 'Cliente marcado como inactivo',
            error: (err) => {
                console.error("Status Change Error:", err);
                return `Error: ${err.message || 'Error desconocido'}`;
            }
        });

        setDeleteModal({ isOpen: false, type: null });
    };

    const handleDeleteCombo = async () => {
        if (!comboToDelete) return;

        const promise = async () => {
            // Find all services in this combo
            const itemsToDelete = services.filter(s => s.origin_combo_id === comboToDelete.id);

            // Delete sequentially
            for (const item of itemsToDelete) {
                await servicesAPI.remove(item.id);
            }

            // Update local state (remove all items with this origin_combo_id)
            setServices(prev => prev.filter(s => s.origin_combo_id !== comboToDelete.id));
        };

        toast.promise(promise(), {
            loading: 'Eliminando combo...',
            success: 'Combo y servicios eliminados',
            error: 'Error al eliminar combo'
        });
        setComboToDelete(null);
    };

    if (!client) return (
        <PageTransition className="space-y-6 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </PageTransition>
    );

    // Derived State
    const recurringAmount = services
        .filter(s => s.type === 'recurring')
        .reduce((sum, s) => sum + s.price, 0);

    return (
        <PageTransition className="space-y-6 pb-20">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-start gap-4">
                    <Link to="/crm">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm mt-1">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            {client.businessName || client.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {/* Status Selector */}
                            <div className="flex items-center gap-2">
                                {!isAddingStatus ? (
                                    <>
                                        <div className="relative">
                                            <select
                                                value={client.status}
                                                onChange={handleQuickStatusChange}
                                                className={`appearance-none pl-3 pr-8 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer transition-colors
                                                ${client.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {statusList.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                                <svg className="h-3 w-3 fill-current opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10"
                                            title="Crear nuevo estado"
                                            onClick={() => setIsAddingStatus(true)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <Input
                                            value={newStatusName}
                                            onChange={(e) => setNewStatusName(e.target.value)}
                                            placeholder="Nuevo estado..."
                                            className="h-7 w-32 text-xs px-2"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateNewStatus()}
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                                            onClick={handleCreateNewStatus}
                                            disabled={!newStatusName.trim()}
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                            onClick={() => { setIsAddingStatus(false); setNewStatusName(""); }}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="h-4 w-px bg-slate-300 mx-1"></div>

                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono text-xs border border-slate-200">
                                ID: {client.id.toString().substring(0, 8)}
                            </span>

                            {client.tax_condition && (
                                <span className="capitalize text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {client.tax_condition.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditClientOpen(true)}
                            className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Cliente
                        </Button>

                        {/* Status Toggle Button */}
                        {client.is_active ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteModal({ isOpen: true, type: 'soft' })}
                                className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 shadow-sm"
                                title="Deshabilitar Cliente"
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Deshabilitar</span>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteModal({ isOpen: true, type: 'reactivate' })}
                                className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 shadow-sm"
                                title="Reactivar Cliente"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>Reactivar</span>
                            </Button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                    <Button
                        onClick={handleOpenPreview}
                        disabled={isGenerating || services.length === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all px-6 hover:shadow-lg hover:-translate-y-0.5"
                    >
                        {isGenerating ? 'Procesando...' : (
                            <>
                                <FileText className="h-4 w-4 mr-2" />
                                Nueva Factura
                            </>
                        )}
                    </Button>
                </div>
            </div>


            {/* --- LAYOUT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* --- LEFT COLUMN: CLIENT DATA (1 Col) --- */}
                <div className="space-y-6 sticky top-8">
                    <Card className="shadow-none border border-slate-200/60 bg-white/50 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Datos Generales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {/* Razón Social & CUIT */}
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <Building className="h-3 w-3" /> Empresa / Razón Social
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">{client.businessName || client.name}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-1">
                                        CUIT: {client.cuit || 'No definido'}
                                        {client.category && <span className="ml-2 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm">{client.category}</span>}
                                    </p>
                                </div>

                                {/* Contacto */}
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <User className="h-3 w-3" /> Persona de Contacto
                                    </p>
                                    <p className="text-sm font-medium text-slate-900">{client.contactName || 'Sin contacto directo'}</p>
                                    {client.dni && <p className="text-xs text-slate-500">DNI: {client.dni}</p>}
                                    {client.altContact && <p className="text-xs text-slate-500 mt-0.5">Alternativo: {client.altContact}</p>}
                                </div>

                                {/* Comunicación (Email & WhatsApp) */}
                                <div className="p-4 hover:bg-slate-50/30 transition-colors bg-white">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Comunicación
                                    </p>
                                    <div className="space-y-2">
                                        {client.email && (
                                            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline group">
                                                <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                                                {client.email}
                                            </a>
                                        )}
                                        {client.whatsapp && (
                                            <a href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 hover:underline group">
                                                <div className="bg-emerald-100 p-0.5 rounded-full">
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-emerald-600">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                </div>
                                                {client.whatsapp}
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Ubicación */}
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Ubicación
                                    </p>
                                    <p className="text-sm text-slate-700 text-pretty">
                                        {client.address || 'Sin dirección'}
                                    </p>
                                    {(client.city || client.province || client.zipCode) && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            {[client.city, client.province, client.zipCode].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                </div>

                                {/* Observaciones Internas (Privado) */}
                                {/* Observaciones Internas (Privado) - MOVIDO A NUEVA TARJETA */}
                            </div>
                        </CardContent>
                    </Card >

                    {/* Notas y Observaciones */}
                    {
                        (client.internalObs || client.obs) && (
                            <Card className="shadow-none border border-slate-200/60 bg-white/50 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Notas y Observaciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {client.internalObs && (
                                        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm mb-3">
                                            <div className="font-bold text-xs uppercase mb-1 flex items-center gap-2">
                                                <FileText className="h-3 w-3" /> Nota Interna (Privada)
                                            </div>
                                            <div
                                                className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-amber-900"
                                                dangerouslySetInnerHTML={{ __html: client.internalObs }}
                                            />
                                        </div>
                                    )}
                                    {client.obs && (
                                        <div className="text-sm text-slate-600">
                                            <p className="font-semibold text-xs text-slate-400 uppercase mb-1">Nota Pública</p>
                                            <p>{client.obs}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    }
                </div>

                {/* --- RIGHT COLUMN: OPERATIONS (2 Cols) --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* SECCIÓN 1: PRESUPUESTO */}
                    <Card className="shadow-none border border-slate-200/60 bg-white/50 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                Presupuesto / Servicios Activos
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsBudgetManagerOpen(true)}
                                className="h-8 text-xs border-slate-200 hover:border-primary hover:text-primary"
                            >
                                <Edit className="h-3 w-3 mr-1.5" /> Gestionar
                            </Button>
                        </CardHeader>

                        <div className="bg-white p-4 space-y-4">
                            {services.length > 0 ? (
                                (() => {
                                    // Group Items Logic
                                    const groups = {};
                                    const singles = [];

                                    services.forEach(s => {
                                        if (s.origin_combo_id && s.origin_combo_id !== 'null') {
                                            if (!groups[s.origin_combo_id]) {
                                                groups[s.origin_combo_id] = {
                                                    id: s.origin_combo_id,
                                                    name: s._comboData?.name || 'Pack',
                                                    items: []
                                                };
                                            }
                                            groups[s.origin_combo_id].items.push(s);
                                        } else {
                                            singles.push(s);
                                        }
                                    });

                                    // Render Logic
                                    return (
                                        <>
                                            {/* 1. Combos */}
                                            {Object.values(groups).map((group) => {
                                                const groupTotal = group.items.reduce((sum, i) => sum + i.price, 0);
                                                return (
                                                    <div key={group.id} className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden mb-4 transition-all hover:border-slate-300 hover:shadow-sm group/card">
                                                        {/* Header */}
                                                        <div className="px-4 py-3 bg-slate-100/50 flex justify-between items-center border-b border-slate-200">
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="h-4 w-4 text-primary" />
                                                                <span className="font-bold text-slate-800 text-sm">{group.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-slate-700 text-sm">
                                                                    ${groupTotal.toLocaleString()}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-opacity opacity-0 group-hover/card:opacity-100"
                                                                    onClick={() => setComboToDelete({ id: group.id, name: group.name })}
                                                                    title="Eliminar Combo completo"
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Items */}
                                                        <div className="divide-y divide-slate-200/50">
                                                            {group.items.map((service, idx) => {
                                                                const IconComponent = ICON_MAP[service.icon] || Repeat;
                                                                return (
                                                                    <div key={service.id || idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <IconComponent className="h-4 w-4 text-slate-400" />
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-medium text-slate-700">{service.name}</span>
                                                                                <span className="text-[10px] text-primary/70 uppercase tracking-wider font-bold">Incluido en Pack</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm font-medium text-slate-600">${service.price.toLocaleString()}</span>
                                                                            {/* Single Delete inside Combo? Maybe risky if it breaks ratio. Let's allow it but it stays in group for now until refresh */}
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                                                                                onClick={() => setServiceToDelete(service)}
                                                                            >
                                                                                <Trash className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* 2. Singles */}
                                            {singles.length > 0 && (
                                                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                                                    {singles.map((service, index) => {
                                                        const IconComponent = ICON_MAP[service.icon] || Repeat;
                                                        return (
                                                            <div key={service.id || index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group bg-white">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                                                                        <IconComponent className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900 text-sm">{service.name}</p>
                                                                        <p className="text-xs text-slate-500">
                                                                            {service.type === 'recurring' ? 'Recurrente Mensual' : 'Pago Único'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right flex items-center gap-4">
                                                                    <p className="font-bold text-slate-900">${service.price.toLocaleString()}</p>
                                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                                                                            onClick={() => {
                                                                                setServiceToEdit({
                                                                                    ...service,
                                                                                    type: 'recurring'
                                                                                });
                                                                                setIsServiceModalOpen(true);
                                                                            }}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                            onClick={() => setServiceToDelete(service)}
                                                                        >
                                                                            <Trash className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No hay servicios activos.
                                    <button onClick={() => setIsBudgetManagerOpen(true)} className="text-primary hover:underline ml-1">
                                        Agregar uno
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Total */}
                        {
                            services.length > 0 && (
                                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600 uppercase">Total Mensual</span>
                                    <span className="text-xl font-bold text-primary tracking-tight">
                                        ${recurringAmount.toLocaleString()}
                                    </span>
                                </div>
                            )
                        }
                    </Card >

                    {/* SECCIÓN 2: HISTORIAL DE FACTURAS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1 mb-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Facturación</h2>
                        </div>

                        <Card className="shadow-none border border-slate-200/60 bg-white/50 overflow-hidden">
                            {invoices.length > 0 ? (
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide">Fecha</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide">Comprobante</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide">Descripción</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide text-center">Estado</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide text-right">Monto</th>
                                                <th className="px-6 py-3 text-xs uppercase tracking-wide text-center">Acción</th>
                                                <th className="px-6 py-3 w-[50px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoices.map((inv) => (
                                                <tr
                                                    key={inv.id}
                                                    onClick={() => handleViewInvoice(inv)}
                                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                                >
                                                    <td className="px-6 py-3 text-slate-600">
                                                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('es-AR') : new Date(inv.created_at).toLocaleDateString('es-AR')}
                                                    </td>
                                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">
                                                        {inv.number || 'Pendiente'}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-slate-700 truncate max-w-[200px]">
                                                        {inv.description || 'Factura de Servicios'}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <Badge variant={inv.status === 'paid' ? 'success' : 'warning'} className="text-[10px]">
                                                            {inv.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                                                        ${(inv.amount || inv.total || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        {inv.status === 'pending' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleToggleStatus(e, inv)}
                                                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold"
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                                Registrar Pago
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleToggleStatus(e, inv)}
                                                                className="h-7 px-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 text-xs"
                                                            >
                                                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                                                Deshacer
                                                            </Button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-300 hover:text-primary hover:bg-primary/5"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadInvoice(inv);
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={FileX2}
                                    title="Sin comprobantes emitidos"
                                    description="Este cliente aún no tiene facturas generadas en el sistema. Puedes generar una nueva arriba."
                                    className="py-12 border-none"
                                />
                            )}
                        </Card>
                    </div >

                </div >
            </div >

            {/* --- MODALS (SIN CAMBIOS EN LÓGICA) --- */}
            {
                client && isBudgetManagerOpen && (
                    <BudgetManagerModal
                        isOpen={isBudgetManagerOpen}
                        onClose={() => setIsBudgetManagerOpen(false)}
                        client={{ ...client, activeServices: services }}
                        onSave={handleSaveBudget}
                    />
                )
            }

            {
                client && (
                    <InvoicePreviewModal
                        open={isPreviewOpen}
                        onOpenChange={setIsPreviewOpen}
                        client={client}
                        items={services}
                        onConfirm={handleConfirmInvoice}
                    />
                )
            }

            {
                client && viewInvoice && (
                    <InvoicePreviewModal
                        open={isViewModalOpen}
                        onOpenChange={setIsViewModalOpen}
                        client={client}
                        items={[]}
                        initialData={viewInvoice}
                        readOnly={true}
                        onConfirm={handleDownloadInvoice}
                    />
                )
            }

            {
                client && (
                    <CreateClientModal
                        isOpen={isEditClientOpen}
                        onClose={() => setIsEditClientOpen(false)}
                        columns={statuses.length > 0 ? statuses : [{ id: client.status, title: client.status.toUpperCase() }]}
                        onUpdate={handleUpdateClient}
                        clientToEdit={client}
                        onAddColumn={() => { }}
                    />
                )
            }

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleStatusChange}
                title={deleteModal.type === 'reactivate' ? "Reactivar cliente" : "Deshabilitar cliente"}
                description={deleteModal.type === 'reactivate'
                    ? "El cliente volverá a estar activo y visible en los listados principales."
                    : "El cliente pasará a estado inactivo y se ocultará de la lista principal."}
                confirmText={deleteModal.type === 'reactivate' ? "Reactivar" : "Deshabilitar"}
                variant={deleteModal.type === 'reactivate' ? "default" : "warning"}
            />
            <DeleteConfirmationModal
                isOpen={!!serviceToDelete}
                onClose={() => setServiceToDelete(null)}
                onConfirm={async () => {
                    if (!serviceToDelete) return;

                    const promise = async () => {
                        await mockBackend.deleteClientService(serviceToDelete.id);
                        setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
                    };

                    toast.promise(promise(), {
                        loading: 'Eliminando servicio...',
                        success: 'Servicio eliminado',
                        error: 'Error al eliminar servicio'
                    });
                    setServiceToDelete(null);
                }}
                title="Eliminar Servicio"
                description={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="destructive"
            />

            <DeleteConfirmationModal
                isOpen={!!comboToDelete}
                onClose={() => setComboToDelete(null)}
                onConfirm={handleDeleteCombo}
                title="Eliminar Combo"
                description={`¿Estás seguro de que deseas eliminar el combo "${comboToDelete?.name}" y todos sus servicios incluidos?`}
                confirmText="Eliminar Todo"
                variant="destructive"
            />

            <CreateServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => {
                    setIsServiceModalOpen(false);
                    setServiceToEdit(null);
                }}
                initialData={serviceToEdit}
                onConfirm={async (data) => {
                    // Update Service Logic
                    const promise = async () => {
                        if (serviceToEdit) {
                            // Update
                            await mockBackend.updateClientService(serviceToEdit.id, data);
                            setServices(prev => prev.map(s => s.id === serviceToEdit.id ? { ...s, ...data } : s));
                        } else {
                            // Create (Only relevant if we used this modal for creation too, but BudgetManager handles that mainly. 
                            // We could allow adding here too if needed, but let's stick to update for now found in buttons)
                        }
                    };

                    toast.promise(promise(), {
                        loading: 'Actualizando servicio...',
                        success: 'Servicio actualizado',
                        error: 'Error al actualizar servicio'
                    });
                    setIsServiceModalOpen(false);
                    setServiceToEdit(null);
                }}
            />
        </PageTransition >
    );
}