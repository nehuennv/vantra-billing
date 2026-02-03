import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function KanbanCard({ client }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: client.id,
        data: { ...client } // Pass client data for optimized rendering if needed
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Prevent scrolling on mobile while dragging
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none select-none">
            <Card className={`group relative hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing border-none shadow-sm ring-1 ring-slate-200 bg-white ${isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary z-50' : 'hover:-translate-y-1'}`}>
                <CardContent className="p-3.5">
                    {/* Header: Name and Drag Handle */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 w-full">
                            <GripVertical className="h-4 w-4 text-slate-200 group-hover:text-slate-400 transition-colors shrink-0" />
                            <h3 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {client.name}
                            </h3>
                        </div>
                    </div>

                    {/* Subtext: Business Name */}
                    {client.businessName && (
                        <p className="text-[11px] font-medium text-slate-400 mb-3 pl-6 uppercase tracking-wider line-clamp-1">
                            {client.businessName}
                        </p>
                    )}

                    {/* Footer: Tags */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                        <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-100 text-[10px] px-1.5 h-5 font-medium">
                            {client.servicePlan || 'S/D'}
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
