import { motion, AnimatePresence } from "framer-motion";
import { clientConfig } from "../../config/client";
import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

export function SplashScreen({ isVisible, message = "Cargando..." }) {
    const primaryColor = clientConfig.colors?.primary || '#18181b';

    return createPortal(
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center font-sans"
                >
                    {/* Background Glow */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0.3 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
                        style={{ backgroundColor: primaryColor }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo Container */}
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="bg-white p-6 rounded-3xl shadow-2xl relative"
                            style={{ boxShadow: `0 20px 40px -10px ${primaryColor}40` }}
                        >
                            <div
                                className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {clientConfig.icon ? (
                                    <clientConfig.icon className="w-8 h-8" strokeWidth={2.5} />
                                ) : (
                                    <span className="text-2xl font-bold">{clientConfig.name.charAt(0)}</span>
                                )}
                            </div>

                            {/* Inner Ring Pulse */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-transparent animate-pulse" style={{ borderColor: `${primaryColor}20` }} />
                        </motion.div>

                        <div className="flex flex-col items-center gap-2">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold text-slate-900 tracking-tight"
                            >
                                {clientConfig.name}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-2 text-slate-500 font-medium"
                            >
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                <span className="text-sm">{message}</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
