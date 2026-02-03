// src/features/billing/pages/BillingPage.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { CheckCircle2, AlertCircle, Play, FileText, Download } from "lucide-react";
import { mockClients } from "../../../data/mockData"; // Usamos la misma "base de datos"

export default function BillingPage() {
    // 1. FILTRO: Solo nos importan los clientes ACTIVOS que pagan abono mensual
    const recurringClients = mockClients.filter(
        c => c.status === 'active' && c.recurringAmount > 0
    );

    // 2. CÁLCULO: Sumamos toda la plata que debería entrar este mes
    const totalForecast = recurringClients.reduce((acc, curr) => acc + curr.recurringAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Facturación Recurrente</h1>
                    <p className="text-slate-500 mt-1">Gestión del período mensual (del 1 al 5).</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Botón para que Gastón sienta que tiene el control */}
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Exportar Excel
                    </Button>
                    <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground w-[220px] justify-center">
                        <Play className="h-4 w-4" /> Generar Período Actual
                    </Button>
                </div>
            </div>

            {/* TARJETAS RESUMEN (KPIs) */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Total a Facturar (Estimado)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary-foreground/80 dark:text-primary">
                            {/* Nota: si el fondo es claro, text-primary va bien. Si es bg-primary/5 (muy claro), text-primary-900 o similar mejor. Usaremos text-slate-900 o text-primary para contraste */}
                            <span className="text-slate-900">${totalForecast.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-primary/80 mt-1">Base recurrente mensual</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Clientes a Procesar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{recurringClients.length}</div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>100% listos para facturar</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Alertas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">0</div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Sin errores en matrices</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* LA LISTA "DEL 1 AL 5" */}
            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-semibold text-slate-700">Cola de Facturación</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold">Concepto (Matriz)</th>
                                <th className="px-6 py-4 font-semibold text-right">Monto</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recurringClients.map((client) => (
                                <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {client.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {client.servicePlan}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                        ${client.recurringAmount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                            Pendiente
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}