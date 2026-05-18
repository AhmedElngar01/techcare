import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Monitor, Plus } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import EmptyState from '../../components/EmptyState/EmptyState';
import './Devices.css';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchDevices = async () => {
        try {
            const res = await api.get('/devices');
            setDevices(res.data.data);
        } catch (err) {
            toast.error('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this device?')) return;
        
        try {
            await api.delete(`/devices/${id}`);
            toast.success('Device deleted');
            setDevices(devices.filter(d => d.id !== id));
        } catch (err) {
            toast.error('Failed to delete device');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="devices-page">
            <div className="page-header">
                <div>
                    <h1>My Devices</h1>
                    <p className="text-muted">Manage your registered devices and start diagnostics.</p>
                </div>
                <Button onClick={() => navigate('/app/devices/new')}>
                    <Plus size={18} /> Add Device
                </Button>
            </div>

            {devices.length === 0 ? (
                <EmptyState 
                    icon={Monitor}
                    title="No devices found"
                    description="You haven't added any devices yet. Add one to get started."
                    action={<Button onClick={() => navigate('/app/devices/new')}>Add Device</Button>}
                />
            ) : (
                <div className="devices-grid">
                    {devices.map(device => (
                        <div key={device.id} className="device-grid-card" onClick={() => navigate(`/app/devices/${device.id}`)}>
                            <div className="device-card-header">
                                <div className="device-icon">
                                    <Monitor size={24} />
                                </div>
                                <div className="device-actions">
                                    <button 
                                        className="btn-icon text-danger" 
                                        onClick={(e) => handleDelete(e, device.id)}
                                        aria-label="Delete device"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div className="device-details">
                                <h3>{device.brand} {device.model}</h3>
                                <p className="text-muted text-sm mb-4">SN: {device.serial_number}</p>
                                
                                <div className="device-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Purchased</span>
                                        <span className="meta-value">{new Date(device.purchase_date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="device-footer">
                                <Button 
                                    variant="primary" 
                                    className="w-full" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/app/devices/${device.id}/diagnose`);
                                    }}
                                >
                                    Start Diagnosis
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Devices;
