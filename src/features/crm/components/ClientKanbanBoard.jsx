import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Button } from "../../../components/ui/Button";
import { Plus } from "lucide-react";
import { createPortal } from 'react-dom';

export function ClientKanbanBoard({ columns, tasks, onTasksChange, onAddColumn, onDeleteColumn, onEditColumn }) {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        })
    );

    // --- Actions ---
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Note: 'over.id' is the Column ID because we made the Column droppable
        const droppedColumnId = overId;

        // If dropped in same column, do nothing (sorting not implemented in this simplified version yet)
        const currentTask = tasks.find(t => t.id === activeId);
        if (currentTask && currentTask.status === droppedColumnId) return;

        // Update Parent State
        const newTasks = tasks.map(t => {
            if (t.id === activeId) {
                return { ...t, status: droppedColumnId };
            }
            return t;
        });

        onTasksChange(newTasks);
    };

    const handleAddColumnLocal = () => {
        const title = prompt("Nombre de la nueva columna:");
        if (!title) return;
        const id = title.toLowerCase().replace(/\s+/g, '_');
        onAddColumn({ id, title: title.toUpperCase() });
    };

    // --- Render Helpers ---
    const getTasksByColumn = (columnId) => {
        return tasks.filter(task => {
            // Exact match
            if (task.status === columnId) return true;
            // Legacy fallbacks might not be needed if we ensure all data is clean,
            // but keeping simple for safety:
            if (columnId === 'potential' && task.status === 'potential') return true;
            if (columnId === 'billed' && task.status === 'active') return true; // Legacy map
            if (columnId === 'to_bill' && task.status === 'debtor') return true; // Legacy map

            return false;
        });
    };

    const activeTask = tasks.find(t => t.id === activeId);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-[calc(100vh-220px)] flex flex-col">
                {/* Horizontal Scroll Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex h-full gap-4 px-1 min-w-max">
                        {columns.map(col => (
                            <KanbanColumn
                                key={col.id}
                                column={col}
                                tasks={getTasksByColumn(col.id)}
                                onDelete={onDeleteColumn}
                                onEdit={onEditColumn}
                            />
                        ))}

                        {/* Add Column Button */}
                        <div className="w-[300px] shrink-0 h-full p-3">
                            <Button
                                onClick={handleAddColumnLocal}
                                variant="outline"
                                className="w-full h-12 border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Agregar Columna
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay (Preview while dragging) */}
            {createPortal(
                <DragOverlay>
                    {activeTask ? <KanbanCard client={activeTask} /> : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
