import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { KanbanCard } from "./KanbanCard";

export function KanbanColumn({ column, tasks, onDelete, onEdit }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div className="flex flex-col h-full w-[300px] shrink-0 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-3 self-start max-h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-2 py-2 rounded-lg bg-white shadow-sm border border-slate-100 group">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide text-slate-700">{column.title}</span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tasks.length}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button onClick={() => onEdit(column)} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary">
                        <Edit2 className="h-3 w-3" />
                    </Button>
                    {/* Prevent deleting default columns if needed, or just allow all */}
                    <Button onClick={() => onDelete(column.id)} variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-600">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1 min-h-[100px]">
                {tasks.map(client => (
                    <KanbanCard key={client.id} client={client} />
                ))}
            </div>

            {/* Footer Action */}
            <div className="mt-3 pt-2 border-t border-slate-200/50">
                <Button variant="ghost" className="w-full justify-start text-xs text-slate-500 hover:text-primary hover:bg-slate-100">
                    <Plus className="h-3 w-3 mr-2" /> Agregar Tarea
                </Button>
            </div>
        </div>
    );
}
