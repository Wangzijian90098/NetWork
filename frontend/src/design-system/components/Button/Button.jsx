import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    loading && 'ds-button--loading',
    disabled && 'ds-button--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="ds-button__spinner" />
      ) : leftIcon ? (
        <span className="ds-button__icon ds-button__icon--left">{leftIcon}</span>
      ) : null}
      <span className="ds-button__text">{children}</span>
      {rightIcon && !loading && (
        <span className="ds-button__icon ds-button__icon--right">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
