import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bell, Send } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import './Admin.css';

const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const [form, setForm] = useState({
        target_role: 'all',
        title: '',
        message: ''
    });

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/admin/notifications');
            setNotifications(res.data.data);
        } catch (err) {
            toast.error('Failed to load notifications history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await api.post('/admin/notifications/dispatch', form);
            toast.success(`Dispatched to ${res.data.data.dispatched_count} users`);
            setForm({ target_role: 'all', title: '', message: '' });
            fetchNotifications(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to dispatch notification');
        } finally {
            setSending(false);
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Type', accessor: 'type', render: (row) => <span className="capitalize">{row.type}</span> },
        { header: 'Title', accessor: 'title' },
        { header: 'Message', accessor: 'message', render: (row) => (
            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.message}
            </div>
        )},
        { header: 'Read', accessor: 'is_read', render: (row) => row.is_read ? 'Yes' : 'No' },
        { header: 'Date', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleString() }
    ];

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>System Notifications</h1>
                    <p className="text-muted">Dispatch platform-wide alerts and updates.</p>
                </div>
            </div>

            <div className="admin-notifications-content" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 className="flex-align-center gap-2 mb-4"><Send size={18} /> Dispatch Notification</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label>Target Audience</label>
                            <select 
                                className="form-control" 
                                value={form.target_role}
                                onChange={(e) => setForm({...form, target_role: e.target.value})}
                            >
                                <option value="all">All Users</option>
                                <option value="user">Standard Users Only</option>
                                <option value="admin">Admins Only</option>
                            </select>
                        </div>
                        <div className="form-group mb-4">
                            <label>Title</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                required
                                value={form.title}
                                onChange={(e) => setForm({...form, title: e.target.value})}
                            />
                        </div>
                        <div className="form-group mb-6">
                            <label>Message</label>
                            <textarea 
                                className="form-control" 
                                rows="4" 
                                required
                                value={form.message}
                                onChange={(e) => setForm({...form, message: e.target.value})}
                            ></textarea>
                        </div>
                        <Button type="submit" variant="primary" className="w-full" loading={sending}>
                            Send Broadcast
                        </Button>
                    </form>
                </div>

                <div className="card">
                    <h3 className="flex-align-center gap-2 mb-4"><Bell size={18} /> Notification History (All Users)</h3>
                    {loading ? (
                        <p>Loading history...</p>
                    ) : (
                        <Table columns={columns} data={notifications} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminNotifications;
