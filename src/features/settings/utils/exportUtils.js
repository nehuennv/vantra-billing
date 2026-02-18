import { clientAPI, invoiceAPI, catalogAPI, combosAPI, servicesAPI } from "../../../services/apiClient";

/**
 * Downloads a string content as a file in the browser.
 * @param {string} content - The content to download (JSON string or CSV string).
 * @param {string} filename - The name of the file to save.
 * @param {string} contentType - The MIME type of the file (e.g., 'application/json', 'text/csv').
 */
export const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data - The data to convert.
 * @param {Array<{header: string, key: string | function}>} columns - The columns configuration.
 * @returns {string} The CSV string.
 */
export const convertArrayToCSV = (data, columns) => {
    if (!data || !data.length) return "";

    const headerRow = columns.map(col => `"${col.header}"`).join(",");
    const rows = data.map(row => {
        return columns.map(col => {
            const value = typeof col.key === 'function' ? col.key(row) : row[col.key];
            const stringValue = value === null || value === undefined ? "" : String(value);
            // Escape double quotes by doubling them
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(",");
    });

    return [headerRow, ...rows].join("\n");
};

/**
 * Generates a CSV content string for Clients.
 * @param {Array<Object>} clients 
 * @returns {string} CSV content
 */
export const generateClientsCSV = (clients) => {
    const columns = [
        { header: "ID", key: "id" },
        { header: "Nombre", key: "name" },
        { header: "Email", key: "email" },
        { header: "Teléfono", key: "phone" },
        { header: "CUIT/DNI", key: "cuit" },
        { header: "Dirección", key: "address" },
        { header: "Notas", key: "notes" },
        { header: "Estado", key: (client) => client.is_active ? "Activo" : "Inactivo" },
        { header: "Fecha Creación", key: (client) => new Date(client.created_at).toLocaleDateString() }
    ];
    return convertArrayToCSV(clients, columns);
};

/**
 * Generates a CSV content string for Invoices.
 * @param {Array<Object>} invoices 
 * @returns {string} CSV content
 */
export const generateInvoicesCSV = (invoices) => {
    const columns = [
        { header: "ID", key: "id" },
        { header: "Número Factura", key: "invoice_number" }, // Asumiendo que existe este campo o similar
        { header: "Cliente", key: (inv) => inv.client?.name || inv.client_name || "N/A" },
        { header: "Fecha Emisión", key: (inv) => new Date(inv.created_at).toLocaleDateString() },
        { header: "Periodo", key: "period" },
        { header: "Total", key: (inv) => inv.total ? `$${inv.total}` : "0" },
        { header: "Estado", key: "status" },
        { header: "Items", key: (inv) => Array.isArray(inv.items) ? inv.items.length : 0 }
    ];
    return convertArrayToCSV(invoices, columns);
};

/**
 * Fetches all critical data from the API for a full backup.
 * @returns {Promise<Object>} Object containing all data collections.
 */
export const fetchAllData = async () => {
    try {
        // Fetch all data in parallel
        const [clients, invoices, catalog, combos, services] = await Promise.all([
            clientAPI.getAll().then(res => Array.isArray(res) ? res : res.data || []),
            invoiceAPI.getAll().then(res => Array.isArray(res) ? res : res.data || []),
            catalogAPI.getAll().then(res => Array.isArray(res) ? res : res.data || []),
            combosAPI.getAll().then(res => Array.isArray(res) ? res : res.data || []),
            servicesAPI.getAll().then(res => Array.isArray(res) ? res : res.data || [])
        ]);

        return {
            clients,
            invoices,
            catalog,
            combos,
            services,
            backupDate: new Date().toISOString(),
            version: "1.0"
        };
    } catch (error) {
        console.error("Error fetching data for backup:", error);
        throw new Error("No se pudo obtener la información completa del servidor.");
    }
};
