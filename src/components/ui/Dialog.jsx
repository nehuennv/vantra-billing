import React from 'react';
import { createPortal } from 'react-dom';
import { X } from "lucide-react";
import { cn } from "../../lib/utils"; // Assuming you have a utils file, if not I'll standardise without it or check if it exists

// Simple Dialog Implementation without Radix
export function Dialog({ open, onOpenChange, children }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={() => onOpenChange(false)}
            />
            {children}
        </div>,
        document.body
    );
}

export function DialogContent({ className, children, ...props }) {
    return (
        <div
            className={cn(
                "fixed z-50 grid w-full gap-4 rounded-b-lg border bg-white p-6 shadow-lg animate-in fade-in zoom-in-95 sm:max-w-lg sm:rounded-lg",
                className
            )}
            {...props}
        >
            {children}
            {/* We could add a close button here if we passed onOpenChange down, but user didn't ask for it explicitly in this sub-component */}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return (
        <div
            className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
            {...props}
        />
    );
}

export function DialogFooter({ className, ...props }) {
    return (
        <div
            className={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                className
            )}
            {...props}
        />
    );
}

export function DialogTitle({ className, ...props }) {
    return (
        <h2
            className={cn(
                "text-lg font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        />
    );
}

export function DialogDescription({ className, ...props }) {
    return (
        <p
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}
