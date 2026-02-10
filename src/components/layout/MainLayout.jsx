import { useOutlet, useLocation, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { clientConfig } from "../../config/client";

// Algoritmo simple para oscurecer un color HEX - YA NO SE USA
// const darkenColor = (hex, percent) => { ... }

export function MainLayout() {
    const location = useLocation();
    const animatedOutlet = useOutlet();

    // Obtener color primario
    const primaryColor = clientConfig.colors?.primary || "#059669";

    return (
        <div
            className="flex h-screen w-full overflow-hidden font-sans relative bg-noise"
            style={{ backgroundColor: primaryColor }}
        >
            {/* Sidebar Area */}
            <Sidebar />

            {/* Main Content Area - Floating Card on Desktop */}
            <main className="flex-1 flex flex-col m-0 md:my-6 md:mr-6 md:ml-0 md:rounded-2xl bg-slate-50 shadow-2xl overflow-hidden relative transition-all duration-300 z-10">

                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 z-20 bg-white/80 backdrop-blur-sm">
                    <span className="font-heading font-bold text-lg text-primary">{clientConfig.name}</span>
                    {/* Placeholder for Mobile Menu Trigger (Implemented in Sidebar or separate component usually) */}
                </div>

                {/* Internal Scroll Area */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar p-4 md:p-6 lg:p-8 ${location.pathname === '/crm' ? '!pb-0' : ''}`}>
                    <AnimatePresence mode="wait">
                        {/* Wrapper div with key ensures content remounts/animates on route change while Sidebar stays put */}
                        <div key={location.pathname} className="h-full w-full">
                            <Outlet />
                        </div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
