import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  className = '',
  header = null,
  footer = null,
  ...props
}) => {
  // Variantes
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-md',
    outlined: 'bg-white border border-gray-300',
    flat: 'bg-gray-50 border border-transparent',
    gradient: 'bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200',
  };

  // Paddings
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  // Classes base
  const baseClasses = [
    'rounded-lg transition-all duration-200',
  ];

  // Classes de hover
  const hoverClasses = hover || clickable
    ? 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1'
    : '';

  // Classes de clique
  const clickableClasses = clickable
    ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
    : '';

  // Classes finais
  const classes = [
    ...baseClasses,
    variants[variant] || variants.default,
    hoverClasses,
    clickableClasses,
    className,
  ].filter(Boolean).join(' ');

  // Classes do conteúdo
  const contentClasses = [
    paddings[padding] || paddings.md,
  ].filter(Boolean).join(' ');

  const CardComponent = clickable ? 'button' : 'div';

  return (
    <CardComponent className={classes} {...props}>
      {/* Header */}
      {header && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          {header}
        </div>
      )}

      {/* Content */}
      <div className={header || footer ? (padding !== 'none' ? 'p-4' : '') : contentClasses}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </CardComponent>
  );
};

// Card.Header component
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

// Card.Title component
Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

// Card.Subtitle component
Card.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

// Card.Content component
Card.Content = ({ children, className = '', ...props }) => (
  <div className={`text-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

// Card.Footer component
Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-4 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;