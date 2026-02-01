import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, AlertCircle, Users } from 'lucide-react';
import { Card } from "../../../../components/ui/Card";
import { cn } from "../../../../components/ui/Button";

// Componente interno para una Card individual (Modularidad)
function StatCard({ title, value, subtext, icon: Icon, trend, trendDir, color, loading }) {

    // Estado de Carga (Skeleton UI)
    if (loading) {
        return (
            <Card className="h-full p-6 border-slate-100 shadow-sm flex flex-col justify-between gap-4">
                <div className="flex justify-between">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
                    <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                    <div className="h-8 w-32 bg-slate-100 animate-pulse rounded" />
                </div>
            </Card>
        );
    }

    // Colores dinámicos basados en la prop 'color'
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
        slate: "bg-slate-100 text-slate-600",
    };

    return (
        <Card className="group relative h-full p-6 border-slate-200/60 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 bg-white overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full gap-4">

                {/* Header: Icono + Trend */}
                <div className="flex justify-between items-start">
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", colorStyles[color])}>
                        <Icon className="h-6 w-6" />
                    </div>

                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border",
                            trendDir === 'up'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                        )}>
                            {trendDir === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {trend}
                        </div>
                    )}
                </div>

                {/* Data Principal */}
                <div>
                    <h3 className="text-sm font-medium text-slate-500 font-sans">{title}</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 font-heading tracking-tight">
                            {value}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        {subtext}
                    </p>
                </div>
            </div>
        </Card>
    );
}

export function StatsGrid({ metrics, loading }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <StatCard
                title="Facturación Total"
                value={metrics?.revenue ? `$${(metrics.revenue.value / 1000000).toFixed(1)}M` : "$0.0M"}
                subtext="vs. mes anterior"
                trend={`${metrics?.revenue?.trend}%`}
                trendDir={metrics?.revenue?.trendDir}
                icon={DollarSign}
                color="indigo"
                loading={loading}
            />

            <StatCard
                title="Cashflow Neto"
                value={metrics?.netIncome ? `$${(metrics.netIncome.value / 1000000).toFixed(1)}M` : "$0.0M"}
                subtext="Rentabilidad real"
                trend={`${metrics?.netIncome?.trend}%`}
                trendDir={metrics?.netIncome?.trendDir}
                icon={Wallet}
                color="emerald"
                loading={loading}
            />

            <StatCard
                title="Deuda Pendiente"
                value={metrics?.pendingDebt ? `$${(metrics.pendingDebt.value / 1000).toFixed(0)}k` : "$0k"}
                subtext={`${metrics?.pendingDebt?.count} facturas vencidas`}
                trend="Requiere Atención" // Trend textual para alertas
                trendDir="down" // Down = Rojo (Alerta)
                icon={AlertCircle}
                color="orange"
                loading={loading}
            />

            <StatCard
                title="Clientes Activos"
                value={metrics?.activeClients?.value || "0"}
                subtext={`+${metrics?.activeClients?.new} nuevos esta semana`}
                trend="Estable"
                trendDir="up"
                icon={Users}
                color="slate"
                loading={loading}
            />
        </div>
    );
}