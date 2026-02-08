const request = async (endpoint, method = 'GET', body = null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const API_KEY = import.meta.env.VITE_API_KEY;

    if (!API_URL || !API_KEY) {
        throw new Error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing in .env");
    }

    const headers = {
        'x-api-key': API_KEY,
    };

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    };

    try {
        console.log(`[API Client] Requesting: ${method} ${API_URL}${endpoint}`, config);
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.details || errorMessage;
            } catch (e) {
                // Si el body no es JSON, mantenemos el mensaje por defecto
            }
            throw new Error(errorMessage);
        }

        // Si es 204 No Content
        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error(`API Request failed: ${method} ${endpoint}`, error);
        throw error;
    }
};

export const clientAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/clients?${query}`, 'GET');
    },

    create: (data) => {
        return request('/v1/clients', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/clients/${id}`, 'PATCH', data);
    },

    // Según nueva documentación (07/02/2026): PATCH para activar/desactivar
    softDelete: (id) => {
        return request(`/v1/clients/${id}`, 'PATCH', { is_active: false });
    },

    reactivate: (id) => {
        return request(`/v1/clients/${id}`, 'PATCH', { is_active: true });
    },
};

export const invoiceAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/invoices?${query}`, 'GET');
    },

    getOne: (id) => {
        return request(`/v1/invoices/${id}`, 'GET');
    },

    getPdf: async (id) => {
        // Special case: we need the blob, not JSON
        const API_URL = import.meta.env.VITE_API_URL;
        const API_KEY = import.meta.env.VITE_API_KEY;

        if (!API_URL || !API_KEY) {
            console.error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing");
            throw new Error("Configuration Error");
        }

        const url = `${API_URL}/v1/invoices/${id}/pdf`;
        console.log("[DEBUG] Requesting PDF:", url);

        try {
            const response = await fetch(url, {
                headers: { 'x-api-key': API_KEY }
            });

            console.log("[DEBUG] PDF Response Status:", response.status);

            if (!response.ok) {
                const text = await response.text();
                console.error("[DEBUG] PDF Error Body:", text);
                throw new Error(`Failed to download PDF (${response.status})`);
            }
            return await response.blob();
        } catch (error) {
            console.error("[DEBUG] PDF Fetch Error:", error);
            throw error;
        }
    }
};

export const servicesAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/services?${query}`, 'GET');
    },

    create: (data) => {
        return request('/v1/services', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/services/${id}`, 'PATCH', data);
    },

    delete: (id, hard = false) => {
        const query = hard ? '?hard=true' : '';
        return request(`/v1/services/${id}${query}`, 'DELETE');
    },

    reactivate: (id) => {
        return request(`/v1/services/${id}/reactivate`, 'POST');
    }
};

export const plansAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/plans?${query}`, 'GET');
    },

    getActive: () => {
        return request('/v1/plans/active', 'GET');
    },

    getOne: (id) => {
        return request(`/v1/plans/${id}`, 'GET');
    },

    create: (data) => {
        return request('/v1/plans', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/plans/${id}`, 'PATCH', data);
    },

    delete: (id, hard = false) => {
        const query = hard ? '?hard=true' : '';
        return request(`/v1/plans/${id}${query}`, 'DELETE');
    }
};
