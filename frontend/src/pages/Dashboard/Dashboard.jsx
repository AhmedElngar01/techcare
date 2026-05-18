import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, FileText, ShoppingCart, Activity } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';
import EmptyState from '../../components/EmptyState/EmptyState';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ devices: 0, diagnoses: 0, orders: 0 });
    const [recentDevices, setRecentDevices] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [devicesRes, diagnosesRes, ordersRes] = await Promise.all([
                    api.get('/devices'),
                    api.get('/diagnoses'),
                    api.get('/orders')
                ]);

                const devices = devicesRes.data.data;
                const diagnoses = diagnosesRes.data.data;
                const orders = ordersRes.data.data;

                setStats({
                    devices: devices.length,
                    diagnoses: diagnoses.filter(d => d.is_fixable).length,
                    orders: orders.filter(o => o.status === 'pending').length
                });

                setRecentDevices(devices.slice(0, 3));
                setRecentOrders(orders.slice(0, 3));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="dashboard">
            <div className="dashboard-welcome">
                <h1>Hello, {user?.name}</h1>
                <Badge variant={user?.role === 'admin' ? 'primary' : 'neutral'}>{user?.role}</Badge>
            </div>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-card__icon"><Monitor /></div>
                    <div className="stat-card__content">
                        <p className="stat-card__label">Total Devices</p>
                        <p className="stat-card__value">{stats.devices}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon"><Activity /></div>
                    <div className="stat-card__content">
                        <p className="stat-card__label">Fixable Issues</p>
                        <p className="stat-card__value">{stats.diagnoses}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__icon"><ShoppingCart /></div>
                    <div className="stat-card__content">
                        <p className="stat-card__label">Pending Orders</p>
                        <p className="stat-card__value">{stats.orders}</p>
                    </div>
                </div>
            </div>

            {stats.devices === 0 ? (
                <EmptyState 
                    icon={Monitor}
                    title="No devices yet"
                    description="Add your first device to get started with AI diagnostics."
                    action={<Button onClick={() => navigate('/app/devices/new')}>Add Device</Button>}
                />
            ) : (
                <div className="dashboard-sections">
                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Devices</h2>
                            <Link to="/app/devices" className="text-muted">View all</Link>
                        </div>
                        <div className="device-cards">
                            {recentDevices.map(device => (
                                <div key={device.id} className="device-card">
                                    <div className="device-card__info">
                                        <h3>{device.brand} {device.model}</h3>
                                        <p className="text-muted">SN: ••••{device.serial_number.slice(-4)}</p>
                                    </div>
                                    <div className="device-card__actions">
                                        <Button variant="secondary" onClick={() => navigate(`/app/devices/${device.id}`)}>View</Button>
                                        <Button onClick={() => navigate(`/app/devices/${device.id}/diagnose`)}>Diagnose</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Recent Orders</h2>
                            <Link to="/app/orders" className="text-muted">View all</Link>
                        </div>
                        {recentOrders.length === 0 ? (
                            <p className="text-muted">No recent orders.</p>
                        ) : (
                            <div className="order-cards">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-card__info">
                                            <p className="font-medium">{order.part_name}</p>
                                            <p className="text-muted">${order.total_price.toFixed(2)}</p>
                                        </div>
                                        <Badge variant={
                                            order.status === 'paid' ? 'success' :
                                            order.status === 'pending' ? 'warning' : 'neutral'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
