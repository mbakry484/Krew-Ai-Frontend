# Krew Backend API Documentation

Base URL: `http://localhost:3000` (Development)

## Table of Contents
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [POST /auth/signup](#post-authsignup)
  - [POST /auth/login](#post-authlogin)
  - [GET /auth/me](#get-authme)
  - [POST /auth/onboarding](#post-authonboarding)
- [Error Handling](#error-handling)
- [CORS Configuration](#cors-configuration)

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

JWT tokens:
- Expire in 7 days
- Contain payload: `{ user_id, email }`
- Use HS256 algorithm

---

## Endpoints

### POST /auth/signup

Register a new user account.

**Endpoint:** `POST /auth/signup`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "first_name": "Mohamed",
  "last_name": "Bakry",
  "business_name": "My Business Inc"
}
```

**Required Fields:**
- `email` (string) - User's email address (must be unique)
- `password` (string) - User's password (will be hashed with bcrypt)
- `first_name` (string) - User's first name
- `last_name` (string) - User's last name
- `business_name` (string) - User's business name

**Success Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing required fields
```json
{
  "error": "Missing required fields: email, password, first_name, last_name, business_name",
  "received": {
    "email": "user@example.com",
    "password": "***",
    "first_name": null,
    "last_name": null,
    "business_name": null
  }
}
```

**409 Conflict** - Email already exists
```json
{
  "error": "User with this email already exists"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create user account"
}
```

---

### POST /auth/login

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Required Fields:**
- `email` (string) - User's email address
- `password` (string) - User's password

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

**400 Bad Request** - Missing credentials
```json
{
  "error": "Email and password are required"
}
```

**401 Unauthorized** - Invalid credentials
```json
{
  "error": "Invalid email or password"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

### GET /auth/me

Get the authenticated user's profile information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com",
    "first_name": "Mohamed",
    "last_name": "Bakry",
    "business_name": "My Business Inc",
    "business_type": "E-commerce",
    "revenue_range": "$10k-$50k",
    "dm_volume": "50-100/day",
    "pain_point": "Managing customer inquiries",
    "created_at": "2026-03-10T12:00:00.000Z"
  }
}
```

**Response Fields:**
- `id` (string) - User's unique identifier
- `email` (string) - User's email address
- `first_name` (string) - User's first name
- `last_name` (string) - User's last name
- `business_name` (string) - User's business name
- `business_type` (string|null) - Type of business
- `revenue_range` (string|null) - Business revenue range
- `dm_volume` (string|null) - Daily DM volume
- `pain_point` (string|null) - Main pain point
- `created_at` (string) - Account creation timestamp

**Note:** The `password` field is never returned for security.

**Error Responses:**

**401 Unauthorized** - Missing or invalid token
```json
{
  "error": "Access token required"
}
```
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found** - User not found
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

### POST /auth/onboarding

Update the authenticated user's onboarding information.

**Endpoint:** `POST /auth/onboarding`

**Authentication:** Required (JWT)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "business_type": "E-commerce",
  "revenue_range": "$10k-$50k",
  "dm_volume": "50-100/day",
  "pain_point": "Managing customer inquiries"
}
```

**Optional Fields:**
- `business_type` (string) - Type of business
- `revenue_range` (string) - Business revenue range
- `dm_volume` (string) - Daily Instagram DM volume
- `pain_point` (string) - Main business pain point

**Note:** At least one field must be provided.

**Success Response (200 OK):**
```json
{
  "message": "Onboarding information updated successfully",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "user@example.com",
    "business_type": "E-commerce",
    "revenue_range": "$10k-$50k",
    "dm_volume": "50-100/day",
    "pain_point": "Managing customer inquiries"
  }
}
```

**Error Responses:**

**400 Bad Request** - No fields provided
```json
{
  "error": "At least one field is required: business_type, revenue_range, dm_volume, pain_point"
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "error": "Access token required"
}
```
```json
{
  "error": "Invalid or expired token"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to update user information"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server-side error

---

## CORS Configuration

The API supports CORS for the following origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://krew-ai-frontend.vercel.app`

**Allowed Methods:**
- GET
- POST
- PUT
- DELETE
- PATCH
- OPTIONS

**Allowed Headers:**
- Content-Type
- Authorization

**Credentials:** Enabled

---

## Example Usage

### JavaScript/TypeScript (Fetch API)

#### Signup
```typescript
const signup = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name: string;
}) => {
  const response = await fetch('http://localhost:3000/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  // Store token in localStorage or secure storage
  localStorage.setItem('token', data.token);
  return data;
};
```

#### Login
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
};
```

#### Get Current User
```typescript
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('http://localhost:3000/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
};
```

#### Update Onboarding
```typescript
const updateOnboarding = async (onboardingData: {
  business_type?: string;
  revenue_range?: string;
  dm_volume?: string;
  pain_point?: string;
}) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch('http://localhost:3000/auth/onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(onboardingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
};
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  revenue_range VARCHAR(50),
  dm_volume VARCHAR(50),
  pain_point TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Environment Variables

Backend requires the following environment variables:

```bash
# Server Configuration
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://krew-ai-frontend.vercel.app

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET=your_jwt_secret_key

# Meta/Instagram Configuration (for other features)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
VERIFY_TOKEN=your_webhook_verify_token

# OpenAI API (for AI features)
OPENAI_API_KEY=your_openai_api_key
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Never expose JWT_SECRET**
3. **Store tokens securely** (use httpOnly cookies or secure storage)
4. **Implement token refresh** for better security
5. **Validate all user inputs** on both frontend and backend
6. **Use strong passwords** (minimum 8 characters with complexity)
7. **Implement rate limiting** to prevent brute force attacks
8. **Log security events** for monitoring

---

## Support

For issues or questions:
- Backend Repository: Contact your backend team
- Frontend Integration: Check the example code above

Last Updated: March 10, 2026
