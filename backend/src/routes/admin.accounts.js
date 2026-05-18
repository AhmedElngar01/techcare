const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('admin'));

const logAdminAction = (admin_id, action, target_user_id, detail) => {
    db.prepare(`
        INSERT INTO admin_audit_logs (admin_id, action, target_user_id, detail)
        VALUES (?, ?, ?, ?)
    `).run(admin_id, action, target_user_id, JSON.stringify(detail));
};

router.get('/', (req, res, next) => {
    try {
        const { search, role, is_active, page = 1, limit = 20 } = req.query;
        
        let query = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE 1=1';
        const params = [];
        
        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        
        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }
        
        if (is_active !== undefined) {
            query += ' AND is_active = ?';
            params.push(Number(is_active));
        }
        
        const countQuery = query.replace('SELECT id, name, email, role, is_active, created_at', 'SELECT COUNT(*) as count');
        const total = db.prepare(countQuery).get(...params).count;
        
        const offset = (page - 1) * limit;
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));
        
        const users = db.prepare(query).all(...params);
        
        res.json({ success: true, data: { users, total, page: Number(page), totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
        
        if (!user) {
            const err = new Error('User not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        user.deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices WHERE user_id = ? AND archived = 0').get(user.id).count;
        user.sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND revoked = 0').get(user.id).count;
        
        const lastSession = db.prepare('SELECT created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);
        user.lastLogin = lastSession ? lastSession.created_at : null;
        
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

router.post('/', [
    body('name').trim().escape().notEmpty(),
    body('email').trim().isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['user', 'admin'])
], validate, (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            const err = new Error('Email already in use');
            err.name = 'ConflictError';
            throw err;
        }
        
        const passwordHash = bcrypt.hashSync(password, 12);
        const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, passwordHash, role);
        
        const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
        
        logAdminAction(req.user.id, 'CREATE_USER', user.id, { email, role });
        
        res.json({ success: true, data: user, message: 'User created' });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', [
    body('role').optional().isIn(['user', 'admin']),
    body('is_active').optional().isBoolean()
], validate, (req, res, next) => {
    try {
        const { role, is_active } = req.body;
        
        const existing = db.prepare('SELECT id, role, is_active FROM users WHERE id = ?').get(req.params.id);
        if (!existing) {
            const err = new Error('User not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const updates = [];
        const params = [];
        const detail = {};
        
        if (role && role !== existing.role) {
            updates.push('role = ?');
            params.push(role);
            detail.role = role;
        }
        
        if (is_active !== undefined && is_active !== Boolean(existing.is_active)) {
            updates.push('is_active = ?');
            params.push(is_active ? 1 : 0);
            detail.is_active = is_active;
        }
        
        if (updates.length > 0) {
            params.push(req.params.id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
            
            let action = 'UPDATE_USER';
            if (detail.is_active === false) action = 'DEACTIVATE_USER';
            else if (detail.is_active === true) action = 'ACTIVATE_USER';
            else if (detail.role) action = 'CHANGE_ROLE';
            
            logAdminAction(req.user.id, action, req.params.id, detail);
            
            // If deactivating, revoke all sessions
            if (is_active === false) {
                db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').run(req.params.id);
            }
            
            // Trigger notification (UC10 logic integration)
            if (is_active !== undefined || role) {
                const msg = is_active === false ? 'Your account has been deactivated.' : (role ? `Your role changed to ${role}.` : 'Your account was updated.');
                db.prepare(`
                    INSERT INTO notifications (user_id, title, body, channel) 
                    VALUES (?, ?, ?, ?)
                `).run(req.params.id, 'Account Update', msg, 'in_app');
            }
        }
        
        const user = db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: user, message: 'User updated' });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/reset-password', [
    body('new_password').isLength({ min: 6 })
], validate, (req, res, next) => {
    try {
        const { new_password } = req.body;
        
        const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
        if (!existing) {
            const err = new Error('User not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const passwordHash = bcrypt.hashSync(new_password, 12);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.params.id);
        db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?').run(req.params.id); // force logout
        
        logAdminAction(req.user.id, 'RESET_PASSWORD', req.params.id, {});
        
        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
