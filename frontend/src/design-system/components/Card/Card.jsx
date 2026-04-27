import './Card.css';

const Card = ({
  children,
  variant = 'default',
  glow = false,
  hoverable = true,
  topBar = true,
  className = '',
  ...props
}) => {
  const classes = [
    'ds-card',
    `ds-card--${variant}`,
    glow && 'ds-card--glow',
    hoverable && 'ds-card--hoverable',
    topBar && 'ds-card--top-bar',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`ds-card__header ${className}`}>{children}</div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`ds-card__body ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`ds-card__footer ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
