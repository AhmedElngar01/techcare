const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

const runSeed = () => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    if (userCount > 0) {
        console.log('Database already seeded. Skipping seed process.');
        return;
    }
    
    console.log('Seeding database...');
    
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    
    const adminHash = bcrypt.hashSync('Admin@123', 12);
    const userHash = bcrypt.hashSync('User@123', 12);
    
    insertUser.run('Admin User', 'admin@techcare.com', adminHash, 'admin');
    insertUser.run('Regular User', 'user@techcare.com', userHash, 'user');
    
    const insertPart = db.prepare('INSERT INTO parts (name, category, compatible_models_json, price, stock, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    const parts = [
        { name: 'iPhone 13 Screen', category: 'Mobile', compatible: '["iPhone 13"]', price: 120.0, stock: 50, img: 'https://via.placeholder.com/150', desc: 'OLED replacement screen for iPhone 13' },
        { name: 'iPhone 13 Battery', category: 'Mobile', compatible: '["iPhone 13"]', price: 45.0, stock: 100, img: 'https://via.placeholder.com/150', desc: 'Genuine replacement battery' },
        { name: 'Galaxy S22 Display', category: 'Mobile', compatible: '["Galaxy S22"]', price: 140.0, stock: 30, img: 'https://via.placeholder.com/150', desc: 'AMOLED screen for Samsung Galaxy S22' },
        { name: 'USB-C Charging Port', category: 'Mobile', compatible: '["Galaxy S22", "Pixel 6"]', price: 15.0, stock: 200, img: 'https://via.placeholder.com/150', desc: 'Replacement USB-C port module' },
        { name: 'Pixel 6 Camera Module', category: 'Mobile', compatible: '["Pixel 6"]', price: 75.0, stock: 20, img: 'https://via.placeholder.com/150', desc: 'Main rear camera module' },
        { name: 'MacBook Air M1 Screen', category: 'Computers', compatible: '["MacBook Air M1"]', price: 300.0, stock: 15, img: 'https://via.placeholder.com/150', desc: 'LCD Display Assembly' },
        { name: 'Dyson V11 Battery', category: 'Home Appliances', compatible: '["Dyson V11"]', price: 90.0, stock: 40, img: 'https://via.placeholder.com/150', desc: 'High capacity battery replacement' },
        { name: 'Dyson V11 Filter', category: 'Home Appliances', compatible: '["Dyson V11"]', price: 25.0, stock: 150, img: 'https://via.placeholder.com/150', desc: 'Washable HEPA filter' },
        { name: 'Washing Machine Pump', category: 'Home Appliances', compatible: '["LG WM3998HBA", "Samsung WF45R6100AP"]', price: 60.0, stock: 25, img: 'https://via.placeholder.com/150', desc: 'Universal drain pump' },
        { name: 'Refrigerator Water Filter', category: 'Home Appliances', compatible: '["Samsung RF28R7351SG"]', price: 35.0, stock: 80, img: 'https://via.placeholder.com/150', desc: 'Replacement water filter DA97-17376B' },
        { name: 'Netgear Router Antenna', category: 'Networking', compatible: '["Nighthawk AX12"]', price: 20.0, stock: 60, img: 'https://via.placeholder.com/150', desc: 'High-gain replacement antenna' },
        { name: 'Cat6 Ethernet Cable 10ft', category: 'Networking', compatible: '["Universal"]', price: 10.0, stock: 300, img: 'https://via.placeholder.com/150', desc: 'Gigabit snagless patch cable' },
        { name: 'RJ45 Connectors (100-pack)', category: 'Networking', compatible: '["Universal"]', price: 12.0, stock: 100, img: 'https://via.placeholder.com/150', desc: 'Gold plated RJ45 crimp ends' },
        { name: 'Dell XPS 15 Battery', category: 'Computers', compatible: '["XPS 15 9500"]', price: 85.0, stock: 35, img: 'https://via.placeholder.com/150', desc: '86Wh replacement battery' },
        { name: 'Thermal Paste', category: 'Computers', compatible: '["Universal"]', price: 8.0, stock: 500, img: 'https://via.placeholder.com/150', desc: 'Premium thermal compound 4g' }
    ];
    
    const insertPartsTx = db.transaction((partsList) => {
        for (const p of partsList) {
            insertPart.run(p.name, p.category, p.compatible, p.price, p.stock, p.img, p.desc);
        }
    });
    insertPartsTx(parts);
    
    // Notification templates
    const insertNotifTemplate = db.prepare('INSERT INTO notifications (title, body, channel, template_id) VALUES (?, ?, ?, ?)');
    insertNotifTemplate.run('System Maintenance', 'Scheduled maintenance in 2 hours.', 'in_app', 'maintenance');
    insertNotifTemplate.run('Order Update', 'Your order status has changed.', 'email', 'order_update');
    insertNotifTemplate.run('Security Alert', 'New login detected on your account.', 'email', 'security_alert');
    
    console.log('Database seeding complete.');
};

module.exports = { runSeed };
