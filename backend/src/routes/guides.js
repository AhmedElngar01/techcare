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
        const guides = db.prepare(`
            SELECT rg.* 
            FROM repair_guides rg
            JOIN diagnoses d ON rg.diagnosis_id = d.id
            JOIN devices dev ON d.device_id = dev.id
            WHERE dev.user_id = ? AND dev.archived = 0
            ORDER BY rg.id DESC
        `).all(req.user.id);
        
        res.json({ success: true, data: guides });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const guide = db.prepare(`
            SELECT rg.* 
            FROM repair_guides rg
            JOIN diagnoses d ON rg.diagnosis_id = d.id
            JOIN devices dev ON d.device_id = dev.id
            WHERE rg.id = ? AND dev.user_id = ? AND dev.archived = 0
        `).get(req.params.id, req.user.id);
        
        if (!guide) {
            const err = new Error('Guide not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        res.json({ success: true, data: guide });
    } catch (err) {
        next(err);
    }
});

router.post('/', [
    body('diagnosis_id').isInt().withMessage('Diagnosis ID is required')
], validate, async (req, res, next) => {
    try {
        const { diagnosis_id } = req.body;
        
        const diagnosis = db.prepare(`
            SELECT d.*, dev.brand, dev.model 
            FROM diagnoses d
            JOIN devices dev ON d.device_id = dev.id
            WHERE d.id = ? AND dev.user_id = ? AND dev.archived = 0
        `).get(diagnosis_id, req.user.id);
        
        if (!diagnosis) {
            const err = new Error('Diagnosis not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        if (!diagnosis.is_fixable) {
            const err = new Error('Device is not fixable according to diagnosis');
            err.name = 'ConflictError';
            throw err;
        }
        
        const existing = db.prepare('SELECT * FROM repair_guides WHERE diagnosis_id = ?').get(diagnosis_id);
        if (existing) {
            return res.json({ success: true, data: existing, message: 'Guide already exists' });
        }
        
        const aiResult = await geminiService.generateRepairGuide(diagnosis.brand, diagnosis.model, diagnosis.ai_root_cause);
        
        const result = db.prepare(`
            INSERT INTO repair_guides (diagnosis_id, steps_json) 
            VALUES (?, ?)
        `).run(diagnosis_id, JSON.stringify(aiResult.steps || []));
        
        const guide = db.prepare('SELECT * FROM repair_guides WHERE id = ?').get(result.lastInsertRowid);
        res.json({ success: true, data: guide, message: 'Guide generated successfully' });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id/progress', [
    body('completed_steps').isArray().withMessage('completed_steps must be an array of integers')
], validate, (req, res, next) => {
    try {
        const { completed_steps } = req.body;
        
        const guide = db.prepare(`
            SELECT rg.*, d.device_id
            FROM repair_guides rg
            JOIN diagnoses d ON rg.diagnosis_id = d.id
            JOIN devices dev ON d.device_id = dev.id
            WHERE rg.id = ? AND dev.user_id = ? AND dev.archived = 0
        `).get(req.params.id, req.user.id);
        
        if (!guide) {
            const err = new Error('Guide not found');
            err.name = 'NotFoundError';
            throw err;
        }
        
        const steps = JSON.parse(guide.steps_json);
        const isDone = completed_steps.length === steps.length;
        
        let status = guide.status;
        let completed_at = guide.completed_at;
        
        if (isDone && status !== 'done') {
            status = 'done';
            completed_at = new Date().toISOString();
        } else if (!isDone && status === 'done') {
            status = 'in_progress';
            completed_at = null;
        }
        
        db.prepare(`
            UPDATE repair_guides 
            SET completed_steps_json = ?, status = ?, completed_at = ?
            WHERE id = ?
        `).run(JSON.stringify(completed_steps), status, completed_at, req.params.id);
        
        const updatedGuide = db.prepare('SELECT * FROM repair_guides WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: updatedGuide, message: 'Progress updated' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
