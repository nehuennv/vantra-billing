import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from "lucide-react";
import { useEffect } from "react";

const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />,
};

export function ToastNotification({ id, type, message, description, duration, icon, depth, isHovering, onDismiss }) {
    useEffect(() => {
        // Pausar timer si está haciendo hover? Opcional. Por ahora lo dejamos corriendo o lo pausamos si preferimos.
        // User didn't explicitly ask to pause, but usually "interaction" implies pausing.
        // Let's NOT pause for now to keep it simple, or maybe yes? 
        // "Expand on hover" implies reading. Let's pause dismissal if hovering.
        if (duration > 0 && duration !== Infinity && !isHovering) {
            const timer = setTimeout(() => {
                onDismiss(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss, isHovering]);

    // Visual styles based on type (Arc-like gradients)
    const variants = {
        success: "bg-gradient-to-br from-white/95 to-emerald-50/90 border-emerald-200/50 shadow-[0_8px_30px_-4px_rgba(16,185,129,0.1)]",
        error: "bg-gradient-to-br from-white/95 to-rose-50/90 border-rose-200/50 shadow-[0_8px_30px_-4px_rgba(244,63,94,0.1)]",
        warning: "bg-gradient-to-br from-white/95 to-amber-50/90 border-amber-200/50 shadow-[0_8px_30px_-4px_rgba(245,158,11,0.1)]",
        info: "bg-gradient-to-br from-white/95 to-blue-50/90 border-blue-200/50 shadow-[0_8px_30px_-4px_rgba(59,130,246,0.1)]",
        loading: "bg-gradient-to-br from-white/95 to-zinc-50/90 border-zinc-200/50 shadow-[0_8px_30px_-4px_rgba(113,113,122,0.1)]"
    };

    const styleClass = variants[type] || variants.info;

    // Calculate vertical offset. 
    // Stacked: tight overlap (15px)
    // Hover: expanded (height ~70-80px? Let's assume 80px + gap)
    const expandedOffset = 85;
    const stackedOffset = 15;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{
                opacity: 1,
                y: -(depth * (isHovering ? expandedOffset : stackedOffset)), // Expand or Stack
                scale: isHovering ? 1 : 1 - depth * 0.05, // Scale 1 on hover
                zIndex: 100 - depth,
                // No blur as requested
            }}
            exit={{
                opacity: 0,
                scale: 0.5,
                y: 20,
                filter: "blur(10px)",
                transition: { duration: 0.2 }
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 1
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 300 }}
            onDragEnd={(event, info) => {
                if (info.offset.x > 50) {
                    onDismiss(id);
                }
            }}
            style={{
                willChange: "transform, opacity",
            }}
            className={`pointer-events-auto absolute bottom-0 right-0 w-full max-w-[356px] flex items-start gap-3 p-4 rounded-[22px] backdrop-blur-xl border ${styleClass} group`}
        >
            <div className="flex-shrink-0 mt-0.5 relative">
                {/* Glow effect capability behind icon */}
                <div className={`absolute inset-0 blur-lg opacity-20 ${type === 'success' ? 'bg-emerald-500' :
                    type === 'error' ? 'bg-rose-500' :
                        type === 'warning' ? 'bg-amber-500' :
                            'bg-blue-500'
                    }`} />
                <div className="relative">{icon || icons[type] || icons.info}</div>
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-zinc-800 leading-tight tracking-tight">{message}</h3>
                {description && (
                    <p className="text-[13px] font-medium text-zinc-500 mt-1 leading-snug tracking-wide opacity-90">{description}</p>
                )}
            </div>

            <button
                onClick={() => onDismiss(id)}
                className="flex-shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors -mr-1 -mt-1 p-1 opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
