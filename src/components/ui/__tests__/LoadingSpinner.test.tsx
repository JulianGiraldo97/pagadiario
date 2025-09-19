import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingButton, LoadingOverlay, Skeleton } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders basic spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders fullscreen spinner', () => {
    render(<LoadingSpinner fullScreen text="Loading app..." />);
    expect(screen.getByText('Loading app...')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.spinner-border-sm')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.spinner-border-lg')).toBeInTheDocument();
  });
});

describe('LoadingButton', () => {
  it('renders button with children', () => {
    render(<LoadingButton loading={false}>Click me</LoadingButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(document.querySelector('.spinner-border')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('LoadingOverlay', () => {
  it('renders children without overlay when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows overlay when loading', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getAllByText('Cargando...').length).toBeGreaterThan(0);
  });
});

describe('Skeleton', () => {
  it('renders skeleton with default props', () => {
    render(<Skeleton />);
    expect(document.querySelector('.bg-light')).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    render(<Skeleton width="200px" height="50px" />);
    const skeleton = document.querySelector('.bg-light');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });
});