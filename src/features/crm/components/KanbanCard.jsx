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
                <CardContent className="p-2.5">
                    {/* Minimalist Card Content */}
                    <div className="flex items-center gap-2 w-full">
                        <GripVertical className={`h-4 w-4 transition-colors shrink-0 ${isOverlay ? 'text-primary' : 'text-slate-200 group-hover:text-slate-400'}`} />
                        <div className="flex flex-col overflow-hidden">
                            <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">
                                {client.name}
                            </h3>
                            {client.cuit && (
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                    <span className="opacity-70">CUIT/CUIL:</span> {client.cuit}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
