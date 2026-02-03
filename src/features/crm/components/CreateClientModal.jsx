import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input"; // Assuming you have an Input component
import { Label } from "../../../components/ui/Label"; // Assuming Label component
import { Plus, X } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";

export function CreateClientModal({ isOpen, onClose, columns, onAddClient, onAddColumn }) {
    const [formData, setFormData] = useState({
        name: '',
        businessName: '',
        cuit: '',
        email: '',
        status: 'potential' // Default
    });

    const [isAddingStatus, setIsAddingStatus] = useState(false);
    const [newStatusName, setNewStatusName] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateStatus = () => {
        if (!newStatusName.trim()) return;
        const id = newStatusName.toLowerCase().replace(/\s+/g, '_');
        onAddColumn({ id, title: newStatusName.toUpperCase() });
        setFormData(prev => ({ ...prev, status: id }));
        setIsAddingStatus(false);
        setNewStatusName("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddClient({
            id: Date.now().toString(), // Mock ID
            ...formData,
            debt: 0,
            servicePlan: 'Consultoría Inicial' // Default for now
        });
        onClose();
        // Reset form
        setFormData({ name: '', businessName: '', cuit: '', email: '', status: 'potential' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Cliente</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre de Contacto</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Empresa / Razón Social</Label>
                            <Input
                                id="businessName"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                placeholder="Ej: Tech Solutions SRL"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cuit">CUIT</Label>
                            <Input
                                id="cuit"
                                name="cuit"
                                value={formData.cuit}
                                onChange={handleChange}
                                placeholder="20-12345678-9"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="juan@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Estado (Columna Kanban)</Label>
                        {!isAddingStatus ? (
                            <div className="flex gap-2">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="flex-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    {columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.title}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingStatus(true)} title="Crear nuevo estado">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                                <Input
                                    value={newStatusName}
                                    onChange={(e) => setNewStatusName(e.target.value)}
                                    placeholder="Nombre del nuevo estado..."
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button type="button" size="sm" onClick={handleCreateStatus} disabled={!newStatusName.trim()}>
                                    Crear
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => setIsAddingStatus(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-500">
                            El cliente se creará en esta columna. Si creas uno nuevo, se agregará al tablero.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">Guardar Cliente</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
