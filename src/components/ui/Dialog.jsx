import React from 'react';
import { createPortal } from 'react-dom';
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function Dialog({ open, onOpenChange, children }) {
    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Content Wrapper - ensures centering and z-index above backdrop */}
                    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
                        {children}
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export function DialogContent({ className, children, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
                "pointer-events-auto relative grid w-full gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-lg",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
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
