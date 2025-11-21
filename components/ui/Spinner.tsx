interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-2',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-foreground border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="იტვირთება"
    >
      <span className="sr-only">იტვირთება...</span>
    </div>
  );
}
