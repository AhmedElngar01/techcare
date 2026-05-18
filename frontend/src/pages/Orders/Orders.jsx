import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBag } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/Table/Table';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import EmptyState from '../../components/EmptyState/EmptyState';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            setOrders(res.data.data);
        } catch (err) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        
        try {
            await api.patch(`/orders/${id}/cancel`);
            toast.success('Order cancelled');
            setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel order');
        }
    };

    if (loading) return <div>Loading...</div>;

    const columns = [
        { header: 'Order ID', accessor: 'id', render: (row) => `#${row.id}` },
        { header: 'Date', accessor: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() },
        { header: 'Item', accessor: 'part_name', render: (row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={row.part_image} alt={row.part_name} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                <span>{row.part_name} (x{row.quantity})</span>
            </div>
        ) },
        { header: 'Total', accessor: 'total_price', render: (row) => `$${row.total_price.toFixed(2)}` },
        { header: 'Status', accessor: 'status', render: (row) => (
            <Badge variant={
                row.status === 'paid' ? 'success' :
                row.status === 'shipped' ? 'info' :
                row.status === 'cancelled' ? 'danger' : 'warning'
            }>
                {row.status}
            </Badge>
        ) },
        { header: 'Actions', accessor: 'id', render: (row) => (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" onClick={() => navigate(`/app/orders/${row.id}`)}>Details</Button>
                {row.status === 'pending' && (
                    <Button variant="danger" onClick={(e) => handleCancel(e, row.id)}>Cancel</Button>
                )}
            </div>
        )}
    ];

    return (
        <div className="orders-page">
            <div className="page-header">
                <div>
                    <h1>My Orders</h1>
                    <p className="text-muted">Track and manage your replacement parts orders.</p>
                </div>
                <Button onClick={() => navigate('/app/parts')}>Browse Marketplace</Button>
            </div>

            {orders.length === 0 ? (
                <EmptyState 
                    icon={ShoppingBag}
                    title="No orders yet"
                    description="You haven't placed any orders. Check out the marketplace for replacement parts."
                    action={<Button onClick={() => navigate('/app/parts')}>Go to Marketplace</Button>}
                />
            ) : (
                <Table columns={columns} data={orders} />
            )}
        </div>
    );
};

export default Orders;
