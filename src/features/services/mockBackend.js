// src/services/mockBackend.js
import { v4 as uuidv4 } from 'uuid';

// --- 1. BASE DE DATOS LOCAL (SIMULADA) ---
// Aquí guardamos los datos en memoria del navegador (localStorage) para que no se borren al recargar.

const loadData = (key, defaultData) => {
    const stored = localStorage.getItem(`vantra_${key}`);
    return stored ? JSON.parse(stored) : defaultData;
};

const saveData = (key, data) => {
    localStorage.setItem(`vantra_${key}`, JSON.stringify(data));
};

// --- 2. DATOS INICIALES (Seed Data) ---
const INITIAL_CLIENTS = [
    {
        id: "c1",
        company_name: "Tech Solutions SA",
        tax_id: "30-71222333-1",
        email_billing: "admin@techsolutions.com",
        address: "Av. Corrientes 1234, CABA",
        is_active: true,
        status: "active", // Campo UI helper
        balance: -150000 // UI helper (calculado en back real)
    },
    {
        id: "c2",
        company_name: "Juan Pérez",
        tax_id: "20-11222333-4",
        email_billing: "juan@gmail.com",
        address: "Calle Falsa 123",
        is_active: true,
        status: "active",
        balance: 0
    }
];

const INITIAL_SERVICES = [
    { id: "s1", client_id: "c1", description: "Fibra Corporativa 500MB", unit_price: 150000, is_recurrent: true },
    { id: "s2", client_id: "c1", description: "IP Fija Adicional", unit_price: 10000, is_recurrent: true },
    { id: "s3", client_id: "c2", description: "Plan Hogar 100MB", unit_price: 25000, is_recurrent: true }
];

// --- 3. SERVICIO (API MOCK) ---

export const mockBackend = {

    // === CLIENTES ===
    getClients: async () => {
        // Simulamos delay de red
        await new Promise(r => setTimeout(r, 600));
        return loadData('clients', INITIAL_CLIENTS);
    },

    createClient: async (clientData) => {
        await new Promise(r => setTimeout(r, 800));
        const clients = loadData('clients', INITIAL_CLIENTS);

        const newClient = {
            id: uuidv4(),
            created_at: new Date().toISOString(),
            is_active: true,
            balance: 0,
            ...clientData // company_name, tax_id, etc.
        };

        clients.push(newClient);
        saveData('clients', clients);
        return newClient;
    },

    // === PRESUPUESTO MATRIZ (Servicios del Cliente) ===
    getClientServices: async (clientId) => {
        await new Promise(r => setTimeout(r, 400));
        const services = loadData('services', INITIAL_SERVICES);
        return services.filter(s => s.client_id === clientId);
    },

    addClientService: async (serviceData) => {
        // serviceData: { client_id, description, unit_price, is_recurrent }
        await new Promise(r => setTimeout(r, 600));
        const services = loadData('services', INITIAL_SERVICES);

        const newService = { id: uuidv4(), ...serviceData };
        services.push(newService);
        saveData('services', services);
        return newService;
    },

    // === FACTURACIÓN (El Motor) ===
    // Esta función es la que usarás en el botón "Generar Factura Manual"
    generateInvoice: async (clientId) => {
        await new Promise(r => setTimeout(r, 1500)); // Simula proceso pesado

        // 1. Buscamos al cliente y sus servicios
        const clients = loadData('clients', INITIAL_CLIENTS);
        const services = loadData('services', INITIAL_SERVICES);
        const invoices = loadData('invoices', []);

        const client = clients.find(c => c.id === clientId);
        const clientServices = services.filter(s => s.client_id === clientId);

        if (!clientServices.length) throw new Error("El cliente no tiene servicios configurados");

        // 2. Calculamos total
        const total = clientServices.reduce((sum, item) => sum + Number(item.unit_price), 0);

        // 3. Creamos la factura (Estructura real de la tabla invoices)
        const newInvoice = {
            id: uuidv4(),
            client_id: clientId,
            invoice_number: `A-0001-${String(invoices.length + 1).padStart(8, '0')}`,
            invoice_type: 'A',
            issue_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            total_amount: total,
            balance_due: total, // Al inicio debe todo
            status: 'DRAFT',
            // Simulamos items dentro (aunque en SQL sería otra tabla)
            items: clientServices
        };

        invoices.push(newInvoice);
        saveData('invoices', invoices);
        return newInvoice;
    },

    getInvoices: async () => {
        await new Promise(r => setTimeout(r, 500));
        return loadData('invoices', []);
    }
};