/**
 * Unit tests for OpenAI Client Service
 * Tests API integration, error handling, and roast generation
 * 
 * @fileoverview TDD tests for OpenAI API client functionality
 */

import { openaiClient } from '../../../src/services/openaiClient.js';

describe('OpenAIClient Service', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
  });

  describe('Roast Generation', () => {
    test('should generate roast from base64 image', async () => {
      const mockResponse = {
        id: 'chatcmpl-test123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'gpt-4-vision-preview',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Looking at this photo, I can see why they invented filters!'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 85,
          completion_tokens: 32,
          total_tokens: 117
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const base64Image = 'data:image/jpeg;base64,fakebase64data';
      const result = await openaiClient.generateRoast(base64Image);

      expect(result.success).toBe(true);
      expect(result.roastText).toBe('Looking at this photo, I can see why they invented filters!');
      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    test('should include proper request format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test roast' } }]
        })
      });

      const base64Image = 'data:image/jpeg;base64,testdata';
      await openaiClient.generateRoast(base64Image);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          }),
          body: expect.stringMatching(/gpt-4-vision-preview/)
        })
      );
    });

    test('should include custom roast prompt', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Custom roast' } }]
        })
      });

      const base64Image = 'data:image/jpeg;base64,testdata';
      await openaiClient.generateRoast(base64Image);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      const textContent = requestBody.messages[0].content.find(c => c.type === 'text');
      
      expect(textContent.text).toContain('humorous');
      expect(textContent.text).toContain('family-friendly');
      expect(textContent.text).toContain('roast');
    });

    test('should respect processing timeout', async () => {
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 15000)) // 15 second delay
      );

      const base64Image = 'data:image/jpeg;base64,testdata';
      const result = await openaiClient.generateRoast(base64Image);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('timeout');
      expect(result.processingTimeMs).toBeGreaterThan(10000);
    });

    test('should handle multiple image formats', async () => {
      const formats = [
        'data:image/jpeg;base64,jpegdata',
        'data:image/png;base64,pngdata',
        'data:image/gif;base64,gifdata',
        'data:image/webp;base64,webpdata'
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Format test roast' } }]
        })
      });

      for (const base64Image of formats) {
        const result = await openaiClient.generateRoast(base64Image);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle API rate limiting', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            message: 'Rate limit reached for requests',
            type: 'requests',
            code: 'rate_limit_exceeded'
          }
        })
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('rate_limit');
      expect(result.error.message).toContain('rate limit');
      expect(result.error.retryAfterSeconds).toBeGreaterThan(0);
    });

    test('should handle invalid API key', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            message: 'Invalid API key provided',
            type: 'invalid_request_error',
            code: 'invalid_api_key'
          }
        })
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('api_error');
      expect(result.error.message).toContain('API key');
    });

    test('should handle content policy violations', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Your request was rejected as a result of our safety system',
            type: 'invalid_request_error',
            code: 'content_policy_violation'
          }
        })
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('content_policy');
      expect(result.error.message).toContain('safety');
    });

    test('should handle service unavailability', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: 'The server is temporarily overloaded',
            type: 'server_error',
            code: 'service_unavailable'
          }
        })
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('service_unavailable');
      expect(result.error.retryAfterSeconds).toBeGreaterThan(0);
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('network_error');
    });

    test('should handle malformed responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }) // Missing required fields
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('invalid_response');
    });
  });

  describe('Retry Logic', () => {
    test('should retry on transient failures', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success after retry' } }]
          })
        });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(true);
      expect(result.roastText).toBe('Success after retry');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    test('should use exponential backoff for retries', async () => {
      const startTime = Date.now();
      
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Retry success' } }]
          })
        });

      await openaiClient.generateRoast('data:image/jpeg;base64,test');
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeGreaterThan(1000); // Should have some delay from backoff
    });

    test('should not retry on permanent failures', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: 'invalid_api_key' }
        })
      });

      await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(fetch).toHaveBeenCalledTimes(1); // No retries for 401
    });

    test('should respect maximum retry attempts', async () => {
      fetch.mockRejectedValue(new Error('Persistent error'));

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Request Configuration', () => {
    test('should use correct model and parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Config test' } }]
        })
      });

      await openaiClient.generateRoast('data:image/jpeg;base64,test');

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      
      expect(requestBody.model).toBe('gpt-4-vision-preview');
      expect(requestBody.max_tokens).toBe(300);
      expect(requestBody.temperature).toBe(0.9);
    });

    test('should include image in correct format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Image format test' } }]
        })
      });

      const base64Image = 'data:image/jpeg;base64,testimage';
      await openaiClient.generateRoast(base64Image);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      const imageContent = requestBody.messages[0].content.find(c => c.type === 'image_url');
      
      expect(imageContent.image_url.url).toBe(base64Image);
    });

    test('should handle custom configuration options', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Custom config test' } }]
        })
      });

      const options = {
        maxTokens: 150,
        temperature: 0.7,
        customPrompt: 'Make it extra funny'
      };

      await openaiClient.generateRoast('data:image/jpeg;base64,test', options);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      
      expect(requestBody.max_tokens).toBe(150);
      expect(requestBody.temperature).toBe(0.7);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track API usage statistics', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Stats test' } }],
          usage: { total_tokens: 100 }
        })
      });

      await openaiClient.generateRoast('data:image/jpeg;base64,test');
      
      const stats = openaiClient.getUsageStats();
      
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });

    test('should track error rates', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }]
          })
        });

      await openaiClient.generateRoast('data:image/jpeg;base64,test1');
      await openaiClient.generateRoast('data:image/jpeg;base64,test2');

      const stats = openaiClient.getUsageStats();
      
      expect(stats.errorRate).toBe(0.5); // 1 error out of 2 requests
    });

    test('should estimate costs based on token usage', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Cost test' } }],
          usage: {
            prompt_tokens: 85,
            completion_tokens: 32,
            total_tokens: 117
          }
        })
      });

      await openaiClient.generateRoast('data:image/jpeg;base64,test');

      const stats = openaiClient.getUsageStats();
      
      expect(stats.estimatedCost).toBeGreaterThan(0);
      expect(typeof stats.estimatedCost).toBe('number');
    });
  });

  describe('Input Validation', () => {
    test('should validate base64 image format', async () => {
      const invalidImage = 'not-a-base64-image';
      
      const result = await openaiClient.generateRoast(invalidImage);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('invalid_input');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should validate image size limits', async () => {
      const hugeImage = 'data:image/jpeg;base64,' + 'x'.repeat(10 * 1024 * 1024); // 10MB base64
      
      const result = await openaiClient.generateRoast(hugeImage);

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('image_too_large');
    });

    test('should handle null or undefined input', async () => {
      const nullResult = await openaiClient.generateRoast(null);
      const undefinedResult = await openaiClient.generateRoast(undefined);

      expect(nullResult.success).toBe(false);
      expect(nullResult.error.type).toBe('invalid_input');
      expect(undefinedResult.success).toBe(false);
      expect(undefinedResult.error.type).toBe('invalid_input');
    });
  });

  describe('Response Processing', () => {
    test('should extract roast text from valid response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is a hilarious roast!'
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.roastText).toBe('This is a hilarious roast!');
    });

    test('should handle empty or missing content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.success).toBe(false);
      expect(result.error.type).toBe('empty_response');
    });

    test('should sanitize potentially harmful content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Roast with <script>alert("xss")</script> content'
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await openaiClient.generateRoast('data:image/jpeg;base64,test');

      expect(result.roastText).not.toContain('<script>');
      expect(result.roastText).toContain('Roast with');
    });
  });
});
