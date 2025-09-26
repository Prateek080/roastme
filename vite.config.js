/**
 * Vite configuration for Photo Roasting Web App
 * Handles build optimization, PWA setup, and development server
 * 
 * @fileoverview Build system configuration with PWA and optimization
 */

import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Base configuration
  base: './',
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
    
    // Bundle optimization
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['openai'],
          utils: ['./src/utils/config.js']
        }
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096,
    
    // Performance budgets (constitutional compliance)
    chunkSizeWarningLimit: 500,
  },
  
  // Plugin configuration
  plugins: [
    // PWA Plugin
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      
      // PWA Manifest
      manifest: {
        name: 'Photo Roasting App',
        short_name: 'PhotoRoast',
        description: 'AI-powered photo roasting for entertainment',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        
        categories: ['entertainment', 'photo', 'social'],
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ]
      }
    })
  ],
  
  // Dependency optimization
  optimizeDeps: {
    include: ['openai']
  },
  
  // Environment variable handling
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Preview server configuration (for production testing)
  preview: {
    port: 4173,
    open: true,
    cors: true
  },
  
  // ESBuild configuration
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
});
