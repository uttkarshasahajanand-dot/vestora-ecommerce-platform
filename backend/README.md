# VESTORA API

Standalone Node.js / Express API for the VESTORA storefront. It uses MySQL for persistent data, bcrypt for password hashing, and JWT bearer tokens for authentication. No payment gateway is included.

## Requirements

- Node.js 20 or newer
- MySQL 8.0 or newer
- A MySQL account with permission to create/use the `vestora` database

## Setup

1. From this folder, install dependencies:

   ```powershell
   npm install
   ```

2. Create the database tables by running `database/schema.sql` in MySQL Workbench or your MySQL client. The script creates the `vestora` database.
   If the database was created before cart idempotency was added, run `database/migrations/001_cart_idempotency.sql`.

3. Optionally add the initial VESTORA catalog by running `database/seed.sql` after the schema. The seed contains the eight products already represented in the frontend and is safe to re-run.

4. Copy `.env.example` to `.env` and fill in your local MySQL settings. Generate a private JWT secret, for example:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
   ```

   Put the generated value in `JWT_SECRET`. Do not commit `.env` or share its contents.

5. Start the API:

   ```powershell
   npm run dev
   ```

   It listens on `http://localhost:4000`. `GET /health` checks both the API and its MySQL connection.

The server refuses to start when the required database settings or a 32-character JWT secret are missing. It does not contain default database credentials.

## Admin access

Registration always creates a `customer`; a caller cannot choose their role. Register the account, then promote it through a trusted MySQL session:

```sql
UPDATE vestora.users SET user_role = 'admin' WHERE email = 'admin@example.com';
```

Sign in again after promotion so the JWT includes the admin role. Never expose database access or an admin token to an untrusted client.

## API

JSON errors use `{ "error": "..." }`; validation errors also include a `details` array. List endpoints are paginated with `page` and `limit` query parameters (`limit` is capped at 100).

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API and database health |
| `GET` | `/api/products` | Product listing; supports `q`/`search`, `category`, `sort` |
| `GET` | `/api/products/:productId` | Product details by slug |
| `GET` | `/api/categories` | Active categories |
| `GET` | `/api/products/:productId/reviews` | Product reviews and rating summary |

Product responses retain the frontend fields: `id` (slug), `name`, `category`, numeric `price`, `color`, `image`, `description`, and `label`. Stock and SKU fields are also provided. Example:

```json
{
  "products": [
    {
      "id": "forma-coat",
      "name": "The Forma Coat",
      "category": "Ready-to-wear",
      "price": 895,
      "color": "Warm stone",
      "image": "https://example.com/forma-coat.jpg",
      "description": "A considered wool-blend coat.",
      "label": "BESTSELLER",
      "stockQuantity": 12
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a customer |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get the authenticated profile |
| `PATCH` | `/api/auth/me` | Update profile name and/or email |

Send protected requests with `Authorization: Bearer <token>`. Registration accepts `{ "name", "email", "password" }`; passwords must be 8–128 characters. Login and registration return `{ "user", "token" }`.

### Cart and orders

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/cart` | View the authenticated user's cart |
| `POST` | `/api/cart/items` | Add `{ "productId": "forma-coat", "size": "M", "quantity": 1 }` |
| `POST` | `/api/cart/merge` | Merge `{ "items": [{ "productId": "forma-coat", "size": "M", "quantity": 1 }] }` |
| `PATCH` | `/api/cart/items/:productId` | Set `{ "size": "M", "quantity": 2 }` |
| `DELETE` | `/api/cart/items/:productId?size=M` | Remove a cart line |
| `POST` | `/api/orders` | Place an order from the server-side cart |
| `GET` | `/api/orders` | List the authenticated user's orders |
| `GET` | `/api/orders/:orderId` | Read one of the authenticated user's orders |

Cart responses contain `items`, `itemCount`, and server-calculated `subtotal`. Order placement uses a MySQL transaction: it locks inventory, validates availability, snapshots item details, deducts stock, writes the order, and clears the cart atomically. Shipping is $15 below $500 and complimentary at or above $500. Orders begin in `pending`; no payment is collected or implied. Dashboard `revenue` is the gross value of non-cancelled orders, not payment-settled revenue.

Authenticated cart `POST` requests require an `Idempotency-Key` header containing a UUID. Reuse the same key and payload when retrying an ambiguous request; reusing a key with a different operation or payload returns `409`. Cart merge validates all product lines and stock, applies all lines in one transaction, and records the key only when the transaction succeeds.

### Reviews

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/products/:productId/reviews` | Add a review for a product |
| `PATCH` | `/api/reviews/:reviewId` | Update the caller's review |
| `DELETE` | `/api/reviews/:reviewId` | Delete the caller's review |

Reviews require authentication, are limited to one per customer and product, and can only be edited or deleted by their author.

### Admin (JWT role `admin`)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | Store statistics, order-status counts, recent orders/users, and best sellers |
| `GET` | `/api/admin/users` | Paginated user listing; supports `search` and `role` |
| `GET` | `/api/admin/users/:userId` | Public profile fields for one user |
| `GET` | `/api/admin/users/:userId/orders` | Paginated order history for a user |
| `PATCH` | `/api/admin/users/:userId/role` | Set `{ "role": "customer" }` or `{ "role": "admin" }`; cannot demote the caller or the last admin |
| `GET` | `/api/admin/inventory` | Low-stock products; configurable `threshold` |
| `GET`, `POST` | `/api/admin/products` | Paginated/filterable product listing and creation |
| `PATCH`, `DELETE` | `/api/admin/products/:productId` | Update or deactivate a product |
| `GET`, `POST` | `/api/admin/categories` | List and create categories |
| `PATCH`, `DELETE` | `/api/admin/categories/:categoryId` | Update or deactivate a category |
| `GET` | `/api/admin/orders` | Paginated listing; supports `search` and `status` |
| `GET` | `/api/admin/orders/:orderId` | Full order, customer, shipping address, and line items |
| `PATCH` | `/api/admin/orders/:orderId/status` | Advance/cancel an order |
| `GET` | `/api/admin/reviews` | Paginated review moderation list; supports `search` |
| `DELETE` | `/api/admin/reviews/:reviewId` | Delete a review |

All `/api/admin/*` routes require a valid JWT with role `admin`; user profile responses omit password hashes. Order states follow `pending → processing → shipped → delivered`; pending and processing orders may also be cancelled. Cancelling restores inventory in a transaction. Revenue and best sellers exclude cancelled orders and reflect gross order totals, not payment-settled revenue. There is no payment gateway or paid status. Product/category delete actions deactivate records to preserve order history and foreign-key integrity.

## Frontend integration

The existing React frontend currently reads its catalog from `src/data/products.js` and stores cart lines in localStorage; it does not yet call an API. This service is ready for that integration without changing the product field names or IDs. Configure `FRONTEND_ORIGINS` as a comma-separated list; the default permits both `http://localhost:5173` and `http://127.0.0.1:5173`.

Example request:

```js
const response = await fetch('http://localhost:4000/api/products?q=coat')
const { products } = await response.json()
```

For authenticated requests, add the returned token to the `Authorization` header. The API does not include mock response handlers; catalog records come from MySQL.

## Scripts

- `npm run dev` — restart-on-change development server
- `npm start` — production server
- `npm test` — utility tests
