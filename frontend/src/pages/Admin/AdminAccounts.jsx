import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Shield, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/Table/Table';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import './Admin.css';

const AdminAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/admin/accounts');
            setAccounts(res.data.data);
        } catch (err) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const toggleRole = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Change role to ${newRole}?`)) return;
        
        try {
            await api.patch(`/admin/accounts/${id}/role`, { role: newRole });
            toast.success(`Role updated to ${newRole}`);
            setAccounts(accounts.map(acc => acc.id === id ? { ...acc, role: newRole } : acc));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const isActive = currentStatus === 1;
        if (!window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this account?`)) return;
        
        try {
            await api.patch(`/admin/accounts/${id}/status`, { is_active: !isActive });
            toast.success(`Account ${isActive ? 'deactivated' : 'activated'}`);
            setAccounts(accounts.map(acc => acc.id === id ? { ...acc, is_active: !isActive ? 1 : 0 } : acc));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;

    const columns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'name' },
        { header: 'Email', accessor: 'email' },
        { header: 'Role', accessor: 'role', render: (row) => (
            <Badge variant={row.role === 'admin' ? 'primary' : 'neutral'}>
                {row.role === 'admin' ? <Shield size={12} className="me-1" /> : null}
                {row.role}
            </Badge>
        )},
        { header: 'Status', accessor: 'is_active', render: (row) => (
            <Badge variant={row.is_active ? 'success' : 'danger'}>
                {row.is_active ? 'Active' : 'Inactive'}
            </Badge>
        )},
        { header: 'Devices', accessor: 'device_count' },
        { header: 'Actions', accessor: 'id', render: (row) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => toggleRole(row.id, row.role)}>
                    Toggle Role
                </Button>
                <Button variant={row.is_active ? 'danger' : 'success'} onClick={() => toggleStatus(row.id, row.is_active)}>
                    {row.is_active ? 'Deactivate' : 'Activate'}
                </Button>
            </div>
        )}
    ];

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1>Account Management</h1>
                    <p className="text-muted">Manage user roles and access status.</p>
                </div>
            </div>

            <div className="card">
                <Table columns={columns} data={accounts} />
            </div>
        </div>
    );
};

export default AdminAccounts;
