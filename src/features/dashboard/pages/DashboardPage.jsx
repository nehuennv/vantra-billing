import React from 'react';
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsGrid } from "./components/StatsGrid";
import { RevenueChart } from "./components/RevenueChart";
import { ActivityFeed } from "./components/ActivityFeed";

export default function DashboardPage() {
    // Ahora 'data' trae TODO: metrics, chartData y recentActivity
    const { data, loading, error } = useDashboardMetrics();

    if (error) return <div className="p-6 text-red-500">Error de conexión.</div>;

    return (
        <div className="space-y-6">

            <DashboardHeader />

            {/* Pasamos solo la parte 'metrics' a las tarjetas */}
            <StatsGrid metrics={data?.metrics} loading={loading} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">

                {/* 1. Gráfico Principal */}
                <div className="col-span-4 h-full">
                    <RevenueChart
                        loading={loading}
                        data={data?.chartData} // <--- CONECTADO
                    />
                </div>

                {/* 2. Feed de Actividad */}
                <div className="col-span-3 h-full">
                    <ActivityFeed
                        loading={loading}
                        invoices={data?.recentActivity} // <--- CONECTADO (Pasamos la prop)
                    />
                </div>
            </div>
        </div>
    );
}