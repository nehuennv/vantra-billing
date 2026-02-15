import React from 'react';
import { Package, Settings2, Hash, User } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

export const ServiceInstanceCard = ({ service, clientName, comboList = [], onEdit }) => {
    // --- Lógica de Negocio ---
    const rawPrice = service.unit_price ?? 0;
    const price = Number(rawPrice);

    const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);

    // Resolvemos el Combo
    const originComboId = service.origin_plan_id;
    const originCombo = originComboId ? comboList.find(c => String(c.id) === String(originComboId)) : null;

    return (
        <div
            className="group relative flex flex-col w-full bg-card border border-border hover:border-primary/50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
        >
            {/* 1. INDICADOR DE ACTIVIDAD (Borde izquierdo sutil) */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${service.is_active ? 'bg-primary' : 'bg-muted'}`} />

            {/* 2. BODY PRINCIPAL (Padding controlado) */}
            <div className="p-5 pl-6 flex flex-col gap-3 h-full">

                {/* HEADER: Título y Badge (Layout estable: Flex row con items-start) */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 w-full">
                        {/* Eyebrow: Cliente (Siempre fijo arriba) */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider truncate max-w-[150px]" title={clientName}>
                                {clientName || 'Sin asignar'}
                            </span>
                        </div>

                        {/* Título del Servicio (Grande y legible) */}
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[1.5rem]">
                            {service.name}
                        </h3>
                    </div>

                    {/* BADGE SLOT: Absoluto o Fijo a la derecha para no empujar el texto hacia abajo */}
                    {originCombo && (
                        <div className="shrink-0">
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 text-[10px] px-2 py-0.5 h-6 flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{originCombo.name}</span>
                            </Badge>
                        </div>
                    )}
                </div>

                {/* DIVIDER INVISIBLE (Espaciador flexible) */}
                <div className="mt-auto" />

                {/* FOOTER: Precio y Controles */}
                <div className="flex items-end justify-between pt-2 border-t border-border/50">

                    {/* Bloque Izquierdo: Precio */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                            {service.display_code && (
                                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 rounded-sm">
                                    {service.display_code}
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-foreground tracking-tight">
                                {formattedPrice}
                            </span>
                            {service.quantity > 1 && (
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    x{service.quantity}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bloque Derecho: Botón (Solo icono, ultra limpio) */}
                    <Button
                        onClick={() => onEdit(service)}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-border bg-transparent text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                        title="Ajustar condiciones"
                    >
                        <Settings2 className="h-4.5 w-4.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};