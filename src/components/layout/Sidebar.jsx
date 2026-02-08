import { LayoutDashboard, Users, CreditCard, Wallet, Settings, MoreVertical, LogOut, Briefcase } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../ui/Button";
import { clientConfig } from "../../config/client";
import { motion } from "framer-motion";
import { useSettings } from "../../hooks/useSettings";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clientes", href: "/crm", icon: Users },
    { name: "Servicios", href: "/services", icon: Briefcase },
    { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const location = useLocation();
    const { settings } = useSettings();

    return (
        <aside className="w-72 hidden md:flex flex-col h-full bg-transparent z-10 shrink-0 py-6 px-3">

            {/* --- BRANDING HEADER --- */}
            <div className="px-4 pb-8">
                <div className="flex items-center gap-4">
                    {/* Logo Container */}
                    <div className="relative group cursor-pointer shrink-0">
                        {clientConfig.logo ? (
                            <img src={clientConfig.logo} alt={clientConfig.name} className="h-9 w-auto object-contain brightness-0 invert ease-out transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col select-none">
                        <span className="font-heading font-bold text-white tracking-tight leading-none text-lg">
                            {clientConfig.name || "Vantra"}
                        </span>
                        <span className="text-[10px] font-medium text-white/50 tracking-[0.2em] uppercase mt-1">
                            Billing OS
                        </span>
                    </div>
                </div>
            </div>

            {/* --- NAVIGATION LINKS --- */}
            <nav className="flex-1 space-y-2 overflow-y-auto px-2">
                <div className="px-4 mb-3 text-[10px] font-bold text-white/40 uppercase tracking-widest select-none">
                    Plataforma
                </div>

                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 outline-none select-none",
                                isActive ? "text-primary" : "text-white/70 hover:text-white"
                            )}
                        >
                            {/* Fondo Activo "Pill" con Animación de Resorte */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebarActiveTab"
                                    className="absolute inset-0 bg-white rounded-lg shadow-lg shadow-black/10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                        mass: 0.8
                                    }}
                                />
                            )}

                            {/* Hover Effect Background (Solo visible si no está activo) */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200" />
                            )}

                            {/* Icono con trazo más fino */}
                            <item.icon
                                strokeWidth={2}
                                className={cn(
                                    "relative z-10 w-[1.2rem] h-[1.2rem] transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-primary" : "text-white/60 group-hover:text-white"
                                )}
                            />

                            {/* Texto con mejor tipografía */}
                            <span className={cn(
                                "relative z-10 font-sans text-[15px] tracking-tight transition-all duration-300",
                                isActive ? "font-semibold translate-x-1" : "font-medium group-hover:translate-x-1"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* --- USER FOOTER --- */}
            <div className="pt-4 px-2 pb-2">
                <div className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-100 to-white flex items-center justify-center shrink-0 shadow-inner">
                            <span className="font-heading font-bold text-xs text-primary">
                                {settings.profile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate leading-tight group-hover:text-white transition-colors">
                                {settings.profile.name}
                            </span>
                            <span className="text-[11px] text-white/50 truncate group-hover:text-white/70 transition-colors">
                                {settings.profile.email}
                            </span>
                        </div>
                    </div>
                    <MoreVertical className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
            </div>
        </aside>
    );
}