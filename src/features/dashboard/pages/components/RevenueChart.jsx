import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Download, RefreshCcw } from "lucide-react";

// --- DATOS DE PRUEBA (Para que no se vea vacío) ---
const MOCK_DATA = [
    { name: 'Ene', recurrente: 45000, ventas: 12000, gastos: 35000 },
    { name: 'Feb', recurrente: 48000, ventas: 8000, gastos: 38000 },
    { name: 'Mar', recurrente: 52000, ventas: 15000, gastos: 41000 },
    { name: 'Abr', recurrente: 53000, ventas: 10000, gastos: 45000 },
    { name: 'May', recurrente: 58000, ventas: 22000, gastos: 48000 },
    { name: 'Jun', recurrente: 64000, ventas: 18000, gastos: 52000 },
];

// --- TOOLTIP OSCURO (High Contrast) ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const ingresos = (payload[0]?.value || 0) + (payload[1]?.value || 0);
        const gastos = payload[2]?.value || 0;
        const neto = ingresos - gastos;

        return (
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 min-w-[220px]">
                <p className="font-sans font-semibold text-slate-400 text-xs mb-3 uppercase tracking-wider">{label}</p>
                <div className="space-y-3">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2 h-2 rounded-full ring-1 ring-white/20"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="font-medium text-slate-300 capitalize">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="font-sans font-medium text-white">
                                ${new Intl.NumberFormat('es-AR').format(entry.value)}
                            </span>
                        </div>
                    ))}
                    <div className="h-px bg-slate-700 my-2" />
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-slate-200">Cashflow Neto</span>
                        <span className={`text-sm font-bold font-sans ${neto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {neto > 0 ? '+' : ''}${new Intl.NumberFormat('es-AR').format(neto)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function RevenueChart({ loading, data }) {
    // 1. Usar datos reales O datos de prueba (MOCK_DATA)
    const chartData = (data && data.length > 0) ? data : MOCK_DATA;

    // 2. Loading State (Solo si explícitamente está cargando)
    if (loading) {
        return (
            <Card className="h-full border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                    <div className="h-6 w-40 bg-slate-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-24 bg-slate-50 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="h-[350px] flex items-end justify-between gap-2 p-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-full bg-slate-100 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 80 + 10}%` }} />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-start justify-between pb-6">
                <div>
                    <CardTitle className="font-sans font-bold text-lg text-slate-900 tracking-tight">
                        Rendimiento Financiero
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        <p className="text-sm text-slate-500 font-medium">Ingresos vs Gastos (Tiempo Real)</p>
                    </div>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 border-slate-200">
                    <Download className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="pl-0 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontFamily="var(--font-sans)"
                            fontWeight={600}
                        />

                        <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v / 1000}k`}
                            dx={-10}
                            fontFamily="var(--font-sans)"
                            fontWeight={600}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.5 }} />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                        />

                        {/* BARRA BASE: Recurrente (Indigo Profundo) */}
                        <Bar
                            dataKey="recurrente"
                            name="Recurrente"
                            stackId="a"
                            fill="#3730a3" // Indigo-900 (Más serio, más contraste)
                            barSize={24}   // Barras más finas = Más elegante
                            radius={[0, 0, 0, 0]} // Rectas, estilo "Linear app"
                        />

                        {/* BARRA TOP: Ventas (Indigo Vibrante) */}
                        <Bar
                            dataKey="ventas"
                            name="Ventas Extra"
                            stackId="a"
                            fill="#6366f1" // Indigo-500
                            barSize={24}
                            radius={[4, 4, 0, 0]} // Solo redondeado arriba suave
                        />

                        {/* LÍNEA: Gastos (Negro/Gris Oscuro - Máximo contraste) */}
                        <Line
                            type="monotone"
                            dataKey="gastos"
                            name="Gastos"
                            stroke="#1e293b" // Slate-800
                            strokeWidth={2}
                            dot={false} // Sin puntos para limpieza visual
                            activeDot={{ r: 6, fill: "#1e293b", strokeWidth: 2, stroke: "#fff" }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}