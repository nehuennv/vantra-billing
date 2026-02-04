import { v4 as uuidv4 } from 'uuid';

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

// --- CALCULADOR DE DEUDA/BALANCE ---
// Helper para asignar deuda realista según estado
const getBalanceForStatus = (status) => {
    if (status === 'debtor') return -Math.floor(Math.random() * 100000 + 10000);
    if (status === 'potential' || status === 'contacted') return 0;
    return 0; // Active usually 0 or positive if paid
};

// --- GENERADOR DE DATOS (SEED) ---
const generateMockData = () => {
    const clients = [];
    const services = [];

    const names = ["Tech", "Global", "Net", "Fibra", "Data", "Cloud", "Sistemas", "Redes", "Conexión", "Digital"];
    const suffixes = ["Solutions", "Corp", "Argentina", "S.A.", "S.R.L.", "Group", "Services", "Latam"];
    const firstNames = ["Juan", "María", "Carlos", "Ana", "Pedro", "Sofía", "Miguel", "Lucía", "Diego", "Valentina"];
    const lastNames = ["Pérez", "García", "González", "Rodríguez", "López", "Martínez", "Fernández", "Díaz"];
    const streets = ["Av. Corrientes", "Av. Libertador", "San Martín", "Belgrano", "Rivadavia", "Mitre"];
    const cities = ["CABA", "Córdoba", "Rosario", "Mendoza", "La Plata"];

    const statuses = ['potential', 'contacted', 'budgeted', 'to_bill', 'billed', 'active', 'debtor'];

    for (let i = 1; i <= 150; i++) {
        const isCompany = Math.random() > 0.4;
        let name, businessName, cuit;

        if (isCompany) {
            businessName = `${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
            name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`; // Contact person
            cuit = `30-${Math.floor(20000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`;
        } else {
            name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            businessName = "";
            cuit = `20-${Math.floor(20000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`;
        }

        const clientId = `c${i}`;
        // Weighted status probability for variety
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const balance = getBalanceForStatus(status);
        const debt = balance < 0 ? Math.abs(balance) : 0;

        // Plan assignment
        const plan = PLANS_CATALOG[Math.floor(Math.random() * PLANS_CATALOG.length)];

        clients.push({
            id: clientId,
            name: name,
            businessName: businessName, // Field expected by UI
            company_name: businessName || name, // Compat
            cuit: cuit,
            tax_id: cuit,
            email: `contacto@${(businessName || name).toLowerCase().replace(/[^a-z]/g, '')}.com`,
            address: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(Math.random() * 5000)}, ${cities[Math.floor(Math.random() * cities.length)]}`,
            status: status,
            is_active: ['active', 'billed', 'to_bill'].includes(status),
            balance: balance,
            debt: debt,
            servicePlan: plan.name,
            tax_condition: isCompany ? "responsable_inscripto" : "consumidor_final",
            created_at: new Date(2023, 0, 1).toISOString()
        });

        // Add service if active-ish
        if (['active', 'billed', 'to_bill', 'debtor'].includes(status)) {
            services.push({
                id: `s${i}`,
                client_id: clientId,
                name: plan.name,
                description: plan.desc,
                price: plan.price,
                unit_price: plan.price,
                type: 'recurring',
                is_recurrent: true,
                startDate: "2024-01-15"
            });
        }
    }

    return { clients, services };
};

const { clients: MOCK_CLIENTS_GENERATED, services: MOCK_SERVICES_GENERATED } = generateMockData();

console.log(`[DEBUG] MOCK BACKEND DATA GENERATED: ${MOCK_CLIENTS_GENERATED.length} Clients, ${MOCK_SERVICES_GENERATED.length} Services.`);

const INITIAL_CLIENTS = MOCK_CLIENTS_GENERATED;
const INITIAL_SERVICES = MOCK_SERVICES_GENERATED;
const INITIAL_CATALOG = PLANS_CATALOG.map(p => ({
    ...p,
    createdAt: new Date().toISOString()
}));

export const mockBackend = {
    // === CLIENTES ===
    getClients: async () => {
        await new Promise(r => setTimeout(r, 500));
        return loadData('clients', INITIAL_CLIENTS);
    },

    // Updated createClient to be consistent
    createClient: async (clientData) => {
        await new Promise(r => setTimeout(r, 500));
        const clients = loadData('clients', INITIAL_CLIENTS);
        const newClient = {
            id: uuidv4(),
            created_at: new Date().toISOString(),
            status: 'potential', // Default status
            is_active: true,
            balance: 0,
            debt: 0,
            servicePlan: 'Sin Plan',
            tax_condition: 'consumidor_final', // Default fallback
            ...clientData
        };
        clients.push(newClient);
        saveData('clients', clients);
        return newClient;
    },

    updateClient: async (clientId, updates) => {
        await new Promise(r => setTimeout(r, 400));
        const clients = loadData('clients', INITIAL_CLIENTS);
        const index = clients.findIndex(c => c.id === clientId);
        if (index === -1) throw new Error("Client not found");

        const updatedClient = { ...clients[index], ...updates };
        clients[index] = updatedClient;
        saveData('clients', clients);
        return updatedClient;
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
