import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return (
    <div>
      <button onClick={() => showSuccess('Success', 'Operation completed')}>
        Show Success
      </button>
      <button onClick={() => showError('Error', 'Something went wrong')}>
        Show Error
      </button>
      <button onClick={() => showWarning('Warning', 'Be careful')}>
        Show Warning
      </button>
      <button onClick={() => showInfo('Info', 'Just so you know')}>
        Show Info
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('Toast System', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows success toast', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<TestComponent />);

    await user.click(screen.getByText('Show Success'));

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('shows error toast', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<TestComponent />);

    await user.click(screen.getByText('Show Error'));

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows warning toast', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<TestComponent />);

    await user.click(screen.getByText('Show Warning'));

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Be careful')).toBeInTheDocument();
  });

  it('shows info toast', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<TestComponent />);

    await user.click(screen.getByText('Show Info'));

    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Just so you know')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<TestComponent />);

    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('auto-removes toast after duration', async () => {
    renderWithProvider(<TestComponent />);

    await act(async () => {
      const button = screen.getByText('Show Success');
      button.click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument();
    });
  });

  it('throws error when useToast is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useToast();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });
});