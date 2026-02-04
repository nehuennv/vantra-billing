import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Download, Calendar, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

export function InvoicePreviewModal({ open, onOpenChange, client, items: initialItems = [], initialData = null, readOnly = false, onConfirm }) {
    if (!open) return null;

    // State for Invoice Metadata
    const [invoiceNumber, setInvoiceNumber] = useState(`0001-${Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8)}`);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [invoiceType, setInvoiceType] = useState('B'); // Default B

    // State for Items
    const [items, setItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize state
    useEffect(() => {
        if (open) {
            if (initialData) {
                // View Mode: Load existing data
                setInvoiceNumber(initialData.number);
                setIssueDate(initialData.issueDate || initialData.created_at?.split('T')[0]);
                setDueDate(initialData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                setInvoiceType(initialData.invoiceType || 'B');
                setItems(initialData.items || []);
            } else {
                // Create Mode: Initialize from Props
                if (initialItems) {
                    const mappedItems = initialItems.map(svc => ({
                        id: svc.id || Math.random(),
                        description: svc.name,
                        quantity: 1,
                        unit_price: svc.price
                    }));
                    setItems(mappedItems);
                }

                // Auto-select Invoice Type
                const cond = client?.tax_condition || 'consumidor_final';
                if (cond === 'responsable_inscripto') {
                    setInvoiceType('A');
                } else {
                    setInvoiceType('B');
                }
            }
        }
    }, [open, initialItems, initialData, client]);

    // Handlers
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Math.random(), description: "Nuevo Item", quantity: 1, unit_price: 0 }
        ]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1) return; // Prevent empty? Or allow empty? Allow empty is risky for invoice.
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    // Assuming prices are FINAL (Tax included) as per InvoicePDF logic. 
    // If not, adjust here. InvoicePDF says: Neto = Total / 1.21.
    // So 'subtotal' here is basically 'total' displayed.
    const total = subtotal;

    const handleConfirmClick = async () => {
        setIsSubmitting(true);
        try {
            const invoiceData = {
                number: invoiceNumber,
                issueDate,
                dueDate,
                invoiceType, // Pass the type
                items,
                total
            };
            await onConfirm(invoiceData);
            onOpenChange(false);
        } catch (error) {
            console.error("Error confirming invoice", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-[700px] md:max-w-[900px]">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
                        <Download className="h-5 w-5 text-indigo-600" />
                        Vista Previa de Factura
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        {readOnly
                            ? "Visualiza los detalles de la factura generada y descárgala nuevamente si es necesario."
                            : "Edita los detalles de la factura antes de generarla. Estos cambios no afectan el plan mensual del cliente."
                        }
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Metadata Column */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Número de Factura</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="pl-9"
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha de Emisión</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className="pl-9"
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Factura</Label>
                            {readOnly ? (
                                <div className="h-10 w-full flex items-center px-3 border border-slate-200 rounded-md bg-slate-50 text-sm font-medium">
                                    Factura {invoiceType}
                                </div>
                            ) : (
                                <select
                                    value={invoiceType}
                                    onChange={(e) => setInvoiceType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    <option value="A">Factura A</option>
                                    <option value="B">Factura B</option>
                                    <option value="C">Factura C</option>
                                    <option value="M">Factura M</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Client Info (Read Only) */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="font-bold text-sm text-slate-700 mb-2 uppercase tracking-wide">Facturar a</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p className="font-medium text-slate-900 text-base">{client?.company_name || client?.name}</p>
                            <p>CUIT: {client?.cuit || client?.tax_id}</p>
                            <p>{client?.address}</p>
                            <p className="text-indigo-600">{client?.email || client?.email_billing}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-700 font-medium">
                            <tr>
                                <th className="p-3 w-[50%]">Descripción</th>
                                <th className="p-3 w-[15%] text-center">Cant.</th>
                                <th className="p-3 w-[20%] text-right">Precio Unit.</th>
                                <th className="p-3 w-[10%] text-right">Total</th>
                                {!readOnly && <th className="p-3 w-[5%]"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={item.id} className="group hover:bg-slate-50">
                                    <td className="p-2">
                                        <Input
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                            className={`border-transparent bg-transparent h-8 ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:border-indigo-500'}`}
                                            readOnly={readOnly}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                            className={`text-center border-transparent bg-transparent h-8 ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:border-indigo-500'}`}
                                            readOnly={readOnly}
                                            min="1"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                            className={`text-right border-transparent bg-transparent h-8 ${readOnly ? 'cursor-default focus:ring-0' : 'hover:bg-white focus:bg-white focus:border-indigo-500'}`}
                                            readOnly={readOnly}
                                        />
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-900">
                                        ${(item.quantity * item.unit_price).toLocaleString()}
                                    </td>
                                    {!readOnly && (
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!readOnly && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100">
                            <Button variant="ghost" size="sm" onClick={handleAddItem} className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                <Plus className="h-4 w-4" /> Agregar Item
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Totals */}
                <div className="flex justify-end mb-6">
                    <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between mb-2 text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-medium">${(total / 1.21).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between mb-3 text-sm">
                            <span className="text-slate-500">IVA (21%)</span>
                            <span className="font-medium">${(total - (total / 1.21)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-slate-200 text-base">
                            <span className="font-bold text-slate-800">Total</span>
                            <span className="font-bold text-indigo-600">${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        onClick={handleConfirmClick}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200"
                    >
                        {isSubmitting ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <Download className="h-4 w-4" /> {readOnly ? 'Descargar PDF' : 'Confirmar y Descargar'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
