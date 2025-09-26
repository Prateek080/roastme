/**
 * RoastDisplay Component Tests
 * Comprehensive test suite for the roast display functionality
 * 
 * @fileoverview Constitutional compliance: <100 lines per logical section
 * @author Photo Roasting App Team
 * @version 1.0.0
 */

import { screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { RoastDisplay } from '../../../src/components/RoastDisplay.js';

describe('RoastDisplay Component', () => {
  let container;
  let user;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    user = userEvent.setup();
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('Component Rendering', () => {
    test('should render empty state initially', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());

      expect(screen.getByText(/waiting for your photo/i)).toBeInTheDocument();
      expect(screen.getByText(/upload a photo to get started/i)).toBeInTheDocument();
    });

    test('should have proper accessibility attributes', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());

      const displayArea = screen.getByRole('region');
      expect(displayArea).toHaveAttribute('aria-label', 'Roast display area');
      expect(displayArea).toHaveAttribute('aria-live', 'polite');
    });

    test('should display loading state', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      roastDisplay.showLoading();

      expect(screen.getByText(/generating your roast/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Roast Display', () => {
    test('should display roast text', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = {
        roastText: 'Your photo is so blurry, even Instagram gave up trying to enhance it!',
        processingTimeMs: 1500,
        timestamp: Date.now()
      };

      roastDisplay.displayRoast(mockRoast);

      expect(screen.getByText(mockRoast.roastText)).toBeInTheDocument();
      expect(screen.getByText(/generated in 1.5 seconds/i)).toBeInTheDocument();
    });

    test('should handle long roast text', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const longRoast = {
        roastText: 'A'.repeat(500),
        processingTimeMs: 2000,
        timestamp: Date.now()
      };

      roastDisplay.displayRoast(longRoast);

      expect(screen.getByText(longRoast.roastText)).toBeInTheDocument();
    });

    test('should display roast with proper formatting', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = {
        roastText: 'This photo makes me question my career choices as an AI!',
        processingTimeMs: 800,
        timestamp: Date.now()
      };

      roastDisplay.displayRoast(mockRoast);

      const roastElement = screen.getByRole('article');
      expect(roastElement).toHaveClass('roast-text');
    });
  });

  describe('Error Handling', () => {
    test('should display error message', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const error = {
        type: 'api_error',
        message: 'Failed to generate roast. Please try again.'
      };

      roastDisplay.showError(error);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(error.message)).toBeInTheDocument();
    });

    test('should handle rate limit errors', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const rateLimitError = {
        type: 'rate_limit',
        message: 'Too many requests. Please wait before trying again.',
        retryAfterSeconds: 60
      };

      roastDisplay.showError(rateLimitError);

      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      expect(screen.getByText(/wait.*60.*seconds/i)).toBeInTheDocument();
    });

    test('should clear error when new roast is displayed', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      // First show error
      roastDisplay.showError({ type: 'api_error', message: 'Error occurred' });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Then display roast
      const mockRoast = { roastText: 'New roast!', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText('New roast!')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should have share button when roast is displayed', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = {
        roastText: 'Shareable roast text',
        processingTimeMs: 1200
      };

      roastDisplay.displayRoast(mockRoast);

      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    test('should have copy button when roast is displayed', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = {
        roastText: 'Copy this roast',
        processingTimeMs: 900
      };

      roastDisplay.displayRoast(mockRoast);

      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    test('should handle copy button click', async () => {
      // Clipboard is already mocked in setup.js

      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = {
        roastText: 'Text to copy',
        processingTimeMs: 1000
      };

      roastDisplay.displayRoast(mockRoast);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRoast.roastText);
    });

    test('should show feedback after copying', async () => {
      // Clipboard is already mocked in setup.js

      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = { roastText: 'Copied text', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    test('should clear display when reset', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      // Display roast first
      const mockRoast = { roastText: 'Test roast', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);
      expect(screen.getByText('Test roast')).toBeInTheDocument();

      // Reset display
      roastDisplay.reset();
      expect(screen.queryByText('Test roast')).not.toBeInTheDocument();
      expect(screen.getByText(/waiting for your photo/i)).toBeInTheDocument();
    });

    test('should track display history', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const roast1 = { roastText: 'First roast', processingTimeMs: 1000 };
      const roast2 = { roastText: 'Second roast', processingTimeMs: 1200 };

      roastDisplay.displayRoast(roast1);
      roastDisplay.displayRoast(roast2);

      const history = roastDisplay.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].roastText).toBe('First roast');
      expect(history[1].roastText).toBe('Second roast');
    });
  });

  describe('Accessibility', () => {
    test('should announce roast to screen readers', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = { roastText: 'Screen reader roast', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);

      const liveRegion = screen.getByRole('region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('should have proper heading structure', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = { roastText: 'Heading test', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      const mockRoast = { roastText: 'Keyboard test', processingTimeMs: 1000 };
      roastDisplay.displayRoast(mockRoast);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      
      // Tab to the copy button
      await user.tab();
      expect(copyButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('should handle rapid roast updates', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const roast = { roastText: `Roast ${i}`, processingTimeMs: 1000 };
        roastDisplay.displayRoast(roast);
      }

      expect(screen.getByText('Roast 9')).toBeInTheDocument();
      expect(screen.queryByText('Roast 8')).not.toBeInTheDocument();
    });

    test('should limit history size', () => {
      const roastDisplay = new RoastDisplay();
      container.appendChild(roastDisplay.render());
      
      // Add more than max history items
      for (let i = 0; i < 15; i++) {
        const roast = { roastText: `History ${i}`, processingTimeMs: 1000 };
        roastDisplay.displayRoast(roast);
      }

      const history = roastDisplay.getHistory();
      expect(history.length).toBeLessThanOrEqual(10); // Max history limit
    });
  });
});
