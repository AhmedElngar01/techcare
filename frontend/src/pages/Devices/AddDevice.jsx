import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import './Devices.css'; // Reuse styles

const AddDevice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        serial_number: '',
        purchase_date: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/devices', formData);
            toast.success('Device added successfully');
            navigate('/app/devices');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add device');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-device-page">
            <button className="btn-icon mb-4" onClick={() => navigate('/app/devices')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back to Devices
            </button>
            
            <div className="page-header">
                <h1>Add New Device</h1>
            </div>

            <div className="auth-card" style={{ maxWidth: '600px', margin: '0' }}>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="brand">Brand</label>
                        <input
                            type="text"
                            id="brand"
                            name="brand"
                            className="form-control"
                            placeholder="e.g., Apple, Samsung, Dyson"
                            value={formData.brand}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="model">Model</label>
                        <input
                            type="text"
                            id="model"
                            name="model"
                            className="form-control"
                            placeholder="e.g., iPhone 13, Galaxy S22"
                            value={formData.model}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="serial_number">Serial Number</label>
                        <input
                            type="text"
                            id="serial_number"
                            name="serial_number"
                            className="form-control"
                            placeholder="Must be unique"
                            value={formData.serial_number}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="purchase_date">Purchase Date</label>
                        <input
                            type="date"
                            id="purchase_date"
                            name="purchase_date"
                            className="form-control"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-actions mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <Button type="button" variant="ghost" onClick={() => navigate('/app/devices')}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading}>Save Device</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDevice;
