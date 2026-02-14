const request = async (endpoint, method = 'GET', body = null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const API_KEY = import.meta.env.VITE_API_KEY;

    if (!API_URL || !API_KEY) {
        throw new Error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing in .env");
    }

    const headers = {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

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

        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/account/change-password')) {
            console.warn("[API Client] 401 Unauthorized - Redirecting to login");
            localStorage.removeItem('token');
            localStorage.removeItem('vantra_user');
            window.location.href = '/login';
            return; // Detener ejecución
        }

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.details || errorMessage;
            } catch (e) {
                // Si el body no es JSON, mantenemos el mensaje por defecto
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        // Si es 204 No Content
        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error(`API Request failed: ${method} ${endpoint}`, error);
        throw error;
    }
};

export const authAPI = {
    login: (data) => {
        return request('/v1/auth/login', 'POST', data);
    },
    changePassword: (data) => {
        return request('/v1/account/change-password', 'POST', data);
    },
    updateProfile: (data) => {
        // CRITICAL: Backend does not support 'name' column yet.
        // We filter the payload to ONLY send 'email' to avoid 400/500 errors.
        const payload = {
            email: data.email
        };
        return request('/v1/account/profile', 'PATCH', payload);
    }
};

export const clientAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/clients?${query}`, 'GET');
    },

    getOne: async (id) => {
        // Fallback: The direct endpoint /v1/clients/:id is confirmed missing (404).
        // We fetch the list and find the client client-side.
        // We add a timestamp to try and bypass cache.
        const query = new URLSearchParams({ _t: Date.now() }).toString();
        const response = await request(`/v1/clients?${query}`, 'GET');
        const list = Array.isArray(response) ? response : (response.data || []);

        // Ensure lenient comparison (String vs Number)
        const found = list.find(c => String(c.id) === String(id));

        if (!found) throw new Error("Client not found in list");
        return found;
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
            const headers = { 'x-api-key': API_KEY };
            const token = localStorage.getItem('token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, { headers });

            console.log("[DEBUG] PDF Response Status:", response.status);

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('vantra_user');
                window.location.href = '/login';
                return;
            }

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

// --- NEW V2 ARCHITECTURE ---

// 1. CATALOG API (Global Settings / Menu)
export const catalogAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams({ ...params, _t: Date.now() }).toString();
        return request(`/v1/catalog?${query}`, 'GET');
    },

    create: (data) => {
        // data: { name, default_price, ... , is_custom: true }
        return request('/v1/catalog', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/catalog/${id}`, 'PUT', data);
    },

    delete: (id) => {
        return request(`/v1/catalog/${id}`, 'DELETE');
    },

    restore: (id) => {
        return request(`/v1/catalog/${id}/restore`, 'POST');
    }
};

// 2. COMBOS API (Global Settings / Packs)
export const combosAPI = {
    getAll: () => {
        const query = new URLSearchParams({ _t: Date.now() }).toString();
        return request(`/v1/combos?${query}`, 'GET');
    },

    create: (data) => {
        // data: { name, items: [{ catalog_item_id, quantity }] }
        return request('/v1/combos', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/combos/${id}`, 'PATCH', data);
    },

    delete: (id) => {
        return request(`/v1/combos/${id}`, 'DELETE');
    }
};

// 3. SERVICES API (Client Instances / Plates Served)
export const servicesAPI = {
    // List services for a specific client
    getByClient: (clientId) => {
        // Strict path: /services/client/:clientId (Singular)
        return request(`/v1/services/client/${clientId}`, 'GET');
    },

    // Sync full budget (Mirror)
    sync: (clientId, servicesArray) => {
        // Strict path: /services/client/:clientId/sync (Singular)
        // Payload: { services: [{ ... }] } wrapper is REQUIRED by docs
        return request(`/v1/services/client/${clientId}/sync`, 'PUT', { services: servicesArray });
    },

    // Legacy assign for backward compatibility if needed, but discouraged
    assignToClient: (clientId, catalogItemId, options = {}) => {
        const payload = { catalog_item_id: catalogItemId };
        if (typeof options === 'number') {
            payload.price = options;
        } else if (typeof options === 'object') {
            if (options.price !== undefined) payload.price = options.price;
            if (options.origin_combo_id) payload.origin_combo_id = options.origin_combo_id;
        }
        return request(`/v1/services/clients/${clientId}/single`, 'POST', payload);
    },

    assignComboToClient: (clientId, comboId) => {
        return request(`/v1/services/clients/${clientId}/bundle`, 'POST', { combo_service_id: comboId });
    },

    remove: (serviceInstanceId) => {
        return request(`/v1/services/${serviceInstanceId}`, 'DELETE');
    }
};
