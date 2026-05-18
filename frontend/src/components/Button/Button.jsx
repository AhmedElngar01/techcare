import './Button.css';
import Spinner from '../Spinner/Spinner';

const Button = ({ children, variant = 'primary', loading = false, disabled = false, className = '', ...props }) => {
    const baseClass = 'button';
    const variantClass = `button--${variant}`;
    const loadingClass = loading ? 'button--loading' : '';
    
    return (
        <button 
            className={`${baseClass} ${variantClass} ${loadingClass} ${className}`} 
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Spinner size="small" className="button__spinner" />}
            <span>{children}</span>
        </button>
    );
};

export default Button;
