/**
 * Unit tests for File Validation Service
 * Tests file size, format, and security validation
 * 
 * @fileoverview TDD tests for file validation functionality
 */

import { fileValidator } from '../../../src/services/fileValidator.js';

describe('FileValidator Service', () => {
  describe('File Size Validation', () => {
    test('should accept files under 5MB', () => {
      const smallFile = new File(['small content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      });
      
      const result = fileValidator.validateFileSize(smallFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject files over 5MB', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
        size: 6 * 1024 * 1024 // 6MB
      });
      
      const result = fileValidator.validateFileSize(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_size');
      expect(result.error.message).toContain('5MB limit');
    });

    test('should accept files exactly at 5MB limit', () => {
      const exactFile = new File(['x'.repeat(5 * 1024 * 1024)], 'exact.jpg', {
        type: 'image/jpeg',
        size: 5 * 1024 * 1024 // Exactly 5MB
      });
      
      const result = fileValidator.validateFileSize(exactFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should handle zero-size files', () => {
      const emptyFile = new File([], 'empty.jpg', {
        type: 'image/jpeg',
        size: 0
      });
      
      const result = fileValidator.validateFileSize(emptyFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_invalid');
    });
  });

  describe('File Format Validation', () => {
    test('should accept JPEG files', () => {
      const jpegFile = new File(['jpeg content'], 'test.jpg', {
        type: 'image/jpeg'
      });
      
      const result = fileValidator.validateFileFormat(jpegFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept PNG files', () => {
      const pngFile = new File(['png content'], 'test.png', {
        type: 'image/png'
      });
      
      const result = fileValidator.validateFileFormat(pngFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept GIF files', () => {
      const gifFile = new File(['gif content'], 'test.gif', {
        type: 'image/gif'
      });
      
      const result = fileValidator.validateFileFormat(gifFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should accept WebP files', () => {
      const webpFile = new File(['webp content'], 'test.webp', {
        type: 'image/webp'
      });
      
      const result = fileValidator.validateFileFormat(webpFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject unsupported file formats', () => {
      const textFile = new File(['text content'], 'test.txt', {
        type: 'text/plain'
      });
      
      const result = fileValidator.validateFileFormat(textFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_format');
      expect(result.error.message).toContain('JPEG, PNG, GIF, or WebP');
    });

    test('should reject files with no MIME type', () => {
      const noTypeFile = new File(['content'], 'test.unknown', {
        type: ''
      });
      
      const result = fileValidator.validateFileFormat(noTypeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_format');
    });

    test('should handle case-insensitive file extensions', () => {
      const upperCaseFile = new File(['jpeg content'], 'TEST.JPG', {
        type: 'image/jpeg'
      });
      
      const result = fileValidator.validateFileFormat(upperCaseFile);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('File Security Validation', () => {
    test('should validate file headers match MIME type', async () => {
      // Mock file with JPEG header
      const jpegFile = new File([new Uint8Array([0xFF, 0xD8, 0xFF])], 'test.jpg', {
        type: 'image/jpeg'
      });
      
      const result = await fileValidator.validateFileHeaders(jpegFile);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject files with mismatched headers', async () => {
      // Mock file with text content but image MIME type
      const fakeImageFile = new File(['This is text content'], 'fake.jpg', {
        type: 'image/jpeg'
      });
      
      const result = await fileValidator.validateFileHeaders(fakeImageFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_invalid');
      expect(result.error.message).toContain('file header');
    });

    test('should sanitize dangerous filenames', () => {
      const dangerousFile = new File(['content'], '../../../etc/passwd', {
        type: 'image/jpeg'
      });
      
      const result = fileValidator.sanitizeFilename(dangerousFile.name);
      
      expect(result).not.toContain('../');
      expect(result).not.toContain('/');
      expect(result).toBe('etc_passwd');
    });

    test('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const longFile = new File(['content'], longName, {
        type: 'image/jpeg'
      });
      
      const result = fileValidator.sanitizeFilename(longFile.name);
      
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result).toMatch(/\.jpg$/);
    });
  });

  describe('Complete File Validation', () => {
    test('should pass complete validation for valid image', async () => {
      const validFile = new File(['valid jpeg content'], 'photo.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      });
      
      const result = await fileValidator.validateFile(validFile);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedName).toBe('photo.jpg');
      expect(result.error).toBeUndefined();
    });

    test('should fail validation for oversized file', async () => {
      const oversizedFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.jpg', {
        type: 'image/jpeg',
        size: 6 * 1024 * 1024 // 6MB
      });
      
      const result = await fileValidator.validateFile(oversizedFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_size');
    });

    test('should fail validation for unsupported format', async () => {
      const unsupportedFile = new File(['pdf content'], 'document.pdf', {
        type: 'application/pdf',
        size: 1024
      });
      
      const result = await fileValidator.validateFile(unsupportedFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_format');
    });

    test('should provide validation summary', async () => {
      const testFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      const result = await fileValidator.validateFile(testFile);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('sanitizedName');
      expect(result).toHaveProperty('fileInfo');
      expect(result.fileInfo.size).toBe(1024);
      expect(result.fileInfo.type).toBe('image/jpeg');
    });
  });

  describe('Error Handling', () => {
    test('should handle null file input', async () => {
      const result = await fileValidator.validateFile(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('missing_file');
    });

    test('should handle undefined file input', async () => {
      const result = await fileValidator.validateFile(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('missing_file');
    });

    test('should handle corrupted file objects', async () => {
      const corruptedFile = { name: 'test.jpg' }; // Missing required File properties
      
      const result = await fileValidator.validateFile(corruptedFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error.type).toBe('file_invalid');
    });
  });

  describe('Performance Requirements', () => {
    test('should complete validation within 100ms', async () => {
      const testFile = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      const startTime = performance.now();
      await fileValidator.validateFile(testFile);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle multiple concurrent validations', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`content ${i}`], `test${i}.jpg`, {
          type: 'image/jpeg',
          size: 1024
        })
      );
      
      const validationPromises = files.map(file => fileValidator.validateFile(file));
      const results = await Promise.all(validationPromises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});
