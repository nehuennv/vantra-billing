import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Repeat, Zap, FileText, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { mockClients } from "../../../data/mockData";
// ...
import { BudgetManagerModal } from "../components/BudgetManagerModal"; // <--- Importamos Manager

export default function ClientDetailPage() {
    const { id } = useParams();
    const [client, setClient] = useState(mockClients.find(c => c.id === parseInt(id)));
    const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false); // <--- Estado para el nuevo modal
    const [isModalOpen, setIsModalOpen] = useState(false); // (Podríamos borrar el viejo modal si ya no se usa "AddServiceModal" simple)

    // Si no encuentra cliente
    if (!client) return <div className="p-8">Cliente no encontrado</div>;

    // --- LÓGICA DE NEGOCIO ---

    // Guardar cambios del BudgetManager
    const handleSaveBudget = (newActiveServices) => {
        const updatedClient = { ...client };
        updatedClient.activeServices = newActiveServices;

        // Recalcular el total recurrente
        const newRecurringAmount = newActiveServices
            .filter(s => s.type === 'recurring')
            .reduce((sum, s) => sum + s.price, 0);

        updatedClient.recurringAmount = newRecurringAmount;

        setClient(updatedClient);
        setIsBudgetManagerOpen(false);
    };

    // ... (Mantener handleRemoveService si se quiere borrar rápido desde la lista, o delegarlo todo al Manager)
    // Por simplicidad, dejamos que el Manager maneje todo el ABM del presupuesto.

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header y Datos de Contacto (Igual) */}
            <div className="flex items-center gap-4">
                <Link to="/crm">
                    <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
                    <p className="text-slate-500 text-sm">Ficha de Cliente #{client.id}</p>
                </div>
            </div>

            {/* --- SECCIÓN: PRESUPUESTO DEL CLIENTE --- */}
            <Card className="border-primary-100 shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Presupuesto Activo</CardTitle>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsBudgetManagerOpen(true)} // Abrimos el Manager
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20"
                    >
                        <Edit className="h-4 w-4" /> Gestionar Presupuesto
                    </Button>
                </CardHeader>

                <div className="divide-y divide-slate-100">
                    {client.activeServices && client.activeServices.length > 0 ? (
                        client.activeServices.map((service, index) => (
                            <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Repeat className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{service.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {service.type === 'recurring' ? 'Suscripción Mensual' : 'Cobro Único'} • Alta: {service.startDate}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900">${service.price.toLocaleString()}</p>
                                        {service.type === 'recurring' && <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mensual</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            Este cliente no tiene servicios en su presupuesto.
                        </div>
                    )}
                </div>

                {/* Footer con Totales */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Total Recurrente Mensual</span>
                    <span className="text-xl font-bold text-primary font-heading">${client.recurringAmount?.toLocaleString() || 0}</span>
                </div>
            </Card>

            {/* ... (Historial de Facturas) ... */}
            <Card>
                <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base">Historial de Facturación</CardTitle>
                </CardHeader>
                <div className="divide-y divide-slate-100">
                    {client.invoices && client.invoices.map((inv) => (
                        <div key={inv.id} className="p-4 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-700">{inv.description}</span>
                                {inv.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                                {inv.status === 'paid' && <Badge variant="success">Pagado</Badge>}
                            </div>
                            <span className="font-bold text-slate-900">${inv.amount.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* --- MODAL MANAGER --- */}
            <BudgetManagerModal
                isOpen={isBudgetManagerOpen}
                onClose={() => setIsBudgetManagerOpen(false)}
                client={client}
                onSave={handleSaveBudget}
            />
        </div>
    );
}