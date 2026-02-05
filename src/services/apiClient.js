const request = async (endpoint, method = 'GET', body = null) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const API_KEY = import.meta.env.VITE_API_KEY;

    if (!API_URL || !API_KEY) {
        throw new Error("Configuration Error: VITE_API_URL or VITE_API_KEY is missing in .env");
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
    };


    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    };

    try {
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
        const query = new URLSearchParams(params).toString();
        return request(`/v1/clients?${query}`, 'GET');
    },

    create: (data) => {
        return request('/v1/clients', 'POST', data);
    },

    update: (id, data) => {
        return request(`/v1/clients/${id}`, 'PATCH', data);
    },

    delete: (id) => {
        return request(`/v1/clients/${id}`, 'DELETE');
    }
};
