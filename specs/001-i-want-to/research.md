# Research Findings: Photo Roasting Web App

**Feature**: Frontend-only anonymous photo roasting web application  
**Date**: 2025-09-18 (Updated for frontend-only architecture)  
**Research Phase**: Phase 0 - Technical decisions and best practices

## Research Areas

### 1. OpenAI GPT-4 Vision API for Image Analysis

**Decision**: Use OpenAI GPT-4 Vision API with custom prompts for humorous roasting (direct from browser)

**Rationale**:
- GPT-4 Vision can analyze images and generate contextual text responses
- Built-in safety filters reduce risk of offensive content
- JavaScript SDK available for browser-based integration
- Supports various image formats (JPEG, PNG, GIF, WebP)
- Rate limiting and error handling built-in
- No backend required - direct browser-to-OpenAI communication

**Alternatives considered**:
- Backend proxy for OpenAI API (rejected - user wants no backend)
- Google Vision API + GPT for text generation (more complex, requires backend)
- Custom fine-tuned model (requires significant training data and resources)
- Other vision APIs (Azure Computer Vision, AWS Rekognition) lack humor generation capability

**Implementation approach**:
- Use OpenAI JavaScript SDK for browser
- Convert image to base64 for API transmission
- Send image with custom prompt: "Generate a humorous, family-friendly roast of this image"
- Handle API errors, timeouts, and rate limits gracefully in browser
- Implement retry logic with exponential backoff

### 2. Client-Side File Handling

**Decision**: Use HTML5 File API with JavaScript for browser-based file processing

**Rationale**:
- Built into modern browsers, no external dependencies
- Direct file access without server upload
- Client-side validation before API calls
- No temporary file storage needed
- Supports drag-and-drop and file selection

**Alternatives considered**:
- Server-side file upload (rejected - user wants no backend)
- Third-party file handling libraries (unnecessary complexity)
- Canvas-based image processing (limited format support)

**Implementation approach**:
- Use `FileReader` API to convert images to base64
- Validate file size and MIME type in browser
- Process files entirely in memory (no disk storage)
- Clear file references after processing

### 3. No Storage Required

**Decision**: Eliminate all file storage - process images directly in browser memory

**Rationale**:
- User explicitly requested no data saving
- Browser FileReader API handles file processing in memory
- Base64 encoding allows direct transmission to OpenAI API
- No cleanup required - garbage collection handles memory
- Enhances privacy and security

**Alternatives considered**:
- Temporary file storage (rejected - user wants no storage)
- Browser localStorage/sessionStorage (rejected - still storage)
- IndexedDB (rejected - user wants no data persistence)

**Implementation approach**:
- Use FileReader to read file as data URL (base64)
- Send base64 image directly to OpenAI API
- Clear all references after processing
- No file system interaction required

### 4. Frontend Framework Selection

**Decision**: Vanilla JavaScript with HTML5 File API for minimal complexity

**Rationale**:
- No build process or framework dependencies
- HTML5 File API provides drag-and-drop and file validation
- Faster development for MVP
- Easy to understand and maintain
- Aligns with constitutional simplicity principles

**Alternatives considered**:
- React.js (overkill for simple upload interface)
- Vue.js (adds build complexity)
- jQuery (unnecessary dependency for modern browsers)

**Implementation approach**:
- Single HTML page with embedded CSS and JavaScript
- Use `fetch()` API for backend communication
- File drag-and-drop with progress indication
- Client-side file size and type validation
- Responsive design for mobile compatibility

### 5. Error Handling and User Experience

**Decision**: Comprehensive error handling with user-friendly messages

**Rationale**:
- Multiple failure points: file validation, upload, OpenAI API, network
- Users need clear feedback for different error types
- Constitutional requirement for graceful error handling

**Error categories identified**:
- File validation errors (size, format)
- Upload failures (network, server errors)
- OpenAI API errors (rate limits, service unavailable)
- Timeout errors (>10 second SLA)

**Implementation approach**:
- Custom exception classes for different error types
- User-friendly error messages with suggested actions
- Logging for debugging without exposing internals
- Retry mechanisms for transient failures

### 6. Performance and Scalability Considerations

**Decision**: Async processing with connection pooling for OpenAI API

**Rationale**:
- 10-second SLA requirement needs efficient processing
- Multiple concurrent users require non-blocking operations
- OpenAI API rate limits need connection management

**Implementation approach**:
- FastAPI async endpoints
- `httpx.AsyncClient` for OpenAI API calls with connection pooling
- Request queuing if needed for rate limit management
- Monitoring and metrics for performance tracking

## Security Considerations

### Image Processing Security
- Validate file headers, not just extensions
- Limit file processing to prevent zip bombs
- Sanitize file metadata before processing
- Use Pillow for safe image validation

### API Security
- CORS configuration for frontend access
- Rate limiting to prevent abuse
- Input validation and sanitization
- No sensitive data logging

## Deployment Considerations

### Environment Requirements
- Python 3.9+ runtime
- OpenAI API key configuration
- Temporary storage space (5MB * concurrent users)
- Reverse proxy for production (nginx)

### Monitoring
- Request/response times
- OpenAI API usage and costs
- Error rates and types
- File upload success/failure rates

## Constitutional Compliance Review

All research decisions align with SpecIt Constitution:
- **Python-First**: All backend code in Python 3.9+
- **File Size Limits**: Modular design enables <100 lines per file
- **Code Usability**: Clear separation of concerns, reusable components
- **Testing**: Each component designed for easy unit testing
- **Documentation**: All decisions documented with rationale

## Next Steps

Phase 1 design will use these research findings to create:
- Data models for photo upload and roast response
- API contracts for upload and roast endpoints
- Contract tests for validation
- Quickstart guide for end-to-end testing
