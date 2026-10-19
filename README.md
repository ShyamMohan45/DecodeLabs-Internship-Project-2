# Project 2: Robust Backend RESTful API Development

A production-grade, architectural reference implementation of a RESTful backend API built using **Node.js, Express 5, TypeScript, and Zod**. It demonstrates strict REST conventions, layered clean architecture, client-server data flow, comprehensive HTTP status code semantics, and the **"Gatekeeper Rule"** for client inputs.

---

## 🏛️ Architecture Overview

The system strictly decouples responsibilities across four modular layers:

```
[ Client Request ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Middlewares                                            │
│  ├── Helmet & CORS (Security & Transport)              │
│  ├── express.json() (Syntactic parsing)                │
│  ├── Rate Limiter (Token/Sliding Window - HTTP 429)    │
│  ├── Request Logger (Audit & Latency)                  │
│  ├── Zod Request Validator (Syntactic Gatekeeper - 400)│
│  └── Authenticate & RequireRole (Auth - 401 & 403)     │
└──────────────────────┬─────────────────────────────────┘
                       │ Validated Req (body, query, params)
                       ▼
┌────────────────────────────────────────────────────────┐
│ Routes & Controllers                                   │
│  ├── Dispatches HTTP verbs (GET, POST, PUT, DELETE)    │
│  ├── Resolves HTTP status codes (200, 201, 204)        │
│  └── Injects Location headers for created resources    │
└──────────────────────┬─────────────────────────────────┘
                       │ Invokes Domain Logic
                       ▼
┌────────────────────────────────────────────────────────┐
│ Service Layer (Semantic Gatekeeper)                    │
│  ├── Enforces business rules & invariants              │
│  ├── Validates relational integrity (Author checks)    │
│  ├── Conflict detection (Duplicate emails - 409)       │
│  └── State transition constraints (Lifecycle checks)   │
└──────────────────────┬─────────────────────────────────┘
                       │ Data Operations
                       ▼
┌────────────────────────────────────────────────────────┐
│ Data Layer / Repositories                              │
│  ├── Abstracted persistence operations                 │
│  └── Pagination, filtering, searching, and sorting     │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart

### 1. Requirements
- Node.js `>= 18` (Tested on Node `v22.16.0`)
- npm `>= 9`

### 2. Installation
```powershell
cd C:\Users\shyam\.gemini\antigravity\scratch\project2-backend-api
npm install
```

### 3. Run Development Server
```powershell
npm run dev
```
The server will start at `http://localhost:3000/api/v1`.

### 4. Run the Full Test Suite
Executes the automated 20-point test suite asserting every HTTP status code:
```powershell
npm test
```

### 5. Build for Production
```powershell
npm run build
npm start
```

---

## 🛡️ The "Gatekeeper" Rule

Never trust client inputs. Input handling is enforced at two distinct layers:

1. **Syntactic Validation (Input Structure & Typing)**:
   - Evaluated by `validateRequest` middleware using **Zod schemas**.
   - Rejects non-conforming types, missing required fields, illegal string lengths, regex failures, or malformed JSON payloads.
   - Responds immediately with **`400 Bad Request`** and a granular breakdown of failing fields:
     ```json
     {
       "success": false,
       "error": {
         "code": "VALIDATION_ERROR",
         "message": "Syntactic validation failed for request payload or parameters",
         "details": [
           { "field": "body.email", "message": "Invalid email address format" }
         ]
       },
       "timestamp": "2026-10-19T09:43:35.253Z"
     }
     ```

2. **Semantic Validation (Business Constraints & Logic)**:
   - Evaluated inside the **Service Layer** *before* touching the repository or database.
   - Verifies logic rules:
     - Duplicate user emails return **`409 Conflict`**.
     - Creating a post under an author ID that does not exist returns **`404 Not Found`**.
     - Creating or updating a post for a suspended user returns **`400 Bad Request`**.
     - Publishing a post requires a minimum length of 20 characters (**`400 Bad Request`**).
     - Moving an archived post back to draft directly is forbidden by business policy (**`400 Bad Request`**).
     - Cannot suspend the sole active administrator account (**`400 Bad Request`**).

---

## 📡 RESTful Endpoints Reference

Base URL: `http://localhost:3000/api/v1`

### Users (`/users`)
| Method | Endpoint | Description | Success Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Paginated list of users (`?page=1&limit=10&role=admin&search=ada`) | `200 OK` |
| `GET` | `/users/:id` | Retrieve single user by ID | `200 OK` |
| `POST` | `/users` | Register a new user | `201 Created` |
| `PUT` | `/users/:id` | Update existing user details | `200 OK` |
| `DELETE` | `/users/:id` | Remove user (Requires Admin Bearer token) | `204 No Content` |

### Nested Resource: User Posts (`/users/:userId/posts`)
| Method | Endpoint | Description | Success Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/:userId/posts` | Retrieve all posts authored by a specific user | `200 OK` |
| `POST` | `/users/:userId/posts` | Create a post scoped directly under a user | `201 Created` |

### Posts (`/posts`)
| Method | Endpoint | Description | Success Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/posts` | Paginated list of posts (`?status=published&tag=ai`) | `200 OK` |
| `GET` | `/posts/:id` | Retrieve single post by ID | `200 OK` |
| `POST` | `/posts` | Create a post with explicit author ID | `201 Created` |
| `PUT` | `/posts/:id` | Update post attributes | `200 OK` |
| `DELETE` | `/posts/:id` | Delete post (Requires Editor or Admin token) | `204 No Content` |

---

## 🚦 HTTP Status Code Demonstration Matrix

| Status Code | Reason / Meaning | Trigger Scenario |
| :--- | :--- | :--- |
| **`200 OK`** | Standard success for retrieval & update | `GET /users`, `GET /users/:id`, `PUT /users/:id` |
| **`201 Created`** | Successful resource creation with `Location` header | `POST /users`, `POST /posts`, `POST /users/:id/posts` |
| **`204 No Content`** | Successful removal with empty response body | `DELETE /users/:id` (with admin token) |
| **`400 Bad Request`** | Syntactic schema failure or business constraint violation | Invalid email format, missing title, or malformed JSON |
| **`401 Unauthorized`** | Missing or invalid authentication token | Calling protected `DELETE` without `Authorization: Bearer <token>` |
| **`403 Forbidden`** | Authenticated user lacks required permission/role | Calling `DELETE /users/:id` with member token instead of admin |
| **`404 Not Found`** | Missing entity or unregistered route | Requesting `/users/usr-ghost` or `/api/v1/unknown` |
| **`409 Conflict`** | Unique constraint violation | Attempting to create a user with an already-registered email |
| **`429 Too Many Requests`** | Rate limiting threshold exceeded | Exceeding request allowance (includes `Retry-After` header) |
| **`500 Internal Server Error`** | Unhandled server exception | Handled cleanly by centralized error middleware without leaking traces |

---

## 🧪 Testing with cURL

### 1. Health Check (200 OK)
```bash
curl -i http://localhost:3000/api/v1/health
```

### 2. Create User (201 Created)
```bash
curl -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada.lovelace@example.com","role":"admin"}'
```

### 3. Syntactic Validation Error (400 Bad Request)
```bash
curl -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"invalid-email"}'
```

### 4. Semantic Conflict (409 Conflict)
```bash
# Trying to register existing seeded email 'alan.turing@example.com'
curl -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alan Duplicate","email":"alan.turing@example.com"}'
```

### 5. Nested Route: Create Post under User (201 Created)
```bash
curl -i -X POST http://localhost:3000/api/v1/users/usr-admin-01/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Computing Engines","content":"A comprehensive analysis of programmable mechanical calculations.","status":"published"}'
```

### 6. Authentication Check (401 Unauthorized)
```bash
curl -i -X DELETE http://localhost:3000/api/v1/users/usr-admin-01
```

### 7. Authorization Check (403 Forbidden)
```bash
curl -i -X DELETE http://localhost:3000/api/v1/users/usr-admin-01 \
  -H "Authorization: Bearer member-token-789"
```

### 8. Authorized Deletion (204 No Content)
```bash
curl -i -X DELETE http://localhost:3000/api/v1/users/usr-member-01 \
  -H "Authorization: Bearer admin-token-123"
```

### 9. Rate Limit Check (429 Too Many Requests)
```bash
curl -i http://localhost:3000/api/v1/simulate/rate-limited
curl -i http://localhost:3000/api/v1/simulate/rate-limited
curl -i http://localhost:3000/api/v1/simulate/rate-limited
```

### 10. Centralized Error Handler (500 Internal Server Error)
```bash
curl -i http://localhost:3000/api/v1/simulate/internal-error
```
