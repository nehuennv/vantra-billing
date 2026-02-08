# Módulo de Clientes (Clients)

Este documento detalla la estructura, endpoints y lógica de negocio del módulo de Clientes en el sistema.

## 1. Base de Datos

La tabla `clients` almacena la información de los clientes (empresas o individuos).

### Estructura de la Tabla (`clients`)

| Columna           | Tipo            | Descripción / Default                                                                | Obligatorio |
| :---------------- | :-------------- | :----------------------------------------------------------------------------------- | :---------- |
| `id`              | `uuid`          | Identificador único (Primary Key). Generado automáticamente con `gen_random_uuid()`. | Sí          |
| `created_at`      | `timestamptz`   | Fecha de creación. Default: `now()`.                                                 | Sí          |
| `updated_at`      | `timestamptz`   | Fecha de última actualización. Default: `now()`.                                     | Sí          |
| `company_name`    | `varchar(255)`  | Razón social o nombre de la empresa.                                                 | Sí          |
| `tax_id`          | `varchar(20)`   | CUIT/CUIL del cliente. Único.                                                        | Sí          |
| `tax_condition`   | `varchar(100)`  | Condición fiscal (ej: `responsable_inscripto`). Default: `responsable_inscripto`.    | No          |
| `email_billing`   | `varchar(255)`  | Email para facturación.                                                              | Sí          |
| `phone_whatsapp`  | `varchar(100)`  | Teléfono de contacto / WhatsApp.                                                     | No          |
| `address`         | `text`          | Dirección física.                                                                    | No          |
| `is_active`       | `boolean`       | Indica si el cliente está activo. Default: `true`.                                   | No          |
| `current_balance` | `numeric(15,2)` | Saldo actual en cuenta corriente. Default: `0.00`.                                   | No          |
| `metadata`        | `jsonb`         | Datos adicionales en formato JSON. Default: `{}`.                                    | No          |
| `nombre`          | `varchar(255)`  | Nombre de fantasía o contacto principal (SaaS Arg).                                  | No          |
| `contacto`        | `varchar(255)`  | Persona de contacto (SaaS Arg).                                                      | No          |
| `observacion`     | `text`          | Observaciones generales.                                                             | No          |
| `obsinterna`      | `text`          | Observaciones internas (no visibles para el cliente).                                | No          |
| `categoria`       | `varchar(100)`  | Categoría del cliente.                                                               | No          |
| `localidad`       | `varchar(255)`  | Localidad.                                                                           | No          |
| `codigopostal`    | `varchar(20)`   | Código Postal.                                                                       | No          |
| `provincia`       | `varchar(100)`  | Provincia.                                                                           | No          |
| `idlista`         | `integer`       | ID de lista de precios asociada.                                                     | No          |
| `lista`           | `varchar(100)`  | Nombre de la lista de precios.                                                       | No          |
| `saldo`           | `numeric(15,2)` | Saldo (campo legacy o alternativo).                                                  | No          |
| `dni`             | `varchar(20)`   | DNI (para personas físicas).                                                         | No          |
| `status`          | `varchar(50)`   | Estado del cliente (ej: `CONTACTADO`, `PROSPECTO`, `CLIENTE`, `INACTIVO`).           | No          |

### Índices

- **PRIMARY KEY**: `id`
- **UNIQUE**: `tax_id`
- **INDEX**: `tax_id` (para búsquedas rápidas)

---

## 2. API Endpoints

Todos los endpoints se encuentran bajo el prefijo `/v1/clients`.

**Autenticación**:
Todos los endpoints requieren el header:
`x-api-key: [VALOR_DE_ENV_VAR]`

### 2.1 Listar Clientes

Obtiene una lista paginada de clientes.

- **Método**: `GET`
- **URL**: `/v1/clients`

**Parámetros (Query Params):**

| Parámetro   | Tipo      | Descripción                                                            | Default |
| :---------- | :-------- | :--------------------------------------------------------------------- | :------ |
| `page`      | `integer` | Número de página.                                                      | `1`     |
| `limit`     | `integer` | Cantidad de registros por página (max 100).                            | `50`    |
| `status`    | `string`  | Filtrar por estado (`CONTACTADO`, `PROSPECTO`, `CLIENTE`, `INACTIVO`). | -       |
| `search`    | `string`  | Búsqueda por texto (nombre, CUIT, email, contacto).                    | -       |
| `categoria` | `string`  | Filtrar por categoría.                                                 | -       |

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid...",
      "company_name": "Empresa S.A.",
      "tax_id": "30-12345678-9",
      ...
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

### 2.2 Crear Cliente

Registra un nuevo cliente en el sistema. Valida que el `tax_id` (CUIT) no exista previamente.

- **Método**: `POST`
- **URL**: `/v1/clients`

**Body (JSON):**

| Campo            | Tipo     | Obligatorio | Validaciones                                                                                      |
| :--------------- | :------- | :---------- | :------------------------------------------------------------------------------------------------ |
| `company_name`   | `string` | Sí          | Min 2, Max 255 chars.                                                                             |
| `tax_id`         | `string` | Sí          | Formato CUIT válido (Módulo 11). Se formatea autom. como XX-XXXXXXXX-X.                           |
| `email_billing`  | `string` | Sí          | Formato email válido.                                                                             |
| `tax_condition`  | `string` | No          | Enum: `responsable_inscripto`, `monotributista`, `exento`, etc. Default: `responsable_inscripto`. |
| `phone_whatsapp` | `string` | No          | Max 100 chars.                                                                                    |
| `address`        | `string` | No          | -                                                                                                 |
| `nombre`         | `string` | No          | Max 255 chars.                                                                                    |
| ...              | ...      | ...         | (Ver esquema completo en `src/schemas/clientSchema.ts`)                                           |

**Respuesta Exitosa (201 Created):**

```json
{
  "status": "success",
  "message": "Cliente creado exitosamente",
  "data": { ... }
}
```

**Errores Comunes:**

- `400 Bad Request`: Error de validación (ej: CUIT inválido).
- `409 Conflict`: El CUIT ya está registrado.

### 2.3 Actualizar Cliente

Actualiza los datos de un cliente existente.

- **Método**: `PATCH`
- **URL**: `/v1/clients/:id`

**Body (JSON):**
Acepta los mismos campos que la creación, pero todos son opcionales.
**Nota**: No se permite modificar el `tax_id` (CUIT) por seguridad.

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "message": "Cliente actualizado exitosamente",
  "data": { ... }
}
```

### 2.4 Eliminar Cliente

Realiza un borrado lógico (Soft Delete) o físico (Hard Delete).

- **Método**: `DELETE`
- **URL**: `/v1/clients/:id`

**Parámetros (Query Params):**

| Parámetro | Tipo     | Descripción                                                                                         |
| :-------- | :------- | :-------------------------------------------------------------------------------------------------- |
| `hard`    | `string` | Si es `'true'`, elimina el registro físicamente de la base de datos. Si no, realiza un Soft Delete. |

**Comportamiento Soft Delete:**

- Establece `status = 'INACTIVO'`
- Establece `is_active = false`
- Actualiza `updated_at`

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "success",
  "message": "Cliente eliminado exitosamente (Soft Delete)"
}
```

---

## 3. Lógica de Negocio y Validaciones

### Validaciones de CUIT

El sistema implementa una validación estricta de CUITs argentinos utilizando el algoritmo de Módulo 11.

- Verifica longitud (11 dígitos).
- Verifica prefijos válidos (20, 23, 27, 30, 33, 34, etc.).
- Calcula el dígito verificador.
- Formatea automáticamente el CUIT al guardar (XX-XXXXXXXX-X).

### Estructura del Código

- **Controlador**: `src/controllers/clientsController.ts` - Maneja la entrada/salida HTTP.
- **Servicio**: `src/services/clientsService.ts` - Contiene la lógica de negocio y consultas SQL.
- **Esquemas**: `src/schemas/clientSchema.ts` - Definiciones Zod para validación de datos.
- **Rutas**: `src/routes/v1/clientsRoutes.ts` - Definición de endpoints Fastify.

---

_Documentación generada automáticamente basada en la versión actual del código._
