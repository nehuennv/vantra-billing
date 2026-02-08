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

    // 3. Decode basic entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    return text.trim();
};

export const adaptClient = (apiClient) => {
    // Definimos balance y deuda
    const rawBalance = Number(apiClient.current_balance ?? apiClient.saldo ?? apiClient.balance ?? 0);
    const debt = rawBalance < 0 ? Math.abs(rawBalance) : 0;

    // UI Identity Logic:
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

export const adaptClientForApi = (uiData) => {
    return {
        // Obligatorios
        company_name: uiData.businessName || uiData.company_name,
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
        nombre: uiData.name || uiData.contactName,
        dni: uiData.dni,

        // Status
        status: uiData.status,
        is_active: uiData.is_active,

        // Notas
        obsinterna: uiData.internalObs,
    };
};
