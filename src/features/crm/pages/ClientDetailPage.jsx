import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, User, Mail, Building, FileSpreadsheet, MapPin, CheckCircle, RotateCcw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { mockBackend } from "../../../services/mockBackend";
import { BudgetManagerModal } from "../components/BudgetManagerModal";
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../../billing/components/InvoicePDF';
import { InvoicePreviewModal } from '../../billing/components/InvoicePreviewModal';
import { CreateClientModal } from '../components/CreateClientModal';
import { toast } from 'sonner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Repeat, Zap, FileX2 } from 'lucide-react';

export default function ClientDetailPage() {
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

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Resolve Client
                const allClients = await mockBackend.getClients();
                const found = allClients.find(c => c.id.toString() === id.toString());
                setClient(found);

                if (found) {
                    const svc = await mockBackend.getClientServices(found.id);
                    setServices(svc);

                    // Load Invoices
                    const invs = await mockBackend.getClientInvoices(found.id);
                    setInvoices(invs);
                }

                // 3. Load Statuses
                const cols = await mockBackend.getStatuses();
                setStatuses(cols);
            } catch (error) {
                console.error("Error loading client details", error);
                toast.error("Error al cargar los datos del cliente");
            }
        };

        // Simulating a bit of delay to show skeleton (optional, can be removed)
        setTimeout(load, 500);
    }, [id]);

    // Handle Budget Changes (Smart Save: Add/Delete)
    const handleSaveBudget = async (newActiveServices) => {
        if (!client) return;

        const promise = async () => {
            // 1. Identify Added Items (Those that don't exist in current services or have temp ID)
            const added = newActiveServices.filter(n => !services.find(o => o.id === n.id));

            // 2. Identify Deleted Items
            const deleted = services.filter(o => !newActiveServices.find(n => n.id === o.id));

            // Process Adds
            for (const item of added) {
                const { id: tempId, ...rest } = item;
                await mockBackend.addClientService({ ...rest, client_id: client.id });
            }

            // Process Deletes
            for (const item of deleted) {
                await mockBackend.deleteClientService(item.id);
            }

            // Reload to sync
            const updatedServices = await mockBackend.getClientServices(client.id);
            setServices(updatedServices);
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

    const handleDownloadExisting = async (invoiceData) => {
        const promise = async () => {
            const blob = await pdf(
                <InvoicePDF
                    client={client}
                    items={invoiceData.items}
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
        };

        toast.promise(promise(), {
            loading: 'Preparando descarga...',
            success: 'Descarga iniciada',
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

            await mockBackend.createInvoice(client.id, invoiceData);

            // 2. Refresh Invoices
            const updatedInvoices = await mockBackend.getClientInvoices(client.id);
            setInvoices(updatedInvoices);

            // Refresh Client Data (optional)
            const allClients = await mockBackend.getClients();
            const found = allClients.find(c => c.id.toString() === id.toString());
            setClient(found);

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

        const promise = mockBackend.updateInvoiceStatus(invoice.id, newStatus);

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
            const saved = await mockBackend.updateClient(client.id, updatedData);
            setClient(saved);
        };

        toast.promise(promise(), {
            loading: 'Guardando cambios...',
            success: 'Cliente actualizado correctamente',
            error: 'Error al actualizar el cliente'
        });
    };

    if (!client) return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
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
        </div>
    );

    // Derived State
    const recurringAmount = services
        .filter(s => s.type === 'recurring')
        .reduce((sum, s) => sum + s.price, 0);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <Link to="/crm">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                {client.company_name || client.name}
                            </h1>
                            <Badge variant={client.status === 'active' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">
                                {client.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className="bg-slate-100 px-1.5 rounded font-mono text-xs">ID: {client.id.toString().substring(0, 8)}</span>
                            <span>•</span>
                            <span className="capitalize">{client.tax_condition?.replace(/_/g, ' ') || 'Consumidor Final'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsEditClientOpen(true)}
                        className="text-slate-500 hover:text-primary hover:bg-primary/5"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Cliente
                    </Button>
                    <Button
                        onClick={handleOpenPreview}
                        disabled={isGenerating || services.length === 0}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all px-6"
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
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden h-full">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Datos Generales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <Building className="h-3 w-3" /> Razón Social
                                    </p>
                                    <p className="text-sm font-medium text-slate-900">{client.businessName || client.company_name || client.name}</p>
                                </div>
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <FileSpreadsheet className="h-3 w-3" /> CUIT / ID
                                    </p>
                                    <p className="text-sm font-mono text-slate-700">{client.cuit || client.tax_id || 'No definido'}</p>
                                </div>
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email Facturación
                                    </p>
                                    <p className="text-sm text-primary hover:underline cursor-pointer truncate">
                                        {client.email || client.email_billing || 'Sin email'}
                                    </p>
                                </div>
                                <div className="p-4 hover:bg-slate-50/30 transition-colors">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Dirección
                                    </p>
                                    <p className="text-sm text-slate-700 text-pretty">
                                        {client.address || 'Sin dirección'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: OPERATIONS (2 Cols) --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* SECCIÓN 1: PRESUPUESTO */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
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

                        <div className="divide-y divide-slate-100 bg-white">
                            {services.length > 0 ? (
                                services.map((service, index) => (
                                    <div key={service.id || index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                                                <Repeat className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{service.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {service.type === 'recurring' ? 'Recurrente Mensual' : 'Pago Único'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">${service.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
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
                        {services.length > 0 && (
                            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-600 uppercase">Total Mensual</span>
                                <span className="text-xl font-bold text-primary tracking-tight">
                                    ${recurringAmount.toLocaleString()}
                                </span>
                            </div>
                        )}
                    </Card>

                    {/* SECCIÓN 2: HISTORIAL DE FACTURAS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <FileText className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-bold text-slate-900">Historial de Facturación</h2>
                        </div>

                        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
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
                                                        <Download className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
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
                    </div>

                </div>
            </div>

            {/* --- MODALS (SIN CAMBIOS EN LÓGICA) --- */}
            {client && (
                <BudgetManagerModal
                    isOpen={isBudgetManagerOpen}
                    onClose={() => setIsBudgetManagerOpen(false)}
                    client={{ ...client, activeServices: services }}
                    onSave={handleSaveBudget}
                />
            )}

            {client && (
                <InvoicePreviewModal
                    open={isPreviewOpen}
                    onOpenChange={setIsPreviewOpen}
                    client={client}
                    items={services}
                    onConfirm={handleConfirmInvoice}
                />
            )}

            {client && viewInvoice && (
                <InvoicePreviewModal
                    open={isViewModalOpen}
                    onOpenChange={setIsViewModalOpen}
                    client={client}
                    items={[]}
                    initialData={viewInvoice}
                    readOnly={true}
                    onConfirm={handleDownloadExisting}
                />
            )}

            {client && (
                <CreateClientModal
                    isOpen={isEditClientOpen}
                    onClose={() => setIsEditClientOpen(false)}
                    columns={statuses.length > 0 ? statuses : [{ id: client.status, title: client.status.toUpperCase() }]}
                    onAddClient={handleUpdateClient}
                    initialData={client}
                    isEditing={true}
                    onAddColumn={() => { }}
                />
            )}
        </div >
    );
}