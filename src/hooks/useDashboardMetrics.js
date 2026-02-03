import { useState, useEffect } from 'react';

// SIMULAMOS LA RESPUESTA DE UNA API REAL COMPLETÍSIMA
const MOCK_DB_RESPONSE = {
    // 1. Los KPIs de arriba
    metrics: {
        revenue: { value: 2450000, trend: 20.1, trendDir: 'up' },
        netIncome: { value: 1820000, trend: 12.5, trendDir: 'up' },
        pendingDebt: { value: 450000, count: 12, trendDir: 'down' },
        activeClients: { value: 142, new: 4, trendDir: 'up' }
    },
    // 2. Data para el Gráfico (Historial de 6 meses)
    chartData: [
        { name: 'Ago', recurrente: 1800000, ventas: 200000, gastos: 1500000 },
        { name: 'Sep', recurrente: 1900000, ventas: 150000, gastos: 1600000 },
        { name: 'Oct', recurrente: 2100000, ventas: 300000, gastos: 1700000 },
        { name: 'Nov', recurrente: 2150000, ventas: 250000, gastos: 1750000 },
        { name: 'Dic', recurrente: 2300000, ventas: 400000, gastos: 1900000 }, // Fiestas: más ventas únicas
        { name: 'Ene', recurrente: 2450000, ventas: 120000, gastos: 1800000 },
    ],
    // 3. Data para el Activity Feed (Últimos movimientos)
    recentActivity: [
        { id: "INV-001", client: "Kiosco El 24", amount: "$15.000", status: "paid", date: "Hoy, 10:30" },
        { id: "INV-002", client: "Mariana Tech SRL", amount: "$85.000", status: "pending", date: "Ayer" },
        { id: "INV-003", client: "Juan Pérez", amount: "$12.500", status: "overdue", date: "Hace 3 días" },
        { id: "INV-004", client: "Clínica Salud", amount: "$230.000", status: "paid", date: "Hace 1 semana" },
    ]
};

export function useDashboardMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Simulamos delay de red
                await new Promise(resolve => setTimeout(resolve, 1000));
                setData(MOCK_DB_RESPONSE);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return { data, loading, error };
}