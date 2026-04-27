import { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const wrapperClasses = [
    'ds-input-wrapper',
    error && 'ds-input-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      {label && <label className="ds-input__label">{label}</label>}
      <div className="ds-input__container">
        {leftIcon && <span className="ds-input__icon ds-input__icon--left">{leftIcon}</span>}
        <input
          ref={ref}
          className={`ds-input ${leftIcon ? 'ds-input--has-left-icon' : ''} ${rightIcon ? 'ds-input--has-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="ds-input__icon ds-input__icon--right">{rightIcon}</span>}
      </div>
      {error && <span className="ds-input__error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
