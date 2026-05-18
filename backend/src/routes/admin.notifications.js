const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

const dispatchNotification = (notificationId) => {
    const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
    if (!notif) return;
    
    let targetUsers = [];
    if (notif.user_id) {
        targetUsers.push({ id: notif.user_id });
    } else if (notif.target_role) {
        targetUsers = db.prepare('SELECT id FROM users WHERE role = ? AND is_active = 1').all(notif.target_role);
    } else {
        targetUsers = db.prepare('SELECT id FROM users WHERE is_active = 1').all();
    }
    
    const insertRead = db.prepare('INSERT INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, NULL)');
    
    const dispatchTx = db.transaction(() => {
        for (const u of targetUsers) {
            insertRead.run(notificationId, u.id);
        }
        db.prepare('UPDATE notifications SET sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(notificationId);
    });
    
    dispatchTx();
};

router.post('/', [
    body('title').trim().escape().notEmpty(),
    body('body').trim().escape().notEmpty(),
    body('channel').isIn(['push', 'email', 'in_app']),
    body('target').isIn(['all', 'role', 'user_id']),
    body('target_value').optional(),
    body('scheduled_at').optional().isISO8601()
], validate, (req, res, next) => {
    try {
        const { title, body, channel, target, target_value, scheduled_at } = req.body;
        
        let user_id = null;
        let target_role = null;
        
        if (target === 'role') target_role = target_value;
        if (target === 'user_id') user_id = target_value;
        
        const result = db.prepare(`
            INSERT INTO notifications (user_id, title, body, channel, target_role, scheduled_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(user_id, title, body, channel, target_role, scheduled_at || null);
        
        const notifId = result.lastInsertRowid;
        
        if (!scheduled_at || new Date(scheduled_at) <= new Date()) {
            dispatchNotification(notifId);
        }
        
        const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notifId);
        res.json({ success: true, data: notif, message: 'Notification created' });
    } catch (err) {
        next(err);
    }
});

router.get('/', (req, res, next) => {
    try {
        const notifs = db.prepare(`
            SELECT n.*, 
                (SELECT COUNT(*) FROM notification_reads WHERE notification_id = n.id) as total_sent,
                (SELECT COUNT(*) FROM notification_reads WHERE notification_id = n.id AND read_at IS NOT NULL) as total_read
            FROM notifications n
            ORDER BY n.created_at DESC
        `).all();
        
        res.json({ success: true, data: notifs });
    } catch (err) {
        next(err);
    }
});

router.get('/:id/stats', (req, res, next) => {
    try {
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_sent,
                SUM(CASE WHEN read_at IS NOT NULL THEN 1 ELSE 0 END) as total_read
            FROM notification_reads
            WHERE notification_id = ?
        `).get(req.params.id);
        
        const total = stats.total_sent || 0;
        const read = stats.total_read || 0;
        const rate = total > 0 ? (read / total) * 100 : 0;
        
        res.json({ success: true, data: { total_sent: total, total_read: read, read_rate_percent: rate } });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/dispatch', (req, res, next) => {
    try {
        const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
        if (!notif) {
            const err = new Error('Notification not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (notif.sent_at) {
            const err = new Error('Notification already sent');
            err.name = 'ConflictError';
            throw err;
        }
        
        dispatchNotification(notif.id);
        res.json({ success: true, message: 'Notification dispatched' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
