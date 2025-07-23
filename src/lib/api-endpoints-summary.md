# API Endpoints Summary

This document summarizes the key API endpoints from the OpenAPI specification that are used in the UI.

## Key Endpoints Used in UI

### Authentication

- **`POST /api/auth/send-otp`** - Send OTP to user's email
  - Request: `{ email: string, tenantId: string }`
  - Response: `{ success: boolean, message: string, expiresAt: string }`

- **`POST /api/auth/verify-otp`** - Verify OTP and receive JWT token
  - Request: `{ email: string, otp: string, tenantId: string }`
  - Response: `{ success: boolean, message: string, user: object, token: string, tokenType: string, timestamp: string }`

### Entities

- **`GET /api/my/entities`** - Get entities owned by authenticated user
  - Query params: `{ page?: number, limit?: number }`
  - Response: `{ entities: Entity[], pagination: object, filters_applied?: object }`
  - Requires authentication

- **`POST /api/entities`** - Create a new entity
  - Request: `{ name: string, category: string, description?: string, attributes?: object, public_shareable: boolean }`
  - Response: `Entity` object
  - Requires authentication

### Image & Category Helpers

- **`GET /api/entities/{id}/images`** - Get images for a specific entity
  - Query params: `{ size?: "thumbnail" | "small" | "medium" | "large" }`
  - Response: `{ entityId: string, images: object[], requestedSize: string, totalImages: number }`

- **`POST /api/entities/{id}/images`** - Upload images to an entity
  - Request: multipart/form-data with files, label, is_fallback
  - Response: `{ success: boolean, message: string, images: object[] }`
  - Requires authentication and ownership

- **`GET /api/categories`** - Get available entity categories
  - Response: `{ categories: object[], total: number }`

- **`GET /api/categories/{category}/entities`** - Get entities by category
  - Query params: `{ include_images?: boolean, page?: number, limit?: number }`
  - Response: `{ entities: Entity[], pagination: object }`

## Type Definitions Available

The generated `src/lib/api.d.ts` file contains strongly-typed definitions for:

- **Entity Schema**: `components["schemas"]["Entity"]`
  - `id`, `entity_type`, `tenant_id`, `owner_id`, `attributes`, `share_token`, `public_shareable`, `disabled`, `created_at`, `updated_at`

- **EntityCreate Schema**: `components["schemas"]["EntityCreate"]`
  - `name` (required), `category` (required), `description`, `attributes`, `public_shareable`

- **EntityList Schema**: `components["schemas"]["EntityList"]`
  - `entities`, `pagination`, `filters_applied`

- **Authentication Types**: `OTPRequest`, `OTPVerifyRequest`, `TokenResponse`, `UserInfo`

- **Image Types**: `EntityImages`, `ImageUploadResponse`

## API Base URL

The API is hosted at: `https://multi-tenant-cli-boilerplate-api.vercel.app`

## Authentication

The API uses Bearer token authentication with JWT tokens obtained from the OTP verification endpoint.
