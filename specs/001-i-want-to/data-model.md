# Data Model: Photo Roasting Web App

**Feature**: Frontend-only anonymous photo roasting web application  
**Date**: 2025-09-18 (Updated for frontend-only architecture)  
**Phase**: 1 - Data design and entity modeling

## Entity Overview

This frontend-only application handles data entities entirely in browser memory during processing, with no persistence or storage requirements. All data exists only during the user session and is cleared immediately after processing.

## Core Entities

### 1. PhotoFile (Browser Memory Only)

**Purpose**: Represents a selected photo file in browser memory during processing

**Attributes**:
- `file`: HTML5 File object from file input
- `filename`: Original filename from file selection
- `content_type`: MIME type of the selected file
- `file_size`: Size in bytes (max 5MB)
- `base64_data`: Base64-encoded image data for API transmission
- `selection_timestamp`: When the file was selected

**Validation Rules**:
- File size MUST be ≤ 5MB (5,242,880 bytes)
- Content type MUST be in: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- File must be readable by FileReader API
- Base64 conversion must succeed

**Lifecycle**:
1. Created when user selects file
2. Validated against size and format rules in browser
3. Converted to base64 for OpenAI API transmission
4. **Cleared from memory** after roast generation (no persistence)

**State Transitions**:
```
SELECTED → VALIDATED → ENCODED → PROCESSING → CLEARED
           ↓
         REJECTED (validation failure)
```

### 2. RoastResponse

**Purpose**: Contains the generated humorous roast content and metadata

**Attributes**:
- `roast_text`: Generated humorous commentary (string)
- `generation_timestamp`: When the roast was created
- `processing_duration`: Time taken to generate roast (milliseconds)
- `status`: Response status (`success`, `error`, `timeout`)
- `error_message`: Error details if generation failed (optional)

**Validation Rules**:
- Roast text MUST be non-empty for successful responses
- Processing duration MUST be tracked for SLA monitoring
- Status MUST be one of the defined enum values
- Error message MUST be user-friendly (no technical details)

**Lifecycle**:
1. Created when OpenAI processing begins
2. Populated with generated roast text
3. Returned to user immediately
4. **Not persisted** (exists only in response)

## Request/Response Models

### Upload Request Model

**Purpose**: Validates incoming photo upload requests

```python
class PhotoUploadRequest:
    file: UploadFile  # FastAPI file upload type
    
    # Validation constraints
    max_size: int = 5_242_880  # 5MB in bytes
    allowed_types: Set[str] = {
        'image/jpeg', 'image/png', 
        'image/gif', 'image/webp'
    }
```

### Roast Response Model

**Purpose**: Standardized API response format

```python
class RoastApiResponse:
    success: bool
    roast_text: Optional[str]
    processing_time_ms: int
    error_message: Optional[str]
    timestamp: datetime
```

## Error Models

### Validation Error Model

**Purpose**: Standardized error responses for invalid uploads

```python
class ValidationError:
    error_type: str  # 'file_size', 'file_format', 'file_invalid'
    message: str     # User-friendly error description
    max_allowed: Optional[str]  # For size errors
    allowed_formats: Optional[List[str]]  # For format errors
```

### Processing Error Model

**Purpose**: Errors during roast generation

```python
class ProcessingError:
    error_type: str  # 'api_error', 'timeout', 'service_unavailable'
    message: str     # User-friendly error description
    retry_suggested: bool
    estimated_retry_delay: Optional[int]  # seconds
```

## Data Flow

### Happy Path Flow
1. **Upload**: User submits photo → `PhotoUpload` entity created
2. **Validation**: File validated → Status updated to `VALIDATED`
3. **Processing**: Photo sent to OpenAI → `RoastResponse` created
4. **Response**: Roast returned → `RoastApiResponse` sent to user
5. **Cleanup**: `PhotoUpload` deleted immediately

### Error Path Flow
1. **Upload**: User submits invalid photo → `ValidationError` created
2. **Response**: Error returned → No processing occurs
3. **Cleanup**: Invalid file discarded immediately

### Timeout Path Flow
1. **Upload**: Valid photo uploaded → `PhotoUpload` created
2. **Processing**: OpenAI API timeout → `ProcessingError` created
3. **Response**: Timeout error returned → `RoastApiResponse` with error
4. **Cleanup**: `PhotoUpload` deleted immediately

## Security Considerations

### File Validation
- **Magic Number Check**: Validate file headers match content type
- **Size Limits**: Enforce 5MB limit to prevent resource exhaustion
- **Path Sanitization**: Clean filenames to prevent directory traversal
- **Content Scanning**: Basic validation to reject suspicious files

### Data Privacy
- **No Persistence**: All photo data deleted immediately after processing
- **No Logging**: Photo content never logged, only metadata
- **Temporary Storage**: Use secure temporary files with proper permissions
- **Memory Cleanup**: Ensure image data cleared from memory after use

## Performance Considerations

### Memory Management
- **Streaming**: Process large files in chunks where possible
- **Temporary Files**: Use disk storage for 5MB files to avoid memory pressure
- **Async Processing**: Non-blocking file operations
- **Connection Pooling**: Reuse HTTP connections to OpenAI API

### Scalability
- **Stateless Design**: No session state, enables horizontal scaling
- **Resource Limits**: File size limits prevent resource exhaustion
- **Queue Management**: Handle concurrent uploads efficiently
- **Error Recovery**: Graceful degradation when OpenAI API unavailable

## Constitutional Compliance

### File Size Adherence
Each data model class will be implemented in separate files:
- `photo_upload.py` (~60 lines): PhotoUpload model and validation
- `roast_response.py` (~40 lines): RoastResponse and API response models
- `error_models.py` (~50 lines): Error handling models
- `validators.py` (~80 lines): File validation logic

### Type Safety
All models will include:
- Complete type hints for all attributes
- Pydantic models for runtime validation
- Custom validators for business rules
- Comprehensive docstrings

### Testing Strategy
Each model will have corresponding test files:
- `test_photo_upload.py`: Upload validation tests
- `test_roast_response.py`: Response format tests
- `test_error_models.py`: Error handling tests
- `test_validators.py`: Validation logic tests

## Next Steps

These data models will be used in Phase 1 contract generation to define:
- API endpoint schemas
- Request/response validation
- Error handling contracts
- Integration test scenarios
