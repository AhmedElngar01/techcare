import './ProgressBar.css';

const ProgressBar = ({ value, max = 100, className = '' }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    return (
        <div className={`progress-bar-container ${className}`}>
            <div 
                className="progress-bar" 
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin="0"
                aria-valuemax={max}
            ></div>
        </div>
    );
};

export default ProgressBar;
