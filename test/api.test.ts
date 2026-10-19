import http from 'http';
import { app } from '../src/app.js';

interface TestResult {
  category: string;
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 Starting Project 2 Backend API Verification Suite');
  console.log('======================================================\n');

  // Start app on random available port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind server');
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  const assertResponse = (
    category: string,
    name: string,
    expectedStatus: number,
    res: Response,
    body: any,
    extraCheck?: (b: any) => boolean
  ) => {
    const statusMatch = res.status === expectedStatus;
    const customPass = extraCheck ? extraCheck(body) : true;
    const passed = statusMatch && customPass;

    results.push({
      category,
      name,
      expectedStatus,
      actualStatus: res.status,
      passed,
      notes: passed
        ? undefined
        : `Expected ${expectedStatus}, got ${res.status}. Body: ${JSON.stringify(body).slice(0, 100)}`,
    });

    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [HTTP ${res.status}] [${category}] ${name}`);
  };

  try {
    // -----------------------------------------------------------------
    // 1. HEALTH CHECK & STATUS 200 OK
    // -----------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();
      assertResponse('Health & System', 'GET /health returns 200 OK', 200, res, data, (b) => b.data.status === 'UP');
    }

    // -----------------------------------------------------------------
    // 2. RESOURCE LISTING & RETRIEVAL (GET 200 OK)
    // -----------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/users?page=1&limit=2`);
      const data = await res.json();
      assertResponse(
        'GET Operations',
        'GET /users returns 200 with paginated data array and meta',
        200,
        res,
        data,
        (b) => Array.isArray(b.data) && b.meta.page === 1
      );
    }

    {
      const res = await fetch(`${baseUrl}/users/usr-admin-01`);
      const data = await res.json();
      assertResponse('GET Operations', 'GET /users/:id returns 200 for existing user', 200, res, data, (b) => b.data.id === 'usr-admin-01');
    }

    // -----------------------------------------------------------------
    // 3. RESOURCE CREATION (POST 201 Created & Location Header)
    // -----------------------------------------------------------------
    let createdUserId = '';
    {
      const payload = {
        name: 'Katherine Johnson',
        email: 'katherine.johnson@nasa.gov',
        role: 'editor',
        bio: 'Pioneered orbital mechanics calculations.',
      };
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      createdUserId = data.data?.id;
      const hasLocationHeader = !!res.headers.get('Location');
      assertResponse(
        'POST Operations',
        'POST /users returns 201 Created and Location header',
        201,
        res,
        data,
        (b) => b.data.name === payload.name && hasLocationHeader
      );
    }

    // -----------------------------------------------------------------
    // 4. RESOURCE UPDATE (PUT 200 OK)
    // -----------------------------------------------------------------
    {
      const updatePayload = {
        name: 'Katherine G. Johnson',
        bio: 'Mathematician whose calculations helped synch Apollo 11 Lunar Module.',
      };
      const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json();
      assertResponse(
        'PUT Operations',
        'PUT /users/:id returns 200 OK with updated attributes',
        200,
        res,
        data,
        (b) => b.data.name === updatePayload.name
      );
    }

    // -----------------------------------------------------------------
    // 5. NESTED RESOURCE ROUTES (GET & POST /users/:userId/posts)
    // -----------------------------------------------------------------
    let nestedPostId = '';
    {
      const nestedPayload = {
        title: 'Trajectory Calculation Algorithms',
        content: 'Calculations for trajectories, launch windows, and emergency return paths.',
        status: 'published',
        tags: ['space', 'math', 'aerospace'],
      };
      const res = await fetch(`${baseUrl}/users/${createdUserId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nestedPayload),
      });
      const data = await res.json();
      nestedPostId = data.data?.id;
      assertResponse(
        'Nested Routes',
        'POST /users/:userId/posts creates post under specified user (201 Created)',
        201,
        res,
        data,
        (b) => b.data.authorId === createdUserId
      );
    }

    {
      const res = await fetch(`${baseUrl}/users/${createdUserId}/posts`);
      const data = await res.json();
      assertResponse(
        'Nested Routes',
        'GET /users/:userId/posts retrieves posts for parent user (200 OK)',
        200,
        res,
        data,
        (b) => Array.isArray(b.data) && b.data.length >= 1
      );
    }

    // -----------------------------------------------------------------
    // 6. GATEKEEPER: SYNTACTIC VALIDATION (400 Bad Request)
    // -----------------------------------------------------------------
    {
      const invalidEmailPayload = {
        name: 'Bad Input User',
        email: 'not-an-email',
      };
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEmailPayload),
      });
      const data = await res.json();
      assertResponse(
        'Syntactic Validation',
        'POST /users with invalid email rejected with 400 Bad Request',
        400,
        res,
        data,
        (b) => b.error.code === 'VALIDATION_ERROR' && Array.isArray(b.error.details)
      );
    }

    {
      // Malformed JSON payload
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ malformed: json without quotes ',
      });
      const data = await res.json();
      assertResponse(
        'Syntactic Validation',
        'POST with malformed JSON body rejected with 400 Bad Request',
        400,
        res,
        data,
        (b) => b.error.code === 'MALFORMED_JSON'
      );
    }

    // -----------------------------------------------------------------
    // 7. GATEKEEPER: SEMANTIC VALIDATION (409 Conflict & Business Logic 400)
    // -----------------------------------------------------------------
    {
      // Duplicate email conflict
      const duplicatePayload = {
        name: 'Duplicate Katherine',
        email: 'katherine.johnson@nasa.gov',
      };
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatePayload),
      });
      const data = await res.json();
      assertResponse(
        'Semantic Validation',
        'Duplicate email registration rejected with 409 Conflict',
        409,
        res,
        data,
        (b) => b.error.code === 'CONFLICT'
      );
    }

    {
      // Post with non-existent author
      const invalidAuthorPayload = {
        title: 'Post with Ghost Author',
        content: 'This post cannot be created because the author ID does not exist in database.',
        authorId: 'usr-non-existent-999',
      };
      const res = await fetch(`${baseUrl}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAuthorPayload),
      });
      const data = await res.json();
      assertResponse(
        'Semantic Validation',
        'Post creation for non-existent author returns 404 Not Found',
        404,
        res,
        data
      );
    }

    {
      // Business constraint: Published post must have >= 20 characters
      const shallowPostPayload = {
        title: 'Too short',
        content: 'Short content',
        authorId: 'usr-admin-01',
        status: 'published',
      };
      const res = await fetch(`${baseUrl}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shallowPostPayload),
      });
      const data = await res.json();
      assertResponse(
        'Semantic Validation',
        'Publishing short content rejected by business rule (400 Bad Request)',
        400,
        res,
        data,
        (b) => b.error.code === 'BAD_REQUEST'
      );
    }

    // -----------------------------------------------------------------
    // 8. NOT FOUND (404 Not Found)
    // -----------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/users/usr-ghost-12345`);
      const data = await res.json();
      assertResponse('Not Found Handling', 'GET /users/missing-id returns 404 Not Found', 404, res, data, (b) => b.error.code === 'NOT_FOUND');
    }

    {
      const res = await fetch(`${baseUrl}/non-existent-endpoint`);
      const data = await res.json();
      assertResponse('Not Found Handling', 'GET unmatched route returns 404 Not Found', 404, res, data);
    }

    // -----------------------------------------------------------------
    // 9. AUTHENTICATION & AUTHORIZATION (401 Unauthorized & 403 Forbidden)
    // -----------------------------------------------------------------
    {
      // Missing token
      const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      assertResponse(
        'Auth Checks',
        'DELETE without token rejected with 401 Unauthorized',
        401,
        res,
        data,
        (b) => b.error.code === 'UNAUTHORIZED'
      );
    }

    {
      // Forbidden: Member token trying to execute admin-only delete
      const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer member-token-789' },
      });
      const data = await res.json();
      assertResponse(
        'Auth Checks',
        'DELETE with insufficient role (member vs admin) rejected with 403 Forbidden',
        403,
        res,
        data,
        (b) => b.error.code === 'FORBIDDEN'
      );
    }

    // -----------------------------------------------------------------
    // 10. RESOURCE REMOVAL (DELETE 204 No Content)
    // -----------------------------------------------------------------
    {
      // Admin deletes user
      const res = await fetch(`${baseUrl}/users/${createdUserId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer admin-token-123' },
      });
      assertResponse(
        'DELETE Operations',
        'DELETE with admin token returns 204 No Content (empty body)',
        204,
        res,
        null
      );
    }

    {
      // Confirm deletion
      const res = await fetch(`${baseUrl}/users/${createdUserId}`);
      const data = await res.json();
      assertResponse('DELETE Operations', 'GET deleted user verifies resource is gone (404 Not Found)', 404, res, data);
    }

    // -----------------------------------------------------------------
    // 11. RATE LIMITING (429 Too Many Requests)
    // -----------------------------------------------------------------
    {
      // Hit the strict limiter twice (permitted) then 3rd time (429)
      await fetch(`${baseUrl}/simulate/rate-limited`);
      await fetch(`${baseUrl}/simulate/rate-limited`);
      const res = await fetch(`${baseUrl}/simulate/rate-limited`);
      const data = await res.json();
      const hasRetryAfter = !!res.headers.get('Retry-After');
      assertResponse(
        'Rate Limiting',
        'Exceeding rate limit returns 429 Too Many Requests & Retry-After header',
        429,
        res,
        data,
        (b) => b.error.code === 'TOO_MANY_REQUESTS' && hasRetryAfter
      );
    }

    // -----------------------------------------------------------------
    // 12. INTERNAL SERVER ERROR (500 Internal Server Error)
    // -----------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/simulate/internal-error`);
      const data = await res.json();
      assertResponse(
        'Error Handling',
        'Unhandled server exceptions caught and formatted as 500 Internal Server Error',
        500,
        res,
        data,
        (b) => b.error.code === 'INTERNAL_SERVER_ERROR'
      );
    }

    console.log('\n======================================================');
    console.log(`📊 Test Summary: ${results.filter((r) => r.passed).length} / ${results.length} Tests Passed`);
    console.log('======================================================\n');

    const allPassed = results.every((r) => r.passed);
    if (!allPassed) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
