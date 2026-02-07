import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../../components/ui/Dialog";
import { Button } from "../../../components/ui/Button";
import { AlertTriangle } from "lucide-react";

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar eliminación",
    description = "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
    confirmText = "Eliminar",
    cancelText = "Cancelar",
    variant = "destructive" // destructive | warning | default
}) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-slate-600">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : variant === 'warning' ? 'secondary' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
