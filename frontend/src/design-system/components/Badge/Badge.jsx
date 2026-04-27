import './Badge.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  glow = false,
  dot = false,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-badge',
    `ds-badge--${variant}`,
    `ds-badge--${size}`,
    glow && 'ds-badge--glow',
    dot && 'ds-badge--dot',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className="ds-badge__dot" />}
      {children}
    </span>
  );
};

export default Badge;
