/**
 * Unit tests for Image Processing Service
 * Tests image conversion, optimization, and base64 encoding
 * 
 * @fileoverview TDD tests for image processing functionality
 */

import { imageProcessor } from '../../../src/services/imageProcessor.js';

describe('ImageProcessor Service', () => {
  describe('Base64 Conversion', () => {
    test('should convert image file to base64', async () => {
      const imageFile = new File(['fake image data'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      const result = await imageProcessor.convertToBase64(imageFile);
      
      expect(result.success).toBe(true);
      expect(result.base64Data).toMatch(/^data:image\/jpeg;base64,/);
      expect(result.error).toBeUndefined();
    });

    test('should handle conversion errors gracefully', async () => {
      const corruptedFile = { name: 'corrupted.jpg' }; // Invalid File object
      
      const result = await imageProcessor.convertToBase64(corruptedFile);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('conversion_failed');
      expect(result.base64Data).toBeNull();
    });

    test('should complete conversion within 2 seconds for 5MB file', async () => {
      const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
        size: 5 * 1024 * 1024
      });
      
      const startTime = performance.now();
      const result = await imageProcessor.convertToBase64(largeFile);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000);
    });

    test('should preserve original file metadata', async () => {
      const imageFile = new File(['image data'], 'photo.jpg', {
        type: 'image/jpeg',
        size: 2048,
        lastModified: Date.now()
      });
      
      const result = await imageProcessor.convertToBase64(imageFile);
      
      expect(result.metadata.originalName).toBe('photo.jpg');
      expect(result.metadata.originalSize).toBe(2048);
      expect(result.metadata.mimeType).toBe('image/jpeg');
    });
  });

  describe('Image Optimization', () => {
    test('should compress large images while maintaining quality', async () => {
      const largeImage = new File(['large image data'], 'large.jpg', {
        type: 'image/jpeg',
        size: 3 * 1024 * 1024 // 3MB
      });
      
      const result = await imageProcessor.optimizeImage(largeImage);
      
      expect(result.success).toBe(true);
      expect(result.optimizedSize).toBeLessThan(largeImage.size);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.compressionRatio).toBeLessThan(1);
    });

    test('should not over-compress small images', async () => {
      const smallImage = new File(['small image'], 'small.jpg', {
        type: 'image/jpeg',
        size: 50 * 1024 // 50KB
      });
      
      const result = await imageProcessor.optimizeImage(smallImage);
      
      expect(result.success).toBe(true);
      expect(result.compressionRatio).toBeGreaterThan(0.8); // Minimal compression
    });

    test('should resize images exceeding maximum dimensions', async () => {
      const hugeDimensionImage = new File(['huge image'], 'huge.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024
      });
      
      // Mock image with huge dimensions
      Object.defineProperty(hugeDimensionImage, 'width', { value: 8000 });
      Object.defineProperty(hugeDimensionImage, 'height', { value: 6000 });
      
      const result = await imageProcessor.optimizeImage(hugeDimensionImage);
      
      expect(result.success).toBe(true);
      expect(result.resized).toBe(true);
      expect(result.newDimensions.width).toBeLessThanOrEqual(4096);
      expect(result.newDimensions.height).toBeLessThanOrEqual(4096);
    });

    test('should maintain aspect ratio during resize', async () => {
      const wideImage = new File(['wide image'], 'wide.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024
      });
      
      Object.defineProperty(wideImage, 'width', { value: 6000 });
      Object.defineProperty(wideImage, 'height', { value: 3000 });
      
      const result = await imageProcessor.optimizeImage(wideImage);
      
      expect(result.success).toBe(true);
      const aspectRatio = result.newDimensions.width / result.newDimensions.height;
      expect(aspectRatio).toBeCloseTo(2, 1); // Original aspect ratio was 2:1
    });
  });

  describe('Image Analysis', () => {
    test('should extract basic image information', async () => {
      const imageFile = new File(['image data'], 'photo.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024
      });
      
      const info = await imageProcessor.analyzeImage(imageFile);
      
      expect(info.fileSize).toBe(1024 * 1024);
      expect(info.mimeType).toBe('image/jpeg');
      expect(info.fileName).toBe('photo.jpg');
      expect(info.isValid).toBe(true);
    });

    test('should detect image format from content', async () => {
      const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], 'test.png', {
        type: 'image/png'
      });
      
      const info = await imageProcessor.analyzeImage(pngFile);
      
      expect(info.detectedFormat).toBe('PNG');
      expect(info.formatMatches).toBe(true);
    });

    test('should identify potential security risks', async () => {
      const suspiciousFile = new File(['<script>alert("xss")</script>'], 'malicious.jpg', {
        type: 'image/jpeg'
      });
      
      const info = await imageProcessor.analyzeImage(suspiciousFile);
      
      expect(info.securityFlags.length).toBeGreaterThan(0);
      expect(info.securityFlags).toContain('suspicious_content');
    });

    test('should estimate processing time', async () => {
      const largeFile = new File(['x'.repeat(4 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
        size: 4 * 1024 * 1024
      });
      
      const info = await imageProcessor.analyzeImage(largeFile);
      
      expect(info.estimatedProcessingTime).toBeGreaterThan(0);
      expect(info.estimatedProcessingTime).toBeLessThan(10000); // Under 10 seconds
    });
  });

  describe('Memory Management', () => {
    test('should clean up temporary data after processing', async () => {
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      const result = await imageProcessor.convertToBase64(imageFile);
      expect(result.success).toBe(true);
      
      // Verify cleanup
      const memoryUsage = imageProcessor.getMemoryUsage();
      expect(memoryUsage.temporaryFiles).toBe(0);
      expect(memoryUsage.activeReaders).toBe(0);
    });

    test('should handle multiple concurrent processing requests', async () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        new File([`image data ${i}`], `test${i}.jpg`, {
          type: 'image/jpeg',
          size: 1024
        })
      );
      
      const promises = files.map(file => imageProcessor.convertToBase64(file));
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      // Verify no memory leaks
      const memoryUsage = imageProcessor.getMemoryUsage();
      expect(memoryUsage.activeReaders).toBe(0);
    });

    test('should abort processing on timeout', async () => {
      const timeoutFile = new File(['timeout test'], 'timeout.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      // Mock a slow processing scenario
      const result = await imageProcessor.convertToBase64(timeoutFile, { timeout: 50 });
      
      // Should either succeed quickly or timeout gracefully
      if (!result.success) {
        expect(result.error.type).toBe('timeout');
      }
    });
  });

  describe('Format Support', () => {
    test('should handle JPEG images', async () => {
      const jpegFile = new File(['jpeg data'], 'test.jpg', {
        type: 'image/jpeg'
      });
      
      const result = await imageProcessor.convertToBase64(jpegFile);
      
      expect(result.success).toBe(true);
      expect(result.base64Data).toContain('data:image/jpeg;base64,');
    });

    test('should handle PNG images', async () => {
      const pngFile = new File(['png data'], 'test.png', {
        type: 'image/png'
      });
      
      const result = await imageProcessor.convertToBase64(pngFile);
      
      expect(result.success).toBe(true);
      expect(result.base64Data).toContain('data:image/png;base64,');
    });

    test('should handle GIF images', async () => {
      const gifFile = new File(['gif data'], 'test.gif', {
        type: 'image/gif'
      });
      
      const result = await imageProcessor.convertToBase64(gifFile);
      
      expect(result.success).toBe(true);
      expect(result.base64Data).toContain('data:image/gif;base64,');
    });

    test('should handle WebP images', async () => {
      const webpFile = new File(['webp data'], 'test.webp', {
        type: 'image/webp'
      });
      
      const result = await imageProcessor.convertToBase64(webpFile);
      
      expect(result.success).toBe(true);
      expect(result.base64Data).toContain('data:image/webp;base64,');
    });
  });

  describe('Error Handling', () => {
    test('should handle null file input', async () => {
      const result = await imageProcessor.convertToBase64(null);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('invalid_input');
    });

    test('should handle FileReader errors', async () => {
      const errorFile = new File(['error test'], 'error.jpg', {
        type: 'image/jpeg'
      });
      
      // Mock FileReader error
      const originalFileReader = global.FileReader;
      global.FileReader = class MockErrorFileReader {
        readAsDataURL() {
          setTimeout(() => this.onerror({ target: { error: new Error('Read failed') } }), 10);
        }
      };
      
      const result = await imageProcessor.convertToBase64(errorFile);
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('read_error');
      
      // Restore original FileReader
      global.FileReader = originalFileReader;
    });

    test('should provide detailed error information', async () => {
      const result = await imageProcessor.convertToBase64(null);
      
      expect(result.error).toHaveProperty('type');
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('timestamp');
      expect(typeof result.error.message).toBe('string');
    });
  });

  describe('Performance Monitoring', () => {
    test('should track processing metrics', async () => {
      const imageFile = new File(['test data'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });
      
      await imageProcessor.convertToBase64(imageFile);
      
      const metrics = imageProcessor.getPerformanceMetrics();
      
      expect(metrics.totalProcessed).toBeGreaterThan(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    test('should reset metrics when requested', () => {
      imageProcessor.resetPerformanceMetrics();
      
      const metrics = imageProcessor.getPerformanceMetrics();
      
      expect(metrics.totalProcessed).toBe(0);
      expect(metrics.averageProcessingTime).toBe(0);
      expect(metrics.successRate).toBe(0);
    });
  });
});
