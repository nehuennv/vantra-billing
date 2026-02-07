import { v4 as uuidv4 } from 'uuid';
import { clientAPI, invoiceAPI, servicesAPI, plansAPI } from './apiClient';

// --- HELPER LOCALSTORAGE ---
const DATA_VERSION = 'v5-fix-keys'; // Increment to force reset

// --- HELPER IN-MEMORY STORE (No Persistence) ---
const memoryStore = {};

// --- CONSTANTES ---
const PLANS_CATALOG = []; // Empty catalog for testing

// --- HELPER STORAGE ---
const loadData = (key, defaultData) => {
    // Return from memory or default
    return memoryStore[key] || defaultData;
};

const saveData = (key, data) => {
    // Save to memory only
    memoryStore[key] = data;
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
        // Strict boolean from API. Default to true if undefined to avoid hiding valid clients.
        is_active: (apiClient.is_active === true || apiClient.is_active === 1 || apiClient.is_active === 'true') ?? true,

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
            // PASO 2: Llamar al apiClient real
            const response = await clientAPI.update(clientId, apiBody);
            // La API devuelve el objeto actualizado
            const rawClient = response.data || response;
            return adaptClient(rawClient);
        } catch (error) {
            console.error("[MockBackend] Failed to update client:", error);
            throw error;
        }
    },

    softDeleteClient: async (clientId) => {
        try {
            await clientAPI.softDelete(clientId);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to soft delete client:", error);
            throw error;
        }
    },

    reactivateClient: async (clientId) => {
        try {
            await clientAPI.reactivate(clientId);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to reactivate client:", error);
            throw error;
        }
    },

    hardDeleteClient: async (clientId) => {
        try {
            await clientAPI.delete(clientId);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to hard delete client:", error);
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
        try {
            // Llamada a API Real
            const response = await invoiceAPI.getAll({ client_id: clientId, limit: 100 });

            // API Response normalization
            const rawList = Array.isArray(response) ? response : (response?.data || []);

            console.log("[DEBUG] Raw Invoices from API:", rawList);

            // Mapper: API -> UI
            return rawList.map(inv => ({
                ...inv, // Spread all original fields first
                id: inv.id,
                clientId: inv.client_id,
                // Map status to what UI expects (lowercase)
                // API: 'DRAFT', 'EMITTED', 'PAID', 'VOID' -> UI: 'pending', 'paid', 'draft'
                status: inv.status === 'PAID' ? 'paid' : (inv.status === 'VOID' ? 'void' : 'pending'),
                originalStatus: inv.status, // Keep original for reference
                invoiceType: inv.invoice_type,
                number: inv.invoice_number,
                issueDate: inv.issue_date, // YYYY-MM-DD
                dueDate: inv.issue_date, // Needs mapping if available
                amount: Number(inv.total_amount),
                total: Number(inv.total_amount),
                description: `Factura ${inv.invoice_type} - ${inv.period_billed}`,
                created_at: inv.created_at,
                items: inv.items || []
            })).sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

        } catch (error) {
            console.error("[MockBackend] Failed to fetch invoices from API:", error);
            return [];
        }
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

    downloadInvoicePdf: async (invoiceId) => {
        try {
            return await invoiceAPI.getPdf(invoiceId);
        } catch (error) {
            console.error("[MockBackend] PDF Download failed:", error);
            throw error;
        }
    },

    getInvoice: async (invoiceId) => {
        try {
            const response = await invoiceAPI.getOne(invoiceId);
            return response.data || response;
        } catch (error) {
            console.error("[MockBackend] Failed to get single invoice:", error);
            throw error;
        }
    },

    // === SERVICIOS / PRESUPUESTO MATRIZ ===

    // === SERVICIOS / PRESUPUESTO MATRIZ ===
    // === SERVICIOS / PRESUPUESTO MATRIZ ===
    getClientServices: async (clientId) => {
        try {
            const response = await servicesAPI.getAll({ client_id: clientId, limit: 100 });
            const rawList = Array.isArray(response) ? response : (response?.data || []);

            return rawList.map(s => ({
                id: s.id,
                client_id: s.client_id,
                name: s.name, // Short Title
                description: s.description, // Detailed Description
                unit_price: Number(s.unit_price),
                price: Number(s.unit_price), // UI alias
                quantity: Number(s.quantity || 1),
                is_active: s.is_active,
                // API: 'recurring' | 'one_time' -> UI: 'recurring' | 'unique'
                type: s.service_type === 'recurring' ? 'recurring' : 'unique',
                api_service_type: s.service_type, // Keep original for reference
                startDate: s.start_date,
                icon: s.icon || 'Wifi',
                origin_plan_id: s.origin_plan_id
            }));
        } catch (error) {
            console.error("[MockBackend] Failed to get client services:", error);
            return [];
        }
    },

    addClientService: async (serviceData) => {
        console.log("[MockBackend] addClientService called with:", serviceData);
        try {
            // Map UI data to API body
            const apiBody = {
                client_id: serviceData.client_id,
                name: serviceData.name,
                description: serviceData.description || serviceData.name, // Fallback
                unit_price: serviceData.price || serviceData.unit_price,
                quantity: 1,
                is_active: true,
                start_date: serviceData.startDate || new Date().toISOString().split('T')[0],
                origin_plan_id: serviceData.origin_plan_id || serviceData.serviceId || null,
                icon: serviceData.icon || 'Wifi',
                // UI: 'recurring' | 'unique' -> API: 'recurring' | 'one_time'
                service_type: (serviceData.type === 'unique' || serviceData.type === 'one_time') ? 'one_time' : 'recurring'
            };

            const response = await servicesAPI.create(apiBody);
            const s = response.data || response;

            return {
                id: s.id,
                client_id: s.client_id,
                name: s.name,
                description: s.description,
                price: Number(s.unit_price),
                type: s.service_type === 'recurring' ? 'recurring' : 'unique',
                startDate: s.start_date,
                icon: s.icon,
                origin_plan_id: s.origin_plan_id
            };
        } catch (error) {
            console.error("[MockBackend] Failed to add client service:", error);
            throw error;
        }
    },

    updateClientService: async (serviceId, serviceData) => {
        try {
            const apiBody = {
                name: serviceData.name,
                description: serviceData.description,
                unit_price: serviceData.price || serviceData.unit_price,
                icon: serviceData.icon,
                // UI: 'recurring' | 'unique' -> API: 'recurring' | 'one_time'
                service_type: (serviceData.type === 'unique' || serviceData.type === 'one_time') ? 'one_time' : 'recurring'
            };

            await servicesAPI.update(serviceId, apiBody);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to update client service:", error);
            throw error;
        }
    },

    deleteClientService: async (serviceId) => {
        try {
            await servicesAPI.delete(serviceId); // Soft delete by default
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to delete client service:", error);
            throw error;
        }
    },

    reactivateClientService: async (serviceId) => {
        try {
            await servicesAPI.reactivate(serviceId);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to reactivate client service:", error);
            throw error;
        }
    },

    deleteClientService: async (serviceId) => {
        try {
            // Hard delete or soft? UI usually implies soft first, but "borrar" might mean hard.
            // We'll use soft delete (default) as per best practices, or hard if user requested "borrar".
            // Let's use soft delete for now.
            await servicesAPI.delete(serviceId);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to delete client service:", error);
            throw error;
        }
    },

    // === CATALOGO DE SERVICIOS (ServicesPage: TAB SERVICIOS) -> LOCAL STORAGE (Seeding) ===
    getCatalog: async () => {
        await new Promise(r => setTimeout(r, 400));
        // Recupere del storage local o use el mock inicial
        // Esto permite que el usuario cree servicios "base" localmente por ahora
        return loadData('catalog', []);
    },

    createService: async (serviceData) => {
        await new Promise(r => setTimeout(r, 500));
        const catalog = loadData('catalog', []);
        const newService = {
            id: uuidv4(), // Local UUID
            createdAt: new Date().toISOString(),
            ...serviceData,
            price: Number(serviceData.price || 0)
        };
        catalog.push(newService);
        saveData('catalog', catalog);
        return newService;
    },

    updateService: async (id, data) => {
        await new Promise(r => setTimeout(r, 400));
        const catalog = loadData('catalog', []);
        const index = catalog.findIndex(s => s.id === id);

        if (index === -1) {
            console.warn("Service not found locally to update:", id);
            return null;
        }

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

    // === GESTIÓN DE PRESUPUESTOS (ServicesPage: TAB PRESUPUESTOS) -> PLANS API ===
    getPlans: async () => {
        try {
            const response = await plansAPI.getAll({ limit: 100 });
            const rawList = Array.isArray(response) ? response : (response?.data || []);

            return rawList.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                totalPrice: Number(p.price || p.unit_price || 0), // Plans usually have a total price
                services: [], // API might not return nested services detail yet, or we assume it's a bundle
                isCustomPrice: false, // Default
                createdAt: p.created_at
            }));
        } catch (error) {
            console.error("[MockBackend] Failed to fetch plans:", error);
            return [];
        }
    },

    createPlan: async (planData) => {
        try {
            const apiBody = {
                name: planData.name,
                description: planData.description,
                unit_price: planData.totalPrice,
                price: planData.totalPrice,
                type: 'plan', // Explicitly marking as plan if needed
            };

            const response = await plansAPI.create(apiBody);
            const p = response.data || response;

            return {
                id: p.id,
                name: p.name,
                description: p.description,
                totalPrice: Number(p.price || p.unit_price),
                services: planData.services || [],
                createdAt: p.created_at
            };
        } catch (error) {
            console.error("[MockBackend] Failed to create plan:", error);
            throw error;
        }
    },

    updatePlan: async (id, data) => {
        try {
            const apiBody = {
                name: data.name,
                description: data.description,
                unit_price: data.totalPrice,
                price: data.totalPrice,
            };

            await plansAPI.update(id, apiBody);
            // Return updated local shape
            return {
                id,
                ...data
            };
        } catch (error) {
            console.error("[MockBackend] Failed to update plan:", error);
            throw error;
        }
    },

    deletePlan: async (id) => {
        try {
            await plansAPI.delete(id);
            return true;
        } catch (error) {
            console.error("[MockBackend] Failed to delete plan:", error);
            throw error;
        }
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
