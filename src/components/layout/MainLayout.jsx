import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { cn } from "../ui/Button";

export function MainLayout() {
    return (
        <div className="flex h-screen w-full bg-gradient-to-br from-primary/10 via-slate-50 to-white overflow-hidden font-sans text-slate-900">
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
                    <div className="w-full h-full space-y-8 p-6 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
