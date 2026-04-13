import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

/**
 * API Tests - FPT CLAW
 * 
 * Mục tiêu: Test backend API endpoints
 * Phủ sóng: Authentication, Chat completions, Models, Error handling
 * 
 * Environment Variables cần thiết:
 * - CLAW_API_URL: Base URL của CLAW API (ví dụ: https://dev-claw.fptcloud.net/api)
 * - CLAW_API_KEY: API key hoặc token để authenticate
 * - CLAW_FROM: From parameter (nếu cần)
 */

const API_BASE_URL = process.env.CLAW_API_URL || 'https://dev-claw.fptcloud.net/api';
const API_KEY = process.env.CLAW_API_KEY || '';
const API_FROM = process.env.CLAW_FROM || 'playwright-test';

// Helper function để tạo API headers
function getApiHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  
  return headers;
}

test.describe('API — FPT CLAW Backend', () => {

  test.describe('API-001: Health Check', () => {
    
    test('API server is accessible', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`);
      
      // API có thể trả về 200, 404 (nếu không có endpoint health), hoặc redirect
      expect([200, 404, 302, 301]).toContain(response.status());
      
      console.log(`✅ API-001 PASS: API server accessible (status: ${response.status()})`);
    });

    test('API base URL responds', async ({ request }) => {
      const response = await request.get(API_BASE_URL);
      
      // Should respond (200, 401, 403, 404 đều OK - quan trọng là server up)
      expect([200, 401, 403, 404]).toContain(response.status());
      
      console.log(`✅ API-001b PASS: API base URL responds (status: ${response.status()})`);
    });
  });

  test.describe('API-002: List Models', () => {
    
    test('GET /v1/models - Should return list of available models', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/models`, {
        headers: getApiHeaders(),
      });
      
      // Verify response status
      expect(response.status()).toBe(200);
      
      // Parse response body
      const body = await response.json();
      
      // Verify response structure
      expect(body).toHaveProperty('object');
      expect(body.object).toBe('list');
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBeTruthy();
      
      // Verify at least one model exists
      expect(body.data.length).toBeGreaterThan(0);
      
      // Verify model structure
      const firstModel = body.data[0];
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('object');
      expect(firstModel.object).toBe('model');
      
      console.log(`✅ API-002 PASS: Found ${body.data.length} models`);
      console.log(`   Models: ${body.data.map((m: any) => m.id).join(', ')}`);
    });

    test('GET /v1/models - Should include model details', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/v1/models`, {
        headers: getApiHeaders(),
      });
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      const firstModel = body.data[0];
      
      // Verify common model properties
      expect(firstModel).toHaveProperty('id');
      expect(firstModel).toHaveProperty('created');
      expect(firstModel).toHaveProperty('owned_by');
      
      console.log(`✅ API-002b PASS: Model details verified for ${firstModel.id}`);
    });
  });

  test.describe('API-003: Chat Completions', () => {
    
    test('POST /v1/chat/completions - Should return AI response', async ({ request }) => {
      test.setTimeout(60000); // 60s timeout for AI response
      
      const payload = {
        model: 'default-assistant',
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with "API test successful"',
          },
        ],
        stream: false,
        max_tokens: 100,
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      // Verify response status
      expect(response.status()).toBe(200);
      
      // Parse response body
      const body = await response.json();
      
      // Verify response structure (OpenAI-compatible)
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('object');
      expect(body.object).toBe('chat.completion');
      expect(body).toHaveProperty('created');
      expect(body).toHaveProperty('model');
      expect(body).toHaveProperty('choices');
      expect(Array.isArray(body.choices)).toBeTruthy();
      expect(body.choices.length).toBeGreaterThan(0);
      
      // Verify choice structure
      const firstChoice = body.choices[0];
      expect(firstChoice).toHaveProperty('index');
      expect(firstChoice).toHaveProperty('message');
      expect(firstChoice).toHaveProperty('finish_reason');
      
      // Verify message structure
      expect(firstChoice.message).toHaveProperty('role');
      expect(firstChoice.message).toHaveProperty('content');
      expect(typeof firstChoice.message.content).toBe('string');
      expect(firstChoice.message.content.length).toBeGreaterThan(0);
      
      console.log(`✅ API-003 PASS: Chat completion successful`);
      console.log(`   Response ID: ${body.id}`);
      console.log(`   Model: ${body.model}`);
      console.log(`   Content: ${firstChoice.message.content.substring(0, 100)}...`);
    });

    test('POST /v1/chat/completions - Should handle multi-turn conversation', async ({ request }) => {
      test.setTimeout(60000); // 60s timeout
      
      const payload = {
        model: 'default-assistant',
        messages: [
          {
            role: 'user',
            content: 'My name is API Tester',
          },
          {
            role: 'assistant',
            content: 'Hello API Tester! How can I help you today?',
          },
          {
            role: 'user',
            content: 'What is my name?',
          },
        ],
        stream: false,
        max_tokens: 100,
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      const content = body.choices[0].message.content;
      
      // Verify AI remembers context
      expect(content.toLowerCase()).toContain('api tester');
      
      console.log(`✅ API-003b PASS: Multi-turn conversation successful`);
      console.log(`   AI remembered: API Tester`);
    });

    test('POST /v1/chat/completions - Should handle Vietnamese language', async ({ request }) => {
      test.setTimeout(60000); // 60s timeout
      
      const payload = {
        model: 'default-assistant',
        messages: [
          {
            role: 'user',
            content: 'Xin chào, hãy trả lời bằng tiếng Việt',
          },
        ],
        stream: false,
        max_tokens: 100,
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      const content = body.choices[0].message.content;
      
      // Verify response is in Vietnamese (contains Vietnamese characters)
      const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      expect(vietnameseChars.test(content)).toBeTruthy();
      
      console.log(`✅ API-003c PASS: Vietnamese language supported`);
      console.log(`   Response: ${content.substring(0, 100)}...`);
    });
  });

  test.describe('API-004: Authentication & Authorization', () => {
    
    test('Should reject requests without API key', async ({ request }) => {
      const payload = {
        model: 'default-assistant',
        messages: [{ role: 'user', content: 'Test' }],
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: {
            'Content-Type': 'application/json',
            // No Authorization header
          },
          data: payload,
        }
      );
      
      // Should return 401 Unauthorized or 403 Forbidden
      expect([401, 403]).toContain(response.status());
      
      console.log(`✅ API-004 PASS: Rejected request without API key (status: ${response.status()})`);
    });

    test('Should reject requests with invalid API key', async ({ request }) => {
      const payload = {
        model: 'default-assistant',
        messages: [{ role: 'user', content: 'Test' }],
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-api-key-12345',
          },
          data: payload,
        }
      );
      
      // Should return 401 Unauthorized or 403 Forbidden
      expect([401, 403]).toContain(response.status());
      
      console.log(`✅ API-004b PASS: Rejected request with invalid API key (status: ${response.status()})`);
    });
  });

  test.describe('API-005: Error Handling', () => {
    
    test('Should handle invalid model name', async ({ request }) => {
      const payload = {
        model: 'non-existent-model-xyz',
        messages: [{ role: 'user', content: 'Test' }],
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      // Should return 400 Bad Request or 404 Not Found
      expect([400, 404]).toContain(response.status());
      
      console.log(`✅ API-005 PASS: Handled invalid model name (status: ${response.status()})`);
    });

    test('Should handle missing required fields', async ({ request }) => {
      const payload = {
        // Missing 'model' field
        messages: [{ role: 'user', content: 'Test' }],
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      // Should return 400 Bad Request
      expect(response.status()).toBe(400);
      
      console.log(`✅ API-005b PASS: Handled missing required fields (status: ${response.status()})`);
    });

    test('Should handle empty messages array', async ({ request }) => {
      const payload = {
        model: 'default-assistant',
        messages: [], // Empty array
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      // Should return 400 Bad Request
      expect(response.status()).toBe(400);
      
      console.log(`✅ API-005c PASS: Handled empty messages array (status: ${response.status()})`);
    });
  });

  test.describe('API-006: Rate Limiting', () => {
    
    test('Should handle multiple rapid requests', async ({ request }) => {
      test.setTimeout(120000); // 2 minutes timeout
      
      const payload = {
        model: 'default-assistant',
        messages: [{ role: 'user', content: 'Quick test' }],
        max_tokens: 10,
      };

      // Send 5 rapid requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request.post(`${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`, {
            headers: getApiHeaders(),
            data: payload,
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // All requests should succeed (or some may be rate limited)
      const successCount = responses.filter(r => r.status() === 200).length;
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      
      console.log(`✅ API-006 PASS: Handled ${responses.length} rapid requests`);
      console.log(`   Success: ${successCount}, Rate Limited: ${rateLimitedCount}`);
      
      // At least some requests should succeed
      expect(successCount).toBeGreaterThan(0);
    });
  });

  test.describe('API-007: Streaming Response', () => {
    
    test('Should support streaming responses', async ({ request }) => {
      test.setTimeout(60000); // 60s timeout
      
      const payload = {
        model: 'default-assistant',
        messages: [{ role: 'user', content: 'Say hello' }],
        stream: true,
        max_tokens: 50,
      };

      const response = await request.post(
        `${API_BASE_URL}/v1/chat/completions?from=${API_FROM}`,
        {
          headers: getApiHeaders(),
          data: payload,
        }
      );
      
      // Streaming should return 200
      expect(response.status()).toBe(200);
      
      // Get response body as text
      const body = await response.text();
      
      // Streaming responses contain multiple "data: " lines
      expect(body).toContain('data: ');
      
      // Count number of chunks
      const chunks = body.split('\n').filter(line => line.startsWith('data: '));
      expect(chunks.length).toBeGreaterThan(0);
      
      console.log(`✅ API-007 PASS: Streaming response supported`);
      console.log(`   Received ${chunks.length} chunks`);
    });
  });

});