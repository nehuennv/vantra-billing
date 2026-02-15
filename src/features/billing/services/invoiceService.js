import { request } from '../../../services/apiClient';

/**
 * Creates a new invoice.
 * @param {Object} data - The invoice data.
 * @param {string} data.clientId - The client UUID.
 * @param {string} data.period - The billing period (YYYY-MM).
 * @param {Array} data.items - Array of items: { description, quantity, unit_price }.
 * @param {Object} [data.options] - Options: { notifyClient: boolean }.
 * @returns {Promise<Object>} The created invoice data.
 */
export const createInvoice = async (data) => {
    return request('/v1/invoices', 'POST', data);
};
