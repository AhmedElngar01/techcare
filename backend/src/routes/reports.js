const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
    try {
        const reports = db.prepare('SELECT id, user_id, report_type, filters_json, format, created_at FROM reports WHERE user_id = ? AND archived = 0 ORDER BY created_at DESC').all(req.user.id);
        res.json({ success: true, data: reports });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const report = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ? AND archived = 0').get(req.params.id, req.user.id);
        if (!report) {
            const err = new Error('Report not found');
            err.name = 'NotFoundError';
            throw err;
        }
        res.json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
});

router.post('/generate', [
    body('report_type').isIn(['diagnostic', 'repair', 'order', 'full']).withMessage('Invalid report type'),
    body('format').isIn(['pdf', 'csv']).withMessage('Format must be pdf or csv')
], validate, (req, res, next) => {
    try {
        const { report_type, device_id, date_from, date_to, format } = req.body;
        
        let data = [];
        const filters = { device_id, date_from, date_to };
        
        // Very basic aggregation logic
        if (report_type === 'diagnostic' || report_type === 'full') {
            let query = `
                SELECT d.*, dev.brand, dev.model 
                FROM diagnoses d
                JOIN devices dev ON d.device_id = dev.id
                WHERE dev.user_id = ? AND dev.archived = 0
            `;
            const params = [req.user.id];
            
            if (device_id) { query += ' AND dev.id = ?'; params.push(device_id); }
            if (date_from) { query += ' AND d.created_at >= ?'; params.push(date_from); }
            if (date_to) { query += ' AND d.created_at <= ?'; params.push(date_to); }
            
            const diags = db.prepare(query).all(...params);
            if (report_type === 'diagnostic') data = diags;
            else data.push({ diagnoses: diags });
        }
        
        if (report_type === 'repair' || report_type === 'full') {
            let query = `
                SELECT rg.*, d.ai_root_cause, dev.brand, dev.model 
                FROM repair_guides rg
                JOIN diagnoses d ON rg.diagnosis_id = d.id
                JOIN devices dev ON d.device_id = dev.id
                WHERE dev.user_id = ? AND dev.archived = 0
            `;
            const params = [req.user.id];
            
            if (device_id) { query += ' AND dev.id = ?'; params.push(device_id); }
            if (date_from) { query += ' AND rg.created_at >= ?'; params.push(date_from); }
            if (date_to) { query += ' AND rg.created_at <= ?'; params.push(date_to); }
            
            const repairs = db.prepare(query).all(...params);
            if (report_type === 'repair') data = repairs;
            else data.push({ repairs });
        }
        
        if (report_type === 'order' || report_type === 'full') {
            let query = `
                SELECT o.*, p.name as part_name, pay.status as payment_status
                FROM orders o
                JOIN parts p ON o.part_id = p.id
                LEFT JOIN payments pay ON o.id = pay.order_id AND pay.status = 'success'
                WHERE o.user_id = ?
            `;
            const params = [req.user.id];
            
            if (date_from) { query += ' AND o.created_at >= ?'; params.push(date_from); }
            if (date_to) { query += ' AND o.created_at <= ?'; params.push(date_to); }
            
            const orders = db.prepare(query).all(...params);
            if (report_type === 'order') data = orders;
            else data.push({ orders });
        }
        
        const result = db.prepare(`
            INSERT INTO reports (user_id, report_type, filters_json, data_json, format)
            VALUES (?, ?, ?, ?, ?)
        `).run(req.user.id, report_type, JSON.stringify(filters), JSON.stringify(data), format);
        
        const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: report, message: 'Report generated successfully' });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', (req, res, next) => {
    try {
        const result = db.prepare('UPDATE reports SET archived = 1 WHERE id = ? AND user_id = ? AND archived = 0').run(req.params.id, req.user.id);
        
        if (result.changes === 0) {
            const err = new Error('Report not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
