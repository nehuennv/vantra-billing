import { useOutlet, useLocation, Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { clientConfig } from "../../config/client";

// Algoritmo simple para oscurecer un color HEX
const darkenColor = (hex, percent) => {
    let num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        B = ((num >> 8) & 0x00FF) - amt,
        G = (num & 0x0000FF) - amt;

    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 +
        (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
};

export function MainLayout() {
    const location = useLocation();
    const animatedOutlet = useOutlet();

    // Obtener color primario y generar variante oscura
    const primaryColor = clientConfig.colors?.primary || "#059669";
    const darkPrimary = darkenColor(primaryColor, 20); // 20% más oscuro (Sutil)

    return (
        <div
            className="flex h-screen w-full overflow-hidden font-sans relative"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${darkPrimary} 100%)` }}
        >
            {/* Sidebar Area */}
            <Sidebar />

            {/* Main Content Area - Floating Card on Desktop */}
            <main className="flex-1 flex flex-col m-0 md:my-6 md:mr-6 md:ml-0 md:rounded-2xl bg-slate-50 shadow-2xl overflow-hidden relative transition-all duration-300 z-10">

                {/* Mobile Header (visible only on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 z-20 bg-white/80 backdrop-blur-sm">
                    <span className="font-heading font-bold text-lg text-primary">Vantra Billing</span>
                    {/* Placeholder for Mobile Menu Trigger (Implemented in Sidebar or separate component usually) */}
                </div>

                {/* Internal Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar p-4 md:p-6 lg:p-8">
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
