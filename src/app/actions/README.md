# Server Actions

This directory contains server actions for all API calls as specified in Step 4 of the project plan.

## Actions

### 1. `sendOtp(email)` - `sendOtp.ts`

- **Endpoint**: POST `/api/auth/send-otp`
- **Purpose**: Send a one-time password to user's email for authentication
- **Parameters**: `email: string`
- **Returns**: `SendOtpResult` with success status and data or error

### 2. `verifyOtp({ email, code })` - `verifyOtp.ts`

- **Endpoint**: POST `/api/auth/verify-otp`
- **Purpose**: Verify OTP code and receive JWT token
- **Parameters**: `{ email: string, code: string }`
- **Side Effect**: Automatically calls `setToken(jwt)` to store the JWT in cookies
- **Returns**: `VerifyOtpResult` with success status and data or error

### 3. `listEntities()` - `listEntities.ts`

- **Endpoint**: GET `/api/my/entities`
- **Purpose**: Get entities owned by the authenticated user
- **Parameters**: None
- **Returns**: `ListEntitiesResult` with success status and data or error

### 4. `createEntity(body)` - `createEntity.ts`

- **Endpoint**: POST `/api/entities`
- **Purpose**: Create a new entity
- **Parameters**: `body: EntityCreate` (from API schema)
- **Returns**: `CreateEntityResult` with success status and data or error

## Key Features

✅ **Server-only execution**: All actions use `'use server'` directive  
✅ **Typed responses**: Uses OpenAPI-generated types from `src/lib/api.d.ts`  
✅ **Consistent error handling**: All actions return typed result objects with success/error states  
✅ **Automatic authentication**: Uses the `fetchApi` utility that automatically includes JWT tokens  
✅ **JWT token management**: `verifyOtp` automatically stores the JWT token in secure cookies

## Usage

```typescript
import { sendOtp, verifyOtp, listEntities, createEntity } from '@/app/actions'

// Send OTP
const otpResult = await sendOtp('user@example.com')
if (otpResult.success) {
  console.log('OTP sent:', otpResult.data)
} else {
  console.error('Error:', otpResult.error)
}

// Verify OTP and get JWT
const verifyResult = await verifyOtp({
  email: 'user@example.com',
  code: '123456',
})
if (verifyResult.success) {
  console.log('User authenticated:', verifyResult.data)
}

// List user entities
const entitiesResult = await listEntities()
if (entitiesResult.success) {
  console.log('Entities:', entitiesResult.data?.entities)
}

// Create entity
const createResult = await createEntity({
  name: 'My Entity',
  category: 'test',
  description: 'A test entity',
  public_shareable: true,
})
```

## Dependencies

- `../../lib/fetchApi`: Centralized API client with automatic JWT handling
- `../../lib/auth-cookie`: JWT token management utilities
- `../../lib/api.d`: OpenAPI-generated TypeScript types
