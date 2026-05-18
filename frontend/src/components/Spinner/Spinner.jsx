import './Spinner.css';

const Spinner = ({ size = 'medium', className = '' }) => {
    return (
        <div className={`spinner spinner--${size} ${className}`}></div>
    );
};

export default Spinner;
