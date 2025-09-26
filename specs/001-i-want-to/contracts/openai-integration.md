# OpenAI API Integration Contract

**Feature**: Frontend-only photo roasting web application  
**Date**: 2025-09-18  
**Integration**: Direct browser-to-OpenAI API communication

## Overview

This document defines the contract for direct OpenAI GPT-4 Vision API integration from the browser. No custom backend API is required - the frontend communicates directly with OpenAI's API endpoints.

## OpenAI Vision API Contract

### Endpoint
```
POST https://api.openai.com/v1/chat/completions
```

### Authentication
```javascript
Headers: {
  "Authorization": "Bearer YOUR_OPENAI_API_KEY",
  "Content-Type": "application/json"
}
```

### Request Format
```javascript
{
  "model": "gpt-4-vision-preview",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Generate a humorous, family-friendly roast of this image. Keep it witty but not offensive."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,{base64_encoded_image}"
          }
        }
      ]
    }
  ],
  "max_tokens": 300,
  "temperature": 0.9
}
```

### Successful Response Format
```javascript
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4-vision-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Looking at this photo, I can see why they invented the saying 'the camera adds 10 pounds'... though in your case, it might have been more generous than that!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 85,
    "completion_tokens": 32,
    "total_tokens": 117
  }
}
```

### Error Response Formats

#### Rate Limit Error (429)
```javascript
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "requests",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

#### Invalid API Key (401)
```javascript
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

#### Content Policy Violation (400)
```javascript
{
  "error": {
    "message": "Your request was rejected as a result of our safety system",
    "type": "invalid_request_error",
    "param": null,
    "code": "content_policy_violation"
  }
}
```

#### Service Unavailable (503)
```javascript
{
  "error": {
    "message": "The server is temporarily overloaded",
    "type": "server_error",
    "param": null,
    "code": "service_unavailable"
  }
}
```

## Frontend Implementation Contract

### File Processing Interface
```javascript
interface PhotoProcessor {
  validateFile(file: File): ValidationResult;
  convertToBase64(file: File): Promise<string>;
  clearFileData(file: File): void;
}

interface ValidationResult {
  isValid: boolean;
  error?: {
    type: 'file_size' | 'file_format' | 'file_invalid';
    message: string;
  };
}
```

### OpenAI Client Interface
```javascript
interface OpenAIClient {
  generateRoast(base64Image: string): Promise<RoastResult>;
  handleApiError(error: any): UserFriendlyError;
}

interface RoastResult {
  success: boolean;
  roastText?: string;
  processingTimeMs: number;
  error?: UserFriendlyError;
}

interface UserFriendlyError {
  type: 'rate_limit' | 'api_error' | 'timeout' | 'service_unavailable';
  message: string;
  retryAfterSeconds?: number;
}
```

### UI Component Interface
```javascript
interface PhotoUploadComponent {
  onFileSelect(file: File): void;
  onFileValidationError(error: ValidationResult): void;
  onRoastGenerated(roast: string): void;
  onRoastError(error: UserFriendlyError): void;
  showLoadingState(): void;
  hideLoadingState(): void;
}
```

## Error Handling Strategy

### Client-Side Validation Errors
- **File too large**: "File size exceeds 5MB limit. Please choose a smaller image."
- **Invalid format**: "Please upload a JPEG, PNG, GIF, or WebP image."
- **Corrupted file**: "Unable to read image file. Please try a different image."

### API Communication Errors
- **Rate limit**: "Too many requests. Please wait {X} seconds before trying again."
- **API key invalid**: "Service configuration error. Please refresh the page and try again."
- **Content policy**: "Unable to process this image. Please try a different photo."
- **Service unavailable**: "Service temporarily unavailable. Please try again in a few minutes."
- **Network timeout**: "Request timed out. Please check your connection and try again."

## Security Considerations

### API Key Management
- **Client-side exposure**: API key will be visible in browser (acceptable for demo/MVP)
- **Rate limiting**: Implement client-side rate limiting to prevent abuse
- **Domain restrictions**: Configure OpenAI API key with domain restrictions if possible

### Data Privacy
- **No persistence**: Images never stored, only processed in memory
- **No logging**: No user data or images logged
- **Base64 transmission**: Images sent as base64 in API requests
- **Memory cleanup**: Clear all image data after processing

## Performance Requirements

### Response Time Targets
- **File validation**: < 100ms
- **Base64 conversion**: < 2 seconds for 5MB file
- **OpenAI API call**: < 8 seconds (within 10-second SLA)
- **Total processing**: < 10 seconds end-to-end

### Resource Management
- **Memory usage**: Clear large base64 strings after API call
- **Concurrent requests**: Prevent multiple simultaneous API calls
- **Request timeout**: 10-second timeout for API calls
- **Retry logic**: Exponential backoff for transient failures

## Testing Contract

### Unit Tests Required
```javascript
// File validation tests
describe('PhotoProcessor', () => {
  test('validates file size under 5MB', () => { /* ... */ });
  test('rejects files over 5MB', () => { /* ... */ });
  test('validates supported image formats', () => { /* ... */ });
  test('rejects unsupported formats', () => { /* ... */ });
});

// OpenAI client tests
describe('OpenAIClient', () => {
  test('sends correct request format', () => { /* ... */ });
  test('handles successful responses', () => { /* ... */ });
  test('handles rate limit errors', () => { /* ... */ });
  test('handles API errors gracefully', () => { /* ... */ });
});
```

### Integration Tests Required
```javascript
// End-to-end flow tests
describe('Photo Roasting Flow', () => {
  test('complete happy path from file select to roast display', () => { /* ... */ });
  test('error handling for invalid files', () => { /* ... */ });
  test('timeout handling for slow API responses', () => { /* ... */ });
  test('retry logic for transient failures', () => { /* ... */ });
});
```

## API Usage Monitoring

### Metrics to Track
- **Request count**: Number of API calls per hour/day
- **Response times**: API call duration distribution
- **Error rates**: Percentage of failed requests by error type
- **Token usage**: OpenAI token consumption for cost monitoring

### Cost Management
- **Token limits**: Monitor token usage to control costs
- **Request throttling**: Implement client-side rate limiting
- **Error budgets**: Track error rates to identify issues
- **Usage alerts**: Monitor for unusual usage patterns

---

This contract ensures reliable, secure, and efficient direct integration with OpenAI's API while maintaining the frontend-only architecture requirement.
