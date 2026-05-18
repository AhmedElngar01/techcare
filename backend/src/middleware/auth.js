const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/db');

const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const err = new Error('No token provided');
            err.name = 'AuthError';
            throw err;
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            const error = new Error('Invalid or expired token');
            error.name = 'AuthError';
            throw error;
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const session = db.prepare("SELECT * FROM sessions WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')").get(tokenHash);

        if (!session) {
            const err = new Error('Session expired or invalid');
            err.name = 'AuthError';
            throw err;
        }

        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        req.tokenHash = tokenHash; // for logout
        next();
    } catch (err) {
        next(err);
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            const err = new Error('Forbidden: insufficient permissions');
            err.name = 'ForbiddenError';
            return next(err);
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
