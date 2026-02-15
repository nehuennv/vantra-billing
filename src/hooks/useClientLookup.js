import { useState, useEffect, useCallback, useRef } from 'react';
import { clientAPI } from '../services/apiClient';

/**
 * Hook para obtener un mapa de todos los clientes y resolver nombres por ID.
 * Implementa paginación automática para superar el límite de 100 items de la API.
 */
export const useClientLookup = () => {
    // Usamos un ref para evitar re-renderizados innecesarios del mapa intermedio
    const [clientMap, setClientMap] = useState(new Map());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllClients = async () => {
            try {
                setLoading(true);

                // 1. Pedimos la primera página con el LÍMITE MÁXIMO PERMITIDO (100)
                // NO poner 1000 porque el backend devuelve error 400.
                const firstResponse = await clientAPI.getAll({ limit: 100, page: 1 });

                // Normalizamos la respuesta (por si viene directo o dentro de .data)
                const firstPageData = Array.isArray(firstResponse) ? firstResponse : (firstResponse.data || []);
                let allClients = [...firstPageData];

                // 2. Verificamos si hay más páginas
                // Asumimos que la respuesta trae metadatos de paginación
                const pagination = firstResponse.pagination || {};
                const totalPages = pagination.totalPages || 1;

                // 3. Si hay más páginas, las pedimos todas en paralelo
                if (totalPages > 1) {
                    const promises = [];
                    for (let page = 2; page <= totalPages; page++) {
                        promises.push(clientAPI.getAll({ limit: 100, page: page }));
                    }

                    const restResponses = await Promise.all(promises);

                    // Juntamos los resultados
                    restResponses.forEach(res => {
                        const pageData = Array.isArray(res) ? res : (res.data || []);
                        allClients = [...allClients, ...pageData];
                    });
                }

                // 4. Transformar a Map: ID -> Nombre
                const map = new Map();
                allClients.forEach(client => {
                    const name = client.company_name || client.name || 'Sin Nombre';
                    map.set(String(client.id), name);
                });

                console.log(`📚 Directorio cargado: ${allClients.length} clientes.`);
                setClientMap(map);

            } catch (error) {
                console.error("Error cargando clientes para lookup:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllClients();
    }, []);

    const getClientName = useCallback((id) => {
        if (!id) return 'Desconocido';
        const name = clientMap.get(String(id));
        return name || 'Desconocido';
    }, [clientMap]);

    return { getClientName, loading };
}; 1