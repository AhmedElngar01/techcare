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
        const { category, search, min_price, max_price, page = 1, limit = 20 } = req.query;
        
        let query = 'SELECT * FROM parts WHERE 1=1';
        const params = [];
        
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ? OR compatible_models_json LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        if (min_price) {
            query += ' AND price >= ?';
            params.push(Number(min_price));
        }
        
        if (max_price) {
            query += ' AND price <= ?';
            params.push(Number(max_price));
        }
        
        const offset = (page - 1) * limit;
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));
        
        const parts = db.prepare(query).all(...params);
        res.json({ success: true, data: parts });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', (req, res, next) => {
    try {
        const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id);
        if (!part) {
            const err = new Error('Part not found');
            err.name = 'NotFoundError';
            throw err;
        }
        res.json({ success: true, data: part });
    } catch (err) {
        next(err);
    }
});

router.post('/recommend', [
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
        
        const aiResult = await geminiService.recommendParts(diagnosis.brand, diagnosis.model, diagnosis.ai_root_cause);
        const requiredParts = aiResult.required_parts || [];
        
        // Find matching parts in DB
        const recommendedParts = [];
        const allParts = db.prepare('SELECT * FROM parts').all();
        
        for (const reqPart of requiredParts) {
            // Very simple matching logic
            const matches = allParts.filter(p => 
                p.name.toLowerCase().includes(reqPart.toLowerCase()) || 
                reqPart.toLowerCase().includes(p.name.toLowerCase()) ||
                p.compatible_models_json.toLowerCase().includes(diagnosis.model.toLowerCase())
            );
            if (matches.length > 0) {
                recommendedParts.push(...matches);
            }
        }
        
        // Remove duplicates
        const uniqueParts = Array.from(new Set(recommendedParts.map(p => p.id)))
            .map(id => recommendedParts.find(p => p.id === id));
        
        res.json({ success: true, data: uniqueParts, message: 'Parts recommended' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
