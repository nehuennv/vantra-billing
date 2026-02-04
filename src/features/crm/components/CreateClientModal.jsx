import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Textarea } from "../../../components/ui/Textarea"; // Assuming Textarea exists or using Input
import { Plus, X } from "lucide-react";

export function CreateClientModal({ isOpen, onClose, columns, onAddClient, onAddColumn, initialData = null, isEditing = false }) {
    const [formData, setFormData] = useState({
        // Identity
        businessName: '', // Razon Social (company_name) - Required
        cuit: '',         // Required
        name: '',         // Contact Name
        dni: '',

        // Contact
        email: '',        // email_billing - Required
        phone: '',        // WhatsApp
        address: '',

        // Location
        city: '',
        zipCode: '',
        province: '',

        // Metadata
        category: '',
        status: 'potential',
        tax_condition: 'responsable_inscripto',

        // Notes
        internalObs: ''   // obsinterna
    });

    // Load initial data if editing
    React.useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setFormData({
                    businessName: initialData.businessName || initialData.company_name || '',
                    cuit: initialData.cuit || initialData.tax_id || '',
                    name: initialData.contactName || initialData.name || '',
                    dni: initialData.dni || '',

                    email: initialData.email || initialData.email_billing || '',
                    phone: initialData.phone || initialData.whatsapp || '',
                    address: initialData.address || '',

                    city: initialData.city || '',
                    zipCode: initialData.zipCode || '',
                    province: initialData.province || '',

                    category: initialData.category || '',
                    status: initialData.status || 'potential',
                    tax_condition: initialData.tax_condition || 'responsable_inscripto',

                    internalObs: initialData.internalObs || ''
                });
            } else {
                // Reset for creation
                setFormData({
                    businessName: '',
                    cuit: '',
                    name: '',
                    dni: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    zipCode: '',
                    province: '',
                    category: '',
                    status: 'potential',
                    tax_condition: 'responsable_inscripto',
                    internalObs: ''
                });
            }
        }
    }, [isOpen, isEditing, initialData]);

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
            ...formData,
            id: isEditing ? initialData.id : undefined
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">

                    {/* SECTION 1: IDENTITY */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Datos Fiscales - Obligatorios</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="businessName">Razón Social *</Label>
                                <Input
                                    id="businessName"
                                    name="businessName"
                                    required
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    placeholder="Ej: Empresa SA"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cuit">CUIT *</Label>
                                <Input
                                    id="cuit"
                                    name="cuit"
                                    required
                                    value={formData.cuit}
                                    onChange={handleChange}
                                    placeholder="20-12345678-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Facturación *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="facturacion@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_condition">Condición IVA</Label>
                                <select
                                    id="tax_condition"
                                    name="tax_condition"
                                    value={formData.tax_condition}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="responsable_inscripto">Responsable Inscripto</option>
                                    <option value="monotributista">Monotributista</option>
                                    <option value="exento">Exento</option>
                                    <option value="consumidor_final">Consumidor Final</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: CONTACT & LOCATION */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Contacto y Ubicación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre de Contacto</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp / Teléfono</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+54 9 11..."
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Dirección Completa</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Calle 123, Piso 1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Localidad</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Provincia</Label>
                                <Input
                                    id="province"
                                    name="province"
                                    value={formData.province}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: METADATA */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Clasificación</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    placeholder="Ej: CLIENTES ABONADOS"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Estado (Columna)</Label>
                                {!isAddingStatus ? (
                                    <div className="flex gap-2">
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="flex-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            {columns.map(col => (
                                                <option key={col.id} value={col.id}>{col.title}</option>
                                            ))}
                                        </select>
                                        <Button type="button" variant="outline" size="icon" onClick={() => setIsAddingStatus(true)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            value={newStatusName}
                                            onChange={(e) => setNewStatusName(e.target.value)}
                                            placeholder="Nuevo estado..."
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
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4: NOTES */}
                    <div className="space-y-2">
                        <Label htmlFor="internalObs">Notas Internas (Privado)</Label>
                        <textarea
                            id="internalObs"
                            name="internalObs"
                            value={formData.internalObs}
                            onChange={handleChange}
                            className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Información interna no visible para el cliente (Soporta HTML básico o Texto plano)"
                        />
                    </div>

                    <DialogFooter className="pt-2 sticky bottom-0 bg-white border-t mt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">{isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
