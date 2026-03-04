import { useState, useCallback } from 'react';
import { quotesAPI } from '../services/quotes.api';
import { useToast } from './useToast';

export function useQuotes(clientId) {
    const [quotes, setQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const { toast } = useToast();

    const fetchQuotes = useCallback(async () => {
        if (!clientId) return;

        setIsLoading(true);
        setIsError(false);
        try {
            const response = await quotesAPI.getClientQuotes(clientId);
            setQuotes(response.data || []);
        } catch (err) {
            console.error("[useQuotes] Error al cargar el historial:", err);
            setIsError(true);
            toast.error("Error al cargar el historial de presupuestos");
        } finally {
            setIsLoading(false);
        }
    }, [clientId, toast]);

    const sendQuote = async () => {
        if (!clientId) return false;

        try {
            const promise = quotesAPI.sendQuote(clientId).then(res => {
                // Autorefrescar el listado luego de crearlo exitosamente
                fetchQuotes();
                return res;
            });

            await toast.promise(promise, {
                loading: 'Generando y enviando presupuesto...',
                success: (res) => res?.message || 'Presupuesto generado y enviado exitosamente',
                error: (err) => {
                    // El backend dice que emite NO_EMAIL si falta.
                    if (err.message && err.message.includes('NO_EMAIL')) {
                        return 'El cliente no tiene email configurado';
                    }
                    return err.message || 'Error al procesar el presupuesto';
                }
            });
            return true;
        } catch (err) {
            return false;
        }
    };

    const downloadQuote = async (quote) => {
        if (!clientId || !quote) return;

        try {
            const promise = quotesAPI.downloadPdf(clientId, quote.id).then(({ blob, filename }) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename || `presupuesto_${quote.quote_number || 'pdf'}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });

            await toast.promise(promise, {
                loading: 'Descargando documento...',
                success: 'Descarga completada',
                error: (err) => {
                    if (err.status === 404 || err.message === "El documento original ya no se encuentra en el servidor") {
                        return "El documento original ya no se encuentra en el servidor";
                    }
                    return "Error al descargar el presupuesto";
                }
            });
        } catch (err) {
            // Error managed by toast
        }
    };

    const downloadQuoteOnly = async () => {
        if (!clientId) return;

        try {
            const promise = quotesAPI.generateQuote(clientId).then(({ blob, filename }) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                // Refresh quotes list since generate-quote also saves to DB
                fetchQuotes();
            });

            await toast.promise(promise, {
                loading: 'Generando presupuesto...',
                success: 'Presupuesto descargado',
                error: (err) => err.message || 'Error al generar el presupuesto'
            });
        } catch (err) {
            // Error managed by toast
        }
    };

    return {
        quotes,
        isLoading,
        isError,
        fetchQuotes,
        sendQuote,
        downloadQuote,
        downloadQuoteOnly
    };
}
