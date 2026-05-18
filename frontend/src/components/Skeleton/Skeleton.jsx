import './Skeleton.css';

const Skeleton = ({ className = '', style = {} }) => {
    return <div className={`skeleton ${className}`} style={style}></div>;
};

export default Skeleton;
