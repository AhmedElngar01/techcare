import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import Button from '../../components/Button/Button';
import Badge from '../../components/Badge/Badge';
import Table from '../../components/Table/Table';
import Modal from '../../components/Modal/Modal';
import './Devices.css';

const DeviceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [device, setDevice] = useState(null);
    const [diagnoses, setDiagnoses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Edit state
    const [editForm, setEditForm] = useState({ brand: '', model: '', purchase_date: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                const [deviceRes, diagnosesRes] = await Promise.all([
                    api.get(`/devices/${id}`),
                    api.get(`/diagnoses?device_id=${id}`)
                ]);
                setDevice(deviceRes.data.data);
                setEditForm({
                    brand: deviceRes.data.data.brand,
                    model: deviceRes.data.data.model,
                    purchase_date: deviceRes.data.data.purchase_date
                });
                setDiagnoses(diagnosesRes.data.data);
            } catch (err) {
                toast.error('Failed to load device details');
                navigate('/app/devices');
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceData();
    }, [id, navigate]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await api.put(`/devices/${id}`, editForm);
            setDevice({ ...device, ...res.data.data });
            toast.success('Device updated');
            setIsEditModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update device');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!device) return null;

    const columns = [
        { header: 'Date', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
        { header: 'Root Cause', accessor: 'ai_root_cause' },
        { header: 'Severity', accessor: 'ai_severity', render: (row) => (
            <Badge variant={
                row.ai_severity === 'critical' ? 'danger' :
                row.ai_severity === 'high' ? 'warning' :
                row.ai_severity === 'medium' ? 'primary' : 'success'
            }>
                {row.ai_severity}
            </Badge>
        )},
        { header: 'Status', accessor: 'is_fixable', render: (row) => (
            row.is_fixable ? <Badge variant="success">Fixable</Badge> : <Badge variant="danger">Not Fixable</Badge>
        )},
        { header: 'Actions', accessor: 'id', render: (row) => (
            <Button variant="ghost" onClick={() => navigate(`/app/diagnoses/${row.id}/guide`)} disabled={!row.is_fixable}>
                View Guide
            </Button>
        )}
    ];

    return (
        <div className="device-detail-page">
            <button className="btn-icon mb-4" onClick={() => navigate('/app/devices')} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back to Devices
            </button>
            
            <div className="page-header">
                <div>
                    <h1>{device.brand} {device.model}</h1>
                    <p className="text-muted">SN: {device.serial_number}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                        <Edit2 size={16} /> Edit
                    </Button>
                    <Button variant="primary" onClick={() => navigate(`/app/devices/${device.id}/diagnose`)}>
                        New Diagnosis
                    </Button>
                </div>
            </div>

            <div className="dashboard-stats" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-card__content">
                        <p className="stat-card__label">Purchase Date</p>
                        <p className="stat-card__value" style={{ fontSize: '1.25rem' }}>{new Date(device.purchase_date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__content">
                        <p className="stat-card__label">Total Diagnoses</p>
                        <p className="stat-card__value" style={{ fontSize: '1.25rem' }}>{device.diagnosesCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__content">
                        <p className="stat-card__label">Generated Reports</p>
                        <p className="stat-card__value" style={{ fontSize: '1.25rem' }}>{device.reportsCount}</p>
                    </div>
                </div>
            </div>

            <h2>Diagnosis History</h2>
            <Table columns={columns} data={diagnoses} />

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Device">
                <form onSubmit={handleEditSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="edit-brand">Brand</label>
                        <input
                            type="text"
                            id="edit-brand"
                            className="form-control"
                            value={editForm.brand}
                            onChange={e => setEditForm({...editForm, brand: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-model">Model</label>
                        <input
                            type="text"
                            id="edit-model"
                            className="form-control"
                            value={editForm.model}
                            onChange={e => setEditForm({...editForm, model: e.target.value})}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Serial Number (Cannot be changed)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={device.serial_number}
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-date">Purchase Date</label>
                        <input
                            type="date"
                            id="edit-date"
                            className="form-control"
                            value={editForm.purchase_date}
                            onChange={e => setEditForm({...editForm, purchase_date: e.target.value})}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={isSaving}>Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DeviceDetail;
