import React from 'react';
import { Package, Edit, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

export const ComboItemCard = ({ combo, onEdit, onDelete, catalogItems = [] }) => {

    // Calculate effective price: Use override if > 0, else sum items
    const effectivePrice = combo.price > 0
        ? combo.price
        : combo.items?.reduce((sum, it) => {
            const catItem = catalogItems.find(c => c.id === it.catalog_item_id);
            return sum + ((catItem?.price || 0) * (it.quantity || 1));
        }, 0);

    const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(effectivePrice || 0);


    return (
        <div
            className="group relative flex flex-col w-full bg-card border border-border hover:border-primary/50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
        >
            {/* 1. INDICADOR (Borde izquierdo sutil - indigo/primary specific for combos?) */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/50 transition-colors" />

            {/* 2. BODY PRINCIPAL */}
            <div className="p-5 pl-6 flex flex-col gap-3 h-full">

                {/* HEADER */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 w-full">
                        {/* Eyebrow: Type */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider truncate max-w-[150px]">
                                Pack / Combo
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[1.5rem]">
                            {combo.name}
                        </h3>
                    </div>
                </div>

                {/* Description: List Preview */}
                <div className="space-y-1 mb-2 min-h-[3.5rem]">
                    {combo.items?.slice(0, 3).map((it, idx) => {
                        const catalogItem = catalogItems.find(c => c.id === it.catalog_item_id);
                        return (
                            <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-1 h-1 rounded-full bg-primary/60" />
                                <span>{it.quantity}x {catalogItem?.name || 'Ítem desconocido'}</span>
                            </div>
                        );
                    })}
                    {(combo.items?.length || 0) > 3 && <p className="text-xs text-muted-foreground pl-3">...</p>}
                </div>


                {/* DIVIDER */}
                <div className="mt-auto" />

                {/* FOOTER */}
                <div className="flex items-end justify-between pt-2 border-t border-border/50">

                    {/* Price */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Precio Plan</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-foreground tracking-tight">
                                {formattedPrice}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                        <Button
                            onClick={() => onEdit(combo)}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-border bg-transparent text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                            title="Editar"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => onDelete(combo)}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-border bg-transparent text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/5 transition-all active:scale-95"
                            title="Eliminar"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
