// src/services/mockBackend.js
import { v4 as uuidv4 } from 'uuid';

// --- 1. BASE DE DATOS LOCAL (SIMULADA) ---
const DATA_VERSION = 'v2-seed-150'; // Cambiar esto forzará el reset de todos los datos

const loadData = (key, defaultData) => {
    const hiddenVersion = localStorage.getItem('vantra_data_version');
    const stored = localStorage.getItem(`vantra_${key}`);

    // Si la versión cambió, forzamos la recarga de TODO
    if (hiddenVersion !== DATA_VERSION) {
        console.warn(`[MockBackend] Nueva versión de datos detectada (${DATA_VERSION}). Reseteando '${key}'...`);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        // Guardamos la nueva versión AL FINAL (o en cada llamada, no importa, pero lo principal es limpiar lo viejo)
        if (key === 'clients') { // Solo seteamos la versión una vez para evitar race conditions visuales, aunque es safe
            localStorage.setItem('vantra_data_version', DATA_VERSION);
        }
        return defaultData;
    }

    // Si no hay persistencia, guardamos y retornamos default
    if (!stored) {
        console.log(`[MockBackend] Init '${key}' -> Saving ${defaultData.length} items.`);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        return defaultData;
    }

    try {
        const parsedData = JSON.parse(stored);

        if (!Array.isArray(parsedData)) {
            console.error(`[MockBackend] Data for '${key}' is not an array. Resetting.`);
            throw new Error("Invalid format");
        }

        console.log(`[MockBackend] Loaded '${key}': ${parsedData.length} items from persistence.`);
        return parsedData;

    } catch (e) {
        console.warn(`[MockBackend] Error loading '${key}'. Resetting to defaults.`, e);
        localStorage.setItem(`vantra_${key}`, JSON.stringify(defaultData));
        return defaultData;
    }
};

const saveData = (key, data) => {
    localStorage.setItem(`vantra_${key}`, JSON.stringify(data));
};

// --- 2. GENERADOR DE DATOS DE PRUEBA (SEED) ---
const generateMockData = () => {
    const clients = [];
    const services = [];

    // Datos base para mezclar
    const names = ["Tech", "Global", "Net", "Fibra", "Data", "Cloud", "Sistemas", "Redes", "Conexión", "Digital"];
    const suffixes = ["Solutions", "Corp", "Argentina", "S.A.", "S.R.L.", "Group", "Services", "Latam"];
    const firstNames = ["Juan", "María", "Carlos", "Ana", "Pedro", "Sofía", "Miguel", "Lucía", "Diego", "Valentina"];
    const lastNames = ["Pérez", "García", "González", "Rodríguez", "López", "Martínez", "Fernández", "Díaz"];
    const streets = ["Av. Corrientes", "Av. Libertador", "San Martín", "Belgrano", "Rivadavia", "Mitre", "Alvear", "9 de Julio"];
    const cities = ["CABA", "Córdoba", "Rosario", "Mendoza", "La Plata", "Mar del Plata"];

    const plans = [
        { name: "Plan Hogar 100MB", price: 18000, desc: "FTTH 100MB Residencial" },
        { name: "Plan Hogar 300MB", price: 25000, desc: "FTTH 300MB Residencial + TV" },
        { name: "Plan Gamer 500MB", price: 35000, desc: "FTTH 500MB Baja Latencia" },
        { name: "Pyme Pack 300MB", price: 45000, desc: "Internet Simétrico + 1 IP Fija" },
        { name: "Corp Dedicado 100MB", price: 120000, desc: "Enlace Dedicado SLA 99.9%" },
        { name: "Corp Dedicado 1GB", price: 350000, desc: "Fibra Oscura 1GBps" }
    ];

    // 1. Crear 150 Clientes
    for (let i = 1; i <= 150; i++) {
        const isCompany = Math.random() > 0.4;
        let name, taxId, taxCondition;

        if (isCompany) {
            name = `${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
            taxId = `30-${Math.floor(20000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`;
            taxCondition = "responsable_inscripto";
        } else {
            name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
            taxId = `20-${Math.floor(20000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`;
            taxCondition = Math.random() > 0.5 ? "consumidor_final" : "monotributo";
        }

        const clientId = `c${i}`;
        const statusRand = Math.random();
        let status = "active";
        if (statusRand > 0.85) status = "debtor";
        else if (statusRand > 0.75) status = "potential";
        else if (statusRand > 0.70) status = "installation";

        clients.push({
            id: clientId,
            company_name: name,
            name: name,
            tax_id: taxId,
            cuit: taxId,
            email_billing: `facturacion@${name.toLowerCase().replace(/\s/g, '')}.com`,
            email: `contacto@${name.toLowerCase().replace(/\s/g, '')}.com`,
            address: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(Math.random() * 5000)}, ${cities[Math.floor(Math.random() * cities.length)]}`,
            is_active: status === 'active',
            status: status,
            tax_condition: taxCondition,
            balance: status === 'debtor' ? -Math.floor(Math.random() * 100000) : 0,
            created_at: new Date(2023, Math.floor(Math.random() * 11), Math.floor(Math.random() * 28)).toISOString()
        });

        if (status === 'active' || status === 'debtor') {
            const possiblePlans = isCompany ? plans.slice(3) : plans.slice(0, 3);
            const selectedPlan = possiblePlans[Math.floor(Math.random() * possiblePlans.length)];

            services.push({
                id: `s${i}_1`,
                client_id: clientId,
                description: selectedPlan.desc,
                name: selectedPlan.name,
                unit_price: selectedPlan.price,
                price: selectedPlan.price,
                is_recurrent: true,
                type: 'recurring',
                startDate: "2024-01-15"
            });
        }
    }

    return { clients, services };
};

// Generar datos iniciales
const { clients: MOCK_CLIENTS_GENERATED, services: MOCK_SERVICES_GENERATED } = generateMockData();

console.log(`[DEBUG] Generados ${MOCK_CLIENTS_GENERATED.length} clientes y ${MOCK_SERVICES_GENERATED.length} servicios en memoria.`);

const INITIAL_CLIENTS = MOCK_CLIENTS_GENERATED;
const INITIAL_SERVICES = MOCK_SERVICES_GENERATED;
const INITIAL_INVOICES = [];

// --- 3. SERVICIO (API MOCK COMPLETA) ---

export const mockBackend = {

    // === CLIENTES ===
    getClients: async () => {
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
            status: 'potential',
            ...clientData
        };
        clients.push(newClient);
        saveData('clients', clients);
        return newClient;
    },

    updateClient: async (clientId, updatedData) => {
        await new Promise(r => setTimeout(r, 500));
        let clients = loadData('clients', INITIAL_CLIENTS);
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updatedData };
            saveData('clients', clients);
            return clients[index];
        }
        throw new Error("Cliente no encontrado");
    },

    // Helper para el Kanban
    getStatuses: async () => {
        return [
            { id: 'potential', title: 'POTENCIAL' },
            { id: 'installation', title: 'EN INSTALACIÓN' },
            { id: 'active', title: 'ACTIVO' },
            { id: 'debtor', title: 'DEUDOR' }
        ];
    },

    // === SERVICIOS / PRESUPUESTO ===
    getClientServices: async (clientId) => {
        await new Promise(r => setTimeout(r, 400));
        const services = loadData('services', INITIAL_SERVICES);
        return services.filter(s => s.client_id === clientId);
    },

    addClientService: async (serviceData) => {
        await new Promise(r => setTimeout(r, 600));
        const services = loadData('services', INITIAL_SERVICES);
        const newService = {
            id: uuidv4(),
            ...serviceData,
            name: serviceData.name || serviceData.description, // Compatibilidad
            price: serviceData.price || serviceData.unit_price, // Compatibilidad
            type: serviceData.is_recurrent ? 'recurring' : 'one-off'
        };
        services.push(newService);
        saveData('services', services);
        return newService;
    },

    deleteClientService: async (serviceId) => {
        await new Promise(r => setTimeout(r, 400));
        let services = loadData('services', INITIAL_SERVICES);
        services = services.filter(s => s.id !== serviceId);
        saveData('services', services);
        return true;
    },

    // === FACTURACIÓN ===

    // Obtener historial de un cliente
    getClientInvoices: async (clientId) => {
        await new Promise(r => setTimeout(r, 400));
        // Guardamos las facturas en 'vantra_invoices' separadas de los clientes
        const invoices = loadData('invoices', INITIAL_INVOICES);
        return invoices
            .filter(inv => inv.client_id === clientId)
            .sort((a, b) => new Date(b.issueDate || b.created_at) - new Date(a.issueDate || a.created_at));
    },

    // Crear factura (versión nueva con argumentos)
    createInvoice: async (clientId, invoiceData) => {
        await new Promise(r => setTimeout(r, 1000));
        const invoices = loadData('invoices', INITIAL_INVOICES);

        const newInvoice = {
            id: uuidv4(),
            client_id: clientId,
            created_at: new Date().toISOString(),
            status: 'pending',
            ...invoiceData // number, issueDate, items, amount/total
        };

        invoices.push(newInvoice);
        saveData('invoices', invoices);
        return newInvoice;
    },

    // Cambiar estado (Pagado/Pendiente)
    updateInvoiceStatus: async (invoiceId, newStatus) => {
        await new Promise(r => setTimeout(r, 300));
        let invoices = loadData('invoices', INITIAL_INVOICES);
        const index = invoices.findIndex(i => i.id === invoiceId);

        if (index !== -1) {
            invoices[index].status = newStatus;
            saveData('invoices', invoices);
            return invoices[index];
        }
        return null;
    }
};