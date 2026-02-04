import { v4 as uuidv4 } from 'uuid';

// --- HELPER LOCALSTORAGE ---
const loadData = (key, defaultData) => {
    const stored = localStorage.getItem(`vantra_${key}`);
    return stored ? JSON.parse(stored) : defaultData;
};

const saveData = (key, data) => {
    localStorage.setItem(`vantra_${key}`, JSON.stringify(data));
};

// --- DATA INICIAL (Seed) ---
const INITIAL_CLIENTS = [
    {
        id: "c1",
        company_name: "Tech Solutions SA", // kept for compatibility if needed, but UI uses 'businessName' sometimes? Check CRMPage.
        // CRMPage uses: name, businessName, cuit, servicePlan, status, debt.
        // Let's ensure seed data matches CRMPage expectations nicely.
        name: "Juan Perez",
        businessName: "Tech Solutions SA",
        cuit: "30-71222333-1",
        email: "admin@techsolutions.com",
        address: "Av. Corrientes 1234, CABA",
        status: "active",
        is_active: true,
        balance: -150000,
        debt: 150000, // Explicit debt for UI
        servicePlan: "Fibra Corporativa 500MB", // Display field
        tax_condition: "responsable_inscripto" // Default expected for corporate
    }
];

const INITIAL_SERVICES = [
    { id: "s1", client_id: "c1", name: "Fibra Corporativa 500MB", price: 150000, type: "recurring", startDate: "2024-01-01" },
    { id: "s2", client_id: "c1", name: "IP Fija Adicional", price: 10000, type: "recurring", startDate: "2024-01-01" }
];

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
        // invoiceData: { items: [], total: number, date: string, dueDate: string, number: string }
        await new Promise(r => setTimeout(r, 600));

        const clients = loadData('clients', INITIAL_CLIENTS);
        const clientIndex = clients.findIndex(c => c.id === clientId);
        if (clientIndex === -1) throw new Error("Client not found");

        const newInvoice = {
            id: uuidv4(),
            clientId,
            status: 'pending', // Default status
            created_at: new Date().toISOString(),
            ...invoiceData
        };

        // Update Client Debt/Balance
        // Assuming invoice increases debt
        clients[clientIndex].debt = (clients[clientIndex].debt || 0) + newInvoice.total;

        // Add invoice to client's invoice history (if nested) or separate table
        // The current ClientDetailPage reads `client.invoices`. 
        // Let's ensure we update that.
        if (!clients[clientIndex].invoices) {
            clients[clientIndex].invoices = [];
        }
        clients[clientIndex].invoices.unshift(newInvoice); // Add to top

        saveData('clients', clients);
        return newInvoice;
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
