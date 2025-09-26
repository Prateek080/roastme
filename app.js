/**
 * Main Application Entry Point for Photo Roasting Web App
 * Orchestrates all components and services
 * 
 * @fileoverview Constitutional compliance: <100 lines, comprehensive JSDoc
 * @author Photo Roasting App Team
 * @version 1.0.0
 */

import { PhotoUpload } from './src/components/PhotoUpload.js';
import { RoastDisplay } from './src/components/RoastDisplay.js';
import { imageProcessor } from './src/services/imageProcessor.js';
import { openaiClient } from './src/services/openaiClient.js';

/**
 * Main application class that orchestrates the photo roasting workflow
 * @class PhotoRoastApp
 */
class PhotoRoastApp {
  constructor() {
    this.isProcessing = false;
    this.currentFile = null;
    this.currentImageData = null;
    this.currentStep = 1; // 1: Upload, 2: Persona, 3: Roast
    this.selectedPersona = 'kapil-sharma';
    
    this.init();
  }

  /**
   * Initializes the application
   */
  async init() {
    try {
      await this.setupServiceWorker();
      this.setupUI();
      this.setupEventListeners();
      console.log('Photo Roasting App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize the application. Please refresh the page.');
    }
  }

  /**
   * Sets up service worker for PWA functionality
   */
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Sets up the user interface
   */
  setupUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('App container not found');
    }

    // Create PhotoUpload component
    this.photoUpload = new PhotoUpload({
      onFileSelect: this.handleFileSelect.bind(this),
      onValidationError: this.handleValidationError.bind(this),
      onStartRoasting: this.handleStartRoasting.bind(this),
      showPreview: false
    });
    
    // Create RoastDisplay component
    this.roastDisplay = new RoastDisplay({
      onShare: this.handleShare.bind(this),
      onCopy: this.handleCopy.bind(this)
    });

    // Create main layout with vertical step indicator
    appContainer.innerHTML = `
      <div class="app-layout">
        <!-- Vertical Step Indicator -->
        <aside class="step-sidebar">
          <div class="app-brand">
            <h1>📸 RoastMe</h1>
            <p>AI-Powered Selfie Roasting</p>
          </div>
          
          <div class="step-indicator-vertical">
            <div class="step-item ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}" data-step="1">
              <div class="step-number">1</div>
              <div class="step-info">
                <h3>Upload Photo</h3>
                <p>Choose your selfie</p>
              </div>
              <div class="step-line-vertical"></div>
            </div>
            
            <div class="step-item ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}" data-step="2">
              <div class="step-number">2</div>
              <div class="step-info">
                <h3>Select Persona</h3>
                <p>Pick roasting style</p>
              </div>
              <div class="step-line-vertical"></div>
            </div>
            
            <div class="step-item ${this.currentStep >= 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}" data-step="3">
              <div class="step-number">3</div>
              <div class="step-info">
                <h3>Get Roasted</h3>
                <p>Enjoy the burn!</p>
              </div>
            </div>
          </div>
        </aside>
        
        <!-- Main Content Area -->
        <main class="app-main-content">
          <div id="step-content" class="step-content">
            <!-- Step content will be inserted here -->
          </div>
        </main>
      </div>
      
      <footer class="app-footer">
        <p>Powered by RoastMe AI</p>
      </footer>
    `;

    // Initialize step-based content
    this.renderCurrentStep();
  }

  /**
   * Sets up event listeners
   */
  setupEventListeners() {
    // Event listeners are now handled by individual components
  }

  /**
   * Renders the current step content
   */
  renderCurrentStep() {
    const stepContent = document.getElementById('step-content');
    
    switch (this.currentStep) {
      case 1:
        this.renderUploadStep(stepContent);
        break;
      case 2:
        this.renderPersonaStep(stepContent);
        break;
      case 3:
        this.renderRoastStep(stepContent);
        break;
      default:
        this.currentStep = 1;
        this.renderUploadStep(stepContent);
    }
    
    this.updateStepIndicator();
  }

  /**
   * Renders Step 1: Upload Photo
   */
  renderUploadStep(container) {
    container.innerHTML = `
      <div class="step-container step-upload">
        <div class="step-header">
          <h2>Upload Your Photo</h2>
          <p>Choose a photo to get roasted by AI</p>
        </div>
        <div id="upload-area" class="upload-area-container">
          <!-- PhotoUpload component will be inserted here -->
        </div>
      </div>
    `;
    
    const uploadArea = document.getElementById('upload-area');
    uploadArea.appendChild(this.photoUpload.render());
  }

  /**
   * Renders Step 2: Select Persona
   */
  renderPersonaStep(container) {
    container.innerHTML = `
      <div class="step-container step-persona">
        <div class="persona-layout">
          <!-- Left Side: Photo and Header -->
          <div class="persona-left">
            <div class="step-header">
              <h2>Choose Your Roasting Style</h2>
              <p>Pick a persona for your AI roast</p>
            </div>
            
            <div class="uploaded-photo-preview">
              <img src="${this.currentImageData}" alt="Your photo" class="preview-image" />
            </div>
            
            <div class="step-actions">
              <button class="btn btn-secondary" onclick="window.photoRoastApp.goToStep(1)">← Back</button>
              <button class="btn btn-primary" onclick="window.photoRoastApp.goToStep(3)">Continue →</button>
            </div>
          </div>
          
          <!-- Right Side: Persona Grid -->
          <div class="persona-right">
            <div class="persona-grid">
              
              <div class="persona-option ${this.selectedPersona === 'virat-kohli' ? 'selected' : ''}" data-persona="virat-kohli">
                <div class="persona-emoji">🏏</div>
                <h3>Virat Kohli</h3>
                <p>Ruthless Cricket Sledger</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'arnab-goswami' ? 'selected' : ''}" data-persona="arnab-goswami">
                <div class="persona-emoji">📺</div>
                <h3>Arnab Goswami</h3>
                <p>Brutal News Destroyer</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'rajinikanth' ? 'selected' : ''}" data-persona="rajinikanth">
                <div class="persona-emoji">🎬</div>
                <h3>Rajinikanth</h3>
                <p>Stylishly Savage Thalaiva</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'shashi-tharoor' ? 'selected' : ''}" data-persona="shashi-tharoor">
                <div class="persona-emoji">🎓</div>
                <h3>Shashi Tharoor</h3>
                <p>Intellectual Assassin</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'bhuvan-bam' ? 'selected' : ''}" data-persona="bhuvan-bam">
                <div class="persona-emoji">📱</div>
                <h3>Bhuvan Bam</h3>
                <p>Millennial Roast Master</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'karan-johar' ? 'selected' : ''}" data-persona="karan-johar">
                <div class="persona-emoji">🎭</div>
                <h3>Karan Johar</h3>
                <p>Glamorous Savage</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'sunil-grover' ? 'selected' : ''}" data-persona="sunil-grover">
                <div class="persona-emoji">🤡</div>
                <h3>Sunil Grover</h3>
                <p>Innocently Brutal</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'jackie-shroff' ? 'selected' : ''}" data-persona="jackie-shroff">
                <div class="persona-emoji">🎭</div>
                <h3>Jackie Shroff</h3>
                <p>Bindaas Bollywood Boss</p>
              </div>
              
              <div class="persona-option ${this.selectedPersona === 'raghu-roadies' ? 'selected' : ''}" data-persona="raghu-roadies">
                <div class="persona-emoji">😤</div>
                <h3>Raghu (Roadies)</h3>
                <p>Roadies Rage Master</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add click listeners for persona selection
    const personaOptions = container.querySelectorAll('.persona-option');
    personaOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        personaOptions.forEach(opt => opt.classList.remove('selected'));
        // Add selected class to clicked option
        option.classList.add('selected');
        // Update selected persona
        this.selectedPersona = option.dataset.persona;
      });
    });
  }

  /**
   * Renders Step 3: Show Roast
   */
  renderRoastStep(container) {
    container.innerHTML = `
      <div class="step-container step-roast">
        
        <div class="roast-content-wrapper">
          <div class="roast-photo-section">
            <img src="${this.currentImageData}" alt="Your photo" class="roast-image" />
            <div class="persona-badge">
              <span class="persona-emoji">${this.getPersonaEmoji(this.selectedPersona)}</span>
              <span class="persona-name">${this.getPersonaName(this.selectedPersona)}</span>
            </div>
            
            <div class="roast-photo-actions">
              <button class="btn btn-secondary btn-icon-text" onclick="window.photoRoastApp.goToStep(2)">
                <span class="btn-icon-emoji">👤</span>
                <span class="btn-text">Change Persona</span>
              </button>
              <button class="btn btn-secondary btn-icon-text" onclick="window.photoRoastApp.resetApp()">
                <span class="btn-icon-emoji">🔄</span>
                <span class="btn-text">Try Another</span>
              </button>
            </div>
          </div>
          
          <div class="roast-text-section">
            <div id="roast-display-area">
              <!-- RoastDisplay component will be inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    const roastDisplayArea = document.getElementById('roast-display-area');
    roastDisplayArea.appendChild(this.roastDisplay.render());
    
    // Auto-start roasting if not already processing
    if (!this.isProcessing) {
      this.handleStartRoasting();
    }
  }

  /**
   * Updates the step indicator
   */
  updateStepIndicator() {
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((stepItem, index) => {
      const stepNumber = index + 1;
      stepItem.className = 'step-item';
      
      if (stepNumber < this.currentStep) {
        stepItem.classList.add('completed');
      } else if (stepNumber === this.currentStep) {
        stepItem.classList.add('active');
      }
    });
  }

  /**
   * Navigates to a specific step
   */
  goToStep(stepNumber) {
    if (stepNumber === 2 && !this.currentImageData) {
      alert('Please upload a photo first!');
      return;
    }
    
    if (stepNumber === 3 && !this.currentImageData) {
      alert('Please upload a photo first!');
      return;
    }
    
    this.currentStep = stepNumber;
    this.renderCurrentStep();
  }

  /**
   * Gets persona display name
   */
  getPersonaName(persona) {
    const names = {
      'virat-kohli': 'Virat Kohli',
      'arnab-goswami': 'Arnab Goswami',
      'rajinikanth': 'Rajinikanth',
      'shashi-tharoor': 'Shashi Tharoor',
      'bhuvan-bam': 'Bhuvan Bam',
      'karan-johar': 'Karan Johar',
      'sunil-grover': 'Sunil Grover',
      'jackie-shroff': 'Jackie Shroff',
      'raghu-roadies': 'Raghu (Roadies)'
    };
    return names[persona] || 'Virat Kohli';
  }

  /**
   * Gets persona emoji
   */
  getPersonaEmoji(persona) {
    const emojis = {
      'kapil-sharma': '😂',
      'virat-kohli': '🏏',
      'arnab-goswami': '📺',
      'rajinikanth': '🎬',
      'shashi-tharoor': '🎓',
      'bhuvan-bam': '📱',
      'karan-johar': '🎭',
      'sunil-grover': '🤡',
      'jackie-shroff': '🎭',
      'raghu-roadies': '😤'
    };
    return emojis[persona] || '😂';
  }

  /**
   * Shows empty state in photo display area
   */
  showEmptyPhotoState() {
    const photoDisplayArea = document.getElementById('photo-display-area');
    photoDisplayArea.innerHTML = `
      <div class="photo-roast-empty">
        <div class="empty-icon">📷</div>
        <h2>No Photo Selected</h2>
        <p>Upload a photo from the left panel to see it here and get your roast!</p>
      </div>
    `;
  }

  /**
   * Shows uploaded photo in the display area with controls
   * @param {string} imageUrl - Base64 or blob URL of the image
   */
  showUploadedPhoto(imageUrl) {
    const photoDisplayArea = document.getElementById('photo-display-area');
    photoDisplayArea.innerHTML = `
      <div class="uploaded-photo-container">
        <img src="${imageUrl}" alt="Uploaded photo" class="uploaded-photo" />
        
        <div class="photo-controls">
          <div class="persona-selector">
            <label for="roast-persona" class="persona-label">Choose Your Savage Roasting Style (100 words):</label>
            <select id="roast-persona" class="persona-dropdown" ${this.isProcessing ? 'disabled' : ''}>
              <option value="virat-kohli">🏏 Virat Kohli - Ruthless Cricket Sledger</option>
              <option value="arnab-goswami">📺 Arnab Goswami - Brutal News Destroyer</option>
              <option value="rajinikanth">🎬 Rajinikanth - Stylishly Savage Thalaiva</option>
              <option value="shashi-tharoor">🎓 Shashi Tharoor - Intellectual Assassin</option>
              <option value="bhuvan-bam">📱 Bhuvan Bam - Millennial Roast Master</option>
              <option value="karan-johar">🎭 Karan Johar - Glamorous Savage</option>
              <option value="sunil-grover">🤡 Sunil Grover - Innocently Brutal</option>
            </select>
          </div>
          
          <div class="start-roasting-section">
            <button type="button" class="start-roasting-btn" ${this.isProcessing ? 'disabled' : ''}>
              🔥 Start Roasting! 🔥
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for the start button
    const startButton = document.getElementById('photo-display-area').querySelector('.start-roasting-btn');
    if (startButton) {
      startButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleStartRoasting();
      });
    }
  }

  /**
   * Handles file selection from PhotoUpload component
   * @param {File} file - Selected image file
   */
  async handleFileSelect(file) {
    this.currentFile = file;
    
    // Debug logging for file object in main app
    console.log('App: Received file object:', {
      file,
      type: typeof file,
      isFile: file instanceof File,
      name: file?.name,
      size: file?.size,
      fileType: file?.type,
      constructor: file?.constructor?.name
    });
    
    try {
      // Process image to base64
      console.log('App: Calling imageProcessor.convertToBase64 with file:', file);
      const imageResult = await imageProcessor.convertToBase64(file);
      if (!imageResult.success) {
        throw new Error(imageResult.error.message);
      }
      
      // Store the base64 data for later roasting
      this.currentImageData = imageResult.base64Data;
      
      // Move to step 2 (persona selection)
      this.goToStep(2);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Handles start roasting button click
   * @param {File} file - The file to roast
   */
  async handleStartRoasting(file) {
    if (this.isProcessing || !this.currentImageData) return;
    
    this.isProcessing = true;
    
    // Show loading state
    this.roastDisplay.showLoading();
    
    try {
      // Generate roast using OpenAI with selected persona
      const startTime = Date.now();
      const roastResult = await openaiClient.generateRoast(this.currentImageData, { persona: this.selectedPersona });
      const processingTime = Date.now() - startTime;
      
      if (!roastResult.success) {
        this.roastDisplay.showError({
          type: roastResult.error.type || 'api_error',
          message: roastResult.error.message || 'Failed to generate roast',
          retryAfterSeconds: roastResult.error.retryAfterSeconds
        });
        return;
      }

      // Display the roast
      this.roastDisplay.displayRoast({
        roastText: roastResult.roastText,
        processingTimeMs: processingTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error processing file:', error);
      this.roastDisplay.showError({
        type: 'processing_error',
        message: `Failed to generate roast: ${error.message}`
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Handles validation errors from PhotoUpload component
   * @param {Object} error - Validation error object
   */
  handleValidationError(error) {
    this.roastDisplay.showError({
      type: error.type || 'validation_error',
      message: error.message || 'File validation failed'
    });
  }
  
  /**
   * Handles roast sharing
   * @param {Object} roast - Roast data
   */
  handleShare(roast) {
    console.log('Sharing roast:', roast.roastText);
    // Analytics or additional sharing logic can go here
  }
  
  /**
   * Handles roast copying
   * @param {Object} roast - Roast data
   */
  handleCopy(roast) {
    console.log('Copied roast:', roast.roastText);
    // Analytics or additional copy logic can go here
  }

  /**
   * Resets the app to initial state
   */
  resetApp() {
    this.currentFile = null;
    this.currentImageData = null;
    this.isProcessing = false;
    this.currentStep = 1;
    this.selectedPersona = 'kapil-sharma';
    
    // Reset components
    this.roastDisplay.reset();
    this.photoUpload.removeFile();
    
    // Re-render step 1
    this.renderCurrentStep();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new PhotoRoastApp();
  
  // Make services available globally for debugging
  if (typeof window !== 'undefined') {
    window.photoRoastApp = app;
    window.imageProcessor = imageProcessor;
    window.openaiClient = openaiClient;
    console.log('🔧 Debug: Services available globally:', {
      photoRoastApp: !!window.photoRoastApp,
      imageProcessor: !!window.imageProcessor,
      openaiClient: !!window.openaiClient
    });
  }
});

// Export for testing
export { PhotoRoastApp };
