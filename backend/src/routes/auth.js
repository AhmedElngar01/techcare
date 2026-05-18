const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', [
    body('name').trim().escape().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], validate, (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            const err = new Error('Email already in use');
            err.name = 'ConflictError';
            throw err;
        }

        const passwordHash = bcrypt.hashSync(password, 12);
        const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash);
        
        const user = { id: result.lastInsertRowid, name, email, role: 'user' };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(user.id, tokenHash);
        
        res.json({ success: true, data: { user, token }, message: 'Registration successful' });
    } catch (err) {
        next(err);
    }
});

router.post('/login', [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], validate, (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
            const err = new Error('Invalid credentials or inactive account');
            err.name = 'AuthError';
            throw err;
        }

        const payload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        db.prepare("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(user.id, tokenHash);
        
        res.json({ success: true, data: { user: payload, token }, message: 'Login successful' });
    } catch (err) {
        next(err);
    }
});

router.post('/logout', requireAuth, (req, res, next) => {
    try {
        db.prepare('UPDATE sessions SET revoked = 1 WHERE token_hash = ?').run(req.tokenHash);
        res.json({ success: true, message: 'Logout successful' });
    } catch (err) {
        next(err);
    }
});

router.get('/me', requireAuth, (req, res, next) => {
    try {
        const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
});

router.put('/me', requireAuth, [
    body('name').optional().trim().escape().notEmpty(),
    body('email').optional().trim().isEmail(),
    body('password').optional().isLength({ min: 6 })
], validate, (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const updates = [];
        const params = [];
        
        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (email) {
            const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
            if (existing) {
                const err = new Error('Email already in use');
                err.name = 'ConflictError';
                throw err;
            }
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            updates.push('password_hash = ?');
            params.push(bcrypt.hashSync(password, 12));
        }

        if (updates.length > 0) {
            params.push(req.user.id);
            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }
        
        const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
        res.json({ success: true, data: user, message: 'Profile updated' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
