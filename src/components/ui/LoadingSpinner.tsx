interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : size === 'lg' ? 'spinner-border-lg' : ''
  
  return (
    <div className={`spinner-border ${sizeClass} ${className}`} role="status">
      <span className="visually-hidden">Cargando...</span>
    </div>
  )
}