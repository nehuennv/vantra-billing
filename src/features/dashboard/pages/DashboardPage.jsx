import React from 'react';
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics"; // Asegurate que la ruta sea correcta
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsGrid } from "./components/StatsGrid";
import { RevenueChart } from "./components/RevenueChart";
import { ActivityFeed } from "./components/ActivityFeed";
import { motion } from "framer-motion";

export default function DashboardPage() {
    // 1. LLAMADA A LA LÓGICA (DATA LAYER)
    const { data: metrics, loading, error } = useDashboardMetrics();

    if (error) {
        return <div className="p-6 text-red-500">Error al cargar datos del dashboard.</div>;
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">

            {/* Header: Estático, no depende de carga */}
            <DashboardHeader />

            {/* Grid de KPIs: Maneja su propio estado de loading internamente */}
            <StatsGrid metrics={metrics} loading={loading} />

            {/* Contenido Principal */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 h-[450px]">
                {/* Aquí podrías pasarle props similares a RevenueChart y ActivityFeed */}
                <div className="col-span-4 h-full">
                    <RevenueChart loading={loading} />
                </div>
                <div className="col-span-3 h-full">
                    <ActivityFeed loading={loading} />
                </div>
            </div>
        </div>
    );
}