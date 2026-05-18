const express = require('express');
const { body } = require('express-validator');
const { db } = require('../config/db');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const geminiService = require('../services/gemini.service');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
    try {
        const { device_id } = req.query;
        let query = `
            SELECT d.* 
            FROM diagnoses d
            JOIN devices dev ON d.device_id = dev.id
            WHERE dev.user_id = ? AND dev.archived = 0
        `;
        const params = [req.user.id];
        
        if (device_id) {
            query += ' AND d.device_id = ?';
            params.push(device_id);
        }
        
        query += ' ORDER BY d.created_at DESC';
        
        const diagnoses = db.prepare(query).all(...params);
        res.json({ success: true, data: diagnoses });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const diagnosis = db.prepare(`
            SELECT d.* 
            FROM diagnoses d
            JOIN devices dev ON d.device_id = dev.id
            WHERE d.id = ? AND dev.user_id = ? AND dev.archived = 0
        `).get(req.params.id, req.user.id);
        
        if (!diagnosis) {
            const err = new Error('Diagnosis not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const guide = db.prepare('SELECT id FROM repair_guides WHERE diagnosis_id = ?').get(diagnosis.id);
        diagnosis.guide_id = guide ? guide.id : null;
        
        res.json({ success: true, data: diagnosis });
    } catch (err) {
        next(err);
    }
});

router.post('/', [
    body('device_id').isInt().withMessage('Device ID is required'),
    body('symptoms_text').trim().escape().isLength({ min: 20 }).withMessage('Symptoms text must be at least 20 characters')
], validate, async (req, res, next) => {
    try {
        const { device_id, symptoms_text } = req.body;
        
        const device = db.prepare('SELECT brand, model FROM devices WHERE id = ? AND user_id = ? AND archived = 0').get(device_id, req.user.id);
        if (!device) {
            const err = new Error('Device not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const aiResult = await geminiService.diagnoseDevice(device.brand, device.model, symptoms_text);
        
        const result = db.prepare(`
            INSERT INTO diagnoses (device_id, symptoms_text, ai_root_cause, ai_severity, ai_confidence, is_fixable, ai_summary) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            device_id, 
            symptoms_text, 
            aiResult.root_cause || 'Unknown', 
            aiResult.severity || 'medium', 
            aiResult.confidence || 0, 
            aiResult.is_fixable ? 1 : 0, 
            aiResult.summary || 'No summary available'
        );
        
        const diagnosis = db.prepare('SELECT * FROM diagnoses WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: diagnosis, message: 'Diagnosis complete' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
