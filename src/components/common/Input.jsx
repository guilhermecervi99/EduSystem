import React, { forwardRef } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  leftIcon = null,
  rightIcon = null,
  showPasswordToggle = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // Determinar o tipo de input atual
  const currentType = type === 'password' && showPassword ? 'text' : type;

  // Tamanhos
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  // Classes base do input
  const baseInputClasses = [
    'block w-full rounded-lg border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
  ];

  // Classes baseadas no estado
  const stateClasses = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
    : isFocused
    ? 'border-primary-500 ring-primary-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  // Classes do input
  const inputClasses = [
    ...baseInputClasses,
    sizes[size] || sizes.md,
    stateClasses,
    leftIcon ? 'pl-10' : '',
    rightIcon || showPasswordToggle || error ? 'pr-10' : '',
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  // Classes do container
  const containerClasses = [
    fullWidth ? 'w-full' : '',
    containerClassName,
  ].filter(Boolean).join(' ');

  // Toggle da senha
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // Determinar ícone da direita
  const getRightIcon = () => {
    if (error) {
      return <AlertCircle className="h-5 w-5 text-danger-500" />;
    }
    if (showPasswordToggle) {
      return (
        <button
          type="button"
          onClick={togglePassword}
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      );
    }
    return rightIcon;
  };

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Ícone da esquerda */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={currentType}
          className={inputClasses}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* Ícone da direita */}
        {(rightIcon || showPasswordToggle || error) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {getRightIcon()}
          </div>
        )}
      </div>

      {/* Helper Text ou Error */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-danger-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;