/**
 * Simple configuration system for Photo Roasting Web App
 * Handles API keys and basic settings
 * 
 * @fileoverview Simplified configuration management
 * @author Photo Roasting App Team
 * @version 1.0.0
 */


/**
 * API configuration constants
 */
const API_CONFIG = {
  OPENAI_MODEL: 'gpt-4o',
  MAX_TOKENS: 300,
  TEMPERATURE: 0.9,
  TIMEOUT_MS: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

/**
 * File upload constraints
 */
const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_DIMENSION_PX: 4096
};

/**
 * Simple application configuration class
 */
class AppConfig {
  constructor() {
    this.apiKey = this.getEnvVar('VITE_OPENAI_API_KEY');
    console.log('apiKey', this.apiKey);
    this.baseUrl = this.getBaseUrl();
  }

  /**
   * Gets base URL for the application
   * @returns {string} Base URL
   */
  getBaseUrl() {    
    return `${window.location.protocol}//${window.location.host}`;
  }


  /**
   * Gets API configuration for OpenAI calls
   * @returns {Object} API configuration object
   */
  getApiConfig() {
    return {
      ...API_CONFIG,
      apiKey: this.apiKey
    };
  }

  /**
   * Gets upload constraints configuration
   * @returns {Object} Upload constraints object
   */
  getUploadConstraints() {
    return { ...UPLOAD_CONSTRAINTS };
  }

  /**
   * Validates current configuration
   * @returns {Object} Validation result with status and errors
   */
  validate() {
    const errors = [];
    
    if (!this.apiKey) {
      errors.push('OpenAI API key is not configured');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets environment variable with fallback for different environments
   * @param {string} key - Environment variable key
   * @returns {string|null} Environment variable value
   */
  getEnvVar(key) {
    // Test environment
    if (typeof jest !== 'undefined') {
      return process.env[key] || null;
    }
    
    // Vite injects env vars into import.meta.env in browser
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || null;
    }
    
    // Browser environment fallback
    if (typeof window !== 'undefined') {
      return window.process?.env?.[key] || window[key] || null;
    }
    
    // Node environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    
    return null;
  }

  /**
   * Gets configuration summary for debugging
   * @returns {Object} Configuration summary (without sensitive data)
   */
  getConfigSummary() {
    return {
      baseUrl: this.baseUrl,
      apiKeyConfigured: !!this.apiKey,
      apiConfig: {
        model: API_CONFIG.OPENAI_MODEL,
        maxTokens: API_CONFIG.MAX_TOKENS,
        temperature: API_CONFIG.TEMPERATURE,
        timeout: API_CONFIG.TIMEOUT_MS
      }
    };
  }
}

// Create singleton instance
const config = new AppConfig();

// Export configuration instance and constants
export { config, API_CONFIG, UPLOAD_CONSTRAINTS };
export default config;
