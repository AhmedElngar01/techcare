import { NavLink, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { LogOut, Monitor, Activity, PenTool, ShoppingCart, FileText, Settings, Users, Bell } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/app/dashboard', icon: Activity, label: 'Dashboard' },
        { path: '/app/devices', icon: Monitor, label: 'My Devices' },
        { path: '/app/parts', icon: ShoppingCart, label: 'Marketplace' },
        { path: '/app/orders', icon: PenTool, label: 'Orders' },
        { path: '/app/reports', icon: FileText, label: 'Reports' },
    ];

    const adminLinks = [
        { path: '/admin/dashboard', icon: Settings, label: 'Admin Dashboard' },
        { path: '/admin/accounts', icon: Users, label: 'Users' },
        { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar__header">
                <h2>TechCare AI</h2>
            </div>
            
            <nav className="sidebar__nav">
                <div className="sidebar__section">
                    <p className="sidebar__section-title">Menu</p>
                    {navLinks.map((link) => (
                        <NavLink 
                            key={link.path} 
                            to={link.path} 
                            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                        >
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>

                {user?.role === 'admin' && (
                    <div className="sidebar__section">
                        <p className="sidebar__section-title">Admin</p>
                        {adminLinks.map((link) => (
                            <NavLink 
                                key={link.path} 
                                to={link.path} 
                                className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                            >
                                <link.icon size={20} />
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__user">
                    <div className="sidebar__user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="sidebar__user-info">
                        <p className="sidebar__user-name">{user?.name}</p>
                        <p className="sidebar__user-role">{user?.role}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="sidebar__logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
