# 🚀 VANTRA Services API v2 - Frontend Documentation

> **Arquitectura**: Catalog vs. Instance Model  
> **Base URL**: `http://localhost:3000/api/v1`  
> **Auth**: Header `x-api-key: {GASTON_API_SECRET}`

---

## 📋 Quick Reference

| Module                               | Base Path   | Purpose                                 |
| ------------------------------------ | ----------- | --------------------------------------- |
| [Catalog](#-catalog-items)           | `/catalog`  | Product definitions (master data)       |
| [Combos](#-combos)                   | `/combos`   | Bundle templates with calculated prices |
| [Client Services](#-client-services) | `/services` | Client-bound service instances          |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CATALOG LAYER (Templates)                        │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │  catalog_items   │◄────────│   combo_items    │──────►│ combo_services│
│  │  (products)      │         │  (junction)      │       │  (bundles)    │
│  └────────┬─────────┘         └──────────────────┘       └───────────────┘
│           │                                                              │
└───────────┼──────────────────────────────────────────────────────────────┘
            │ SNAPSHOT (immutable copy)
            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        INSTANCE LAYER (Client-bound)                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        client_services                            │   │
│  │  • catalog_item_id  → traces origin product                      │   │
│  │  • origin_combo_id  → traces origin combo (if from bundle)       │   │
│  │  • name, price...   → SNAPSHOT at assignment time                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept             | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Catalog Item**    | Product template with `default_price`. Changes here do NOT affect existing client services. |
| **Combo**           | Logical grouping of catalog items. Price is calculated from items at runtime.               |
| **Client Service**  | Immutable snapshot assigned to a client. Price locked at assignment time.                   |
| **origin_combo_id** | Watermark that groups services from the same combo assignment.                              |

---

## 📦 Catalog Items

Master product catalog. Price changes here don't retroactively affect assigned services.

### Endpoints

| Method   | Path                   | Description                    |
| -------- | ---------------------- | ------------------------------ |
| `GET`    | `/catalog`             | List with filters & pagination |
| `POST`   | `/catalog`             | Create new product             |
| `PUT`    | `/catalog/:id`         | Update product                 |
| `DELETE` | `/catalog/:id`         | Soft delete (archive)          |
| `POST`   | `/catalog/:id/restore` | Restore archived product       |
| `GET`    | `/catalog/active`      | Get active items for selectors |

---

### `GET /catalog`

List catalog items with filtering, sorting, and pagination.

**Query Parameters:**

| Param        | Type         | Default      | Description                      |
| ------------ | ------------ | ------------ | -------------------------------- |
| `search`     | string       | -            | Search in name, SKU, description |
| `is_active`  | boolean      | -            | Filter by active/archived        |
| `min_price`  | number       | -            | Minimum price filter             |
| `max_price`  | number       | -            | Maximum price filter             |
| `sort_by`    | string       | `created_at` | Field to sort by                 |
| `sort_order` | `asc`/`desc` | `desc`       | Sort direction                   |
| `page`       | number       | 1            | Page number                      |
| `limit`      | number       | 20           | Items per page (max 100)         |

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "db766d9b-c1c0-496e-872e-c223143325a8",
      "name": "Servicio de Internet 100MB",
      "sku": "INET-100",
      "description": "Plan de Internet 100 Megabits",
      "default_price": "15000.00",
      "is_active": true,
      "created_at": "2026-02-08T01:21:20.668Z",
      "updated_at": "2026-02-08T01:21:20.668Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### `POST /catalog`

Create a new catalog item.

**Request Body:**

```json
{
  "name": "Servicio de Internet 100MB",
  "sku": "INET-100",
  "description": "Plan de Internet 100 Megabits",
  "default_price": 15000
}
```

| Field           | Type   | Required | Validation           |
| --------------- | ------ | -------- | -------------------- |
| `name`          | string | ✅       | 1-255 chars          |
| `sku`           | string | ❌       | Unique, max 50 chars |
| `description`   | string | ❌       | -                    |
| `default_price` | number | ✅       | ≥ 0                  |

**Response (201):**

```json
{
  "status": "success",
  "message": "Producto creado exitosamente en el catálogo",
  "data": {
    /* CatalogItem */
  }
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `SKU_DUPLICADO` | 409 | SKU already exists |
| `VALIDATION_ERROR` | 400 | Invalid input data |

---

### `PUT /catalog/:id`

Update an existing catalog item.

> ⚠️ **IMPORTANT**: Price changes do NOT affect existing client_services. They keep their snapshot price.

**Request Body:** Same as POST (all fields optional)

**Response (200):**

```json
{
  "status": "success",
  "message": "Producto actualizado exitosamente",
  "data": {
    /* Updated CatalogItem */
  }
}
```

---

### `DELETE /catalog/:id`

Soft delete (archive) a catalog item.

**Response (200):**

```json
{
  "status": "success",
  "message": "Producto archivado correctamente"
}
```

---

### `POST /catalog/:id/restore`

Restore an archived catalog item.

**Response (200):**

```json
{
  "status": "success",
  "message": "Producto restaurado correctamente",
  "data": {
    /* Restored CatalogItem */
  }
}
```

---

### `GET /catalog/active`

Get all active catalog items (for dropdowns/selectors).

**Response (200):**

```json
{
  "status": "success",
  "data": [
    { "id": "...", "name": "Internet 100MB", "default_price": "15000.00" },
    { "id": "...", "name": "TV Cable", "default_price": "8000.00" }
  ]
}
```

---

## 📦 Combos

Bundle templates. Price is calculated from component items.

### Endpoints

| Method   | Path             | Description                         |
| -------- | ---------------- | ----------------------------------- |
| `GET`    | `/combos`        | List all combos with items & prices |
| `POST`   | `/combos`        | Create combo with items (atomic)    |
| `PUT`    | `/combos/:id`    | Update combo                        |
| `DELETE` | `/combos/:id`    | Soft delete combo                   |
| `GET`    | `/combos/active` | Get active combos for selectors     |

---

### `GET /combos`

List all combos with populated items and calculated prices.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "id": "03485bed-af5f-438e-9176-478b8a31c389",
      "name": "Pack Triple Play",
      "description": "Internet + TV + Telefonia",
      "is_active": true,
      "created_at": "2026-02-08T01:23:27.370Z",
      "items": [
        {
          "id": "item-uuid",
          "combo_service_id": "03485bed-af5f-438e-9176-478b8a31c389",
          "catalog_item_id": "db766d9b-c1c0-496e-872e-c223143325a8",
          "quantity": 1,
          "catalog_item": {
            "id": "db766d9b-c1c0-496e-872e-c223143325a8",
            "name": "Servicio de Internet 100MB",
            "description": "Plan de Internet 100 Megabits",
            "default_price": 15000,
            "is_active": true
          }
        }
      ],
      "total_calculated_price": 28000
    }
  ]
}
```

---

### `POST /combos`

Create a new combo with items (atomic transaction).

**Request Body:**

```json
{
  "name": "Pack Triple Play",
  "description": "Internet + TV + Telefonia",
  "items": [
    { "catalog_item_id": "uuid-1", "quantity": 1 },
    { "catalog_item_id": "uuid-2", "quantity": 1 },
    { "catalog_item_id": "uuid-3", "quantity": 1 }
  ]
}
```

| Field                     | Type   | Required | Description               |
| ------------------------- | ------ | -------- | ------------------------- |
| `name`                    | string | ✅       | Combo name                |
| `description`             | string | ❌       | Description               |
| `items`                   | array  | ✅       | List of catalog items     |
| `items[].catalog_item_id` | UUID   | ✅       | Reference to catalog item |
| `items[].quantity`        | number | ❌       | Default: 1                |

**Response (201):**

```json
{
  "status": "success",
  "message": "Combo creado exitosamente",
  "data": {
    "id": "03485bed-af5f-438e-9176-478b8a31c389",
    "name": "Pack Triple Play",
    "items": [
      /* populated items */
    ],
    "total_calculated_price": 28000
  }
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `CATALOG_ITEM_NOT_FOUND` | 404 | One or more items don't exist |
| `COMBO_CREATION_FAILED` | 500 | Transaction rolled back |

---

## 👤 Client Services

Client-bound service instances. Immutable snapshots from catalog.

### Endpoints

| Method | Path                                 | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| `POST` | `/services/clients/:clientId/single` | Assign single service           |
| `POST` | `/services/clients/:clientId/bundle` | Assign combo bundle             |
| `GET`  | `/services/clients/:clientId`        | Get grouped services (UI-ready) |

---

### `POST /services/clients/:clientId/single`

Assign a single catalog item to a client. Creates an **immutable snapshot**.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `clientId` | UUID | Target client ID |

**Request Body:**

```json
{
  "catalog_item_id": "db766d9b-c1c0-496e-872e-c223143325a8",
  "override_price": 12000,
  "quantity": 1
}
```

| Field             | Type   | Required | Description                           |
| ----------------- | ------ | -------- | ------------------------------------- |
| `catalog_item_id` | UUID   | ✅       | Catalog item to assign                |
| `override_price`  | number | ❌       | Custom price (default: catalog price) |
| `quantity`        | number | ❌       | Default: 1                            |

**Response (201):**

```json
{
  "status": "success",
  "message": "Servicio asignado exitosamente",
  "data": {
    "id": "47806de2-e9d6-4eb0-9289-690b92def913",
    "client_id": "1d8325c8-829c-410b-b983-9c0cba241e6c",
    "catalog_item_id": "db766d9b-c1c0-496e-872e-c223143325a8",
    "origin_combo_id": null,
    "origin_plan_id": null,
    "name": "Servicio de Internet 100MB",
    "description": "Plan de Internet 100 Megabits",
    "icon": null,
    "unit_price": "15000.00",
    "quantity": 1,
    "service_type": "recurring",
    "is_active": true,
    "start_date": "2026-02-08T03:00:00.000Z",
    "created_at": "2026-02-08T01:26:11.007Z",
    "updated_at": "2026-02-08T01:26:11.007Z"
  }
}
```

---

### `POST /services/clients/:clientId/bundle`

Assign a combo bundle to a client. Creates **multiple immutable snapshots** with `origin_combo_id` watermark.

> 🔒 **ATOMIC TRANSACTION**: All services are created together or none.

**Request Body:**

```json
{
  "combo_service_id": "03485bed-af5f-438e-9176-478b8a31c389"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Combo asignado exitosamente (3 servicios)",
  "data": [
    {
      "id": "5a15e417-a6e6-4a8f-bb68-9dc88fa42a04",
      "client_id": "1d8325c8-829c-410b-b983-9c0cba241e6c",
      "catalog_item_id": "db766d9b-c1c0-496e-872e-c223143325a8",
      "origin_combo_id": "03485bed-af5f-438e-9176-478b8a31c389",
      "name": "Servicio de Internet 100MB",
      "unit_price": "15000.00",
      "quantity": 1,
      "service_type": "recurring",
      "is_active": true
    },
    {
      /* TV Cable service */
    },
    {
      /* VoIP service */
    }
  ],
  "count": 3
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| `CLIENT_NOT_FOUND` | 404 | Client doesn't exist |
| `COMBO_NOT_FOUND` | 404 | Combo doesn't exist |
| `COMBO_ARCHIVED` | 404 | Combo is inactive |
| `EMPTY_COMBO` | 400 | Combo has no items |
| `ITEM_ARCHIVED` | 404 | One or more items are archived |

---

### `GET /services/clients/:clientId`

Get client services **grouped by combo** for accordion UI.

**Response (200):**

```json
{
  "status": "success",
  "grouped_services": [
    {
      "combo_id": "03485bed-af5f-438e-9176-478b8a31c389",
      "combo_name": "Pack Triple Play",
      "items": [
        {
          "id": "5a15e417-a6e6-4a8f-bb68-9dc88fa42a04",
          "name": "Servicio de Internet 100MB",
          "unit_price": "15000.00",
          "quantity": 1,
          "is_active": true
        },
        {
          /* TV Cable */
        },
        {
          /* VoIP */
        }
      ],
      "subtotal": 28000
    }
  ],
  "individual_services": [
    {
      "id": "47806de2-e9d6-4eb0-9289-690b92def913",
      "name": "Internet 100MB (individual)",
      "unit_price": "15000.00",
      "quantity": 1,
      "is_active": true
    }
  ],
  "total_monthly": 43000
}
```

### Frontend Usage (React Example)

```tsx
// Render grouped services as accordion
{
  response.grouped_services.map((group) => (
    <Accordion key={group.combo_id}>
      <AccordionSummary>
        <Typography>{group.combo_name}</Typography>
        <Chip label={`$${group.subtotal.toLocaleString()}`} />
      </AccordionSummary>
      <AccordionDetails>
        {group.items.map((service) => (
          <ServiceRow key={service.id} service={service} />
        ))}
      </AccordionDetails>
    </Accordion>
  ));
}

// Render individual services as flat list
{
  response.individual_services.map((service) => (
    <ServiceRow key={service.id} service={service} />
  ));
}

// Total
<Typography variant="h5">
  Total Mensual: ${response.total_monthly.toLocaleString()}
</Typography>;
```

---

## 📊 TypeScript Types

```typescript
// Catalog Item
interface CatalogItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  default_price: string; // Decimal as string
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Combo
interface ComboService {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: ComboItem[];
  total_calculated_price: number;
}

interface ComboItem {
  id: string;
  combo_service_id: string;
  catalog_item_id: string;
  quantity: number;
  catalog_item: CatalogItem;
}

// Client Service (Instance)
interface ClientService {
  id: string;
  client_id: string;
  catalog_item_id: string | null;
  origin_combo_id: string | null;
  origin_plan_id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  unit_price: string; // Decimal as string
  quantity: number;
  service_type: string;
  is_active: boolean;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

// Grouped Response
interface GroupedServicesResponse {
  status: "success";
  grouped_services: {
    combo_id: string;
    combo_name: string;
    items: ClientService[];
    subtotal: number;
  }[];
  individual_services: ClientService[];
  total_monthly: number;
}
```

---

## ⚠️ Error Response Format

All errors follow RFC 7807 format:

```json
{
  "status": "error",
  "code": "ITEM_NOT_FOUND",
  "message": "El producto no existe en el catálogo",
  "details": {
    "catalog_item_id": "invalid-uuid"
  },
  "timestamp": "2026-02-08T01:30:00.000Z"
}
```

### Common Error Codes

| Code                | HTTP | Description                  |
| ------------------- | ---- | ---------------------------- |
| `VALIDATION_ERROR`  | 400  | Invalid input data           |
| `UNAUTHORIZED`      | 401  | Invalid or missing API key   |
| `CLIENT_NOT_FOUND`  | 404  | Client doesn't exist         |
| `ITEM_NOT_FOUND`    | 404  | Catalog item doesn't exist   |
| `COMBO_NOT_FOUND`   | 404  | Combo doesn't exist          |
| `SERVICE_NOT_FOUND` | 404  | Client service doesn't exist |
| `ITEM_ARCHIVED`     | 404  | Item/combo is archived       |
| `SKU_DUPLICADO`     | 409  | SKU already exists           |
| `INTERNAL_ERROR`    | 500  | Unexpected server error      |

---

## 🔑 Authentication

All endpoints require the `x-api-key` header:

```bash
curl -H "x-api-key: gaston_sec_2026_xK9mPq4wL8nR" \
     http://localhost:3000/api/v1/catalog
```

---

## 📝 Changelog

### v2.0.0 (2026-02-07)

**New Features:**

- ✨ Catalog vs. Instance architecture
- ✨ Combo bundles with calculated prices
- ✨ Single service assignment from catalog
- ✨ Bundle assignment with atomic transactions
- ✨ Grouped services response for accordion UI
- ✨ Traceability via `catalog_item_id` and `origin_combo_id`

**Breaking Changes:**

- 🔥 Removed `status` column from `client_services` (use `is_active` instead)
- 🔥 Price updates to catalog items don't affect existing client services

---

_Generated: 2026-02-07 22:32 ART_
