# API de Facturación — Documentación Frontend

## Base URL

```
https://<tu-dominio>/api/v1/invoices
```

## Autenticación

Todas las rutas requieren el header:

```
x-api-key: <GASTON_API_SECRET>
```

---

## Endpoints

### 1. Emitir Factura

```
POST /api/v1/invoices
```

**Request Body:**

```json
{
  "clientId": "uuid-del-cliente",
  "period": "2026-02",
  "items": [
    {
      "description": "Abono Internet 100MB",
      "quantity": 1,
      "unit_price": 15000
    },
    {
      "description": "Consumo Telefonía",
      "quantity": 1,
      "unit_price": 2500.5
    }
  ],
  "options": {
    "notifyClient": true
  }
}
```

| Campo                  | Tipo               | Requerido | Descripción                                                      |
| ---------------------- | ------------------ | --------- | ---------------------------------------------------------------- |
| `clientId`             | `string (UUID)`    | ✅        | ID del cliente en la tabla `clients`                             |
| `period`               | `string (YYYY-MM)` | ✅        | Período a facturar                                               |
| `items`                | `array`            | ✅        | Mínimo 1 ítem                                                    |
| `items[].description`  | `string`           | ✅        | Descripción del concepto                                         |
| `items[].quantity`     | `number`           | Opcional  | Default: 1                                                       |
| `items[].unit_price`   | `number`           | ✅        | Precio unitario (positivo)                                       |
| `options.notifyClient` | `boolean`          | Opcional  | Default: `false`. Si `true`, genera PDF y envía email al cliente |

**Respuestas:**

#### ✅ 201 Created — Factura emitida

```json
{
  "status": "success",
  "data": {
    "invoice_id": "uuid",
    "invoice_number": "00002-00000192",
    "invoice_type": "B",
    "cae": "74123456789012",
    "cae_expiration": "20260225",
    "total_amount": 17500.5,
    "status": "EMITTED",
    "created_at": "2026-02-15T18:00:00.000Z"
  },
  "notification": {
    "pdfGenerated": false,
    "emailSent": false,
    "emailError": null
  }
}
```

> Si `notifyClient: true` y todo fue bien, `status` será `"SENT"` y `notification.pdfGenerated` / `emailSent` serán `true`.

#### ❌ 400 — Validación fallida

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Datos de entrada inválidos",
  "details": {
    "invalid_fields": [
      { "field": "clientId", "message": "clientId debe ser un UUID válido" }
    ]
  }
}
```

#### ❌ 401 — Sin API Key

```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Invalid or missing API Key"
}
```

#### ❌ 409 — Ya facturado (idempotencia)

```json
{
  "status": "error",
  "code": "DUPLICATE_BILLING",
  "message": "Cliente ya facturado para 2026-02 (Factura: 00002-00000191)",
  "details": { "existing_invoice": "00002-00000191" }
}
```

#### ❌ 502 — Error de AFIP/ARCA

```json
{
  "status": "error",
  "code": "AFIP_ERROR",
  "message": "No se pudo facturar: ...",
  "details": { "provider": "ARCA/AFIP", "originalError": "..." }
}
```

---

### 2. Listar Facturas

```
GET /api/v1/invoices
```

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 10, max: 100) |
| `client_id` | UUID | Filtrar por cliente |
| `status` | enum | `DRAFT`, `PROCESSING_AFIP`, `EMITTED`, `ERROR_AFIP`, `PAID`, `VOID` |
| `invoice_type` | enum | `A`, `B`, `C` |
| `period_billed` | string | Formato `MM-YYYY` |
| `date_from` | string | `YYYY-MM-DD` |
| `date_to` | string | `YYYY-MM-DD` |
| `search` | string | Busca por número de factura o nombre de empresa |

**Respuesta 200:**

```json
{
  "status": "success",
  "data": [ { "id": "...", "invoice_number": "00002-00000192", "status": "EMITTED", ... } ],
  "pagination": { "total": 50, "limit": 10, "page": 1, "totalPages": 5 }
}
```

---

### 3. Detalle de Factura

```
GET /api/v1/invoices/:id
```

**Respuesta 200:**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "invoice_number": "00002-00000192",
    "status": "EMITTED",
    "total_amount": 17500.5,
    "cae_code": "74123456789012",
    "company_name": "ACME SRL",
    "items": [
      {
        "description": "Abono Internet 100MB",
        "quantity": 1,
        "unit_price": 15000,
        "total_price": 15000
      }
    ]
  }
}
```

---

### 4. Descargar PDF

```
GET /api/v1/invoices/:id/pdf
```

Retorna el archivo PDF directamente (`Content-Type: application/pdf`). Si el PDF no existe, lo genera automáticamente.

---

## Estados de Factura (Ciclo de Vida)

```
DRAFT → PROCESSING_AFIP → EMITTED → SENT → PAID
                        ↘ ERROR_AFIP
                                     → VOID
```

| Estado            | Significado                                          |
| ----------------- | ---------------------------------------------------- |
| `PROCESSING_AFIP` | Esperando respuesta de ARCA/AFIP                     |
| `EMITTED`         | CAE recibido, factura válida (sin enviar al cliente) |
| `SENT`            | Email enviado al cliente con PDF adjunto             |
| `ERROR_AFIP`      | AFIP rechazó la factura                              |
| `PAID`            | Pago recibido                                        |
| `VOID`            | Anulada                                              |

## Notas para Frontend

1. **Doble click**: El backend protege contra doble facturación. Si el usuario hace doble click, el segundo request retorna `409` con la factura existente.
2. **`notifyClient`**: Usar `true` solo cuando el usuario confirme que quiere enviar el email. El PDF se genera solo si `notifyClient: true`.
3. **Latencia AFIP**: La request puede tardar 5-30 segundos por la negociación con AFIP. Mostrar un spinner/loading state.
4. **PDF independiente**: Se puede descargar el PDF en cualquier momento via `GET /:id/pdf`, sin necesidad de haber usado `notifyClient: true`.
