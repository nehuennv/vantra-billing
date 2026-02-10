import { createContext, useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ToastNotification } from "../components/ui/ToastNotification";
import { toastManager } from "./ToastManager";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToastEvent = (event) => {
            if (event.type === "ADD") {
                setToasts((prev) => [...prev, event.payload]);
            } else if (event.type === "DISMISS") {
                setToasts((prev) => prev.filter((t) => t.id !== event.payload.id));
            } else if (event.type === "UPDATE") {
                setToasts((prev) => prev.map((t) => t.id === event.payload.id ? { ...t, ...event.payload.updates } : t));
            }
        };

        const unsubscribe = toastManager.subscribe(handleToastEvent);
        return () => unsubscribe();
    }, []);

    const removeToast = (id) => {
        toastManager.dismiss(id);
    };

    // Limit to 4 visible toasts for stacking effect, unless hovering then show all (or limit to say 8)
    // Limit to 4 visible toasts for stacking effect, unless hovering then show all (or limit to say 8)
    const [isHovering, setIsHovering] = useState(false);
    const hoverTimerRef = useRef(null);

    const handleMouseEnter = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        hoverTimerRef.current = setTimeout(() => {
            setIsHovering(false);
        }, 150); // 150ms delay to bridge gaps
    };

    // Show more when hovering so user can see "all" (or at least more context)
    const visibleToasts = isHovering ? toasts.slice(-8) : toasts.slice(-3);

    return (
        <ToastContext.Provider value={{ toast: toastManager }}>
            {children}
            <div
                className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none p-4 w-full max-w-[420px]"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {visibleToasts.map((toast, index) => {
                        // depth calculation adjusted for dynamic list length
                        const depth = visibleToasts.length - 1 - index;
                        return (
                            <ToastNotification
                                key={toast.id}
                                {...toast}
                                depth={depth}
                                isHovering={isHovering}
                                onDismiss={removeToast}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
