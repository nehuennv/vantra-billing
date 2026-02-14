# 📦 Client Services API Documentation

> Gestión de servicios contratados por clientes. Cada servicio puede estar vinculado a un plan del catálogo (`origin_plan_id`) para trazabilidad.

**Base URL:** `/api/v1/services`  
**Autenticación:** Header `x-api-key` requerido

---

## 📋 Índice

- [Endpoints](#endpoints)
- [Modelo de Datos](#modelo-de-datos)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Endpoints

| Método   | Endpoint                                 | Descripción                    |
| -------- | ---------------------------------------- | ------------------------------ |
| `GET`    | `/api/v1/services`                       | Lista paginada de servicios    |
| `GET`    | `/api/v1/services/:id`                   | Obtener un servicio por ID     |
| `POST`   | `/api/v1/services`                       | Crear nuevo servicio           |
| `PATCH`  | `/api/v1/services/:id`                   | Actualizar servicio            |
| `DELETE` | `/api/v1/services/:id`                   | Eliminar servicio (Permanente) |
| `PUT`    | `/api/v1/services/client/:clientId/sync` | Sincronizar servicios (Mirror) |
| `GET`    | `/api/v1/services/client/:clientId`      | Servicios de un cliente        |
| `GET`    | `/api/v1/services/plan/:planId`          | Servicios de un plan           |

---

## Modelo de Datos

### ClientServiceItem

| Campo            | Tipo          | Nullable | Default      | Descripción                       |
| ---------------- | ------------- | -------- | ------------ | --------------------------------- |
| `id`             | UUID          | No       | auto         | Identificador único               |
| `client_id`      | UUID          | No       | -            | FK a tabla `clients`              |
| `origin_plan_id` | UUID          | Sí       | null         | FK a tabla `plans` (trazabilidad) |
| `display_code`   | string(15)    | Sí       | auto         | Código visual (ej: SRV-1001)      |
| `name`           | string(100)   | No       | -            | Nombre del servicio               |
| `description`    | text          | Sí       | null         | Descripción detallada             |
| `icon`           | string(50)    | Sí       | null         | Icono (ej: "wifi", "tv")          |
| `unit_price`     | decimal(15,2) | No       | 0.00         | Precio unitario                   |
| `quantity`       | integer       | No       | 1            | Cantidad                          |
| `service_type`   | enum          | Sí       | "recurring"  | Tipo: `recurring` o `one_time`    |
| `is_active`      | boolean       | Sí       | true         | Estado activo                     |
| `start_date`     | date          | Sí       | CURRENT_DATE | Fecha de inicio                   |
| `created_at`     | timestamptz   | Sí       | now()        | Fecha de creación                 |
| `updated_at`     | timestamptz   | Sí       | now()        | Última actualización              |

---

## Códigos de Error

### Errores de Autenticación

| Código         | HTTP | Mensaje                    | Causa                                  |
| -------------- | ---- | -------------------------- | -------------------------------------- |
| `UNAUTHORIZED` | 401  | Invalid or missing API Key | Falta header `x-api-key` o es inválido |

### Errores de Validación

| Código             | HTTP | Mensaje             | Causa                |
| ------------------ | ---- | ------------------- | -------------------- |
| `VALIDATION_ERROR` | 400  | [Detalle del campo] | Falla validación Zod |

**Ejemplos de mensajes de validación:**

- `"El nombre del servicio es requerido"`
- `"El nombre no puede exceder 100 caracteres"`
- `"El precio unitario no puede ser negativo"`
- `"La cantidad debe ser al menos 1"`
- `"El client_id debe ser un UUID válido"`
- `"El formato de fecha debe ser YYYY-MM-DD"`

### Errores de Negocio

| Código                     | HTTP | Mensaje                                                               | Causa                                       |
| -------------------------- | ---- | --------------------------------------------------------------------- | ------------------------------------------- |
| `CLIENT_NOT_FOUND`         | 404  | El cliente con ID {id} no existe                                      | El `client_id` no existe en la BD           |
| `PLAN_NOT_FOUND`           | 404  | El plan con ID {id} no existe                                         | El `origin_plan_id` no existe               |
| `SERVICE_NOT_FOUND`        | 404  | El servicio con ID {id} no existe                                     | El servicio no existe                       |
| `SERVICE_ALREADY_EXISTS`   | 409  | El cliente ya tiene un servicio activo con el nombre "{name}"         | Nombre duplicado para mismo cliente         |
| `SERVICE_NAME_TAKEN`       | 409  | Ya existe un servicio activo con el nombre "{name}" para este cliente | Al actualizar a un nombre existente         |
| `SERVICE_ALREADY_INACTIVE` | 400  | El servicio ya está desactivado                                       | Intentar desactivar un servicio ya inactivo |
| `SERVICE_ALREADY_ACTIVE`   | 400  | El servicio ya está activo                                            | Intentar reactivar un servicio activo       |

---

## Ejemplos de Uso

### GET /api/v1/services - Listar servicios

**Query Parameters:**

| Param            | Tipo           | Default | Descripción                                       |
| ---------------- | -------------- | ------- | ------------------------------------------------- |
| `page`           | int            | 1       | Número de página                                  |
| `limit`          | int            | 50      | Items por página (max 100)                        |
| `client_id`      | UUID           | -       | Filtrar por cliente                               |
| `origin_plan_id` | UUID           | -       | Filtrar por plan origen                           |
| `service_type`   | enum           | -       | Filtrar: `recurring` o `one_time`                 |
| `is_active`      | "true"/"false" | -       | Filtrar por estado                                |
| `search`         | string         | -       | Buscar por nombre, descripción o **display_code** |

**Request:**

```http
GET /api/v1/services?client_id=1e5422aa-88b4-4c30-9d7f-3ad152069682&is_active=true
x-api-key: YOUR_API_KEY
```

**Response (200):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "f761be59-7c42-4668-a3be-a7990aa22a19",
      "client_id": "1e5422aa-88b4-4c30-9d7f-3ad152069682",
      "origin_plan_id": "abc123...",
      "display_code": "SRV-1042",
      "name": "Internet Fibra 300MB",
      "description": "Plan con IP dinámica",
      "icon": "wifi",
      "unit_price": 25000.0,
      "quantity": 1,
      "service_type": "recurring",
      "is_active": true,
      "start_date": "2026-02-01",
      "created_at": "2026-02-07T10:00:00Z",
      "updated_at": "2026-02-07T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### POST /api/v1/services - Crear servicio

**Request Body:**

| Campo            | Tipo           | Requerido | Default     | Descripción              |
| ---------------- | -------------- | --------- | ----------- | ------------------------ |
| `client_id`      | UUID           | ✅        | -           | ID del cliente           |
| `name`           | string(1-100)  | ✅        | -           | Nombre del servicio      |
| `unit_price`     | number         | ✅        | -           | Precio unitario (≥0)     |
| `description`    | string         | ❌        | null        | Descripción              |
| `icon`           | string(max 50) | ❌        | null        | Icono                    |
| `quantity`       | int            | ❌        | 1           | Cantidad (≥1)            |
| `service_type`   | enum           | ❌        | "recurring" | `recurring` o `one_time` |
| `is_active`      | boolean        | ❌        | true        | Estado inicial           |
| `start_date`     | string         | ❌        | null        | Formato: YYYY-MM-DD      |
| `origin_plan_id` | UUID           | ❌        | null        | FK a plan origen         |

**Request:**

```http
POST /api/v1/services
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "client_id": "1e5422aa-88b4-4c30-9d7f-3ad152069682",
  "name": "Internet Fibra 300MB",
  "description": "Plan con IP dinámica",
  "icon": "wifi",
  "unit_price": 25000.00,
  "service_type": "recurring",
  "origin_plan_id": "abc123-plan-uuid"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Servicio creado exitosamente",
  "data": {
    /* ClientServiceItem */
  }
}
```

**Error Response (404) - Cliente no existe:**

```json
{
  "status": "error",
  "code": "CLIENT_NOT_FOUND",
  "message": "El cliente con ID 1e5422aa-88b4-4c30-9d7f-3ad152069682 no existe",
  "details": {
    "client_id": "1e5422aa-88b4-4c30-9d7f-3ad152069682"
  }
}
```

**Error Response (409) - Servicio duplicado:**

```json
{
  "status": "error",
  "code": "SERVICE_ALREADY_EXISTS",
  "message": "El cliente ya tiene un servicio activo con el nombre \"Internet Fibra 300MB\"",
  "details": {
    "client_id": "1e5422aa-...",
    "service_name": "Internet Fibra 300MB",
    "existing_service_id": "existing-uuid"
  }
}
```

---

### PATCH /api/v1/services/:id - Actualizar servicio

> Todos los campos son opcionales (partial update). No se puede cambiar `client_id`.

**Request:**

```http
PATCH /api/v1/services/f761be59-7c42-4668-a3be-a7990aa22a19
Content-Type: application/json
x-api-key: YOUR_API_KEY

{
  "name": "Internet Fibra 500MB (Upgrade)",
  "unit_price": 35000.00,
  "icon": "rocket"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Servicio actualizado exitosamente",
  "data": {
    /* ClientServiceItem actualizado */
  }
}
```

---

### DELETE /api/v1/services/:id - Eliminar servicio

> [!WARNING]
> **HARD DELETE**: Esta acción elimina permanentemente el servicio de la base de datos. No se puede deshacer.

**Request:**

```http
DELETE /api/v1/services/f761be59-7c42-4668-a3be-a7990aa22a19
x-api-key: YOUR_API_KEY
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Servicio eliminado permanentemente"
}
```

---

### PUT /api/v1/services/client/:clientId/sync - Sincronizar servicios (Mirror)

> [!WARNING]
> **OPERACIÓN DESTRUCTIVA**: Los servicios existentes que NO estén en el array serán eliminados permanentemente.

Recibe el estado completo deseado de los servicios de un cliente. La base de datos se actualizará para reflejar exactamente lo que se envía:

- Items **con `id` existente** → se actualizan.
- Items **sin `id`** (o `id: null`) → se crean.
- Servicios en la DB **que no estén en el array** → se eliminan permanentemente.

Todo se ejecuta dentro de una **transacción ACID**.

**Request:**

```http
PUT /api/v1/services/client/1e5422aa-88b4-4c30-9d7f-3ad152069682/sync
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "services": [
    {
      "id": "f761be59-7c42-4668-a3be-a7990aa22a19",
      "name": "Internet Fibra 300MB",
      "unit_price": 15000,
      "service_type": "recurring",
      "is_active": true
    },
    {
      "name": "Nuevo Servicio TV HD",
      "unit_price": 5000,
      "service_type": "recurring"
    }
  ]
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Sincronización completada: 1 creados, 1 actualizados, 2 eliminados",
  "data": [
    /* Array final de servicios del cliente */
  ],
  "summary": {
    "created": 1,
    "updated": 1,
    "deleted": 2,
    "total": 2
  }
}
```

---

### GET /api/v1/services/client/:clientId - Servicios de un cliente

**Query Parameters:**

| Param         | Default | Descripción                    |
| ------------- | ------- | ------------------------------ |
| `active_only` | "true"  | "false" para incluir inactivos |

**Request:**

```http
GET /api/v1/services/client/1e5422aa-88b4-4c30-9d7f-3ad152069682?active_only=true
x-api-key: YOUR_API_KEY
```

**Response (200):**

```json
{
  "status": "success",
  "data": [
    /* Array de ClientServiceItem */
  ],
  "count": 3
}
```

---

### GET /api/v1/services/plan/:planId - Servicios de un plan

> Obtiene todos los servicios derivados de un plan específico (útil para actualizaciones masivas).

**Request:**

```http
GET /api/v1/services/plan/abc123-plan-uuid
x-api-key: YOUR_API_KEY
```

**Response (200):**

```json
{
  "status": "success",
  "data": [
    /* Array de ClientServiceItem con ese origin_plan_id */
  ],
  "count": 45
}
```

---

## Notas de Implementación

### Snapshot Pattern

El campo `origin_plan_id` implementa el patrón **Snapshot**:

- Cuando se crea un servicio desde un plan, se copia `name`, `description`, `unit_price`, `icon` al servicio
- El `origin_plan_id` guarda la referencia al plan original
- Si el plan cambia de precio, los servicios existentes **mantienen su precio pactado**
- Permite consultar: "¿Cuántos clientes tienen el Plan X?" con `GET /api/v1/services/plan/:planId`

### Service Types

| Tipo        | Descripción                 | Uso típico            |
| ----------- | --------------------------- | --------------------- |
| `recurring` | Servicio recurrente mensual | Internet, TV, Hosting |
| `one_time`  | Cargo único                 | Instalación, Equipos  |
