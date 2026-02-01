import { LayoutDashboard, Users, CreditCard, Wallet, Settings, MoreVertical, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../ui/Button";
import { clientConfig } from "../../config/client";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "CRM", href: "/crm", icon: Users },
    { name: "Facturación", href: "/billing", icon: CreditCard },
    { name: "Tesorería", href: "/finance", icon: Wallet },
    { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <aside className="fixed left-4 top-4 bottom-4 w-[280px] rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 hidden md:flex flex-col z-50 overflow-hidden transition-all duration-300">

            {/* --- BRANDING HEADER --- */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3.5 px-2">
                    {/* Logo Container con Sombra Difusa */}
                    <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {clientConfig.logo ? (
                            <img src={clientConfig.logo} alt={clientConfig.name} className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-glow-sm text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-slate-900 tracking-tight leading-tight">
                            {clientConfig.name || "Vantra"}
                        </span>
                        <span className="text-[10px] font-heading font-semibold text-slate-400 tracking-widest uppercase">
                            Billing OS
                        </span>
                    </div>
                </div>
            </div>

            {/* --- NAVIGATION LINKS --- */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2">
                <div className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                    Plataforma
                </div>

                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 outline-none",
                                isActive
                                    ? "text-indigo-600"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {/* Fondo Activo "Flotante" (Magic Motion) */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebarActiveTab"
                                    className="absolute inset-0 bg-indigo-50/80 border border-indigo-100/50 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}

                            {/* Icono */}
                            <item.icon
                                className={cn(
                                    "relative z-10 h-[1.15rem] w-[1.15rem] transition-colors duration-200",
                                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                                )}
                            />

                            {/* Texto */}
                            <span className={cn(
                                "relative z-10 font-heading tracking-tight",
                                isActive ? "font-semibold" : "font-medium"
                            )}>
                                {item.name}
                            </span>

                            {/* Indicador de Activo (Puntito) */}
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-500/50"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* --- USER FOOTER --- */}
            <div className="p-4 border-t border-slate-100">
                <div className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-white shadow-sm flex items-center justify-center shrink-0">
                            <span className="font-heading font-bold text-xs text-slate-600">JD</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 truncate transition-colors">
                                John Doe
                            </span>
                            <span className="text-xs text-slate-400 truncate group-hover:text-slate-500">
                                admin@vantra.com
                            </span>
                        </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-600 transition-colors p-1">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}