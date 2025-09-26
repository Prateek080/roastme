# Quickstart Guide: Photo Roasting Web App

**Feature**: Frontend-only anonymous photo roasting web application  
**Date**: 2025-09-18 (Updated for frontend-only architecture)  
**Purpose**: End-to-end validation and testing guide

## Overview

This quickstart guide provides step-by-step instructions to validate the complete frontend-only photo roasting application functionality from user file selection to AI-generated roast response via direct OpenAI API integration.

## Prerequisites

### Development Environment
- Modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key configured in application
- Static web server or local file serving
- Internet connection for OpenAI API calls

### Test Assets
Prepare test images in `test-assets/` directory:
- `valid-photo.jpg` (< 5MB, JPEG format)
- `large-photo.jpg` (> 5MB, for size validation)
- `invalid-format.txt` (text file with .jpg extension)
- `corrupted-image.jpg` (corrupted JPEG file)

## Quick Validation Steps

### Step 1: Application Loading
```bash
# Serve the application locally
npx serve . -p 3000
# OR
python -m http.server 3000
# OR open index.html directly in browser

# Navigate to: http://localhost:3000
```

**Expected behavior**:
- Page loads without JavaScript errors
- Upload interface is visible and functional
- OpenAI API key is configured (check browser console for warnings)

### Step 2: Happy Path - Valid Photo Selection
**Manual Test**:
1. Open browser developer tools (F12) to monitor network requests
2. Select or drag a valid photo (< 5MB, JPEG/PNG/GIF/WebP)
3. Click "Generate Roast" button
4. Wait for processing (should complete within 10 seconds)

**Expected behavior**:
- File validation passes immediately
- Loading indicator appears
- Network request to `api.openai.com` visible in DevTools
- Roast text displays within 10 seconds
- No errors in browser console

### Step 3: File Size Validation
**Manual Test**:
1. Select a file larger than 5MB
2. Attempt to process

**Expected behavior**:
- Immediate validation error: "File size exceeds 5MB limit"
- No API request made
- User can immediately try another file

### Step 4: File Format Validation
**Manual Test**:
1. Select a non-image file (e.g., .txt, .pdf)
2. Attempt to process

**Expected behavior**:
- Immediate validation error: "Please upload JPEG, PNG, GIF, or WebP"
- No API request made
- Clear error message displayed

## Frontend Validation

### Step 1: Open Application
1. Navigate to `http://localhost:3000` (or local file path)
2. Verify page loads with upload interface
3. Check responsive design on mobile/desktop

### Step 2: Upload Interface Test
1. **Drag & Drop**: Drag valid image to upload area
2. **File Selection**: Click "Choose File" and select image
3. **Progress Indicator**: Verify upload progress is shown
4. **File Validation**: Try uploading invalid files (should show error)

### Step 3: Roast Display Test
1. Upload valid photo
2. Wait for processing (should complete within 10 seconds)
3. Verify roast text displays clearly
4. Check "Try Again" functionality works

### Step 4: Error Handling Test
1. **Large File**: Upload >5MB image → Should show size error
2. **Invalid Format**: Upload .txt file → Should show format error
3. **Network Error**: Disconnect internet → Should show connection error
4. **Timeout**: Use slow connection → Should handle timeout gracefully

## Integration Test Scenarios

### Scenario 1: Complete User Journey
```
Given: User visits the photo roasting web app
When: They upload a valid photo (JPEG, <5MB)
Then: They receive a humorous roast within 10 seconds
And: The photo is immediately deleted from server
```

**Validation Steps**:
1. Monitor server logs for file creation/deletion
2. Check temporary directory is clean after processing
3. Verify no photo data persists in database
4. Confirm roast text is family-friendly and humorous

### Scenario 2: Error Recovery
```
Given: User uploads an invalid file
When: The system rejects the file with clear error message
Then: User can immediately try again with valid file
And: The error doesn't break the application state
```

**Validation Steps**:
1. Upload invalid file → Verify error message
2. Upload valid file immediately after → Should work normally
3. Check no partial data remains from failed upload

### Scenario 3: Performance Under Load
```
Given: Multiple users upload photos simultaneously
When: Each upload is processed within 10 seconds
Then: All users receive their roasts successfully
And: System remains responsive
```

**Validation Steps**:
1. Use multiple browser tabs or `curl` in parallel
2. Monitor response times for each request
3. Verify no requests fail due to resource contention
4. Check temporary file cleanup works under load

## Performance Benchmarks

### Response Time Targets
- **File Upload**: < 1 second for 5MB file
- **Roast Generation**: < 10 seconds total (including OpenAI API)
- **Error Responses**: < 100ms
- **Health Check**: < 50ms

### Resource Usage Limits
- **Memory**: < 100MB per concurrent request
- **Disk Space**: Temporary files cleaned within 30 seconds
- **CPU**: < 50% usage during normal operation
- **Network**: Efficient OpenAI API usage

## Security Validation

### File Security Tests
1. **Path Traversal**: Try filename like `../../../etc/passwd`
2. **Executable Upload**: Try uploading .exe or .sh files
3. **Zip Bomb**: Upload compressed file that expands to huge size
4. **Magic Number**: Upload .txt file renamed to .jpg

### Privacy Validation
1. **No Persistence**: Verify photos are deleted immediately
2. **No Logging**: Check logs don't contain image data
3. **Memory Cleanup**: Ensure image data cleared from RAM
4. **Anonymous Usage**: Verify no user tracking or sessions

## Troubleshooting

### Common Issues

#### "Service Unavailable" Error
- Check OpenAI API key is configured
- Verify internet connectivity
- Check OpenAI service status

#### "File Upload Failed"
- Verify file size is under 5MB
- Check file format is supported (JPEG, PNG, GIF, WebP)
- Ensure file is not corrupted

#### "Timeout" Error
- Check internet connection speed
- Verify OpenAI API is responding
- Try with smaller/simpler image

#### Frontend Not Loading
- Check backend server is running on correct port
- Verify CORS configuration allows frontend domain
- Check browser console for JavaScript errors

### Debug Commands

```bash
# Check backend logs
tail -f logs/app.log

# Monitor temporary files
watch -n 1 'ls -la /tmp/photo-roast-*'

# Test OpenAI API directly
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check file permissions
ls -la test-assets/
```

## Success Criteria

The quickstart is complete when all these criteria are met:

- [ ] Health check returns 200 OK
- [ ] Valid photo upload generates roast within 10 seconds
- [ ] File size validation rejects >5MB files
- [ ] Format validation rejects non-image files
- [ ] Frontend displays roasts clearly
- [ ] Error messages are user-friendly
- [ ] Photos are deleted immediately after processing
- [ ] No data persistence occurs
- [ ] Performance meets SLA requirements
- [ ] Security validations pass

## Next Steps

After successful quickstart validation:
1. Run full test suite: `pytest tests/`
2. Execute contract tests: `pytest tests/contract/`
3. Performance testing with load tools
4. Security audit with OWASP guidelines
5. Deployment to staging environment
