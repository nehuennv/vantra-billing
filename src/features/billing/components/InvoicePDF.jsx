import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { clientConfig } from '../../../config/client'; // Importamos la config para el logo y datos de la empresa

// Registramos fuentes (opcional, usamos Helvetica por defecto que es segura)
// Font.register({ family: 'Inter', src: '...' });

const colors = {
    primary: '#4f46e5', // Indigo Vantra
    secondary: '#1e293b', // Slate 800
    text: '#334155', // Slate 700
    textLight: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
    bgLight: '#f8fafc', // Slate 50
};

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: colors.text,
        backgroundColor: '#ffffff'
    },

    // --- HEADER & BRAND ---
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary,
        paddingBottom: 20,
    },
    brandColumn: { width: '60%' },
    brandName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    brandSub: { fontSize: 8, color: colors.textLight, marginBottom: 10 },

    // --- INVOICE BOX (Estilo AFIP) ---
    invoiceBox: {
        width: '40%',
        alignItems: 'flex-end',
    },
    invoiceTypeContainer: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.bgLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderRadius: 4
    },
    invoiceTypeLetter: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    invoiceData: { textAlign: 'right' },
    invoiceTitle: { fontSize: 14, fontWeight: 'bold', color: colors.secondary },
    invoiceNumber: { fontSize: 10, color: colors.textLight, marginTop: 2 },

    // --- INFO COLUMNS (FROM / TO) ---
    infoContainer: {
        flexDirection: 'row',
        marginBottom: 30,
        gap: 20
    },
    infoCol: { flex: 1 },
    infoTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: colors.textLight,
        marginBottom: 4,
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 2
    },
    infoText: { fontSize: 9, marginBottom: 2, lineHeight: 1.4 },
    infoBold: { fontWeight: 'bold', color: colors.secondary },

    // --- TABLE ---
    tableContainer: {
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignItems: 'center'
    },
    tableHeaderCell: { color: '#ffffff', fontWeight: 'bold', fontSize: 8 },

    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff'
    },
    tableRowAlt: { backgroundColor: colors.bgLight }, // Filas alternas

    // Column Widths
    colDesc: { width: '60%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },

    tableCell: { fontSize: 9, color: colors.secondary },
    tableCellDesc: { fontSize: 9, color: colors.secondary },

    // --- TOTALS & BANK INFO ---
    footerSection: {
        flexDirection: 'row',
        marginTop: 10,
    },
    bankInfo: {
        flex: 1,
        paddingRight: 20,
    },
    bankTitle: { fontSize: 9, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
    bankText: { fontSize: 8, color: colors.textLight, marginBottom: 1 },

    totalsBox: {
        flex: 0.5,
        backgroundColor: colors.bgLight,
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 2,
        borderTopColor: colors.primary
    },
    totalLabel: { fontSize: 8, color: colors.textLight },
    totalValue: { fontSize: 9, fontWeight: 'bold', color: colors.secondary },
    totalFinalLabel: { fontSize: 10, fontWeight: 'bold', color: colors.primary },
    totalFinalValue: { fontSize: 12, fontWeight: 'bold', color: colors.primary },

    // --- FOOTER ---
    legalText: {
        marginTop: 40,
        textAlign: 'center',
        fontSize: 7,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 10
    }
});

// Helper para formato de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
};

export const InvoicePDF = ({ client, items, invoiceNumber, issueDate, dueDate }) => {
    // Cálculos básicos
    const subtotal = items.reduce((acc, item) => acc + Number(item.unit_price) * (item.quantity || 1), 0);
    // Nota: El modal maneja quantity, asegurémonos de usarlo aquí también si viene.
    // En el modal: items tienen { quantity, unit_price }.
    // En el backend original: services tienen { price }.
    // InvoicePDF original asumía quantity=1. Vamos a soportar quantity.

    // Si querés que el precio unitario ya incluya IVA, la lógica cambia. 
    // Asumamos para este MVP que el precio unitario es FINAL.
    // Entonces: Neto = Total / 1.21
    const neto = subtotal / 1.21;
    const ivaAmount = subtotal - neto;
    const total = subtotal;

    // Fechas
    // Si vienen como string ISO (YYYY-MM-DD), formatearlas. Si no, usar default.
    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toLocaleDateString('es-AR');
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const formattedDate = issueDate ? formatDate(issueDate) : new Date().toLocaleDateString('es-AR');
    // dueDate logic: if passed, use it. Else +7 days.
    const formattedDueDate = dueDate ? formatDate(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR');

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* 1. HEADER */}
                <View style={styles.headerContainer}>
                    <View style={styles.brandColumn}>
                        {/* Si tuvieras un logo en imagen: <Image src="/logo.png" style={{ width: 40, height: 40 }} /> */}
                        <Text style={styles.brandName}>{clientConfig.name || "VANTRA ISP"}</Text>
                        <Text style={styles.brandSub}>Servicios de Internet y Telecomunicaciones</Text>
                        <Text style={styles.infoText}>Av. Corrientes 1234, Piso 5, CABA</Text>
                        <Text style={styles.infoText}>IVA Responsable Inscripto</Text>
                        <Text style={styles.infoText}>CUIT: 30-71000000-1</Text>
                    </View>

                    <View style={styles.invoiceBox}>
                        <View style={styles.invoiceTypeContainer}>
                            <Text style={styles.invoiceTypeLetter}>A</Text>
                        </View>
                        <Text style={styles.invoiceTitle}>FACTURA</Text>
                        <Text style={styles.invoiceNumber}>N° {invoiceNumber || '0001-00000024'}</Text>
                        <Text style={[styles.invoiceNumber, { marginTop: 4 }]}>Fecha: {formattedDate}</Text>
                    </View>
                </View>

                {/* 2. CLIENTE Y CONDICIONES */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoTitle}>FACTURAR A</Text>
                        <Text style={[styles.infoText, styles.infoBold]}>{client.company_name}</Text>
                        <Text style={styles.infoText}>CUIT: {client.tax_id || 'Consumidor Final'}</Text>
                        <Text style={styles.infoText}>{client.address || 'Domicilio no especificado'}</Text>
                        <Text style={styles.infoText}>{client.email_billing}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoTitle}>CONDICIONES COMERCIALES</Text>
                        <Text style={styles.infoText}>Condición Venta: <Text style={styles.infoBold}>Cuenta Corriente</Text></Text>
                        <Text style={styles.infoText}>Vencimiento: <Text style={styles.infoBold}>{formattedDueDate}</Text></Text>
                        <Text style={styles.infoText}>Periodo Facturado: <Text style={styles.infoBold}>Mensual</Text></Text>
                    </View>
                </View>

                {/* 3. TABLA DE ITEMS */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDesc]}>DESCRIPCIÓN / SERVICIO</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>CANT.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>P. UNIT</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>SUBTOTAL</Text>
                    </View>

                    {items.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <Text style={[styles.tableCellDesc, styles.colDesc]}>{item.description || item.name}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity || 1}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>
                                {Number(item.unit_price || item.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal, { fontWeight: 'bold' }]}>
                                {(Number(item.unit_price || item.price) * (item.quantity || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* 4. FOOTER: DATOS BANCARIOS Y TOTALES */}
                <View style={styles.footerSection}>

                    {/* Datos Bancarios (Izquierda) */}
                    <View style={styles.bankInfo}>
                        <Text style={styles.bankTitle}>DATOS PARA TRANSFERENCIA</Text>
                        <Text style={styles.bankText}>Banco: <Text style={{ fontWeight: 'bold' }}>Banco Galicia</Text></Text>
                        <Text style={styles.bankText}>Titular: <Text style={{ fontWeight: 'bold' }}>VANTRA TECH S.A.</Text></Text>
                        <Text style={styles.bankText}>CBU: 0070004520000012345678</Text>
                        <Text style={styles.bankText}>Alias: VANTRA.PAGOS.OK</Text>
                        <Text style={[styles.bankText, { marginTop: 5, color: colors.primary }]}>
                            Por favor enviar comprobante a pagos@vantra.com
                        </Text>
                    </View>

                    {/* Totales (Derecha) */}
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Importe Neto Gravado</Text>
                            <Text style={styles.totalValue}>{formatCurrency(neto)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA (21%)</Text>
                            <Text style={styles.totalValue}>{formatCurrency(ivaAmount)}</Text>
                        </View>
                        <View style={styles.totalRowFinal}>
                            <Text style={styles.totalFinalLabel}>TOTAL A PAGAR</Text>
                            <Text style={styles.totalFinalValue}>{formatCurrency(total)}</Text>
                        </View>
                    </View>

                </View>

                {/* 5. LEGAL / FINAL */}
                <Text style={styles.legalText}>
                    Documento no válido como factura fiscal (MVP Demo). Original electrónico generado vía Web Service AFIP.
                    Vantra Billing Software v1.0
                </Text>

            </Page>
        </Document>
    );
};