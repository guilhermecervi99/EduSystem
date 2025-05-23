import React from 'react';

const Loading = ({
  size = 'md',
  variant = 'spinner',
  text = '',
  fullscreen = false,
  overlay = false,
  className = '',
}) => {
  // Tamanhos
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  // Spinner component
  const Spinner = ({ className: spinnerClassName = '' }) => (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${
        sizes[size]
      } ${spinnerClassName}`}
    />
  );

  // Pulse component
  const Pulse = ({ className: pulseClassName = '' }) => (
    <div className={`flex space-x-1 ${pulseClassName}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-primary-600 rounded-full animate-pulse ${
            size === 'xs' ? 'h-2 w-2' :
            size === 'sm' ? 'h-3 w-3' :
            size === 'lg' ? 'h-5 w-5' :
            size === 'xl' ? 'h-6 w-6' :
            'h-4 w-4'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );

  // Dots component
  const Dots = ({ className: dotsClassName = '' }) => (
    <div className={`flex space-x-1 ${dotsClassName}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-primary-600 rounded-full animate-bounce ${
            size === 'xs' ? 'h-2 w-2' :
            size === 'sm' ? 'h-3 w-3' :
            size === 'lg' ? 'h-5 w-5' :
            size === 'xl' ? 'h-6 w-6' :
            'h-4 w-4'
          }`}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );

  // Skeleton component
  const Skeleton = ({ className: skeletonClassName = '' }) => (
    <div className={`space-y-3 ${skeletonClassName}`}>
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-gray-300 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Escolher o componente baseado na variante
  const getLoadingComponent = () => {
    switch (variant) {
      case 'pulse':
        return <Pulse />;
      case 'dots':
        return <Dots />;
      case 'skeleton':
        return <Skeleton />;
      case 'spinner':
      default:
        return <Spinner />;
    }
  };

  // Container classes
  const containerClasses = [
    'flex flex-col items-center justify-center',
    fullscreen ? 'fixed inset-0 z-50' : '',
    overlay ? 'bg-white bg-opacity-75 backdrop-blur-sm' : '',
    className,
  ].filter(Boolean).join(' ');

  // Se for fullscreen, usar portal ou overlay
  const content = (
    <div className={containerClasses}>
      {getLoadingComponent()}
      {text && (
        <p className={`mt-3 text-gray-600 ${
          size === 'xs' ? 'text-xs' :
          size === 'sm' ? 'text-sm' :
          size === 'lg' ? 'text-lg' :
          size === 'xl' ? 'text-xl' :
          'text-base'
        }`}>
          {text}
        </p>
      )}
    </div>
  );

  return content;
};

// Loading.Inline - para loading inline
Loading.Inline = ({ size = 'sm', className = '' }) => (
  <div className={`inline-flex items-center ${className}`}>
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${
        size === 'xs' ? 'h-3 w-3' :
        size === 'sm' ? 'h-4 w-4' :
        size === 'md' ? 'h-5 w-5' :
        'h-6 w-6'
      }`}
    />
  </div>
);

// Loading.Button - para botões
Loading.Button = ({ size = 'sm' }) => (
  <div
    className={`animate-spin rounded-full border-2 border-current border-t-transparent ${
      size === 'xs' ? 'h-3 w-3' :
      size === 'sm' ? 'h-4 w-4' :
      'h-5 w-5'
    }`}
  />
);

// Loading.Screen - para tela inteira
Loading.Screen = ({ text = 'Carregando...' }) => (
  <Loading
    fullscreen
    overlay
    size="lg"
    text={text}
    className="bg-white"
  />
);

// Loading.Card - para cards
Loading.Card = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-300 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

export default Loading;