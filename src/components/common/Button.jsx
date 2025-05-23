import React from 'react';
import { THEME_COLORS } from '../../utils/constants';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  leftIcon = null,
  rightIcon = null,
  ...props
}) => {
  // Variantes de cor
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white border-transparent focus:ring-secondary-500',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white border-transparent focus:ring-accent-500',
    success: 'bg-success-600 hover:bg-success-700 text-white border-transparent focus:ring-success-500',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white border-transparent focus:ring-warning-500',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white border-transparent focus:ring-danger-500',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-primary-500',
    link: 'bg-transparent hover:bg-transparent text-primary-600 hover:text-primary-700 border-transparent focus:ring-primary-500 p-0',
  };

  // Tamanhos
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base',
  };

  // Classes base
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium',
    'border',
    'rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'disabled:hover:bg-current',
  ];

  // Adicionar classes baseadas nas props
  const classes = [
    ...baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    disabled || loading ? 'pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  // Ícone de loading
  const LoadingIcon = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <>
          <LoadingIcon />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;