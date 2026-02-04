import { v4 as uuidv4 } from 'uuid';
import { clientAPI } from './apiClient';

// --- HELPER LOCALSTORAGE ---
const DATA_VERSION = 'v4-fix-catalog'; // Increment to force reset

// --- CONSTANTES ---
const PLANS_CATALOG = [
    { id: 'p1', name: "Plan Hogar 100MB", price: 18000, desc: "FTTH 100MB Residencial" },
    { id: 'p2', name: "Plan Hogar 300MB", price: 25000, desc: "FTTH 300MB Residencial + TV" },
    { id: 'p3', name: "Pyme Pack 300MB", price: 45000, desc: "Internet Simétrico + 1 IP Fija" },
    { id: 'p4', name: "Corp Dedicado 100MB", price: 120000, desc: "Enlace Dedicado SLA 99.9%" }
];

// --- HELPER LOCALSTORAGE (ROBUST) ---
const loadData = (key, defaultData) => {
    // Versionado por key para evitar race conditions
    const hiddenVersion = localStorage.getItem(`vantra_version_${key}`);
    const stored = localStorage.getItem(`vantra_${key}`);

    // Si la versión para ESTA key no coincide, forzamos reset
    if (hiddenVersion !== DATA_VERSION) {
        console.warn(`[MockBackend] Version Check for '${key}': ${hiddenVersion} != ${DATA_VERSION}. FORCING RESET.`);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        localStorage.setItem(`vantra_version_${key}`, DATA_VERSION);
        return defaultData;
    }

    // Si no hay persistencia, guardamos y retornamos default
    if (!stored) {
        console.log(`[MockBackend] Init '${key}' -> Saving ${defaultData.length} items.`);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        localStorage.setItem(`vantra_version_${key}`, DATA_VERSION);
        return defaultData;
    }

    try {
        const parsedData = JSON.parse(stored);

        if (!Array.isArray(parsedData)) {
            console.error(`[MockBackend] Data for '${key}' is broken. Resetting.`);
            localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
            localStorage.setItem(`vantra_version_${key}`, DATA_VERSION);
            return defaultData;
        }

        console.log(`[MockBackend] Loaded '${key}' (${parsedData.length} items) from Persistence.`);
        return parsedData;

    } catch (e) {
        console.warn(`[MockBackend] Error loading '${key}'. Resetting.`, e);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        localStorage.setItem(`vantra_version_${key}`, DATA_VERSION);
        return defaultData;
    }
};

const saveData = (key, data) => {
    localStorage.setItem(`vantra_${key}`, JSON.stringify(data));
};

// --- ADAPTER / TRANSFORMER ---
// Helper to strip HTML but preserve line breaks
const stripHtml = (html) => {
    if (!html) return '';
    // 1. Replace block tags and breaks with newlines
    let text = html.replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n');

    // 2. Strip all other tags
    text = text.replace(/<[^>]+>/g, '');

    // 3. Decode basic entities (optional, can be expanded)
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    return text.trim();
};

// Transforma la respuesta de la API al formato esperado por la UI
const adaptClient = (apiClient) => {
    // Definimos balance y deuda
    const rawBalance = Number(apiClient.current_balance ?? apiClient.saldo ?? apiClient.balance ?? 0);
    const debt = rawBalance < 0 ? Math.abs(rawBalance) : 0;

    // UI Identity Logic:
    // User wants Company Name as the main "Name" in the list.
    const displayName = apiClient.company_name || apiClient.business_name || apiClient.name || 'Sin Nombre';

    return {
        id: apiClient.id, // UUID

        // Identity
        name: displayName,
        businessName: apiClient.company_name || '',
        contactName: apiClient.nombre || apiClient.contact_name || '', // Persona de contacto
        dni: apiClient.dni || '',
        altContact: apiClient.contacto || '', // Contacto alternativo

        // Tax / Legal
        cuit: apiClient.tax_id || apiClient.cuit || '',
        tax_id: apiClient.tax_id || '',
        tax_condition: apiClient.tax_condition || 'consumidor_final',
        internalCode: apiClient.internal_code || '',

        // Contact
        email: apiClient.email_billing || apiClient.email || '',
        phone: apiClient.phone_whatsapp || '',
        whatsapp: apiClient.phone_whatsapp || '', // Specific field for UI links
        address: apiClient.address || '',

        // Location
        city: apiClient.localidad || '',
        zipCode: apiClient.codigopostal || '',
        province: apiClient.provincia || '',

        // Categorization
        category: apiClient.categoria || '',
        status: apiClient.status || 'potential',
        is_active: apiClient.is_active ?? ['active', 'billed', 'to_bill'].includes(apiClient.status),

        // Financial
        balance: rawBalance,
        debt: debt,
        servicePlan: apiClient.service_plan || apiClient.plan_name || 'Sin Plan',
        priceListId: apiClient.idlista,
        priceListName: apiClient.lista,

        // Notes / Metadata
        obs: stripHtml(apiClient.observacion || ''),
        internalObs: stripHtml(apiClient.obsinterna || ''),
        metadata: apiClient.metadata || {},

        created_at: apiClient.created_at || new Date().toISOString()
    };
};

// --- GENERADOR DE DATOS (SEED) ---
const generateMockData = () => {
    // MIGRATION: Deshabilitamos generación de clientes porque ahora vienen de la API.
    const clients = [];
    const services = []; // También vaciamos servicios mock iniciales

    return { clients, services };
};

const { clients: MOCK_CLIENTS_GENERATED, services: MOCK_SERVICES_GENERATED } = generateMockData();

// Ya no usamos INITIAL_CLIENTS para persistencia local de clientes
const INITIAL_CLIENTS = [];
const INITIAL_SERVICES = MOCK_SERVICES_GENERATED;
const INITIAL_CATALOG = PLANS_CATALOG.map(p => ({
    ...p,
    createdAt: new Date().toISOString()
}));

// Mapeo Inverso: UI -> API (para Create/Update)
const adaptClientForApi = (uiData) => {
    return {
        // Obligatorios
        company_name: uiData.businessName || uiData.company_name, // API requires company_name
        tax_id: uiData.cuit || uiData.tax_id,
        email_billing: uiData.email || uiData.email_billing,

        // Opcionales
        tax_condition: uiData.tax_condition,
        phone_whatsapp: uiData.phone || uiData.phone_whatsapp,
        address: uiData.address,
        localidad: uiData.city,
        codigopostal: uiData.zipCode,
        provincia: uiData.province,

        categoria: uiData.category,

        // Contacto
        nombre: uiData.name || uiData.contactName, // 'nombre' is contact name in API
        dni: uiData.dni,

        // Status
        status: uiData.status,

        // Notas
        obsinterna: uiData.internalObs,
        // No enviamos observacion pública por ahora si no está en el form, o mapeamos si existiera
    };
};

export const mockBackend = {
    // === CLIENTES (API REAL via Adapter) ===
    getClients: async () => {
        try {
            // Llamada a API Real: Traemos 100 para evitar paginación inmediata
            const response = await clientAPI.getAll({ limit: 100 });

            // TRANSFORMACIÓN: { data: [], pagination: {} } -> []
            const rawList = Array.isArray(response) ? response : (response?.data || []);

            // Adaptamos cada cliente al formato UI
            return rawList.map(adaptClient);

        } catch (error) {
            console.error("[MockBackend] Failed to fetch clients from API:", error);
            // Fallback seguro para no romper UI
            return [];
        }
    },



    createClient: async (clientData) => {
        try {
            const apiBody = adaptClientForApi(clientData);
            const response = await clientAPI.create(apiBody);
            // La API debería devolver el objeto creado o { data: object }
            const rawClient = response.data || response;
            return adaptClient(rawClient);
        } catch (error) {
            console.error("[MockBackend] Failed to create client:", error);
            throw error;
        }
    },

    updateClient: async (clientId, updates) => {
        try {
            const apiBody = adaptClientForApi(updates);
            const response = await clientAPI.update(clientId, apiBody);
            const rawClient = response.data || response;
            return adaptClient(rawClient);
        } catch (error) {
            console.error("[MockBackend] Failed to update client:", error);
            throw error;
        }
    },

    // === FACTURAS ===
    createInvoice: async (clientId, invoiceData) => {
        // invoiceData: { items: [], total: number, date: string, dueDate: string, number: string, invoiceType: string }
        await new Promise(r => setTimeout(r, 600));

        const invoices = loadData('invoices', []); // Load from separate 'vantra_invoices'

        const newInvoice = {
            id: uuidv4(),
            clientId,
            status: 'pending', // Default status
            created_at: new Date().toISOString(),
            ...invoiceData
        };

        invoices.push(newInvoice);
        saveData('invoices', invoices);

        // NOTE: We intentionally DO NOT update client debt/balance here per requirement.
        return newInvoice;
    },

    getClientInvoices: async (clientId) => {
        await new Promise(r => setTimeout(r, 300));
        const invoices = loadData('invoices', []);
        // Return invoices for this client, sorted by date (newest first)
        return invoices
            .filter(inv => inv.clientId.toString() === clientId.toString())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    updateInvoiceStatus: async (invoiceId, newStatus) => {
        await new Promise(r => setTimeout(r, 300));
        const invoices = loadData('invoices', []);
        const index = invoices.findIndex(inv => inv.id === invoiceId);

        if (index === -1) throw new Error("Invoice not found");

        invoices[index].status = newStatus;
        saveData('invoices', invoices);

        return invoices[index];
    },

    // === SERVICIOS / PRESUPUESTO MATRIZ ===
    getClientServices: async (clientId) => {
        await new Promise(r => setTimeout(r, 300));
        const services = loadData('services', INITIAL_SERVICES);
        // Filter by client_id. Note: The seed data uses 'client_id', ensuring consistent usage.
        // However, the UI 'mockClients' structure in `ClientDetailPage` expected nested `activeServices`.
        // We are decoupling this, so `getClientServices` returning an array is correct.
        return services.filter(s => s.client_id === clientId);
    },

    addClientService: async (serviceData) => {
        // serviceData: { client_id, name, price, type, ... }
        await new Promise(r => setTimeout(r, 400));
        const services = loadData('services', INITIAL_SERVICES);
        const newService = {
            id: uuidv4(),
            startDate: new Date().toISOString().split('T')[0],
            ...serviceData
        };
        services.push(newService);
        saveData('services', services);
        return newService;
    },

    deleteClientService: async (serviceId) => {
        await new Promise(r => setTimeout(r, 300));
        let services = loadData('services', INITIAL_SERVICES);
        services = services.filter(s => s.id !== serviceId);
        saveData('services', services);
        return true;
    },

    // === CATALOGO DE SERVICIOS (ServicesPage) ===
    getCatalog: async () => {
        await new Promise(r => setTimeout(r, 400));
        // Fallback to initial hardcoded catalog if empty, or just return empty?
        // Ideally we should import mockServicesCatalog here for seeding, but to avoid circular deps or complexity, 
        // let's assume the UI handles seeding or we just return what's in localstorage.
        return loadData('catalog', INITIAL_CATALOG);
    },

    createService: async (serviceData) => {
        await new Promise(r => setTimeout(r, 500));
        const catalog = loadData('catalog', []);
        const newService = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            ...serviceData
        };
        catalog.push(newService);
        saveData('catalog', catalog);
        return newService;
    },

    updateService: async (id, data) => {
        await new Promise(r => setTimeout(r, 400));
        const catalog = loadData('catalog', []);
        const index = catalog.findIndex(s => s.id === id);
        if (index === -1) throw new Error("Service not found");

        const updated = { ...catalog[index], ...data };
        catalog[index] = updated;
        saveData('catalog', catalog);
        return updated;
    },

    deleteService: async (id) => {
        await new Promise(r => setTimeout(r, 400));
        let catalog = loadData('catalog', []);
        catalog = catalog.filter(s => s.id !== id);
        saveData('catalog', catalog);
        return true;
    },

    // === METADATA (Statuses/Columns) ===
    getStatuses: async () => {
        // In a real app, this might come from a DB table 'crm_columns'
        // For now we return the default structure expected by Kanban/Dropdowns
        return [
            { id: 'potential', title: 'POTENCIAL' },
            { id: 'contacted', title: 'CONTACTADO' },
            { id: 'budgeted', title: 'PRESUPUESTADO' },
            { id: 'to_bill', title: 'A FACTURAR' },
            { id: 'billed', title: 'FACTURADO' },
        ];
    }
};
