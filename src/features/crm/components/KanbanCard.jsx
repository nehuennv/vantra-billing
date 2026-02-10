import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function KanbanCard({ client, isOverlay }) {
    const navigate = useNavigate();
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: client.id,
        data: { ...client }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1, // El original se desvanece
        touchAction: 'none',
    };

    // Si es el overlay, ignoramos el estilo de transformación de dnd-kit (lo maneja el overlay)
    // y forzamos opacidad 1
    const finalStyle = isOverlay ? {} : style;

    const handleClick = () => {
        if (!isDragging) {
            navigate(`/crm/clients/${client.id}`);
        }
    }

    return (
        <div ref={setNodeRef} style={finalStyle} {...attributes} {...listeners} className="touch-none outline-none">
            <Card
                onClick={handleClick}
                className={`
                    group relative transition-all duration-200 border-none shadow-none ring-1 ring-slate-200 bg-white
                    ${isOverlay ? 'shadow-2xl ring-2 ring-primary/20 cursor-grabbing' : 'hover:bg-slate-50/80 hover:ring-slate-300 transition-all duration-200 cursor-pointer'}
                `}
            >
                <CardContent className="p-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 w-full">
                            <GripVertical className={`h-4 w-4 transition-colors shrink-0 ${isOverlay ? 'text-primary' : 'text-slate-200 group-hover:text-slate-400'}`} />
                            <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
                                {client.name}
                            </h3>
                        </div>
                    </div>

                    {/* Subtext */}
                    {client.businessName && (
                        <p className="text-[11px] font-medium text-slate-400 mb-3 pl-6 uppercase tracking-wider line-clamp-1">
                            {client.businessName}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                        <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 text-[10px] px-1.5 h-5 font-medium">
                            {client.servicePlan || 'General'}
                        </Badge>

                        {client.debt > 0 && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] px-1.5 py-0 h-5">
                                ${client.debt.toLocaleString()}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
