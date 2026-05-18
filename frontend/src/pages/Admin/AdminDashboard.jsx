import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, DollarSign, Activity, Monitor } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../api/axios';
import './Admin.css';

const AdminDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/analytics');
                setAnalytics(res.data.data);
            } catch (err) {
                toast.error('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!analytics) return null;

    const { kpis, charts } = analytics;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Platform Analytics</h1>
                <p className="text-muted">Real-time KPI monitoring and system performance.</p>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon"><Users size={24} /></div>
                    <div className="kpi-info">
                        <p className="kpi-label">Active Users</p>
                        <h3 className="kpi-value">{kpis.total_users}</h3>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><Monitor size={24} /></div>
                    <div className="kpi-info">
                        <p className="kpi-label">Devices Registered</p>
                        <h3 className="kpi-value">{kpis.total_devices}</h3>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><Activity size={24} /></div>
                    <div className="kpi-info">
                        <p className="kpi-label">AI Diagnoses</p>
                        <h3 className="kpi-value">{kpis.total_diagnoses}</h3>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><DollarSign size={24} /></div>
                    <div className="kpi-info">
                        <p className="kpi-label">Total Revenue</p>
                        <h3 className="kpi-value">${kpis.total_revenue.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-grid mt-8">
                <div className="chart-card">
                    <h3>Revenue (Last 30 Days)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.revenue_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>AI Diagnosis Status</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Fixable', count: charts.diagnosis_fixability.fixable, fill: 'var(--color-success)' },
                                { name: 'Not Fixable', count: charts.diagnosis_fixability.not_fixable, fill: 'var(--color-danger)' }
                            ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
