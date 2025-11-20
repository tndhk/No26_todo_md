import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast, { ToastMessage } from '@/components/Toast';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

// Mock CSS modules
jest.mock('@/components/Toast.module.css', () => ({
  container: 'container',
  toast: 'toast',
  success: 'success',
  error: 'error',
  info: 'info',
  icon: 'icon',
  message: 'message',
  dismissButton: 'dismissButton',
}));

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render empty container when no toasts', () => {
      const { container } = render(<Toast toasts={[]} onDismiss={jest.fn()} />);

      const toastContainer = container.querySelector('.container');
      expect(toastContainer).toBeInTheDocument();
      expect(toastContainer?.children.length).toBe(0);
    });

    it('should render single toast message', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Success message' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should render multiple toast messages', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First message' },
        { id: '2', type: 'error', message: 'Second message' },
        { id: '3', type: 'info', message: 'Third message' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });

    it('should render correct icon for success toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Success' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should render correct icon for error toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'error', message: 'Error' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should render correct icon for info toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'info', message: 'Info' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });

    it('should render dismiss button for each toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const dismissButtons = screen.getAllByLabelText('Dismiss notification');
      expect(dismissButtons).toHaveLength(2);
    });

    it('should render X icon in dismiss button', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply success class to success toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Success' },
      ];

      const { container } = render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('success');
    });

    it('should apply error class to error toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'error', message: 'Error' },
      ];

      const { container } = render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('error');
    });

    it('should apply info class to info toast', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'info', message: 'Info' },
      ];

      const { container } = render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('info');
    });
  });

  describe('manual dismiss', () => {
    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledWith('1');
    });

    it('should dismiss correct toast when multiple toasts exist', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
        { id: '3', type: 'info', message: 'Third' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      const dismissButtons = screen.getAllByLabelText('Dismiss notification');
      fireEvent.click(dismissButtons[1]); // Click second toast's dismiss

      expect(onDismiss).toHaveBeenCalledWith('2');
    });

    it('should allow dismissing multiple toasts', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      const dismissButtons = screen.getAllByLabelText('Dismiss notification');
      fireEvent.click(dismissButtons[0]);
      fireEvent.click(dismissButtons[1]);

      expect(onDismiss).toHaveBeenCalledTimes(2);
      expect(onDismiss).toHaveBeenCalledWith('1');
      expect(onDismiss).toHaveBeenCalledWith('2');
    });
  });

  describe('auto dismiss', () => {
    it('should auto-dismiss toast after 5 seconds', async () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      expect(onDismiss).not.toHaveBeenCalled();

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('1');
      });
    });

    it('should not auto-dismiss before 5 seconds', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      // Fast-forward time by 4.9 seconds
      jest.advanceTimersByTime(4900);

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should auto-dismiss multiple toasts independently', async () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];

      render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalledWith('1');
        expect(onDismiss).toHaveBeenCalledWith('2');
        expect(onDismiss).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear timeout on manual dismiss', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      const { unmount } = render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);

      // Unmount to trigger cleanup
      unmount();

      // Advance time - should not call onDismiss again
      jest.advanceTimersByTime(5000);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should cleanup timer on unmount', () => {
      const onDismiss = jest.fn();
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      const { unmount } = render(<Toast toasts={toasts} onDismiss={onDismiss} />);

      unmount();

      // Advance time after unmount
      jest.advanceTimersByTime(5000);

      // Should not call onDismiss after unmount
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('toast updates', () => {
    it('should handle adding new toasts', () => {
      const onDismiss = jest.fn();
      const initialToasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
      ];

      const { rerender } = render(<Toast toasts={initialToasts} onDismiss={onDismiss} />);

      expect(screen.getByText('First')).toBeInTheDocument();

      const updatedToasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];

      rerender(<Toast toasts={updatedToasts} onDismiss={onDismiss} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('should handle removing toasts', () => {
      const onDismiss = jest.fn();
      const initialToasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ];

      const { rerender } = render(<Toast toasts={initialToasts} onDismiss={onDismiss} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();

      const updatedToasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
      ];

      rerender(<Toast toasts={updatedToasts} onDismiss={onDismiss} />);

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on dismiss button', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should render dismiss button as button element', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'Message' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const dismissButton = screen.getByLabelText('Dismiss notification');
      expect(dismissButton.tagName).toBe('BUTTON');
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: longMessage },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const specialMessage = 'Message with "quotes" & <brackets> #hashtag';
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: specialMessage },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: '' },
      ];

      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const messageElement = screen.getByText('', { selector: '.message' });
      expect(messageElement).toBeInTheDocument();
    });

    it('should handle many toasts', () => {
      const manyToasts: ToastMessage[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        type: (i % 3 === 0 ? 'success' : i % 3 === 1 ? 'error' : 'info') as any,
        message: `Message ${i}`,
      }));

      render(<Toast toasts={manyToasts} onDismiss={jest.fn()} />);

      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByText('Message 19')).toBeInTheDocument();
    });

    it('should handle rapid toast additions and removals', () => {
      const onDismiss = jest.fn();
      const toast1: ToastMessage[] = [{ id: '1', type: 'success', message: 'First' }];
      const toast2: ToastMessage[] = [{ id: '2', type: 'error', message: 'Second' }];
      const toast3: ToastMessage[] = [{ id: '3', type: 'info', message: 'Third' }];

      const { rerender } = render(<Toast toasts={toast1} onDismiss={onDismiss} />);
      rerender(<Toast toasts={toast2} onDismiss={onDismiss} />);
      rerender(<Toast toasts={toast3} onDismiss={onDismiss} />);
      rerender(<Toast toasts={[]} onDismiss={onDismiss} />);

      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.queryByText('Second')).not.toBeInTheDocument();
      expect(screen.queryByText('Third')).not.toBeInTheDocument();
    });

    it('should handle duplicate IDs gracefully', () => {
      const toasts: ToastMessage[] = [
        { id: '1', type: 'success', message: 'First' },
        { id: '1', type: 'error', message: 'Second (same ID)' },
      ];

      // React will warn about duplicate keys but should still render
      render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      // Only the last one with the same key will be visible in the DOM
      expect(screen.getByText('Second (same ID)')).toBeInTheDocument();
    });
  });

  describe('key prop behavior', () => {
    it('should use toast ID as key', () => {
      const toasts: ToastMessage[] = [
        { id: 'unique-1', type: 'success', message: 'First' },
        { id: 'unique-2', type: 'error', message: 'Second' },
      ];

      const { container } = render(<Toast toasts={toasts} onDismiss={jest.fn()} />);

      const toastElements = container.querySelectorAll('.toast');
      expect(toastElements).toHaveLength(2);
    });
  });
});
