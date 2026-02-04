import { useOutlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "../ui/Button";
import { AnimatePresence, motion } from "framer-motion";

export function MainLayout() {
    const location = useLocation();
    const animatedOutlet = useOutlet();

    return (
        <div className="flex h-screen w-full bg-gradient-to-br from-primary/30 via-slate-50 to-white overflow-hidden font-sans text-slate-900">
            {/* Sidebar Area - Fixed width wrapper for the floating sidebar */}
            <div className="hidden md:block w-72 shrink-0" />

            <Sidebar />

            {/* Main Content Area - Transparent & Fluid */}
            <main className="flex-1 relative flex flex-col m-4 md:ml-0 md:mr-4 overflow-hidden">
                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-indigo-100/20 sticky top-0 z-20 backdrop-blur-sm">
                    <span className="font-heading font-bold text-lg text-slate-900">Vantra Billing</span>
                    {/* Placeholder for Mobile Menu Trigger */}
                </div>

                {/* Internal Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="w-full min-h-full space-y-8 p-6 md:p-8"
                        >
                            {animatedOutlet}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
