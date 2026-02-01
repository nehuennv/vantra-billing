import { useState, useEffect } from 'react';

// Simulamos una respuesta de API
const MOCK_API_RESPONSE = {
    revenue: { value: 2450000, trend: 20.1, trendDir: 'up' },
    netIncome: { value: 1820000, trend: 12.5, trendDir: 'up' },
    pendingDebt: { value: 450000, count: 12, trendDir: 'down' }, // 'down' en deuda es malo/alerta
    activeClients: { value: 1234, new: 14, trendDir: 'up' }
};

export function useDashboardMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Simulamos delay de red (Real-world scenario)
        const fetchMetrics = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s de carga
                setData(MOCK_API_RESPONSE);
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