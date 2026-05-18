import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';

// Pages
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Devices from './pages/Devices/Devices';
import AddDevice from './pages/Devices/AddDevice';
import DeviceDetail from './pages/Devices/DeviceDetail';
import Diagnose from './pages/Diagnoses/Diagnose';
import RepairGuide from './pages/Guides/RepairGuide';
import Parts from './pages/Parts/Parts';
import Orders from './pages/Orders/Orders';
import OrderDetail from './pages/Orders/OrderDetail';
import Reports from './pages/Reports/Reports';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminAccounts from './pages/Admin/AdminAccounts';
import AdminNotifications from './pages/Admin/AdminNotifications';

const ProtectedLayout = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

const AdminLayout = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/app/dashboard" replace />;
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route path="/app" element={<ProtectedLayout><Navigate to="/app/dashboard" replace /></ProtectedLayout>} />
                <Route path="/app/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                <Route path="/app/devices" element={<ProtectedLayout><Devices /></ProtectedLayout>} />
                <Route path="/app/devices/new" element={<ProtectedLayout><AddDevice /></ProtectedLayout>} />
                <Route path="/app/devices/:id" element={<ProtectedLayout><DeviceDetail /></ProtectedLayout>} />
                <Route path="/app/devices/:id/diagnose" element={<ProtectedLayout><Diagnose /></ProtectedLayout>} />
                <Route path="/app/diagnoses/:id/guide" element={<ProtectedLayout><RepairGuide /></ProtectedLayout>} />
                <Route path="/app/parts" element={<ProtectedLayout><Parts /></ProtectedLayout>} />
                <Route path="/app/orders" element={<ProtectedLayout><Orders /></ProtectedLayout>} />
                <Route path="/app/orders/:id" element={<ProtectedLayout><OrderDetail /></ProtectedLayout>} />
                <Route path="/app/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
                
                <Route path="/admin" element={<AdminLayout><Navigate to="/admin/dashboard" replace /></AdminLayout>} />
                <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
                <Route path="/admin/accounts" element={<AdminLayout><AdminAccounts /></AdminLayout>} />
                <Route path="/admin/notifications" element={<AdminLayout><AdminNotifications /></AdminLayout>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
