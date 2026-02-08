import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { KanbanCard } from "./KanbanCard";

export function KanbanColumn({ column, tasks, onDelete, onEdit }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div className="flex flex-col h-full w-[320px] shrink-0">
            {/* Column Header - Diseño "Vantra" limpio */}
            <div className="flex items-center justify-between mb-3 px-1 group">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        {column.title}
                        <span className="ml-2 text-slate-400 text-xs font-medium">{tasks.length}</span>
                    </span>
                </div>

                {/* Actions (Solo visibles en hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <Button onClick={() => onEdit(column)} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-white hover:shadow-sm">
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button onClick={() => onDelete(column.id)} variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Droppable Area (The Track) */}
            {/* Fondo sutilmente diferente para delimitar la zona, pero sin bordes duros */}
            <div
                ref={setNodeRef}
                className="flex-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 p-2 overflow-y-auto scrollbar-hide space-y-3 min-h-[150px] transition-colors hover:bg-slate-50/80 hover:border-slate-300/50"
            >
                {tasks.map(client => (
                    <KanbanCard key={client.id} client={client} />
                ))}

                {/* Botón rápido para agregar tarea en esta columna */}
                <Button variant="ghost" className="w-full justify-center text-xs text-slate-400 hover:text-primary hover:bg-white py-3 border border-transparent hover:border-slate-100 dashed">
                    <Plus className="h-3 w-3 mr-1.5" /> Añadir tarea
                </Button>
            </div>
        </div>
    );
}