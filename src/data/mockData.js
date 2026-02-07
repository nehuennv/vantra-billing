// src/data/mockData.js

export const mockClients = [
    {
        id: 1,
        name: "Juan Pérez",
        businessName: "Kiosco El 24", // Razón Social
        cuit: "20-12345678-9",
        status: "active", // active, potential, suspended
        servicePlan: "Internet 50Mb Fibra",
        recurringAmount: 15000, // Lo que paga por mes
        debt: 15000, // Deuda actual
        email: "juan@kiosco.com",
        lastPayment: "2023-10-05",
    },
    {
        id: 2,
        name: "Mariana Tech SRL",
        businessName: "Mariana Tech SRL",
        cuit: "30-87654321-0",
        status: "active",
        servicePlan: "Internet 300Mb Dedicado + IP Fija",
        recurringAmount: 85000,
        debt: 0, // Al día
        email: "admin@marianatech.com",
        lastPayment: "2023-11-02",
    },
    {
        id: 3,
        name: "Carlos 'El Mecánico'",
        businessName: null, // Consumidor final
        cuit: "20-11223344-5",
        status: "potential", // Todavía no es cliente
        servicePlan: "Pendiente cotización",
        recurringAmount: 0,
        debt: 0,
        email: "carlos@taller.com",
        lastPayment: null,
    },
    {
        id: 4,
        name: "Clinica Salud",
        businessName: "Salud SA",
        cuit: "30-99887766-1",
        status: "debtor", // Debe plata
        servicePlan: "Pack Corporativo 100Mb",
        recurringAmount: 45000,
        debt: 90000, // Debe 2 meses
        email: "pagos@salud.com",
        lastPayment: "2023-09-01",
    },
];

export const mockStats = {
    totalRevenue: 1250000, // Facturado
    collected: 980000,     // Cobrado real (Caja)
    pending: 270000,       // En la calle
    activeClients: 142,
};

// Plantillas de Presupuestos (Packs)
export const mockServicesCatalog = [];

export const mockBudgetTemplates = [];