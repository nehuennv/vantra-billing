import { request } from './apiClient';

export const quotesAPI = {
    // Generar y enviar presupuesto por email
    sendQuote: (clientId, body = {}) => {
        return request(`/v1/clients/${clientId}/send-quote`, 'POST', body);
    },

    // Listar presupuestos de un cliente
    getClientQuotes: (clientId) => {
        const query = new URLSearchParams({ _t: Date.now() }).toString();
        return request(`/v1/clients/${clientId}/quotes?${query}`, 'GET');
    },

    // Descargar PDF del presupuesto
    downloadPdf: async (clientId, quoteId) => {
        const API_URL = import.meta.env.VITE_API_URL;
        const API_KEY = import.meta.env.VITE_API_KEY;

        if (!API_URL || !API_KEY) {
            throw new Error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing");
        }

        const url = `${API_URL}/v1/clients/${clientId}/quotes/${quoteId}/pdf`;

        try {
            const headers = { 'x-api-key': API_KEY };
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, { headers });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('vantra_user');
                window.location.href = '/login';
                return;
            }

            if (response.status === 404) {
                const error = new Error("El documento original ya no se encuentra en el servidor");
                error.status = 404;
                throw error;
            }

            if (!response.ok) {
                throw new Error(`Error al descargar PDF (${response.status})`);
            }

            // Descargar blob
            const blob = await response.blob();

            // Extract filename from header or fallback
            const disposition = response.headers.get('Content-Disposition');
            let filename = `presupuesto_${quoteId}.pdf`;

            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            } else if (disposition && disposition.indexOf('inline') !== -1) {
                const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            return { blob, filename };

        } catch (error) {
            console.error("[Quotes API] Fallo al descargar PDF:", error);
            throw error;
        }
    },

    // Generar presupuesto sin enviar email (devuelve PDF directo)
    generateQuote: async (clientId, body = {}) => {
        const API_URL = import.meta.env.VITE_API_URL;
        const API_KEY = import.meta.env.VITE_API_KEY;

        if (!API_URL || !API_KEY) {
            throw new Error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing");
        }

        const url = `${API_URL}/v1/clients/${clientId}/generate-quote`;

        const headers = {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
        };
        const token = localStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('vantra_user');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error al generar presupuesto (${response.status})`);
        }

        const blob = await response.blob();

        // Extract filename from header or fallback
        const disposition = response.headers.get('Content-Disposition');
        let filename = `Presupuesto_${clientId}.pdf`;

        if (disposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        return { blob, filename };
    }
};
