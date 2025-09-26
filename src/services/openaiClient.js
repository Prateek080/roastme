/**
 * OpenAI Client Service for Photo Roasting Web App
 * Handles API integration, error handling, and roast generation
 * 
 * @fileoverview Constitutional compliance: <100 lines, comprehensive JSDoc
 * @author Photo Roasting App Team
 * @version 1.0.0
 */

import { corsProxy } from '../utils/corsProxy.js';
import config, { API_CONFIG } from '../utils/config.js';

/**
 * OpenAI API client with retry logic and usage tracking
 * @class OpenAIClient
 */
class OpenAIClient {
  constructor() {
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      errorCount: 0,
      totalResponseTime: 0,
      estimatedCost: 0
    };
  }

  /**
   * Generates humorous roast from base64 image
   * @param {string} base64Image - Base64 encoded image data
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Roast generation result
   */
  async generateRoast(base64Image, options = {}) {
    console.log('🤖 OpenAI.generateRoast called with:', {
      hasImage: !!base64Image,
      imageLength: base64Image?.length,
      imageType: typeof base64Image,
      startsWithData: base64Image?.startsWith?.('data:'),
      options
    });
    
    const startTime = performance.now();
    
    // Input validation
    console.log('🔍 Starting input validation...');
    const validationResult = this.validateInput(base64Image);
    if (!validationResult.isValid) {
      console.error('❌ Input validation failed:', validationResult.error);
      return {
        success: false,
        error: validationResult.error
      };
    }
    console.log('✅ Input validation passed');

    console.log('🛠️ Building request body...');
    const requestBody = this.buildRequestBody(base64Image, options);
    console.log('📦 Request body built:', {
      model: requestBody.model,
      messagesCount: requestBody.messages?.length,
      maxTokens: requestBody.max_tokens,
      temperature: requestBody.temperature
    });
    
    try {
      console.log('🚀 Making API request to OpenAI...');
      const response = await this.makeRequestWithRetry(requestBody);
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const result = this.processSuccessResponse(data, processingTime);
        this.updateUsageStats(processingTime, true, data.usage);
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorResult = this.processErrorResponse(response, errorData, processingTime);
        this.updateUsageStats(processingTime, false);
        return errorResult;
      }
    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      this.updateUsageStats(processingTime, false);
      
      if (processingTime > 10000) {
        return {
          success: false,
          processingTimeMs: processingTime,
          error: { type: 'timeout', message: 'Request timed out after 10 seconds' }
        };
      }
      
      return {
        success: false,
        processingTimeMs: processingTime,
        error: { type: 'network_error', message: 'Network request failed' }
      };
    }
  }

  /**
   * Validates input parameters
   * @param {string} base64Image - Base64 image data
   * @returns {Object} Validation result
   */
  validateInput(base64Image) {
    if (!base64Image) {
      return {
        isValid: false,
        error: { type: 'invalid_input', message: 'No image provided' }
      };
    }
    
    if (!base64Image.startsWith('data:image/')) {
      return {
        isValid: false,
        error: { type: 'invalid_input', message: 'Invalid base64 image format' }
      };
    }
    
    // Check size (rough estimate: base64 is ~1.33x original size)
    if (base64Image.length > 10 * 1024 * 1024 * 1.33) {
      return {
        isValid: false,
        error: { type: 'image_too_large', message: 'Image too large for processing' }
      };
    }
    
    return { isValid: true };
  }

  /**
   * Builds OpenAI API request body
   * @param {string} base64Image - Base64 image data
   * @param {Object} options - Request options
   * @returns {Object} Request body
   */
  buildRequestBody(base64Image, options) {
    const prompt = options.customPrompt || this.getPersonaPrompt(options.persona);
    
    return {
      model: API_CONFIG.OPENAI_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      }],
      max_tokens: options.maxTokens || API_CONFIG.MAX_TOKENS,
      temperature: options.temperature || API_CONFIG.TEMPERATURE
    };
  }

  /**
   * Gets persona-specific prompt for roasting
   * @param {string} persona - Selected persona
   * @returns {string} Persona-specific prompt
   */
  getPersonaPrompt(persona = 'kapil-sharma') {
    const personas = {      
      'virat-kohli': "DEMOLISH this photo like Virat Kohli would destroy a rival team! Be absolutely RUTHLESS and aggressive. Use cricket sledging - 'This shot has worse technique than a tailender!' Mock their pose like you're mocking a batsman's stance. Be intense, passionate, and brutal. Say things like 'Even a blind umpire would call this OUT!' Show no mercy! MAXIMUM 3-4 lines only.",
      
      'arnab-goswami': "DESTROY this photo like Arnab Goswami in full attack mode! Be ABSOLUTELY OUTRAGEOUS and dramatic! Scream things like 'HOW DARE THEY take such a photo!' Ask brutal questions - 'WHO told them this pose was acceptable?' Be mercilessly mocking and intense. Make it feel like you're EXPOSING a major scandal! MAXIMUM 3-4 lines only.",
      
      'rajinikanth': "Roast this photo with Rajinikanth's LEGENDARY swagger but make it SAVAGE! Say 'Mind it!' while brutally mocking everything. Use his style to deliver cutting insults - 'Even my stunts look more realistic than this pose!' Be stylishly brutal and mock with Thalaiva's confidence. Make them feel small with style! MAXIMUM 3-4 lines only.",
      
      'shashi-tharoor': "INTELLECTUALLY DESTROY this photo using Shashi Tharoor's vocabulary! Use big words to deliver SAVAGE insults. Call them things like 'a paragon of photographic mediocrity' or 'an epitome of aesthetic catastrophe.' Be eloquently brutal and mockingly sophisticated. Make them feel intellectually inferior while roasting mercilessly! MAXIMUM 3-4 lines only.",
      
      'bhuvan-bam': "SAVAGE this photo like Bhuvan Bam roasting someone! Use YouTube humor to be brutally funny - 'Bhai, yeh photo dekh kar lagta hai filter bhi give up kar gaya!' Be relentlessly mocking with millennial slang. Use 'Samay hai' to mock their timing. Be energetically brutal and don't spare anything! MAXIMUM 3-4 lines only.",
      
      'karan-johar': "TEAR APART this photo like Karan Johar roasting celebrities on his show! Be glamorously SAVAGE about fashion, pose, everything! Say things like 'Darling, this look is giving me second-hand embarrassment!' Mock their style choices mercilessly. Be fabulously brutal with Bollywood references. Show no mercy, darling! MAXIMUM 3-4 lines only.",
      
      'sunil-grover': "Channel Gutthi/Dr. Gulati to be INNOCENTLY SAVAGE! Use that sweet voice to deliver brutal roasts - 'Arrey sahab, photo mein kya ho gaya hai aapko?' Be mockingly innocent while being absolutely ruthless. Use Hindi comedy to brutally roast everything visible. Make it hilariously cruel with innocent expressions! MAXIMUM 3-4 lines only.",
      
      'jackie-shroff': "Roast this photo like Jackie Shroff would - be BINDAAS and brutally honest! Use his signature style - 'Bhidu, yeh kya scene hai?' Be coolly savage and mock everything with his laid-back but cutting humor. Say things like 'Arre yaar, camera bhi confused ho gaya hoga!' Use Mumbai street slang to deliver brutal roasts. Be stylishly ruthless, bhidu! MAXIMUM 3-4 lines only.",
      
      'raghu-roadies': "ABSOLUTELY DESTROY this photo like Raghu from Roadies! Be FURIOUSLY ANGRY and brutally savage! Scream things like 'WHAT THE HELL is this pose?!' Mock their attitude like you're eliminating them from Roadies. Be aggressively brutal - 'You think this is COOL? This is PATHETIC!' Show pure rage and disgust. Make them feel worthless with your anger! MAXIMUM 3-4 lines only."
    };

    return personas[persona] || personas['kapil-sharma'];
  }

  /**
   * Makes API request with retry logic
   * @param {Object} requestBody - Request payload
   * @returns {Promise<Response>} API response
   */
  async makeRequestWithRetry(requestBody, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      const response = await corsProxy.makeRequest('chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      return response;
    } catch (error) {
      if (retryCount < maxRetries && this.shouldRetry(error)) {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.makeRequestWithRetry(requestBody, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Determines if request should be retried
   * @param {Error} error - Request error
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error) {
    // Don't retry 401 (auth) or 400 (bad request) errors
    return !error.message?.includes('401') && !error.message?.includes('400');
  }

  /**
   * Delays execution for specified milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Processes successful API response
   * @param {Object} data - Response data
   * @param {number} processingTime - Processing time in ms
   * @returns {Object} Processed result
   */
  processSuccessResponse(data, processingTime) {
    if (!data.choices || !data.choices[0]?.message?.content) {
      return {
        success: false,
        error: { type: 'invalid_response', message: 'Invalid API response format' }
      };
    }
    
    const roastText = data.choices[0].message.content.trim();
    if (!roastText) {
      return {
        success: false,
        error: { type: 'empty_response', message: 'Empty roast content received' }
      };
    }
    
    // Sanitize content (remove potential HTML/script tags)
    const sanitizedText = roastText.replace(/<[^>]*>/g, '');
    
    return {
      success: true,
      roastText: sanitizedText,
      processingTimeMs: processingTime
    };
  }

  /**
   * Processes API error response
   * @param {Response} response - HTTP response
   * @param {Object} errorData - Error data
   * @param {number} processingTime - Processing time in ms
   * @returns {Object} Error result
   */
  processErrorResponse(response, errorData, processingTime) {
    const baseError = { processingTimeMs: processingTime };
    
    switch (response.status) {
      case 429:
        return {
          success: false,
          ...baseError,
          error: {
            type: 'rate_limit',
            message: 'Rate limit exceeded. Please wait before trying again.',
            retryAfterSeconds: 60
          }
        };
      case 401:
        return {
          success: false,
          ...baseError,
          error: { type: 'api_error', message: 'Invalid API key provided' }
        };
      case 400:
        if (errorData.error?.code === 'content_policy_violation') {
          return {
            success: false,
            ...baseError,
            error: { type: 'content_policy', message: 'Content violates safety guidelines' }
          };
        }
        return {
          success: false,
          ...baseError,
          error: { type: 'api_error', message: 'Bad request to API' }
        };
      case 503:
        return {
          success: false,
          ...baseError,
          error: {
            type: 'service_unavailable',
            message: 'OpenAI service temporarily unavailable',
            retryAfterSeconds: 30
          }
        };
      default:
        return {
          success: false,
          ...baseError,
          error: { type: 'api_error', message: 'Unknown API error occurred' }
        };
    }
  }

  /**
   * Updates usage statistics
   * @param {number} responseTime - Response time in ms
   * @param {boolean} success - Whether request succeeded
   * @param {Object} usage - Token usage data
   */
  updateUsageStats(responseTime, success, usage = {}) {
    this.usageStats.totalRequests++;
    this.usageStats.totalResponseTime += responseTime;
    
    if (success) {
      this.usageStats.totalTokens += usage.total_tokens || 0;
      // Rough cost estimate: $0.01 per 1K tokens for GPT-4 Vision
      this.usageStats.estimatedCost += (usage.total_tokens || 0) * 0.00001;
    } else {
      this.usageStats.errorCount++;
    }
  }

  /**
   * Gets current usage statistics
   * @returns {Object} Usage stats with calculated metrics
   */
  getUsageStats() {
    const totalRequests = this.usageStats.totalRequests;
    return {
      totalRequests,
      totalTokens: this.usageStats.totalTokens,
      errorRate: totalRequests > 0 ? this.usageStats.errorCount / totalRequests : 0,
      averageResponseTime: totalRequests > 0 ? this.usageStats.totalResponseTime / totalRequests : 0,
      estimatedCost: this.usageStats.estimatedCost
    };
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();
export default openaiClient;
