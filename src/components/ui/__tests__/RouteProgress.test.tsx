import { render, screen } from '@testing-library/react';
import RouteProgress from '../RouteProgress';

describe('RouteProgress', () => {
  const mockProgressData = {
    total: 10,
    visited: 7,
    paid: 5,
    notPaid: 1,
    absent: 1,
    totalCollected: 250000,
    totalExpected: 500000
  };

  it('renders progress information correctly', () => {
    render(<RouteProgress {...mockProgressData} />);

    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Paid count
    expect(screen.getByText('1')).toBeInTheDocument(); // Not paid count
    expect(screen.getByText('$250,000')).toBeInTheDocument(); // Total collected
    expect(screen.getByText('de $500,000 esperado')).toBeInTheDocument();
  });

  it('renders compact version correctly', () => {
    render(<RouteProgress {...mockProgressData} isCompact={true} />);

    expect(screen.getByText('Progreso del Día')).toBeInTheDocument();
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('Clientes visitados')).toBeInTheDocument();
  });

  it('calculates percentages correctly', () => {
    render(<RouteProgress {...mockProgressData} />);

    // Progress percentage should be 70% (7/10)
    const progressBar = screen.getAllByRole('progressbar')[0];
    expect(progressBar).toHaveStyle('width: 70%');

    // Collection percentage should be 50% (250000/500000)
    const collectionBar = screen.getAllByRole('progressbar')[1];
    expect(collectionBar).toHaveStyle('width: 50%');
  });

  it('handles zero values correctly', () => {
    const zeroData = {
      total: 0,
      visited: 0,
      paid: 0,
      notPaid: 0,
      absent: 0,
      totalCollected: 0,
      totalExpected: 0
    };

    render(<RouteProgress {...zeroData} />);

    expect(screen.getByText('0/0')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});