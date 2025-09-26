/**
 * CORS Proxy utility for OpenAI API calls
 * Handles cross-origin requests and API key security
 * 
 * @fileoverview CORS handling and API request proxying
 * @author Photo Roasting App Team
 * @version 1.0.0
 */

/**
 * CORS proxy configuration
 * @readonly
 * @enum {string}
 */
const PROXY_CONFIG = {
  // Public CORS proxies (for development/demo only)
  CORS_ANYWHERE: 'https://cors-anywhere.herokuapp.com/',
  ALLORIGINS: 'https://api.allorigins.win/raw?url=',
  CORS_PROXY: 'https://corsproxy.io/?',
  
  // Custom proxy endpoints (production)
  CUSTOM_PROXY: '/api/proxy',
  
  // OpenAI API base URL
  OPENAI_BASE_URL: 'https://api.openai.com/v1'
};

/**
 * Proxy strategies for different environments
 * @readonly
 * @enum {string}
 */
const PROXY_STRATEGIES = {
  DIRECT: 'direct',           // Direct API call (may fail due to CORS)
  CORS_PROXY: 'cors_proxy',   // Use public CORS proxy
  CUSTOM_PROXY: 'custom',     // Use custom backend proxy
  MOCK: 'mock'                // Use mock responses for testing
};

/**
 * CORS Proxy handler class
 * Manages different strategies for handling CORS issues
 */
class CorsProxy {
  constructor(config = {}) {
    this.strategy = config.strategy || this.detectBestStrategy();
    this.customProxyUrl = config.customProxyUrl || PROXY_CONFIG.CUSTOM_PROXY;
    this.fallbackStrategies = config.fallbackStrategies || this.getDefaultFallbacks();
  }
  
  /**
   * Gets default fallback strategies based on environment
   * @returns {Array} Array of fallback strategies
   */
  getDefaultFallbacks() {
    // In test environment, no fallbacks needed (mock is primary)
    if (typeof jest !== 'undefined') {
      return [];
    }
    
    // For development/production, only use MOCK as last resort
    return [PROXY_STRATEGIES.DIRECT];
  }

  /**
   * Detects the best proxy strategy for current environment
   * @returns {string} Best strategy to use
   */
  detectBestStrategy() {
    // In test environment, always use mock
    if (typeof jest !== 'undefined') {
      return PROXY_STRATEGIES.MOCK;
    }
    
    // Check if we have a custom proxy available
    if (this.isCustomProxyAvailable()) {
      return PROXY_STRATEGIES.CUSTOM_PROXY;
    }
    
    // For localhost development, use CORS proxy instead of direct
    // Direct calls will fail due to CORS restrictions
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return PROXY_STRATEGIES.CORS_PROXY;
    }
    
    // For production, use CORS proxy as fallback
    return PROXY_STRATEGIES.CORS_PROXY;
  }

  /**
   * Checks if custom proxy is available
   * @returns {boolean} True if custom proxy is available
   */
  async isCustomProxyAvailable() {
    try {
      const response = await fetch(this.customProxyUrl + '/health', {
        method: 'GET',
        timeout: 2000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Makes a proxied request to OpenAI API
   * @param {string} endpoint - API endpoint (relative to OpenAI base)
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async makeRequest(endpoint, options = {}) {
    const strategies = [this.strategy, ...this.fallbackStrategies];
    
    for (const strategy of strategies) {
      try {
        console.log(`[CorsProxy] Attempting ${strategy} strategy`);
        const response = await this.executeStrategy(strategy, endpoint, options);
        
        if (response.ok) {
          console.log(`[CorsProxy] Success with ${strategy} strategy`);
          return response;
        }
      } catch (error) {
        console.warn(`[CorsProxy] ${strategy} strategy failed:`, error);
        continue;
      }
    }
    
    throw new Error('All proxy strategies failed');
  }

  /**
   * Executes a specific proxy strategy
   * @param {string} strategy - Strategy to execute
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async executeStrategy(strategy, endpoint, options) {
    const fullUrl = `${PROXY_CONFIG.OPENAI_BASE_URL}/${endpoint}`;
    
    switch (strategy) {
      case PROXY_STRATEGIES.DIRECT:
        return this.directRequest(fullUrl, options);
      
      case PROXY_STRATEGIES.CORS_PROXY:
        return this.corsProxyRequest(fullUrl, options);
      
      case PROXY_STRATEGIES.CUSTOM_PROXY:
        return this.customProxyRequest(endpoint, options);
      
      case PROXY_STRATEGIES.MOCK:
        return this.mockRequest(endpoint, options);
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  /**
   * Makes direct request to OpenAI API
   * @param {string} url - Full API URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async directRequest(url, options) {
    return fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Makes request through public CORS proxy
   * @param {string} url - Full API URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async corsProxyRequest(url, options) {
    const proxyUrl = `${PROXY_CONFIG.CORS_PROXY}${encodeURIComponent(url)}`;
    
    return fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  /**
   * Makes request through custom backend proxy
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} API response
   */
  async customProxyRequest(endpoint, options) {
    return fetch(`${this.customProxyUrl}/${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Returns mock response for testing
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Mock response
   */
  async mockRequest(endpoint, options) {
    console.log('🎭 CorsProxy.mockRequest called:', {
      endpoint,
      options,
      hasBody: !!options.body,
      method: options.method
    });
    
    // Simulate network delay
    console.log('⏳ Simulating network delay (100ms)');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockData = {
      id: 'chatcmpl-mock-123',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4-vision-preview',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mock roast response for testing purposes! Your photo is so generic, it could be the default wallpaper for disappointment.'
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 85,
        completion_tokens: 32,
        total_tokens: 117
      }
    };
    
    // Handle Jest environment where Response might not be available
    if (typeof Response === 'undefined') {
      // Create a mock Response-like object for Jest
      return {
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Map([['Content-Type', 'application/json']])
      };
    }
    
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Gets current strategy information
   * @returns {Object} Strategy information
   */
  getStrategyInfo() {
    return {
      current: this.strategy,
      fallbacks: this.fallbackStrategies,
      available: Object.values(PROXY_STRATEGIES)
    };
  }
}

// Create singleton instance
const corsProxy = new CorsProxy();

// Export proxy instance and configuration
export { corsProxy, PROXY_CONFIG, PROXY_STRATEGIES, CorsProxy };
export default corsProxy;
