/**
 * Jest test setup file
 * Configures global test environment and utilities
 */

// Import testing utilities
import '@testing-library/jest-dom';

// Mock OpenAI API for testing
global.mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

// Mock File API for browser testing
global.File = class MockFile {
  constructor(bits, filename, options = {}) {
    this.bits = bits;
    this.name = filename;
    this.type = options.type || '';
    // Handle size override for testing
    this.size = options.size !== undefined ? options.size : 
                bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit), 0);
    this.lastModified = options.lastModified || Date.now();
  }
  
  // Mock slice method for header validation
  slice(start = 0, end) {
    const slicedBits = this.bits.slice(start, end);
    return new MockFile(slicedBits, this.name, {
      type: this.type,
      size: end !== undefined ? Math.min(end - start, this.size - start) : this.size - start
    });
  }
  
  // Mock arrayBuffer method with proper headers
  arrayBuffer() {
    let buffer;
    
    // Check if content matches expected type (for mismatched header testing)
    const firstBit = this.bits[0] || '';
    const isTextContent = typeof firstBit === 'string' && firstBit.includes('text');
    
    if (isTextContent) {
      // Create buffer based on actual content, not MIME type
      const textBytes = new TextEncoder().encode(firstBit);
      buffer = textBytes.buffer;
    } else if (this.type === 'image/jpeg') {
      buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, ...new Array(Math.max(0, this.size - 4)).fill(0)]).buffer;
    } else if (this.type === 'image/png') {
      buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47, ...new Array(Math.max(0, this.size - 4)).fill(0)]).buffer;
    } else if (this.type === 'image/gif') {
      buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38, ...new Array(Math.max(0, this.size - 4)).fill(0)]).buffer;
    } else {
      buffer = new ArrayBuffer(this.size);
    }
    return Promise.resolve(buffer);
  }
  
  // Mock text method
  text() {
    return Promise.resolve(this.bits.join(''));
  }
};

// Mock FileReader API
global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
    this.onloadstart = null;
    this.onloadend = null;
  }
  
  readAsDataURL(file) {
    this.readyState = 1;
    if (this.onloadstart) this.onloadstart();
    
    setTimeout(() => {
      this.readyState = 2;
      this.result = `data:${file.type};base64,mockbase64data`;
      const event = {
        target: this,
        result: this.result,
        type: 'load'
      };
      if (this.onload) this.onload(event);
      if (this.onloadend) this.onloadend();
    }, 10);
  }
  
  readAsArrayBuffer(file) {
    this.readyState = 1;
    if (this.onloadstart) this.onloadstart();
    
    setTimeout(() => {
      this.readyState = 2;
      // Create mock array buffer with proper headers for different file types
      let buffer;
      if (file.type === 'image/jpeg') {
        buffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer;
      } else if (file.type === 'image/png') {
        buffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47]).buffer;
      } else if (file.type === 'image/gif') {
        buffer = new Uint8Array([0x47, 0x49, 0x46, 0x38]).buffer;
      } else {
        buffer = new ArrayBuffer(8);
      }
      this.result = buffer;
      const event = {
        target: this,
        result: this.result,
        type: 'load'
      };
      if (this.onload) this.onload(event);
      if (this.onloadend) this.onloadend();
    }, 10);
  }
  
  abort() {
    this.readyState = 2;
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Response for CORS proxy tests
if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
  };
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
};

// Mock clipboard API - handle existing property
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue('')
    },
    writable: true,
    configurable: true
  });
} else {
  navigator.clipboard.writeText = jest.fn().mockResolvedValue(undefined);
  navigator.clipboard.readText = jest.fn().mockResolvedValue('');
}

// Mock share API
Object.defineProperty(navigator, 'share', {
  value: jest.fn().mockResolvedValue(undefined),
  writable: true
});

// Mock IntersectionObserver for accessibility testing
global.IntersectionObserver = class MockIntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Console error handler for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset OpenAI mock
  global.mockOpenAI.chat.completions.create.mockClear();
});
