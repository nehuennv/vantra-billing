# Documentación Técnica Maestra - Vantra Billing

**Versión del Documento:** 1.0.0
**Fecha:** 4 de Febrero, 2026
**Rol:** Technical Lead & Architecture Overview

---

## 1. Visión General del Proyecto

**Vantra Billing** es una aplicación Web (SPA) diseñada como un sistema híbrido de **CRM y Facturación** optimizado para ISPs (Proveedores de Internet). Su objetivo es gestionar el ciclo de vida completo del abonado: desde la captación (Leads) y presupuestación, hasta la activación del servicio y la facturación recurrente.

### Stack Tecnológico
*   **Core:** React 18 + Vite (Build Tool).
*   **Lenguaje:** JavaScript (ES6+).
*   **Estilos:** Tailwind CSS (Utility-first framework).
*   **Iconografía:** Lucide React.
*   **Navegación:** React Router DOM v6.
*   **Feedback UI:** Sonner (Toast notifications).
*   **Generación PDF:** @react-pdf/renderer (Client-side generation).
*   **Gestión de Estado:** React Hooks (`useState`, `useEffect`) + Prop Drilling controlado.

### Arquitectura del Frontend
El proyecto sigue una arquitectura basada en **Features** (Domain Driven Design simplificado para Frontend).
*   **SPA (Single Page Application):** Carga única, navegación fluida sin recargas.
*   **Feature-First:** El código se organiza por módulos de negocio (`crm`, `billing`, `services`) en lugar de por tipo técnico (`components`, `hooks` globales).
*   **Patrón de Servicios:** La lógica de negocio y llamadas a datos están desacopladas de la UI a través de la capa `src/services`.

---

## 2. Arquitectura de Datos (CRÍTICO)

Esta es la pieza fundamental del sistema. Utilizamos un **Patrón Híbrido / Adapter**.

### El Problema
Necesitamos que la aplicación funcione tanto con una **API Real** (para Clientes) como con un **Mock Local** (para Facturación y Servicios), permitiendo desarrollar funcionalidades de facturación sin esperar al backend real.

### La Solución: `mockBackend.js` como Adapter
El archivo `src/services/mockBackend.js` actúa como un **Proxy Inteligente**. No es solo un mock; es un orquestador de fuentes de datos.

#### Flujo de Datos Conceptual
```
[UI Components] 
      │ (Llaman a función única)
      ▼
[mockBackend.js (The Adapter)] ──┐
      │                          │
      │ (Decisión de Ruta)       │
      ▼                          ▼
[apiClient.js (Real API)]   [localStorage (Persistence)]
      │                          │
      ▼                          ▼
 [External External API]    [Browser Storage]
    (Clientes)              (Facturas, Servicios)
```

1.  **Datos Reales (Clientes):** Cuando la UI pide clientes (`getClients`), el `mockBackend` llama a `apiClient.getAll`. La respuesta "cruda" de la API pasa por un **Mapper (`adaptClient`)** que normaliza los nombres de campos (ej: de `company_name` a `businessName`) para que la UI siempre reciba una estructura consistente.
2.  **Datos Simulados (Facturación/Servicios):** Cuando la UI pide servicios o crea facturas, el `mockBackend` intercepta la llamada y usa `localStorage` (`vantra_services`, `vantra_invoices`) como base de datos persistente.
3.  **Transparencia:** Los componentes de React **NO saben** de dónde vienen los datos. Solo conocen la interfaz de `mockBackend`.

---

## 3. Estructura de Directorios

La estructura favorece la escalabilidad y la separación de conceptos.

```bash
src/
├── components/          # Componentes Globales / Atómicos
│   ├── ui/              # Button, Card, Input, Badge, etc (Design System)
│   ├── layout/          # Layouts principales (Sidebar, Navbar)
│   └── modals/          # Modales genéricos reutilizables
├── config/              # Configuraciones globales (colores, constantes)
├── data/                # Datos estáticos o semillas (seeds) para mocks
├── features/            # MÓDULOS DE NEGOCIO (Domain Driven)
│   ├── billing/         # Lógica de Facturación (Ciclos, Emisión)
│   ├── crm/             # Gestión de Clientes (Listados, Detalle, Kanban)
│   ├── dashboard/       # Pantalla principal y Métricas
│   └── services/        # Catálogo de Productos y Presupuestos
├── hooks/               # Custom Hooks globales
├── routes/              # Definición de rutas (AppRoutes.jsx)
└── services/            # CAPA DE DATOS (API Client & Mock Backend)
```

---

## 4. Análisis Detallado: Archivo por Archivo

### A. Capa de Servicios

#### 1. `src/services/apiClient.js`
*   **Propósito:** Cliente HTTP puro. Encapsula `fetch` para manejar headers, autenticación y errores de red.
*   **Funciones Clave:**
    *   `request(endpoint, method, body)`: Wrapper central. Inyecta automáticamente el header `x-api-key`.
    *   `clientAPI.getAll`: Obtiene clientes con parámetros de query (ej: filtros).
    *   `clientAPI.softDelete / reactivate`: Maneja la lógica de borrado lógico (`is_active: false`).

#### 2. `src/services/mockBackend.js` (MASTER)
*   **Propósito:** El cerebro de la persistencia data. Implementa el patrón Adapter.
*   **Funciones Clave:**
    *   `adaptClient(apiData)`: **CRÍTICO.** Transforma el JSON snake_case de la API (backend legacy) al CamelCase limpio que espera la UI. Calcula `debt` y `balance`.
    *   `loadData/saveData`: Wrappers de `localStorage` con control de versiones (`DATA_VERSION`) para evitar conflictos de esquema.
    *   `handleSaveBudget`: (Lógica implícita en servicios individualizados en `features`).

### B. Feature: CRM

#### 1. `src/features/crm/pages/CRMPage.jsx`
*   **Propósito:** Pantalla principal de gestión de clientes. Actúa como controlador de vistas "Lista" y "Kanban".
*   **Estados:** `clients` (lista completa), `viewMode` (toggle list/kanban), `searchTerm`.
*   **Lógica Clave:**
    *   **Filtrado en Cliente:** Filtra por múltiples campos (nombre, cuit, email) y estado (activo/inactivo) en memoria.
    *   **Integración Kanban:** Levanta el estado de las columnas (`columns`) para sincronizar el tablero y la lista.

#### 2. `src/features/crm/pages/ClientDetailPage.jsx`
*   **Propósito:** Vista 360 del cliente. El componente más complejo del sistema.
*   **Estados:** `client` (datos perfil), `services` (servicios activos/presupuesto), `invoices` (historial facturas).
*   **Funciones Clave:**
    *   `handleSaveBudget`: Recibe una nueva lista de servicios del modal. Compara con la lista actual (`diffing`) para determinar qué servicios llamar a `addClientService` (nuevos) y cuáles a `deleteClientService` (removidos).
    *   `handleConfirmInvoice`: Orquesta la generación de factura. (1) Crea registro en BD local -> (2) Genera PDF en memoria -> (3) Dispara descarga al usuario.

#### 3. `src/features/crm/components/CreateClientModal.jsx`
*   **Propósito:** Formulario transaccional para alta/edición de clientes.
*   **Lógica:**
    *   Maneja modo "Creación" vs "Edición" basado en la prop `clientToEdit`.
    *   Tiene capacidad de crear "Estados" (Columnas Kanban) al vuelo desde el propio dropdown.

### C. Feature: Services & Billing

#### 1. `src/features/services/pages/ServicesPage.jsx`
*   **Propósito:** ABM (Alta, Baja, Modificación) del Catálogo de Productos.
*   **Lógica:**
    *   **Grouping:** Permite agrupar visualmente servicios "Recurrentes" vs "Pago Único".
    *   Gestiona dos entidades distintas en la misma UI: `Services` (ítems individuales) y `Budgets` (paquetes pre-armados).

#### 2. `src/features/billing/pages/BillingPage.jsx`
*   **Propósito:** Simulación del ciclo de facturación recurrente ("Del 1 al 5").
*   **Lógica:**
    *   Calcula el `totalForecast` sumando el precio de los planes de todos los clientes activos.

---

## 5. Guía de Servicios y API

### `apiClient.js` (Interface Externa)
Este archivo es la **única puerta de salida** hacia internet.
*   **Headers:** Siempre inyecta `x-api-key` desde `.env`.
*   **Manejo de Errores:** Intercepta respuestas no-200, intenta parsear el JSON de error y lanza una excepción estandarizada para que `toast.promise` pueda mostrarla.

### `mockBackend.js` (El Orquestador)
Expone métodos asíncronos que imitan promesas de red (`await new Promise(r => setTimeout(r, 600))`) para dar realismo a la UI (Loading states, skeletons).

| Método | Fuente de Datos | Descripción |
| :--- | :--- | :--- |
| `getClients()` | **API Real** | Trae todos y mapea con `adaptClient`. |
| `createClient(data)` | **API Real** | Hace POST y devuelve el cliente creado mapeado. |
| `getClientServices(id)` | **localStorage** | Filtra array `vantra_services` por `client_id`. |
| `createInvoice(id, data)` | **localStorage** | Crea registro en `vantra_invoices`. **Nota:** No actualiza saldo de cliente (deuda desacoplada). |

---

## 6. Flujos Críticos (Business Logic)

### A. Creación de Cliente (El "Handshake" entre UI y API)
1.  **Usuario:** Completa formulario en `CreateClientModal`.
2.  **Submit:** Llama a `onCreate` -> `mockBackend.createClient`.
3.  **Adapter:**
    *   Toma el objeto UI (`businessName`, `cuit`).
    *   Lo transforma al formato API (`company_name`, `tax_id`) mediante `adaptClientForApi`.
4.  **Transporte:** `apiClient` hace POST `/v1/clients`.
5.  **Respuesta:** La API devuelve el registro creado.
6.  **Re-Adaptación:** `mockBackend` toma la respuesta y la vuelve a transformar al formato UI.
7.  **Final:** La UI recibe el objeto limpio y lo agrega a la lista local sin recargar.

### B. Gestión de Presupuestos ("Smart Diffing")
Cuando editas los servicios de un cliente en `BudgetManagerModal`:
1.  La UI mantiene una lista "temporal" de los servicios seleccionados.
2.  Al guardar, `ClientDetailPage` compara la lista **Nueva** vs la **Vieja**.
    *   **Nuevos:** Items en lista nueva que NO están en la vieja -> `addClientService`.
    *   **Eliminados:** Items en lista vieja que NO están en la nueva -> `deleteClientService`.
3.  Esto evita borrar todo y volver a crear, manteniendo la integridad de IDs y fechas.

### C. Generación de Factura PDF
Este proceso es **100% Client-Side** para velocidad inmediata.
1.  Al confirmar "Emitir Factura", se arma un objeto JSON con los ítems y totales.
2.  Se guarda el JSON en `mockBackend` (persistencia simulada).
3.  Se pasa ese mismo JSON al componente `<InvoicePDF />` de `@react-pdf/renderer`.
4.  Se genera un `Blob` binario en memoria.
5.  Se crea dinámicamente un elemento `<a download>` invisible y se hace click programáticamente para descargar el archivo.
