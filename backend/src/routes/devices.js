const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
    try {
        const devices = db.prepare('SELECT * FROM devices WHERE user_id = ? AND archived = 0 ORDER BY created_at DESC').all(req.user.id);
        res.json({ success: true, data: devices });
    } catch (err) {
        next(err);
    }
});

router.post('/', [
    body('brand').trim().escape().notEmpty().withMessage('Brand is required'),
    body('model').trim().escape().notEmpty().withMessage('Model is required'),
    body('serial_number').trim().escape().notEmpty().withMessage('Serial number is required'),
    body('purchase_date').trim().escape().notEmpty().withMessage('Purchase date is required')
], validate, (req, res, next) => {
    try {
        const { brand, model, serial_number, purchase_date } = req.body;
        
        try {
            const result = db.prepare('INSERT INTO devices (user_id, brand, model, serial_number, purchase_date) VALUES (?, ?, ?, ?, ?)').run(req.user.id, brand, model, serial_number, purchase_date);
            const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
            res.json({ success: true, data: device, message: 'Device added successfully' });
        } catch (dbErr) {
            if (dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                const err = new Error('A device with this serial number already exists for this user');
                err.name = 'ConflictError';
                throw err;
            }
            throw dbErr;
        }
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ? AND archived = 0').get(req.params.id, req.user.id);
        if (!device) {
            const err = new Error('Device not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const diagnosesCount = db.prepare('SELECT COUNT(*) as count FROM diagnoses WHERE device_id = ?').get(device.id).count;
        const reportsCount = db.prepare(`
            SELECT COUNT(*) as count 
            FROM reports 
            WHERE user_id = ? AND archived = 0 
            AND (filters_json LIKE '%' || ? || '%' OR report_type = 'full')
        `).get(req.user.id, `"device_id":${device.id}`).count; // Simplified check for reports count
        
        device.diagnosesCount = diagnosesCount;
        device.reportsCount = reportsCount;
        
        res.json({ success: true, data: device });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', [
    body('brand').optional().trim().escape().notEmpty(),
    body('model').optional().trim().escape().notEmpty(),
    body('purchase_date').optional().trim().escape().notEmpty()
], validate, (req, res, next) => {
    try {
        const { brand, model, purchase_date } = req.body;
        
        const existing = db.prepare('SELECT id FROM devices WHERE id = ? AND user_id = ? AND archived = 0').get(req.params.id, req.user.id);
        if (!existing) {
            const err = new Error('Device not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const updates = [];
        const params = [];
        
        if (brand) { updates.push('brand = ?'); params.push(brand); }
        if (model) { updates.push('model = ?'); params.push(model); }
        if (purchase_date) { updates.push('purchase_date = ?'); params.push(purchase_date); }
        
        if (updates.length > 0) {
            params.push(req.params.id, req.user.id);
            db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
        }
        
        const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: device, message: 'Device updated successfully' });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', (req, res, next) => {
    try {
        const result = db.prepare('UPDATE devices SET archived = 1 WHERE id = ? AND user_id = ? AND archived = 0').run(req.params.id, req.user.id);
        if (result.changes === 0) {
            const err = new Error('Device not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        // Soft delete linked reports
        db.prepare('UPDATE reports SET archived = 1 WHERE user_id = ? AND filters_json LIKE ?').run(req.user.id, `%"device_id":${req.params.id}%`);
        
        res.json({ success: true, message: 'Device deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
