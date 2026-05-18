const express = require('express');
const { db } = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/', (req, res, next) => {
    try {
        // KPI cards
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get().count;
        const totalDiagnoses = db.prepare('SELECT COUNT(*) as count FROM diagnoses').get().count;
        const totalRevenue = db.prepare('SELECT SUM(amount) as total FROM payments WHERE status = "success"').get().total || 0;
        const partsSold = db.prepare(`
            SELECT SUM(quantity) as total 
            FROM orders o 
            JOIN payments p ON o.id = p.order_id 
            WHERE p.status = "success"
        `).get().total || 0;

        // User registrations line chart
        const userRegistrations = db.prepare(`
            SELECT date(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= date('now', '-30 days')
            GROUP BY date(created_at)
            ORDER BY date ASC
        `).all();

        // Orders per part category bar chart
        const ordersByCategory = db.prepare(`
            SELECT p.category as name, SUM(o.quantity) as count
            FROM orders o
            JOIN parts p ON o.part_id = p.id
            GROUP BY p.category
        `).all();

        // Diagnosis severity pie chart
        const diagnosisSeverity = db.prepare(`
            SELECT ai_severity as name, COUNT(*) as value
            FROM diagnoses
            GROUP BY ai_severity
        `).all();

        res.json({
            success: true,
            data: {
                kpis: {
                    totalUsers,
                    totalDiagnoses,
                    totalRevenue,
                    partsSold
                },
                charts: {
                    userRegistrations,
                    ordersByCategory,
                    diagnosisSeverity
                }
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
