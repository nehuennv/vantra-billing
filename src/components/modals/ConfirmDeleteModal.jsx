import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, entityName, entityType = "elemento" }) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-6 w-6 text-rose-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">¿Estás seguro?</DialogTitle>
                    <DialogDescription className="text-center space-y-2">
                        <span>
                            Estás a punto de eliminar {entityType.toLowerCase() === 'servicio' || entityType.toLowerCase() === 'presupuesto' ? 'el' : 'al'} {entityType.toLowerCase()}:
                        </span>
                        <br />
                        <span className="font-bold text-slate-900 block text-base mt-2">"{entityName}"</span>
                        <span className="text-rose-600 text-xs block mt-4 font-semibold">
                            Esta acción no se puede deshacer.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        Eliminar {entityType}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
