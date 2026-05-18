import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import './Alert.css';

const ICONS = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertCircle
};

const Alert = ({ children, variant = 'info', className = '' }) => {
    const Icon = ICONS[variant] || Info;
    
    return (
        <div className={`alert alert--${variant} ${className}`}>
            <Icon size={20} className="alert__icon" />
            <div className="alert__content">
                {children}
            </div>
        </div>
    );
};

export default Alert;
