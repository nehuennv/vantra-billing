import React from 'react';
import { Package, Edit, Trash2, Zap, Wifi, Globe, Monitor, Smartphone, Server, Database, Cloud, Shield } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";

// Icon Map (keep it here or move to a shared utility if reused often)
const ICON_MAP = {
    'Wifi': Wifi, 'Zap': Zap, 'Globe': Globe, 'Monitor': Monitor,
    'Smartphone': Smartphone, 'Server': Server, 'Database': Database,
    'Cloud': Cloud, 'Shield': Shield,
};

export const CatalogItemCard = ({ item, onEdit, onDelete }) => {
    const IconComponent = ICON_MAP[item.icon] || Zap;

    // Format Price
    const formattedPrice = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(item.price || 0);

    return (
        <div
            className="group relative flex flex-col w-full bg-card border border-border hover:border-primary/50 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
        >
            {/* 1. INDICADOR (Borde izquierdo sutil - optional for catalog, maybe just transparent or grey) */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary/50 transition-colors" />

            {/* 2. BODY PRINCIPAL */}
            <div className="p-5 pl-6 flex flex-col gap-3 h-full">

                {/* HEADER */}
                <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 w-full">
                        {/* Eyebrow: SKU or Type */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <IconComponent className="h-3 w-3" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider truncate max-w-[150px]">
                                {item.sku || 'Sin SKU'}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[1.5rem]">
                            {item.name}
                        </h3>
                    </div>

                    {/* BADGE: If needed, maybe for status? For now empty or SKU badge if preferred */}
                    {/* keeping it clean as per request */}
                </div>

                {/* Description - specific to Catalog */}
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {item.description || 'Sin descripción disponible.'}
                </p>

                {/* DIVIDER */}
                <div className="mt-auto" />

                {/* FOOTER */}
                <div className="flex items-end justify-between pt-2 border-t border-border/50">

                    {/* Price */}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Precio Lista</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-foreground tracking-tight">
                                {formattedPrice}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                        <Button
                            onClick={() => onEdit(item)}
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-border bg-transparent text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                            title="Editar"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            onClick={() => onDelete(item)}
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
